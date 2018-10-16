import * as mocha from "mocha";
import * as assert from "assert";

import { parseNetlifyConfig, parseWebpackConfig } from "../../src/ts";

process.env.NETLIFY_LOCAL_BRANCH = "default"

mocha.describe('Config', () => {
  mocha.describe('parseNetlifyConfig', () => {
    mocha.it('should throw when not found', () => {
      assert.throws(() => parseNetlifyConfig("test/toml/netlify.toml" + Math.random()));
    });
    mocha.it('should override build with context', () => {
      const netlifyConfig = parseNetlifyConfig("test/toml/netlify.toml");

      assert.equal(netlifyConfig.build.base, "default-base");
      assert.equal(netlifyConfig.build.publish, "default-publish");
      assert.equal(netlifyConfig.build.functions, "default-functions");
      assert.equal(netlifyConfig.build.command, "default-command");
    });
  });
  mocha.describe('parseWebpackConfig', () => {
    mocha.it('should throw when not found', () => {
      assert.throws(() => parseWebpackConfig("test/js/webpack.config.js" + Math.random()));
    });
    mocha.it('should correctly import webpack config', () => {
      const webpackConfig = parseWebpackConfig("test/js/webpack.config.js");

      assert.equal(webpackConfig.target, "node");
    });
  });
});
