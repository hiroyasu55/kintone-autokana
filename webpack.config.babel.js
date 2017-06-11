export default {
  entry: {
    plugin: `${__dirname}/src/js/plugin.js`,
    config: './src/js/config.js',
  },
  output: {
    filename: '[name].js',
    path: `${__dirname}/plugin/js`,
  },
  devtool: 'inline-source-map',
  module: {
    loaders: [{
      test: /\.js$/,
      include: [
        `${__dirname}/src/js`
      ],
      loader: 'babel',
    }],
  },
  resolve: {
    root: [
      `${__dirname}/lib`,
    ],
  },
};
