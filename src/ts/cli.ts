#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as program from "commander";

import { Logger } from "./helper";
import { Netlify } from "./netlify";
import { Server } from "./server";
import { Webpack } from "./webpack";
import { parseNetlifyConfig, parseNetlifyPluginLocalConfig, parseSslCertificates, parseWebpackConfig } from "./config";

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

      const netlifyConfig = parseNetlifyConfig(program.netlify || "netlify.toml");

      const netlifyPluginLocalConfig = parseNetlifyPluginLocalConfig(netlifyConfig, {
        webpack: {
          config: program.webpack,
        },
        server: {
          static: program.static === "false" ? false : true,
          lambda: program.lambda === "false" ? false : true,
          certificates: program.certificates,
          port: program.port || 9000,
        }
      });

      const server = new Server({
        netlifyConfig: netlifyConfig,
        routes: {
          static: netlifyPluginLocalConfig.server.static,
          lambda: netlifyPluginLocalConfig.server.lambda,
        },
        certificates: netlifyPluginLocalConfig.server.certificates ? parseSslCertificates(netlifyPluginLocalConfig.server.certificates) : undefined,
        port: netlifyPluginLocalConfig.server.port
      });

      await server.listen();

      if(netlifyPluginLocalConfig.webpack.config) {
        const webpackConfig = parseWebpackConfig(netlifyPluginLocalConfig.webpack.config);
        const webpack = new Webpack(webpackConfig);
        webpack.watch();
      }

    })()
      .catch(error => {
        Logger.info(error)
        process.exit(1);
      })
  });

program.parse(process.argv);
