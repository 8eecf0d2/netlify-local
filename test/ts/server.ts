import * as mocha from "mocha";
import * as assert from "assert";

import { parseNetlifyConfig, Server } from "../../src/ts";

process.env.SILENT = "true";

mocha.describe('Server', () => {
  mocha.describe('lifecycle', () => {
    mocha.it('should listen and close correctly', async () => {
      const netlifyConfig = parseNetlifyConfig("test/assets/netlify.toml");

      const server = new Server(netlifyConfig, 9000);
      await server.listen();

      //@ts-ignore
      assert.notEqual(server.server.address(), null);

      server.close();

      //@ts-ignore
      assert.equal(server.server.address(), null);
    });
  });
});
