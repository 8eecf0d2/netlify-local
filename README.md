# Netlify Local

[![Travis CI badge](https://travis-ci.org/8eecf0d2/netlify-local.svg?branch=master)](https://travis-ci.org/8eecf0d2/netlify-local)
[![Codeclimate maintainability](https://img.shields.io/codeclimate/maintainability-percentage/8eecf0d2/netlify-local.svg)](https://codeclimate.com/github/8eecf0d2/netlify-local)
[![Greenkeeper badge](https://badges.greenkeeper.io/8eecf0d2/netlify-local.svg)](https://greenkeeper.io/)

Local Netlify service emulation.

**Experimental:** This package has not been heavily tested or used, some of the Netlify Services might be incorrectly implemented. [Submit an issue](https://github.com/8eecf0d2/netlify-local/issues) if you find any!

**Semver Notice:** Breaking changes which increase compatibility with Netlify Services are not considered breaking 🤷‍♂️

For help bundling your Javascript to work with Netlify Functions, checkout [8eecf0d2/webpack-netlify-lambda-plugin](https://github.com/8eecf0d2/webpack-netlify-lambda-plugin) or [netlify/netlify-lambda](https://github.com/netlify/netlify-lambda).

An example Netlify deployable application is available at [8eecf0d2/netlify-local-example](https://github.com/8eecf0d2/netlify-local-example).

### Install

You should probably install as a dev dependency, but globally works too.
```bash
yarn add -D netlify-local
```

### Usage

#### `serve` command

By default `netlify-local` will _try_ and start the **static server** and the **lambda server** which use the `publish` and `functions` property respectively from your `netlify.toml`.

```bash
netlify-local serve
```

If your `netlify.toml` is not in the current directory you can pass in the `-n --netlify` argument with a relative path to the configuration file.

```bash
netlify-local app-functions/netlify.toml
```

You can prevent the **static server** or **lambda server** from starting by passing in the `-s --static` or `-l --lambda` arguments respectively with the value `false`.

```bash
netlify-local -s false
netlify-local -l false
netlify-local -s false -l false
```

### API

Specific classes and methods are exposed for running `netlify-local` programmatically, see [Issue #6](https://github.com/8eecf0d2/netlify-local/issues/6) for more information and documentation.

### Typings

Relevant Typescript typings are exposed for the API and also Netlify Function handlers.
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

### Webpack Issues

To correctly execute lambda's they must be self contained bundles, a common issue when bundled incorrectly is missing modules similar to the error below.

```bash
Error: Cannot find module '/.../path/file'
```

To bundle your files correctly ensure that `module.exports.handler` is exposed for each handler file and that you're using individual entires within webpack.

```js
module.exports = {
  target: "node",
  entry: {
    foo: "./src/ts/handlers/foo.ts",
    bar: "./src/ts/handlers/bar.ts",
    ...
  },
  ...
}
```

If you're starting a new project or not currently bundling, the easiest solution would be to use [netlify/netlify-lambda](https://github.com/netlify/netlify-lambda) and it's `build` command.

If you've got a pre-existing webpack config I'd suggest using a webpack helper library such as [8eecf0d2/webpack-netlify-lambda-plugin](https://github.com/8eecf0d2/webpack-netlify-lambda-plugin).

### Credit

This project is inspired by [netlify/netlify-lambda](https://github.com/netlify/netlify-lambda).
