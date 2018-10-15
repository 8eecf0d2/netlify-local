import * as fs from "fs";
import * as path from "path";
import * as program from "commander";
import * as toml from "toml";

import { Netlify } from "./netlify";
import { Server } from "./server";
import { Webpack } from "./webpack";

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));

program.version(packageJson.version);

program
  .option("-n --netlify <path>", "path to `netlify.toml` file (default `./netlify.toml`")
  .option("-w --webpack <path>", "path to webpack config file (default `./webpack.config.js`")
  .option("-p --port <port>", "port to serve from (default: 9000)")

program
  .command("serve")
  .description("serve and rebuild files on change")
  .action(() => {
    const webpackConfig = program.webpack ? require(path.join(process.cwd(), program.webpack)) : false;
    const netlifyConfig = toml.parse(fs.readFileSync(path.join(process.cwd(), program.netlify), "utf8"));

    if(webpackConfig) {
      const webpack = new Webpack(webpackConfig);
      webpack.watch();
    }

    const server = new Server(netlifyConfig, program.port || 9000);
    server.listen();
  });

program.parse(process.argv);
