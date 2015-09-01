module.exports = {
  entry: './localstorage-events',
  output: {
    path: __dirname + '/dist',
    filename: 'localstorage-events.js',
    library: 'LSEvents',
    libraryTarget: 'umd'
  }
};
