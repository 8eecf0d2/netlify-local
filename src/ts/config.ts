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

export const parseNetlifyConfig = (filename: string, overrides?: Netlify.Plugins.Local): Netlify.Config => {
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

  netlifyConfig.plugins = {
    local: parseNetlifyPluginLocalConfig(netlifyConfig, overrides),
  }

  return netlifyConfig;
}

export const parseNetlifyPluginLocalConfig = (netlifyConfig: Netlify.Config, overrides?: Netlify.Plugins.Local): Netlify.Plugins.Local => {
  const netlifyPluginLocalConfig: Netlify.Plugins.Local = {
    webpack: {
      config: undefined,
    },
    server: {
      static: true,
      lambda: true,
      certificates: undefined,
      port: 9000,
    },
    functions: {
      source: undefined,
      files: [],
    },
  };

  /** Parse config from Netlify configuration plugins */
  if(netlifyConfig.plugins.local) {
    if(netlifyConfig.plugins.local.webpack !== undefined) {
      if(netlifyConfig.plugins.local.webpack.config !== undefined) {
        netlifyPluginLocalConfig.webpack.config = netlifyConfig.plugins.local.webpack.config;
      }
    }
    if(netlifyConfig.plugins.local.server !== undefined) {
      if(netlifyConfig.plugins.local.server.static !== undefined) {
        netlifyPluginLocalConfig.server.static = netlifyConfig.plugins.local.server.static;
      }
      if(netlifyConfig.plugins.local.server.lambda !== undefined) {
        netlifyPluginLocalConfig.server.lambda = netlifyConfig.plugins.local.server.lambda;
      }
      if(netlifyConfig.plugins.local.server.certificates !== undefined) {
        netlifyPluginLocalConfig.server.certificates = netlifyConfig.plugins.local.server.certificates;
      }
      if(netlifyConfig.plugins.local.server.port !== undefined) {
        netlifyPluginLocalConfig.server.port = netlifyConfig.plugins.local.server.port;
      }
    }
    if(netlifyConfig.plugins.local.functions !== undefined) {
      if(netlifyConfig.plugins.local.functions.source !== undefined) {
        netlifyPluginLocalConfig.functions.source = netlifyConfig.plugins.local.functions.source;
      }
      if(netlifyConfig.plugins.local.functions.files !== undefined) {
        netlifyPluginLocalConfig.functions.files = netlifyConfig.plugins.local.functions.files;
      }
    }
  }

  /** Parse command line options */
  if(overrides) {
    if(overrides.webpack !== undefined) {
      if(overrides.webpack.config !== undefined) {
        netlifyPluginLocalConfig.webpack.config = overrides.webpack.config;
      }
    }
    if(overrides.server !== undefined) {
      if(overrides.server.static !== undefined) {
        netlifyPluginLocalConfig.server.static = overrides.server.static;
      }
      if(overrides.server.lambda !== undefined) {
        netlifyPluginLocalConfig.server.lambda = overrides.server.lambda;
      }
      if(overrides.server.certificates !== undefined) {
        netlifyPluginLocalConfig.server.certificates = overrides.server.certificates;
      }
      if(overrides.server.port !== undefined) {
        netlifyPluginLocalConfig.server.port = overrides.server.port;
      }
    }
  }

  return netlifyPluginLocalConfig;
}


export const parseSslCertificates = (directory?: string): { key: string, cert: string } => {
  const keyFilePath = path.join(process.cwd(), directory, "key.pem");
  const certFilePath = path.join(process.cwd(), directory, "cert.pem");
  const keyFileExists = fs.existsSync(keyFilePath);
  const certFileExists = fs.existsSync(certFilePath);

  if(!keyFileExists) {
    throw new Error(`cannot find certificate key file "${keyFilePath}"`);
  }

  if(!certFileExists) {
    throw new Error(`cannot find certificate cert file in "${certFilePath}"`);
  }

  return {
    key: fs.readFileSync(keyFilePath, "utf8"),
    cert: fs.readFileSync(certFilePath, "utf8"),
  }
}
