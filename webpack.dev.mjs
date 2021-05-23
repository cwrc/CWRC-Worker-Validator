import webpack from 'webpack';
import Merge from 'webpack-merge';
import common from './webpack.common.js';

export default Merge.merge(common, {
  mode: 'development',
  cache: true,
  devtool: false,
  output: {
    pathinfo: true,
    publicPath: '/',
  },
  optimization: {
    checkWasmTypes: false,
    concatenateModules: false,
    emitOnErrors: true,
    flagIncludedChunks: false,
    minimize: false,
    nodeEnv: 'development',
    removeAvailableModules: false,
    sideEffects: false,
    usedExports: false,
  },
  performance: { hints: false },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
  ],
});
