const path = require('path');
const webpack = require('webpack');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
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
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                quietDeps: true,
              },
            },
          },
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
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    new webpack.ProvidePlugin({$: 'jquery'}),
    ...MODE === 'production'
      ? [
        new CompressionWebpackPlugin({
          deleteOriginalAssets: true,
          filename: '[file]',
          algorithm: 'gzip',
          test: /\.(js|css|svg)$/,
          threshold: 0,
          minRatio: Number.MAX_SAFE_INTEGER,
        }),
      ]
      : [],
  ],
});
