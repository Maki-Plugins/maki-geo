const path = require("path");
const defaultConfig = require("@wordpress/scripts/config/webpack.config");

module.exports = {
  ...defaultConfig,
  devServer: {
    ...defaultConfig.devServer,
    host: "maki-test.maki",
    allowedHosts: "maki-test.maki",
  },
  entry: {
    ...defaultConfig.entry(),
    admin: path.resolve(__dirname, "src/admin/admin.tsx"),
    "geo-content-frontend": path.resolve(
      __dirname,
      "src/geo-conditions/evaluate-conditions-frontend.ts",
    ),
    "geo-redirection-frontend": path.resolve(
      __dirname,
      "src/geo-redirection/geo-redirection-frontend.ts",
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
