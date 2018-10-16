import * as fs from "fs";
import * as path from "path";
import * as toml from "toml";
import * as gitBranch from "git-branch";

import { Netlify } from "./netlify";
import { Webpack } from "./webpack";

export const parseWebpackConfig = (filename: string): Webpack.Config => {
  const webpackConfigExists = fs.existsSync(path.join(process.cwd(), filename));

  if(!webpackConfigExists) {
    throw new Error(`Could not locate "${filename}" file.`);
  }

  const webpackConfig = require(path.join(process.cwd(), filename));

  return webpackConfig;
}

export const parseNetlifyConfig = (filename: string): Netlify.Config => {
  const netlifyFileOption = filename;
  const netlifyConfigExists = fs.existsSync(path.join(process.cwd(), netlifyFileOption));
  if(!netlifyConfigExists) {
    throw new Error(`Could not locate "${netlifyFileOption}" file.`);
  }

  const netlifyConfig = toml.parse(fs.readFileSync(path.join(process.cwd(), netlifyFileOption), "utf8"));
  const currentBranch = process.env.NETLIFY_LOCAL_BRANCH || gitBranch.sync();

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
