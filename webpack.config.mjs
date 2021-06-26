import path from 'path';
import { fileURLToPath } from 'url';

import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import WebpackBar from 'webpackbar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    'cwrc.worker': path.resolve(__dirname, 'src', 'index.worker.ts'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build', 'dist'),
    globalObject: 'this',
    library: 'cwrc-worker-validator',
    libraryTarget: 'umd',
  },
  resolve: { extensions: ['.ts', '.js'] },
  plugins: [new CleanWebpackPlugin(), new WebpackBar()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
};
