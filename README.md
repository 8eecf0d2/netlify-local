# Netlify Local
Local Netlify service emulation.

**Experimental:** None of the supported Netlify Services are correctly implemented yet.

This project aims to be as _"hands off"_ as possible, simply emulating different parts of Netlify.

For help bundling your Javascript to work with Netlify Functions, checkout [8eecf0d2/webpack-netlify-lambda-plugin](https://github.com/8eecf0d2/webpack-netlify-lambda-plugin) or [netlify/netlify-lambda](https://github.com/netlify/netlify-lambda).

An example Netlify deployable application is available at [8eecf0d2/netlify-local-example](https://github.com/8eecf0d2/netlify-local-example).

### Install

You should probably install as a dev dependency, but globally works too.
```bash
yarn add -D netlify-local
```

### Usage

```bash
netlify-local -n netlify.toml -w webpack.config.js
```

### Options
```bash
Usage: netlify-local [options]

Locally emulate Netlify services

Options:
  -V, --version        output the version number
  -n --netlify <path>  path to `netlify.toml` file (default `./netlify.toml`)
  -w --webpack <path>  path to webpack config file (default `./webpack.config.js`)
  -p --port <port>     port to serve from (default: 9000)
  -h, --help           output usage information
```

### Typings

You can access typescript types for Netlify Function handlers.
```ts
import { Netlify } from "netlify-local";

export const handler: Netlify.Handler<handler.Request, handler.Context, handler.Response> = (request, context, callback) => {

  return callback(null, {
    statusCode: 200,
    body: "foo"
  })
}

export namespace handler {
  export interface Request extends Netlify.Handler.Request {
    headers: {
      example: string;
    }
  }
  export interface Context extends Netlify.Handler.Context {
    user: { ... }
  }
  export interface Response extends Netlify.Handler.Response {
    body: { ... };
  }
}
```

### Credit

This project is based entirely upon [netlify/netlify-lambda](https://github.com/netlify/netlify-lambda).
