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

  public watch (): void {
    console.log("netlify-local: webpack watching");
    this.compiler.watch({}, () => {
      console.log("netlify-local: webpack rebuilt")
    });
  }
}

export namespace Webpack {
  export type Config = any;
}
