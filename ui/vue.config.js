module.exports = {
  transpileDependencies: [
    'vuetify'
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
    }
  }
}
