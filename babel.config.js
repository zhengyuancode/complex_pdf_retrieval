// babel.config.js
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  plugins: [
    '@babel/plugin-transform-class-static-block', 
    '@babel/plugin-transform-private-methods'     
  ]
}