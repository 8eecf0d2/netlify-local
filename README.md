# Netlify Local
Local Netlify service emulation.

**Note:** This project is experimental, none of the supported Netlify Services are correctly implemented.

### Install
```bash
yarn global add netlify-local
```

### Usage
```bash
netlify-local -n netlify.toml -w webpack.config.js
```

### Options
```bash
Options:
  -V, --version        output the version number
  -n --netlify <path>  path to netlify toml configuration file (default `./netlify.toml`)
  -w --webpack <path>  path to webpack config file (default `./webpack.config.js`)
  -p --port <port>     port to serve from (default: 9000)
  -h, --help           output usage information

Commands:
  serve                serve and rebuild files on change
```

### Todo

- [ ] Write documentation
- [ ] Publish example repository

Implement the following Netlify features as correctly as possible

- [ ] Netlify static file server
- [ ] Netlify functions
- [ ] `netlify.toml` options (_context_, _redirect_, _headers_)

### Credit

This project is based entirely upon [netlify/netlify-lambda](https://github.com/netlify/netlify-lambda).
