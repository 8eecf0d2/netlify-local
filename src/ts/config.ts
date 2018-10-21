import * as fs from "fs";
import * as path from "path";
import * as toml from "toml";
import * as gitBranch from "git-branch";

import { Netlify } from "./netlify";
import { Webpack } from "./webpack";

export const parseWebpackConfig = (filename: string): Webpack.Config|Webpack.Config[] => {
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

export const parseNetlifyLocalConfig = (netlifyConfig: Netlify.Config, cliOptions: any): Netlify.Plugins.Local => {
  const netlifyPluginLocalConfig: Netlify.Plugins.Local = {
    webpack: {
      config: undefined,
    },
    server: {
      static: undefined,
      lambda: undefined,
      certificates: undefined,
      port: undefined,
    },
    functions: {
      source: undefined,
      files: [],
    },
  };

  /** Parse config from Netlify configuration plugins */
  if(netlifyConfig.plugins.local) {
    if(netlifyConfig.plugins.local.hasOwnProperty("webpack")) {
      if(netlifyConfig.plugins.local.webpack.hasOwnProperty("config")) {
        netlifyPluginLocalConfig.webpack.config = netlifyConfig.plugins.local.webpack.config;
      }
    }
    if(netlifyConfig.plugins.local.hasOwnProperty("server")) {
      if(netlifyConfig.plugins.local.server.hasOwnProperty("static")) {
        netlifyPluginLocalConfig.server.static = netlifyConfig.plugins.local.server.static;
      }
      if(netlifyConfig.plugins.local.server.hasOwnProperty("lambda")) {
        netlifyPluginLocalConfig.server.lambda = netlifyConfig.plugins.local.server.lambda;
      }
      if(netlifyConfig.plugins.local.server.hasOwnProperty("certificates")) {
        netlifyPluginLocalConfig.server.certificates = netlifyConfig.plugins.local.server.certificates;
      }
      if(netlifyConfig.plugins.local.server.hasOwnProperty("port")) {
        netlifyPluginLocalConfig.server.port = netlifyConfig.plugins.local.server.port;
      }
    }
    if(netlifyConfig.plugins.local.hasOwnProperty("functions")) {
      if(netlifyConfig.plugins.local.functions.hasOwnProperty("source")) {
        netlifyPluginLocalConfig.functions.source = netlifyConfig.plugins.local.functions.source;
      }
      if(netlifyConfig.plugins.local.functions.hasOwnProperty("files")) {
        netlifyPluginLocalConfig.functions.files = netlifyConfig.plugins.local.functions.files;
      }
    }
  }

  /** Parse command line options */
  if(cliOptions.webpack !== undefined) {
    netlifyPluginLocalConfig.webpack.config = cliOptions.webpack;
  }
  if(cliOptions.static !== undefined) {
    netlifyPluginLocalConfig.server.static = cliOptions.static;
  }
  if(cliOptions.lambda !== undefined) {
    netlifyPluginLocalConfig.server.lambda = cliOptions.lambda;
  }
  if(cliOptions.certificates !== undefined) {
    netlifyPluginLocalConfig.server.certificates = cliOptions.certificates;
  }
  if(cliOptions.port !== undefined) {
    netlifyPluginLocalConfig.server.port = cliOptions.port;
  }

  return netlifyPluginLocalConfig;
}
