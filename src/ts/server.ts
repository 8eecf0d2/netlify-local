import * as path from "path";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as serveStatic from "serve-static";
import * as queryString from "querystring";
import * as jwt from "jsonwebtoken";
import * as http from "http";
import { URL } from "url";
import * as UrlPattern from "url-pattern";
//@ts-ignore
import * as expressHttpProxy from "express-http-proxy";

import { Logger } from "./helper";
import { Netlify } from "./netlify";

export class Server {
  private express: express.Express;
  private server: http.Server;
  private paths: Server.Paths;

  constructor(
    private options: Server.Options,
  ) {
    this.initialize();
  }

  private initialize (): void {
    this.paths = {
      static: path.join(process.cwd(), String(this.options.netlifyConfig.build.publish)),
      lambda: path.join(process.cwd(), String(this.options.netlifyConfig.build.functions)),
    }

    this.express = express();
    this.express.use(bodyParser.raw({ limit: "6mb" }));
    this.express.use(bodyParser.text({ limit: "6mb", type: "*/*" }));

    const hardRedirects = this.options.netlifyConfig.redirects.filter(redirect => redirect.force === true);
    const softRedirects = this.options.netlifyConfig.redirects.filter(redirect => redirect.force === false);

    this.routeHeaders(this.options.netlifyConfig.headers);
    this.routeRedirects(hardRedirects);
    this.routeStatic();
    this.routeLambda();
    this.routeRedirects(softRedirects);
  }

  /**
    Static Router
   */
  private routeStatic (): void {
    if(!this.options.routes.static) {
      return
    }

    if(!this.options.netlifyConfig.build.publish) {
      throw new Error("cannot find `build.publish` property within toml config");
    }

    this.express.use(this.options.netlifyConfig.build.base, serveStatic(this.paths.static));
    Logger.info("netlify-local: static routes initialized");
  }

  /**
    Header Router
   */
  private routeHeaders (headers: Netlify.Headers[]): void {
    for(const header of headers) {
      this.handleHeader(header.for, header.values)
    }
  }

  private handleHeader (path: string, headers: { [key: string]: string }): void {
    this.express.all(path, (request, response, next) => {
      for(const header in headers) {
        response.setHeader(header, headers[header]);
      }
      next();
    })
  }

