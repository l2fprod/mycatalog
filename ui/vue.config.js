module.exports = {
  outputDir: '../public/next',
  publicPath: '/next',
  transpileDependencies: [
    'vuetify',
    'markdown-it-prism'
  ],
  devServer: {
    proxy: {
      '^/generated': {
        target: process.env.USE_LOCAL ? 'http://localhost:9080/' : 'https://mycatalog.mybluemix.net/',
        // logLevel: 'debug'
      },
      '^/js': {
        target: process.env.USE_LOCAL ? 'http://localhost:9080/' : 'https://mycatalog.mybluemix.net/',
        // logLevel: 'debug'
      },
      '^/icons': {
        target: process.env.USE_LOCAL ? 'http://localhost:9080/' : 'https://mycatalog.mybluemix.net/',
        // logLevel: 'debug'
      },
      '^/api': {
        target: process.env.USE_LOCAL ? 'http://localhost:9080/' : 'https://mycatalog.mybluemix.net/',
        // logLevel: 'debug'
      },
    }
  }
}
