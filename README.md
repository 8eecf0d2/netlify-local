# Netlify Local

[![Travis CI badge](https://travis-ci.org/8eecf0d2/netlify-local.svg?branch=master)](https://travis-ci.org/8eecf0d2/netlify-local)
[![Codeclimate maintainability](https://img.shields.io/codeclimate/maintainability-percentage/8eecf0d2/netlify-local.svg)](https://codeclimate.com/github/8eecf0d2/netlify-local)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=8eecf0d2/netlify-local)](https://dependabot.com)

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

### Usage

#### `serve` command
The [**serve** command](https://github.com/8eecf0d2/netlify-local/wiki/Command-Serve) will attempt to emulate Netlify Services.
```bash
netlify-local serve <options>
```

#### `build` command
The [**build** command](https://github.com/8eecf0d2/netlify-local/wiki/Command-Build) will attempt to correctly execute the `build.command` property within `netlify.toml`.
```bash
netlify-local build <options>
```

#### `bundle` command
The [**bundle** command](https://github.com/8eecf0d2/netlify-local/wiki/Command-Bundle) will attempt to parse your `netlify.toml` and build a Webpack Configuration with the correct `entry` and `output` properties before running a Webpack compiler with the computed configuration.
```bash
netlify-local bundle <options>
```

#### Options
You can view a detailed [list of options in the wiki](https://github.com/8eecf0d2/netlify-local/wiki/Options).

### Features

#### Static Router
The **static router** refers to the static server functionality of [Netlify Continuous Deployment](https://www.netlify.com/docs/continuous-deployment), which serves files from the `build.publish` directory, specified within the toml configuration.

#### Lambda Router
The **lambda router** refers to the [Netlify Functions](https://www.netlify.com/features/functions) feature which serves Lambda's or Cloud Functions from the `build.functions` directory, specified within the toml configuration.

#### Redirects
This feature refers to [Netlify Redirects](https://www.netlify.com/docs/netlify-toml-reference#redirects), this has not been correctly implemented and is missing a lot of functionality, see [Issue #8](https://github.com/8eecf0d2/netlify-local/issues/8) for progress.

#### Headers
This feature refers to [Netlify Headers](https://www.netlify.com/docs/netlify-toml-reference#headers), for the most part this works as expected however the [Netlify Basic Auth](https://www.netlify.com/docs/headers-and-basic-auth/#basic-auth) portion is not supported.

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
