import * as mocha from "mocha";
import * as assert from "assert";

import { Webpack, parseNetlifyConfig, parseWebpackConfig } from "../../dist";

process.env.NETLIFY_LOCAL_CONTEXT = "default"

mocha.describe('Config', () => {
  mocha.describe('parseNetlifyConfig', () => {
    mocha.it('should throw when not found', () => {
      assert.throws(() => parseNetlifyConfig("test/assets/netlify.toml" + Math.random()));
    });
    mocha.it('should correctly parse build', () => {
      const netlifyConfig = parseNetlifyConfig("test/assets/netlify-no-context.toml");

      assert.equal(netlifyConfig.build.base, "build-base");
      assert.equal(netlifyConfig.build.publish, "build-publish");
      assert.equal(netlifyConfig.build.functions, "build-functions");
      assert.equal(netlifyConfig.build.command, "build-command");
    });
    mocha.it('should correctly override build with context', () => {
      const netlifyConfig = parseNetlifyConfig("test/assets/netlify.toml");

      assert.equal(netlifyConfig.build.base, "build-base");
      assert.equal(netlifyConfig.build.publish, "default-publish");
      assert.equal(netlifyConfig.build.functions, "default-functions");
      assert.equal(netlifyConfig.build.command, "default-command");
    });
  });
  mocha.describe('parseWebpackConfig', () => {
    mocha.it('should throw when not found', () => {
      assert.throws(() => parseWebpackConfig("test/assets/webpack.config.js" + Math.random()));
    });
    mocha.it('should correctly import webpack config', () => {
      const webpackConfig = <Webpack.Config>parseWebpackConfig("test/assets/webpack.config.js");

      assert.equal(webpackConfig.target, "node");
    });
  });
});
