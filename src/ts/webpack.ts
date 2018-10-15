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

  public build (): Promise<webpack.Stats> {
    return new Promise((resolve, reject) => {
      console.log("netlify-local: webpack build started");
      this.compiler.run((error, stats) => {
        if(error) {
          console.log("netlify-local: webpack build failure");
          console.error(error);

          return reject(error);
        }
        console.log("netlify-local: webpack build success");
        return resolve(stats);
      });
    });
  }

  public watch (): void {
    console.log("netlify-local: webpack watching");
    this.compiler.watch({}, (error, stats) => {
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
  export interface Config extends webpack.Configuration {}
}
