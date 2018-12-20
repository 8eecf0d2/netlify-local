import * as webpack from "webpack";
import { Logger } from "../helper";

export class Webpack {

  constructor(
    config: Webpack.Config | Array<Webpack.Config>,
  ) {
    this.configs = Array.isArray(config) ? config : [config];
    this.initialize();
  }
  private configs: Array<Webpack.Config>;
  private compilers: Array<webpack.Compiler>;

  public initialize(): void {
    this.compilers = this.configs.map((config) => webpack(config));
    Logger.info(`webpack initialized (${this.compilerNames()})`);
  }

  public build(): Promise<webpack.Stats> {
    return new Promise((resolve, reject) => {
      Logger.info(`webpack build started (${this.compilerNames()})`);
      for (let iter = 0; iter < this.compilers.length; iter++) {
        const compiler = this.compilers[iter];
        compiler.run((error, stats) => {
          if (error || stats.hasErrors()) {
            Logger.info(`webpack build failure (${this.compilerName(compiler, iter)})`);
            Logger.error(error || stats.toString("minimal"));

            return reject(error);
          }

          Logger.good(`webpack build success (${this.compilerName(compiler, iter)}:${stats.hash})`);

          return resolve(stats);
        });
      }
    });
  }

  public watch(): void {
    Logger.info(`webpack watching (${this.compilerNames()})`);
    for (let iter = 0; iter < this.compilers.length; iter++) {
      const compiler = this.compilers[iter];
      compiler.watch({}, (error, stats) => {
        if (error || stats.hasErrors()) {
          Logger.error(`webpack build failure (${this.compilerName(compiler, iter)})`);
          Logger.error(error || stats.toString("minimal"));

          return;
        }

        Logger.good(`webpack build success (${this.compilerName(compiler, iter)}:${stats.hash})`);
      });
    }
  }

  private compilerName(compiler: webpack.Compiler, iter: number): string {
    return compiler.name ? compiler.name : `#${iter + 1}`;
  }

  private compilerNames(): string {
    return this.compilers.map((compiler, index) => this.compilerName(compiler, index)).join(", ");
  }
}

export namespace Webpack {
  export interface Config extends webpack.Configuration {}
}
