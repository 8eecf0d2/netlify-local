import * as webpack from "webpack";
import { Logger } from "./helper";

export class Webpack {
  private configs: Webpack.Config[];
  private compilers: webpack.Compiler[];

  constructor(
    config: Webpack.Config | Webpack.Config[],
  ) {
    this.configs = Array.isArray(config) ? config : [config];
    this.initialize();
  }

  public initialize (): void {
    this.compilers = this.configs.map(config => webpack(config));
    Logger.info(`netlify-local: webpack initialized (${this.compilerNames()})`);
  }

  private compilerName (compiler: webpack.Compiler, iter: number): string {
    return compiler.name ? compiler.name : `#${iter + 1}`;
  }

  private compilerNames (): string {
    return this.compilers.map((compiler, index) => this.compilerName(compiler, index)).join(", ");
  }

  public build (): Promise<webpack.Stats> {
    return new Promise((resolve, reject) => {
      Logger.info(`netlify-local: webpack build started (${this.compilerNames()})`);
      for(let iter = 0; iter < this.compilers.length; iter++) {
        const compiler = this.compilers[iter];
        compiler.run((error, stats) => {
          if(error || stats.hasErrors()) {
            Logger.info(`netlify-local: webpack build failure (${this.compilerName(compiler, iter)}:${stats.hash})`);
            Logger.error(stats.toString("minimal"));

            return reject(error);
          }

          Logger.info(`netlify-local: webpack build success (${this.compilerName(compiler, iter)}:${stats.hash})`);

          return resolve(stats);
        });
      }
    });
  }

  public watch (): void {
    Logger.info(`netlify-local: webpack watching (${this.compilerNames()})`);
    for(let iter = 0; iter < this.compilers.length; iter++) {
      const compiler = this.compilers[iter];
      compiler.watch({}, (error, stats) => {
        if(error || stats.hasErrors()) {
          Logger.info(`netlify-local: webpack build failure (${this.compilerName(compiler, iter)}:${stats.hash})`);
          Logger.error(stats.toString("minimal"));

          return;
        }

        Logger.info(`netlify-local: webpack build success (${this.compilerName(compiler, iter)}:${stats.hash})`);
      });
    }
  }
}

export namespace Webpack {
  export interface Config extends webpack.Configuration {}
}
