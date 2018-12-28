import { Logger } from "../helper";
import { Netlify } from "../netlify";
import { composeWebpackEntry, composeWebpackOutput, parseWebpackConfig, Webpack } from "../utility";

export class Bundle {

  public static async start(netlifyConfig: Netlify.Config): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      Logger.info("bundle started");
      const baseWebpackConfig = parseWebpackConfig(netlifyConfig.plugins.local.webpack.config).find((config) => config.name === "functions");
      const updatedWebpackConfig = Bundle.generateFunctionsConfig(netlifyConfig, baseWebpackConfig);
      const webpack = new Webpack(updatedWebpackConfig);
      webpack.build();
    })
  }

  public static generateFunctionsConfig(netlifyConfig: Netlify.Config, webpackConfig: Webpack.Config): Webpack.Config {
    return {
      ...webpackConfig,
      entry: composeWebpackEntry(netlifyConfig),
      output: composeWebpackOutput(netlifyConfig),
    };
  }

}
