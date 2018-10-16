export namespace Netlify {
  export interface Config {
    build: {
      base?: string;
      publish: string;
      functions: string;
      command: string;
    }
    context: any;
    redirects: Netlify.Redirect[];
    headers: Netlify.Headers[];
  }
  export interface Redirect {
    from: string;
    to: string;
    headers?: {
      [key: string]: string;
    };
  }
  export interface Headers {
    for: string;
    values: {
      [key: string]: string;
    }
  }
  export namespace Handler {
    export interface Response {
      statusCode: number;
      body: any;
      headers?: {
        [key: string]: string;
      }
      isBase64Encoded?: boolean;
    }
    export interface Request {
      path: string;
      httpMethod: string;
      queryStringParameters: {
        [key: string]: string | string[];
      };
      headers: {
        [key: string]: string | string[];
      };
      body: any;
      isBase64Encoded: boolean;
    }
    export interface Context {
      identity?: {
        url: string;
        token: string;
      };
      user?: any;
    }
    export type Callback<ResponseType> = (error: boolean, response: ResponseType) => void;
  }
  export type Handler<RequestType = Netlify.Handler.Request, ContextType = Netlify.Handler.Context, ResponseType = Netlify.Handler.Response> = (
    request: RequestType,
    context: ContextType,
    callback: Netlify.Handler.Callback<ResponseType>,
  ) => void | Promise<ResponseType>;
}
