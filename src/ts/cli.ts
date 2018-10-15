#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as program from "commander";
import * as toml from "toml";
import * as gitBranch from "git-branch";

import { Netlify } from "./netlify";
import { Server } from "./server";
import { Webpack } from "./webpack";

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));

program.version(packageJson.version);

program
  .option("-n --netlify <path>", "path to `netlify.toml` file (default `./netlify.toml`)")
  .option("-w --webpack <path>", "path to webpack config file (default `./webpack.config.js`)")
  .option("-p --port <port>", "port to serve from (default: 9000)")

program
  .description("Locally emulate Netlify services")
  .action(() => {
    (async () => {
      let webpackFileOption = program.webpack || "webpack.config.js";
      let netlifyFileOption = program.netlify || "netlify.toml";

      const webpackConfigExists = fs.existsSync(path.join(process.cwd(), webpackFileOption));
      const netlifyConfigExists = fs.existsSync(path.join(process.cwd(), netlifyFileOption));

      if(!webpackConfigExists && program.webpack) {
        throw new Error(`Could not locate "${webpackFileOption}" file.`);
      }

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

      const server = new Server(netlifyConfig, program.port || 9000);
      await server.listen();

      if(webpackConfigExists) {
        console.log("netlify-local: webpack config loading");
        const webpack = new Webpack(require(path.join(process.cwd(), webpackFileOption)));
        webpack.watch();
      }
    })()
      .catch(error => {
        console.log(error)
        process.exit(1);
      })
  });

program.parse(process.argv);
