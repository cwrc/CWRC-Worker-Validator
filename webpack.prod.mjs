import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import Merge from 'webpack-merge';
import common from './webpack.common.js';

export default Merge.merge(common, {
  mode: 'production',
  devtool: false,
  output: { pathinfo: false },
  optimization: {
    checkWasmTypes: true,
    concatenateModules: true,
    emitOnErrors: false,
    flagIncludedChunks: true,
    nodeEnv: 'production',
    sideEffects: true,
    usedExports: true,
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  performance: { hints: 'warning' },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.SourceMapDevToolPlugin({
      exclude: ['js/vendor.js'],
      filename: '[name].js.map',
    }),
  ],
});
