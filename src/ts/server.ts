import * as path from "path";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as serveStatic from "serve-static";

import { Netlify } from "./netlify";

export class Server {
  public express: express.Express;
  public paths: Server.Paths;

  constructor(
    private netlifyConfig: Netlify.Config,
    private port: number,
  ) {
    this.initialize();
  }

  public initialize (): void {
    this.paths = {
      static: path.join(process.cwd(), this.netlifyConfig.build.publish),
      lambda: path.join(process.cwd(), this.netlifyConfig.build.functions),
    }
    this.express = express();
    this.express.use(bodyParser.raw());
    this.express.use(bodyParser.text({type: "*/*"}));
    this.express.use(serveStatic(this.paths.static))
    this.routeLambdas();
    this.routeRedirects();
  }

  private routeRedirects (): void {
    for(const redirect of this.netlifyConfig.redirects) {
      this.handleRedirect(redirect.from, redirect.to);
    }
  }

  public handleRedirect(from: string, to: string): void {
    this.express.get(from, (request, response, next) => {
      return response.status(200).sendFile(path.join(this.paths.static, to));
    });
  }

  private routeLambdas (): void {
    this.express.all("/.netlify/functions/:lambda", this.handleLambda());
  }

  private handleLambda (): express.Handler {
    return (request, response, next) => {

      const module = path.join(this.paths.lambda, request.params.lambda);
      delete require.cache[require.resolve(module)];

      let lambda: any;
      try {
        lambda = require(module);
      } catch (error) {

        return response.status(500).json(`Function invocation failed: ${error.toString()}`);
      }

      const lambdaRequest = {
        path: request.path,
        httpMethod: request.method,
        queryStringParameters: request.query,
        headers: request.headers,
        body: request.body,
        isBase64Encoded: false,
      }

      lambda.handler(lambdaRequest, {}, Server.lambdaCallback(response));
    }
  }

  static lambdaCallback (response: express.Response): any {
      return (error: Error, lambdaResponse: any) => {
      if (error) {

        return response.status(500).json(`Function invocation failed: ${error.toString()}`);
      }

      response.statusCode = lambdaResponse.statusCode;

      for (const key in lambdaResponse.headers) {
        response.setHeader(key, lambdaResponse.headers[key]);
      }

      response.write(lambdaResponse.body);

      response.end();
    }
  }

  public listen (): void {
    this.express.listen(this.port, (error: Error) => {
      if (error) {
        console.error("netlify-local: unable to start server");
        console.error(error);
        process.exit(1);
      }

      console.log(`netlify-local: server up on port ${this.port}`);
    });
  }
}

export namespace Server {
  export interface Paths {
    static: string;
    lambda: string;
  }
}
