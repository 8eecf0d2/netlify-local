# Netlify Local

[![Travis CI badge](https://travis-ci.org/8eecf0d2/netlify-local.svg?branch=master)](https://travis-ci.org/8eecf0d2/netlify-local)
[![Codeclimate maintainability](https://img.shields.io/codeclimate/maintainability-percentage/8eecf0d2/netlify-local.svg)](https://codeclimate.com/github/8eecf0d2/netlify-local)
[![Greenkeeper badge](https://badges.greenkeeper.io/8eecf0d2/netlify-local.svg)](https://greenkeeper.io/)

Local Netlify service emulation.

**Experimental:** This package has not been heavily tested or used, some of the Netlify Services are incorrectly implemented. [Submit an issue](https://github.com/8eecf0d2/netlify-local/issues) if you find any!

**Semver Notice:** Breaking changes which increase compatibility with Netlify services and features are not considered breaking 🤷‍♂️

For help bundling your Javascript to work with Netlify Functions, checkout [netlify/netlify-lambda](https://github.com/netlify/netlify-lambda) or [8eecf0d2/webpack-netlify-lambda-plugin](https://github.com/8eecf0d2/webpack-netlify-lambda-plugin).

An example Netlify deployable application is available at [8eecf0d2/netlify-local-example](https://github.com/8eecf0d2/netlify-local-example).

### Install

You should probably install as a dev dependency, but globally works too.
```bash
yarn add -D netlify-local
```

### Features

#### Static Router
The **static router** refers to the static server functionality of [Netlify Continuous Deployment](https://www.netlify.com/docs/continuous-deployment), which serves files from the `build.publish` directory, specified within the toml configuration.

#### Lambda Router
The **lambda router** refers to the [Netlify Functions](https://www.netlify.com/features/functions) feature which serves Lambda's or Cloud Functions from the `build.functions` directory, specified within the toml configuration.

#### Redirects
This feature refers to [Netlify Redirects](https://www.netlify.com/docs/netlify-toml-reference#redirects), this has not been correctly implemented and is missing a lot of functionality, see [Issue #8](https://github.com/8eecf0d2/netlify-local/issues/8) for progress.

#### Headers
This feature refers to [Netlify Headers](https://www.netlify.com/docs/netlify-toml-reference#headers), for the most part this works as expected however the [Netlify Basic Auth](https://www.netlify.com/docs/headers-and-basic-auth/#basic-auth) portion is not supported.

### Commands

#### `serve`

By default **netlify-local** will _try_ and start the **static router** and the **lambda router**.

```bash
netlify-local serve
```

##### `-s --static, -l --lambda`
You can prevent the **static router** or **lambda router** from being initialized by passing in the `-s --static` or `-l --lambda` with the value `false`.

```bash
netlify-local serve -s false -l false
```

##### `-c --context`
The [deploy context](https://www.netlify.com/docs/netlify-toml-reference#deploy-context) will be derived from the currently checked out git branch, you can pass in the `-c --context` argument to override this value.

```bash
netlify-local serve -c foo-branch
```

##### `-n --netlify`

If your `netlify.toml` is not in the current directory you can pass in the `-n --netlify` argument with a relative path to the configuration file.

```bash
netlify-local serve -n app-functions/netlify.toml
```

##### `-w --webpack`

If your source files require a webpack build process you can pass in the `-w --webpack` argument with a relative path to your webpack config which will create a [Webpack compiler](https://webpack.js.org/api/node/#watching) and watch your files. _There are no plans to support additional build tools._

```bash
netlify-local serve -w webpack.config.js
```

##### `-p --port`

You can set the port which the server should bind on by passing in the `-p --port` argument with a number, defaults to `9000`.

```bash
netlify-local serve -p 3000
```

### API

Specific classes and methods are exposed for running **netlify-local** programmatically, see [Issue #6](https://github.com/8eecf0d2/netlify-local/issues/6) for more information and documentation.

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

### Webpack

#### Multiple Configs
If you use multiple Webpack configurations for your application (one for the client, another for lambda) you should set the [`name` property within the Webpack configuration](https://webpack.js.org/configuration/other-options#name) to get better logging, _otherwise config's will be named by their index._

#### Issues
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
