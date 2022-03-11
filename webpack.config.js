const path = require('path');
const webpack = require('webpack');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MODE = process.env.NODE_ENV || 'development';

module.exports = () => ({
  target: 'web',
  mode: MODE,
  entry: {
    web: path.join(__dirname, 'lib', 'frontend', 'src', 'web.js'),
  },
  devServer: {
    host: 'localhost',
    port: 8001,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '3000',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET',
    },
  },
  resolve: {
    extensions: ['.js'],
  },
  output: {
    path: path.join(__dirname, 'lib', 'frontend', 'dist'),
    publicPath: '/',
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/react',
              ],
              plugins: [
                '@babel/plugin-proposal-class-properties',
              ],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {loader: MiniCssExtractPlugin.loader},
          {loader: 'css-loader'},
        ],
      },
      {
        test: /\.scss$/,
        use: [
          {loader: MiniCssExtractPlugin.loader},
          {loader: 'css-loader'},
          {loader: 'sass-loader'},
        ],
      },
      {
        test: /.*\.(eot|svg|woff|woff2|ttf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              esModule: false,
              name: 'fonts/[name].[ext]',
              publicPath: MODE === 'production' ? '.' : '/',
            },
          },
        ],
      },
    ],
  },
  plugins: (() => {
    const result = [
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),
      new webpack.ProvidePlugin({$: 'jquery'}),
    ];
    if (MODE === 'production') {
      result.push(
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            discardComments: {removeAll: true},
          },
        }),
      );
      result.push(
        new CompressionWebpackPlugin({
          filename: '[path]',
          algorithm: 'gzip',
          test: /\.(js|css|svg)$/,
          threshold: 0,
        }),
      );
    }

    return result;
  })(),
});
