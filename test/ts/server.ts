import * as mocha from "mocha";
import * as assert from "assert";

import { parseNetlifyConfig, Server } from "../../src/ts";

process.env.SILENT = "true";

const createServer = async (): Promise<Server>  => {
  const netlifyConfig = parseNetlifyConfig("test/assets/netlify.toml");
  const server = new Server({
    netlifyConfig: netlifyConfig,
    routes: {
      static: true,
      lambda: true,
    },
    port: 9000,
  });
  await server.listen();

  return server;
}

mocha.describe('Server', () => {
  mocha.describe('lifecycle', () => {
    mocha.it('should listen and close', async () => {
      const server = await createServer();

      //@ts-ignore
      assert.notEqual(server.server.address(), null);

      server.close();

      //@ts-ignore
      assert.equal(server.server.address(), null);
    });

    mocha.it('should add redirect routes', async () => {
      const server = await createServer();

      const [redirectRouteA, redirectRouteB] = [
        //@ts-ignore
        server.express._router.stack.find(route => route.route && route.route.path === "/redirect-from-a"),
        //@ts-ignore
        server.express._router.stack.find(route => route.route && route.route.path === "/redirect-from-b")
      ];

      assert.notEqual(redirectRouteA, undefined);

      assert.notEqual(redirectRouteB, undefined);

      server.close();
    });

    mocha.it('should add redirect header routes', async () => {
      const server = await createServer();

      //@ts-ignore
      const redirectRouteHeader = server.express._router.stack.find(route => route.route && route.route.path === "/redirect-from-header");

      assert.notEqual(redirectRouteHeader, undefined);

      server.close();
    });

    mocha.it('should add header routes', async () => {
      const server = await createServer();

      const [headerRouteA, headerRouteB] = [
        //@ts-ignore
        server.express._router.stack.find(route => route.route && route.route.path === "/headers-for-a"),
        //@ts-ignore
        server.express._router.stack.find(route => route.route && route.route.path === "/headers-for-b")
      ];

      assert.notEqual(headerRouteA, undefined);

      assert.notEqual(headerRouteB, undefined);

      server.close();
    });
  });
});