  /**
    Redirect Router
   */
  private routeRedirects (redirects: Netlify.Redirect[]): void {
    for(const redirect of redirects) {
      // XXX: Need to check if this can be made stricter to just match "http" and "https"

      /** Routes which have an absolute urls will be proxied */
      if(redirect.to.match(/^(?:[a-z]+:)?\/\//i)) {
        this.handleProxy(redirect);
        continue;
      }

      /** Routes which have a 301, 302 or 303 status code are considered typical redirects */
      if([301, 302, 303].includes(redirect.status)) {
        this.handleRedirect(redirect);
        continue;
      }

      /** Routes which do not match other conditions are assumed to be rewrites */
      this.handleRewrite(redirect);
    }
  }

  private handleRedirect (redirect: Netlify.Redirect): void {
    const placeholderOptions = Server.placeholderOptions(redirect);
    this.express.all(redirect.from, Server.redirectHeadersMiddleware(redirect), Server.placeholderParamsMiddleware(), (request, response, next) => {

      return response.status(redirect.status).redirect(Server.redirectPatternToPath(placeholderOptions.pattern, request.params));
    })
  }

  private handleRewrite (redirect: Netlify.Redirect): void {
    const placeholderOptions = Server.placeholderOptions(redirect);
    this.express.all(redirect.from, Server.redirectHeadersMiddleware(redirect), Server.placeholderParamsMiddleware(), (request, response, next) => {

      return response.status(redirect.status).sendFile(path.join(this.paths.static, Server.redirectPatternToPath(placeholderOptions.pattern, request.params)));
    });
  }

  private handleProxy (redirect: Netlify.Redirect) {
    const placeholderOptions = Server.placeholderOptions(redirect);

    this.express.all(redirect.from, Server.redirectHeadersMiddleware(redirect), Server.placeholderParamsMiddleware(), (request, response, next) => {

      return expressHttpProxy(placeholderOptions.url.origin, {
        proxyReqPathResolver: (proxyRequest: express.Request) => Server.redirectPatternToPath(placeholderOptions.pattern, request.params),
      })(request, response, next);
    });
  }

  private static placeholderOptions (redirect: Netlify.Redirect) {
    let redirectUrl: URL;

    if(redirect.to.match(/^(?:[a-z]+:)?\/\//i)) {
      redirectUrl = new URL(redirect.to);
    } else {
      redirectUrl = new URL("http://localhost");
    }

    const redirectPattern = new UrlPattern(redirectUrl.pathname);

    return {
      url: redirectUrl,
      pattern: redirectPattern,
    }
  }

  private static redirectHeadersMiddleware (redirect: Netlify.Redirect): express.Handler {
    return (request, response, next) => {
      if(redirect.headers) {
        for(const header in redirect.headers) {
          response.setHeader(header, redirect.headers[header]);
        }
      }
      next();
    }
  }

  private static placeholderParamsMiddleware (): express.Handler {
    return (request, response, next) => {
      request.params = {
        splat: request.params["0"],
        ...request.params,
      }

      next();
    }
  }

  private static redirectPatternToPath (pattern: UrlPattern, params: { [key: string]: string }): string {
    return pattern.stringify(params);
  }

  /**
    Lambda Router
   */
  private routeLambda (): void {
    if(!this.options.routes.lambda) {
      return
    }

    if(!this.options.netlifyConfig.build.functions) {
      throw new Error("cannot find `build.functions` property within toml config");
    }

    this.express.all("/.netlify/functions/:lambda", this.handleLambda());
    Logger.info("netlify-local: lambda routes initialized");
  }

  private handleLambda (): express.Handler {
    return (request, response, next) => {
      Logger.info(`netlify-local: lambda invoked "${request.params.lambda}"`);

      const module = path.join(this.paths.lambda, request.params.lambda);

      delete require.cache[require.resolve(module)];

      let lambda: { handler: Netlify.Handler };
      try {
        lambda = require(module);
      } catch (error) {

        return response.status(500).json(`Function invocation failed: ${error.toString()}`);
      }

      const lambdaRequest = Server.lambdaRequest(request);
      const lambdaContext = Server.lambdaContext(request);

      const lambdaExecution = lambda.handler(lambdaRequest, lambdaContext, Server.lambdaCallback(response));

      if(Promise.resolve(<any>lambdaExecution) === lambdaExecution) {
        return lambdaExecution
          .then(lambdaResponse => Server.handleLambdaResponse(response, lambdaResponse))
          .catch(error => Server.handleLambdaError(response, error));
      }
    }
  }

  private static lambdaRequest (request: express.Request): Netlify.Handler.Request {
    const isBase64Encoded = request.body && !(request.headers["content-type"] || "").match(/text|application|multipart\/form-data/);

    return {
      path: request.path,
      httpMethod: request.method,
      queryStringParameters: queryString.parse(request.url.split("?")[1]),
      headers: request.headers,
      body: isBase64Encoded ? Buffer.from(request.body.toString(), "utf8").toString('base64') : request.body,
      isBase64Encoded: isBase64Encoded,
    }
  }

  private static lambdaContext (request: express.Request): Netlify.Handler.Context {
    let lambdaContext: Netlify.Handler.Context = {}

    if(request.headers["authorization" || "Authorization"]) {
      const bearerToken = String(request.headers["authorization" || "Authorization"]).split(" ")[1];
      lambdaContext = {
        identity: { url: '', token: '' },
        user: jwt.decode(bearerToken),
      }
    }

    return lambdaContext;
  }

  private static lambdaCallback (response: express.Response): any {
    return (error: Error, lambdaResponse: Netlify.Handler.Response) => {
      if (error) {

        return Server.handleLambdaError(response, error);
      }

      return Server.handleLambdaResponse(response, lambdaResponse);
    }
  }

  private static handleLambdaResponse (response: express.Response, lambdaResponse: Netlify.Handler.Response): void {
    const parsedResponse = typeof lambdaResponse === "string" ? { statusCode: 200, body: lambdaResponse } : lambdaResponse;

    response.statusCode = parsedResponse.statusCode;

    for (const key in parsedResponse.headers) {
      response.setHeader(key, parsedResponse.headers[key]);
    }

    response.write(parsedResponse.isBase64Encoded ? Buffer.from(parsedResponse.body, "base64") : parsedResponse.body);
    response.end();
  }

  static handleLambdaError (response: express.Response, error: Error): express.Response {
    return response.status(500).json(`Function invocation failed: ${error.toString()}`);
  }

  public listen (): Promise<void> {
    return new Promise(resolve => {
      this.server = this.express.listen(this.options.port, (error: Error) => {
        if (error) {
          Logger.info("netlify-local: unable to start server");
          Logger.error(error);
          process.exit(1);
        }

        Logger.info(`netlify-local: server up on port ${this.options.port}`);
        return resolve();
      });
    });
  }

  public close (): Promise<void> {
    return new Promise(resolve => {
      this.server.close(() => {
        Logger.info(`netlify-local: server down on port ${this.options.port}`);
        resolve();
      });
    });
  }
}

export namespace Server {
  export interface Options {
    netlifyConfig: Netlify.Config;
    routes: {
      static: boolean;
      lambda: boolean;
    };
    port: number;
  }
  export interface Paths {
    static: string;
    lambda: string;
  }
}
