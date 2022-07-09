module.exports = {
  outputDir: '../docs',
  publicPath: '/',
  transpileDependencies: [
    'vuetify',
    'markdown-it-prism'
  ],
  productionSourceMap: false,
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
  },
  pages: {
    index: {
      entry: 'src/main.js',
      title: 'My Catalog'
    }
  }
}
