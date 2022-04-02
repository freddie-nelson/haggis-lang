const path = require("path");

module.exports = {
  entry: "./src/Haggis.ts",
  target: "node",
  mode: "development",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      Haggis: path.resolve(__dirname, "src/Haggis.ts"),
    },
  },
  output: {
    filename: "haggis.js",
    path: __dirname,
  },
};
