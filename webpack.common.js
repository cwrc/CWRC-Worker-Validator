const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WebpackBar = require('webpackbar');

module.exports = {
  mode: 'none',
  entry: {
    'cwrc.worker': path.resolve(__dirname, 'src', 'index.worker.ts'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build','dist'),
    library: 'cwrc-worker-validator',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    modules: ["build/dist/lib", "node_modules"],
  },
  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new WebpackBar({ color: '#0099ff' }),
  ],
  module: {
    rules: [
      {
        rules: [
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: 'ts-loader',
          },
        ],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              sourceType: 'unambiguous',
              presets: ['@babel/preset-env'],
              plugins: ['@babel/plugin-transform-runtime'],
            },
          },
        ],
      },
    ],
  },
};
