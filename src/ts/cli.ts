#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as program from "commander";

import { Logger } from "./helper";
import { Netlify } from "./netlify";
import { Server } from "./server";
import { Webpack } from "./webpack";
import { parseNetlifyConfig, parseWebpackConfig } from "./config";

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));

program.version(packageJson.version);

program
  .option("-n --netlify <path>", "path to `netlify.toml` file (default `./netlify.toml`)")
  .option("-w --webpack [path]", "path to webpack config file (default `./webpack.config.js`)")
  .option("-p --port <port>", "port to serve from (default: 9000)")

program
  .description("Locally emulate Netlify services")
  .action(() => {
    (async () => {
      const netlifyConfig = parseNetlifyConfig(program.netlify || "netlify.toml");
      const server = new Server(netlifyConfig, program.port || 9000);
      await server.listen();

      if(program.webpack === true || program.webpack) {
        const webpackFilename = program.webpack === true ? "webpack.config.js" : program.webpack;
        const webpackConfig = parseWebpackConfig(webpackFilename);
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
