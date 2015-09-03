module.exports = {
  // Need an object+array instead of just a string, I think because
  // Karma makes two builds where one requires the other, leading to:
  // `Error: a dependency to an entry point is not allowed`
  // https://github.com/webpack/webpack/issues/300
  entry: {
    'localstorage-events': ['./source/localstorage-events'],
  },
  output: {
    path: __dirname,
    filename: 'localstorage-events.js',
    library: 'LSEvents',
    libraryTarget: 'umd'
  }
};
