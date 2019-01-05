#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as webpack from "webpack";
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
      if (program.context) {
        process.env.NETLIFY_LOCAL_CONTEXT = program.context;
      }

      const netlifyConfig = parseNetlifyConfig(program.netlify || "netlify.toml", {
        webpack: {
          config: program.webpack,
          hmr: program.hmr,
        },
        server: {
          static: program.static === undefined ? undefined : program.static === "false" ? false : true,
          lambda: program.lambda === undefined ? undefined : program.lambda === "false" ? false : true,
          certificates: program.certificates,
          port: program.hasOwnProperty("port") ? parseInt(program.port, 10) : undefined,
        },
      });

      let compilers: Array<webpack.Compiler>;

      if (netlifyConfig.plugins.local.webpack.config) {
        const webpackConfig = parseWebpackConfig(netlifyConfig.plugins.local.webpack.config);
        const webpackClient = new Webpack(webpackConfig);
        compilers = webpackClient.compilers;
        webpackClient.watch();
      }

      const server = new Server({
        netlifyConfig: netlifyConfig,
        findAvailablePort: !program.hasOwnProperty("port"),
        compilers: compilers,
      });

      await server.listen();

    })()
      .catch((error) => {
        Logger.error(error);
        process.exit(1);
      });
  });

program
  .command("build")
  .description("Execute Netlify build")
  .action(() => {
    (async () => {
      if (program.context) {
        process.env.NETLIFY_LOCAL_CONTEXT = program.context;
      }

      const netlifyConfig = parseNetlifyConfig(program.netlify || "netlify.toml", {
        webpack: {
          config: program.webpack,
          hmr: program.hmr,
        },
      });

      try {
        await Build.start(netlifyConfig);
      } catch (error) {
        Logger.error(error);
      }

    })()
      .catch((error) => {
        Logger.error(error);
        process.exit(1);
      });
  });

program
  .command("bundle")
  .description("Bundle Netlify functions")
  .action(() => {
    (async () => {
      if (program.context) {
        process.env.NETLIFY_LOCAL_CONTEXT = program.context;
      }

      const netlifyConfig = parseNetlifyConfig(program.netlify || "netlify.toml", {
        webpack: {
          config: program.webpack,
          hmr: program.hmr,
        },
      });

      try {
        await Bundle.start(netlifyConfig);
      } catch (error) {
        Logger.error(error);
      }

    })()
      .catch((error) => {
        Logger.error(error);
        process.exit(1);
      });
  });

program.parse(process.argv);
