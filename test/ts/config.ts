import { describe, it } from "mocha";
import * as assert from "assert";

import { parseNetlifyConfig, parseWebpackConfig } from "../../src/ts";

process.env.NETLIFY_LOCAL_BRANCH = "default"

describe('Config', function() {
  describe('parseNetlifyConfig', function() {
    it('should throw when not found', function() {
      assert.throws(() => parseNetlifyConfig("test/toml/netlify.toml" + Math.random()));
    });
    it('should override build with context', function() {
      const netlifyConfig = parseNetlifyConfig("test/toml/netlify-example-1.toml");

      assert.equal(netlifyConfig.build.base, `default-base`);
      assert.equal(netlifyConfig.build.publish, `default-publish`);
      assert.equal(netlifyConfig.build.functions, `default-functions`);
      assert.equal(netlifyConfig.build.command, `default-command`);
    });
  });
});
