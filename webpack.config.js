const defaultConfig = require("@wordpress/scripts/config/webpack.config");
const path = require("path");

module.exports = {
  ...defaultConfig,
  entry: {
    ...defaultConfig.entry(),
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js",
  },
};
