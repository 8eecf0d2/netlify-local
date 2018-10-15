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
  }
  export interface Redirect {
    from: string;
    to: string;
  }
}
