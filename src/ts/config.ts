import * as fs from "fs";
import * as path from "path";
import * as toml from "toml";
import * as gitBranch from "git-branch";

import { Netlify } from "./netlify";

export const parseWebpackConfig = (filename: string): any => {
  const webpackFileOption = filename || "webpack.config.js";
  const webpackConfigExists = fs.existsSync(path.join(process.cwd(), webpackFileOption));
  if(!webpackConfigExists && filename) {
    throw new Error(`Could not locate "${webpackFileOption}" file.`);
  }

  if(webpackConfigExists) {
    const webpackConfig = require(path.join(process.cwd(), webpackFileOption));

    return webpackConfig;
  }

  return false;
}

export const parseNetlifyConfig = (filename: string): Netlify.Config => {
  const netlifyFileOption = filename || "netlify.toml";
  const netlifyConfigExists = fs.existsSync(path.join(process.cwd(), netlifyFileOption));
  if(!netlifyConfigExists) {
    throw new Error(`Could not locate "${netlifyFileOption}" file.`);
  }

  const netlifyConfig = toml.parse(fs.readFileSync(path.join(process.cwd(), netlifyFileOption), "utf8"));
  const currentBranch = gitBranch.sync();

  if(netlifyConfig.context && netlifyConfig.context[currentBranch]) {
    netlifyConfig.build = {
      ...netlifyConfig.build,
      ...netlifyConfig.context[currentBranch],
    }
  }

  if(netlifyConfig.build.environment) {
    for(const variable in netlifyConfig.build.environment) {
      process.env[variable] = netlifyConfig.build.environment[variable];
    }
  }

  return netlifyConfig;
}
