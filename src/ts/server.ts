import * as path from "path";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as serveStatic from "serve-static";
import * as queryString from "querystring";
import * as jwt from "jsonwebtoken";
import * as http from "http";

import { Netlify } from "./netlify";

export class Server {
  private express: express.Express;
  private server: http.Server;
  private paths: Server.Paths;

  constructor(
    private netlifyConfig: Netlify.Config,
    private port: number,
  ) {
    this.initialize();
  }

  private initialize (): void {
    this.paths = {
      static: path.join(process.cwd(), this.netlifyConfig.build.publish),
      lambda: path.join(process.cwd(), this.netlifyConfig.build.functions),
    }
    this.express = express();
    this.express.use(bodyParser.raw({ limit: "6mb" }));
    this.express.use(bodyParser.text({ limit: "6mb", type: "*/*" }));
    this.routeHeaders();
    this.express.use(this.netlifyConfig.build.base, serveStatic(this.paths.static))
    this.routeLambdas();
    this.routeRedirects();
  }

  private routeHeaders (): void {
    if(!this.netlifyConfig.headers) {
      return
    }

    for(const header of this.netlifyConfig.headers) {
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

  private routeRedirects (): void {
    if(!this.netlifyConfig.redirects) {
      return
    }

    for(const redirect of this.netlifyConfig.redirects) {
      this.handleRedirect(redirect.from, redirect.to, redirect.headers);
    }
  }

  private handleRedirect(from: string, to: string, headers: { [key: string]: string }): void {
    this.express.get(from, (request, response, next) => {
      if(headers) {
        for(const header in headers) {
          response.setHeader(header, headers[header]);
        }
      }
      return response.status(200).sendFile(path.join(this.paths.static, to));
    });
  }

  private routeLambdas (): void {
    this.express.all("/.netlify/functions/:lambda", this.handleLambda());
  }

  private handleLambda (): express.Handler {
    return (request, response, next) => {
      console.log(`netlify-local: lambda invoked "${request.params.lambda}"`);

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
      this.server = this.express.listen(this.port, (error: Error) => {
        if (error) {
          console.log("netlify-local: unable to start server");
          console.error(error);
          process.exit(1);
        }

        console.log(`netlify-local: server up on port ${this.port}`);
        return resolve();
      });
    });
  }

  public close (): Promise<void> {
    return new Promise(resolve => {
      this.server.close(() => {
        console.log(`netlify-local: server down on port ${this.port}`);
        resolve();
      });
    });
  }
}

export namespace Server {
  export interface Paths {
    static: string;
    lambda: string;
  }
}
