import { exec } from "child_process";

import { Logger } from "../helper";
import { Netlify } from "../netlify";
import { composeWebpackEntry, composeWebpackOutput, Webpack } from "../utility";

export class Bundle {
  public static async buildWebpackFunctionsConfig(netlifyConfig: Netlify.Config, webpackConfig: Webpack.Config): Promise<void> {
    const parsedWebpackConfig = {
      ...webpackConfig,
      entry: composeWebpackEntry(netlifyConfig),
      output: composeWebpackOutput(netlifyConfig),
    };
  }

}
