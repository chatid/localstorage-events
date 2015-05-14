module.exports = {
  devtool: 'source-map',
  entry: './localstorage-events',
  output: {
    path: __dirname + '/dist',
    filename: 'localstorage-events.js',
    library: 'LSEvents',
    libraryTarget: 'umd'
  },
  externals: [{
    // js-cookie (formerly jquery-cookie) requires jquery but allows it to be undefined
    'jquery': 'this $'
  }]
};
