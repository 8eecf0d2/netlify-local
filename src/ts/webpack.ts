import * as webpack from "webpack";

export class Webpack {
  private compiler: webpack.Compiler;

  constructor(
    private config: Webpack.Config,
  ) {
    this.initialize();
  }

  public initialize (): void {
    this.compiler = webpack(this.config);
  }

  public build (): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log("netlify-local: webpack build started");
      this.compiler.run((error, status) => {
        if(error) {
          console.log("netlify-local: webpack build failure");
          return reject(error);
        }
        console.log("netlify-local: webpack build success");
        return resolve(status);
      });
    });
  }

  public watch (): void {
    console.log("netlify-local: webpack watching");
    this.compiler.watch({}, (error, status) => {
      if(error) {
        console.log("netlify-local: webpack build failure");
        console.error(error);

        return;
      }

      console.log("netlify-local: webpack build success");
    });
  }
}

export namespace Webpack {
  export type Config = any;
}
