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

    mocha.it('should add lambda route', async () => {
      const server = await createServer();

      //@ts-ignore
      const lambdaRoute = server.express._router.stack.find(route => route.route && route.route.path === "/.netlify/functions/:lambda");

      assert.notEqual(lambdaRoute, undefined);

      server.close();
    });

    mocha.it('should correctly format lambda request', async () => {
      const requestObj = {
        path: "/foo",
        method: "GET",
        url: "/foo?bar[0]=baz&bar[1]=qak",
        headers: {
          "content-type": "application/json"
        },
        body: { test: true },
      }

      //@ts-ignore
      const lambdaRequest = Server.lambdaRequest(requestObj);

      assert.equal(lambdaRequest.path, "/foo");
      assert.equal(lambdaRequest.httpMethod, "GET");
      assert.equal(lambdaRequest.queryStringParameters["bar[0]"], "baz");
      assert.equal(lambdaRequest.queryStringParameters["bar[1]"], "qak");
      assert.equal(lambdaRequest.headers["content-type"], "application/json");
      assert.equal(JSON.stringify(lambdaRequest.body), JSON.stringify({ test: true }));
      assert.equal(lambdaRequest.isBase64Encoded, false);
    });

    mocha.it('should correctly format lambda context', async () => {
      const requestWithoutBearer = {
        headers: {}
      }

      //@ts-ignore
      const lambdaContextWithoutBearer = Server.lambdaContext(requestWithoutBearer);

      assert.equal(JSON.stringify(lambdaContextWithoutBearer), JSON.stringify({}));

      const requestWithBearer = {
        headers: {
          "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIifQ._NaFhGu8tCCgBKksGBA6ADwRdKx3e9GES_KyF4A5phE"
        }
      }

      //@ts-ignore
      const lambdaContextWithBearer = Server.lambdaContext(requestWithBearer);

      assert.equal(lambdaContextWithBearer.identity.url, "");
      assert.equal(lambdaContextWithBearer.identity.token, "");
      assert.equal(JSON.stringify(lambdaContextWithBearer.user), JSON.stringify({ foo: "bar" }));
    });

  });
});
