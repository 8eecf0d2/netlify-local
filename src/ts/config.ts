import * as fs from "fs";
import * as path from "path";
import * as toml from "toml";
import * as gitBranch from "git-branch";

import { Netlify } from "./netlify";
import { Webpack } from "./webpack";

export const parseWebpackConfig = (filename: string): Webpack.Config => {
  const webpackConfigExists = fs.existsSync(path.join(process.cwd(), String(filename)));

  if(!webpackConfigExists) {
    throw new Error(`cannot find webpack configuration file "${filename}"`);
  }

  const webpackConfig = require(path.join(process.cwd(), filename));

  return webpackConfig;
}

export const parseNetlifyConfig = (filename: string): Netlify.Config => {
  const netlifyConfigExists = fs.existsSync(path.join(process.cwd(), String(filename)));
  if(!netlifyConfigExists) {
    throw new Error(`cannot find netlify configuration file "${filename}"`);
  }

  const netlifyConfig: Netlify.Config = {
    redirects: [],
    headers: [],
    ...toml.parse(fs.readFileSync(path.join(process.cwd(), filename), "utf8"))
  };
  const context = process.env.NETLIFY_LOCAL_CONTEXT || gitBranch.sync();

  if(netlifyConfig.context && netlifyConfig.context[context]) {
    netlifyConfig.build = {
      ...netlifyConfig.build,
      ...netlifyConfig.context[context],
    }
  }

  if(netlifyConfig.build.environment) {
    for(const variable in netlifyConfig.build.environment) {
      process.env[variable] = netlifyConfig.build.environment[variable];
    }
  }

  if(netlifyConfig.redirects) {
    netlifyConfig.redirects = netlifyConfig.redirects.map(redirect => {
      return {
        status: 301,
        force: false,
        ...redirect,
      }
    });
  }

  return netlifyConfig;
}
