module.exports = {
  transpileDependencies: [
    'vuetify',
    'markdown-it-prism'
  ],
  devServer: {
    proxy: {
      '^/generated': {
        target: 'https://mycatalog.mybluemix.net/',
        // logLevel: 'debug'
      },
      '^/js': {
        target: 'https://mycatalog.mybluemix.net/',
        // logLevel: 'debug'
      },
      '^/icons': {
        target: 'https://mycatalog.mybluemix.net/',
        // logLevel: 'debug'
      },
    }
  }
}
