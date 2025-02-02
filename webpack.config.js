const path = require("path");
const defaultConfig = require("@wordpress/scripts/config/webpack.config");

module.exports = {
  ...defaultConfig,
  entry: {
    ...defaultConfig.entry(),
    admin: path.resolve(__dirname, "src/admin/admin-global-geo-rules.tsx"),
    "admin-tabs": path.resolve(__dirname, "src/admin/tabs/admin-tabs.js"),
    "admin-settings": path.resolve(__dirname, "src/admin/tabs/admin-settings.js"),
    "geo-content-frontend": path.resolve(
      __dirname,
      "src/geo-rules/evaluate-rule-frontend.ts",
    ),
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js", // Output files for each entry point
  },
  externals: {
    ...defaultConfig.externals,
    // Ensure WordPress-provided React and ReactDOM are used
    react: "React",
    "react-dom": "ReactDOM",
  },
  module: {
    rules: [
      ...defaultConfig.module.rules,
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
            },
          },
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.json",
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
};
