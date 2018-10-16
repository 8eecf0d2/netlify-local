import { describe, it } from "mocha";
import * as assert from "assert";

import * as gitBranch from "git-branch";

import { parseNetlifyConfig, parseWebpackConfig } from "../../src/ts";

describe('Config', function() {
  describe('parseNetlifyConfig', function() {
    it('should throw when not found', function() {
      const currentBranch = gitBranch.sync();
      assert.throws(() => parseNetlifyConfig("test/toml/netlify.toml" + Math.random()));
    });
    it('should override build with context', function() {
      const currentBranch = gitBranch.sync();
      const netlifyConfig = parseNetlifyConfig("test/toml/netlify-example-1.toml");

      assert.equal(netlifyConfig.build.base, `${currentBranch}-base`);
      assert.equal(netlifyConfig.build.publish, `${currentBranch}-publish`);
      assert.equal(netlifyConfig.build.functions, `${currentBranch}-functions`);
      assert.equal(netlifyConfig.build.command, `${currentBranch}-command`);
    });
  });
});
