import * as webpack from "webpack";
import { Logger } from "./helper";

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
      Logger.info("netlify-local: webpack build started");
      this.compiler.run((error, stats) => {
        if(error) {
          Logger.info("netlify-local: webpack build failure");
          Logger.error(error);

          return reject(error);
        }
        Logger.info("netlify-local: webpack build success");
        return resolve(stats);
      });
    });
  }

  public watch (): void {
    Logger.info("netlify-local: webpack watching");
    this.compiler.watch({}, (error, stats) => {
      if(error) {
        Logger.info("netlify-local: webpack build failure");
        Logger.error(error);

        return;
      }

      Logger.info("netlify-local: webpack build success");
    });
  }
}

export namespace Webpack {
  export interface Config extends webpack.Configuration {}
}
