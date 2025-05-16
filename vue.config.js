const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({

  publicPath: '/', // 确保静态资源路径正确
  transpileDependencies: true,
  chainWebpack: config => {
    config.module
      .rule('js')
      .use('babel-loader')
      .loader('babel-loader')
      .options({
        plugins: [
          '@babel/plugin-transform-class-static-block',
          '@babel/plugin-transform-private-methods'
        ]
      });
  }
});