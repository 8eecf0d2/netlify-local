const path = require("path");

module.exports = {
  target: "node",
  mode: "none",
  entry: {
    foo: "foo.js",
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].js",
    libraryTarget: "commonjs",
  }
}
