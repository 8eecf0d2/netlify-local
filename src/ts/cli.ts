#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as program from "commander";

import { Logger } from "./helper";
import { Netlify } from "./netlify";
import { parseNetlifyConfig, parseNetlifyPluginLocalConfig, parseSslCertificates, parseWebpackConfig, Server, Webpack } from "./utility";
import { Build, Bundle } from "./command";

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));

program.version(packageJson.version);

program
  .option("-s --static [boolean]", "start the static server (default: true)")
  .option("-l --lambda [boolean]", "start the lambda server (default: true)")
  .option("-n --netlify <path>", "path to netlify toml config file")
  .option("-w --webpack <path>", "path to webpack config file")
  .option("-c --context <context>", "override context (default: current git branch)")
  .option("-p --port <port>", "port to serve from (default: 9000)")
  .option("--certificates <path>", "certificates for ssl");

program
  .command("serve")
  .description("Locally emulate Netlify services")
  .action(() => {
    (async () => {
      if(program.context) {
        process.env.NETLIFY_LOCAL_CONTEXT = program.context;
      }

      const netlifyConfig = parseNetlifyConfig(program.netlify || "netlify.toml", {
        webpack: {
          config: program.webpack,
        },
        server: {
          static: program.static === undefined ? undefined : program.static === "false" ? false : true,
          lambda: program.lambda === undefined ? undefined : program.lambda === "false" ? false : true,
          certificates: program.certificates,
          port: program.hasOwnProperty("port") ? parseInt(program.port) : undefined,
        }
      });

      const server = new Server({
        netlifyConfig: netlifyConfig,
        findAvailablePort: !program.hasOwnProperty("port"),
      });

      await server.listen();

      if(netlifyConfig.plugins.local.webpack.config) {
        const webpackConfig = parseWebpackConfig(netlifyConfig.plugins.local.webpack.config);
        const webpack = new Webpack(webpackConfig);
        webpack.watch();
      }

    })()
      .catch(error => {
        Logger.error(error)
        process.exit(1);
      })
  });

program
  .command("build")
  .description("Execute Netlify build")
  .action(() => {
    (async () => {
      if(program.context) {
        process.env.NETLIFY_LOCAL_CONTEXT = program.context;
      }

      const netlifyConfig = parseNetlifyConfig(program.netlify || "netlify.toml", {
        webpack: {
          config: program.webpack,
        }
      });

      try {
        await Build.from(netlifyConfig);
      } catch(error) {
        Logger.error(error);
      }

    })()
      .catch(error => {
        Logger.error(error)
        process.exit(1);
      })
  });

program
  .command("bundle")
  .description("Bundle Netlify functions")
  .action(() => {
    (async () => {
      if(program.context) {
        process.env.NETLIFY_LOCAL_CONTEXT = program.context;
      }

      const netlifyConfig = parseNetlifyConfig(program.netlify || "netlify.toml", {
        webpack: {
          config: program.webpack,
        }
      });

      const webpackConfigs = parseWebpackConfig(netlifyConfig.plugins.local.webpack.config);
      const functionsConfig = webpackConfigs.find(config => config.name === "functions");

      try {
        const parsedConfig = Bundle.buildWebpackFunctionsConfig(netlifyConfig, functionsConfig);
      } catch(error) {
        Logger.error(error);
      }

    })()
      .catch(error => {
        Logger.error(error)
        process.exit(1);
      })
  });

program.parse(process.argv);
