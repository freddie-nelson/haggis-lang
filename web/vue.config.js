const { defineConfig } = require("@vue/cli-service");
const path = require("path");

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      alias: {
        Haggis: path.resolve(__dirname, "../interpreter/src/HaggisWeb.ts"),
        "@interpreter": path.resolve(__dirname, "../interpreter/src"),
      },
    },
  },
  chainWebpack: (config) => {
    config.plugin("html").tap((args) => {
      args[0].title = "Haggis Lang";
      return args;
    });
  },
});
