var webpack = require('webpack'),
  path = require('path'),
  fileSystem = require('fs-extra'),
  env = require('./utils/env'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin');
var { CleanWebpackPlugin } = require('clean-webpack-plugin');
var ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
var ReactRefreshTypeScript = require('react-refresh-typescript');
var FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ASSET_PATH = process.env.ASSET_PATH || '/';

var alias = {
  '@': path.resolve(__dirname, './src'),
  buffer: path.resolve(__dirname, 'node_modules/buffer'),
  'bn.js': path.resolve(__dirname, 'node_modules/bn.js'),
  'ethereumjs-util': path.resolve(__dirname, 'node_modules/ethereumjs-util'),
};

// load the secrets
var secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js');

var imgFileExtensions = ['svg', 'png', 'jpg', 'jpeg', 'gif'];
var fontFileExtensions = ['eot', 'otf', 'ttf', 'woff', 'woff2'];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

const isDevelopment = process.env.NODE_ENV !== 'production';

var options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    home: path.join(__dirname, 'src', 'pages', 'Home', 'index.jsx'),
    background: path.join(__dirname, 'src', 'pages', 'Background', 'index.js'),
    //offscreen: path.join(__dirname, 'src', 'services', 'algorithms', 'offscreen.js'),
  },
  chromeExtensionBoilerplate: {
    notHotReload: ['background'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build'),
    clean: true,
    publicPath: ASSET_PATH,
  },
  module: {
    rules: [
      {
        // look for .css or .scss files
        test: /\.css$/,
        // in the `src` directory
        use: [
          MiniCssExtractPlugin.loader,
          // {
          //   loader: 'style-loader',
          // },
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        // look for .css or .scss files
        test: /\.s[ac]ss$/,
        // in the `src` directory
        use: [
          MiniCssExtractPlugin.loader,
          // {
          //   loader: 'style-loader',
          // },
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: new RegExp('.(' + imgFileExtensions.join('|') + ')$'),
        type: 'asset',
        exclude: /node_modules/,
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // Images smaller than 10kb will be processed by base64
          },
        },
        generator: {
          filename: 'static/imgs/[hash:8][ext][query]',
        },
      },
      {
        test: new RegExp('.(' + fontFileExtensions.join('|') + ')$'),
        type: 'asset/resource',
        exclude: /node_modules/,
        generator: {
          filename: 'static/fonts/[hash:8][ext][query]',
        },
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('ts-loader'),
            options: {
              getCustomTransformers: () => ({
                before: [isDevelopment && ReactRefreshTypeScript()].filter(
                  Boolean
                ),
              }),
              transpileOnly: isDevelopment,
            },
          },
        ],
      },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'source-map-loader',
          },
          {
            loader: require.resolve('babel-loader'),
            options: {
              plugins: [
                isDevelopment && require.resolve('react-refresh/babel'),
              ].filter(Boolean),
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: alias,
    extensions: imgFileExtensions
      .map((extension) => '.' + extension)
      .concat(['.js', '.jsx', '.ts', '.tsx', '.css']),
    fallback: {
      https: require.resolve('https-browserify'),
      http: require.resolve('stream-http'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      assert: require.resolve('assert'),
      os: require.resolve('os-browserify'),
      url: require.resolve('url'),
      constants: require.resolve('constants-browserify'),
      zlib: require.resolve('browserify-zlib'),
      util: require.resolve('util'),
      path: require.resolve('path-browserify'),
      net: require.resolve('net'),
      async_hooks: false,
      fs: false,
    },
  },
  plugins: [
    isDevelopment && new ReactRefreshWebpackPlugin(),
    new CleanWebpackPlugin({ verbose: false }),
    new webpack.ProgressPlugin(),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: path.join(__dirname, 'build'),
          force: true,
          transform: function (content, path) {
            // generates the manifest file using the package.json informations
            if (process.env.NODE_ENV === 'production') {
              return Buffer.from(
                JSON.stringify({
                  description: process.env.npm_package_description,
                  version: process.env.npm_package_version,
                  ...JSON.parse(content.toString()),
                })
              );
            } else {
              let jsonobj = JSON.parse(content.toString());
              jsonobj.host_permissions.push('https://api-dev.padolabs.org/');
              jsonobj.host_permissions.push(
                'https://xuda-note.oss-cn-shanghai.aliyuncs.com/'
              );
              return Buffer.from(
                JSON.stringify({
                  description: process.env.npm_package_description,
                  version: process.env.npm_package_version,
                  ...jsonobj,
                })
              );
            }
          },
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/img/logo.png',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/services/algorithms/offscreen.html',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/services/algorithms/offscreen.js',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/services/algorithms/ccxt.browser.min.js',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/services/algorithms/client_plugin.data',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/services/algorithms/client_plugin.wasm',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/services/algorithms/client_plugin.worker.js',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/services/algorithms/client_plugin.js',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/content/pageDecode.js',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/content/pageDecode.css',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/img/content/iconExtension.svg',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/img/content/iconSuc.svg',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Home', 'index.html'),
      filename: 'home.html',
      chunks: ['home'],
      cache: false,
    }),
    new FriendlyErrorsWebpackPlugin(),
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
      const mod = resource.request.replace(/^node:/, '');
      switch (mod) {
        case 'buffer':
          resource.request = 'buffer';
          break;
        case 'http':
          resource.request = 'http';
          break;
        case 'https':
          resource.request = 'https';
          break;
        case 'stream':
          resource.request = 'stream';
          break;
        case 'url':
          resource.request = 'url';
          break;
        case 'zlib':
          resource.request = 'zlib';
          break;
        case 'util':
          resource.request = 'util';
          break;
        case 'net':
          resource.request = 'net';
          break;
        default:
          throw new Error(`Not found ${mod}`);
      }
    }),
    new MiniCssExtractPlugin({
      // 定义输出文件名和目录
      filename: 'static/css/main.css',
    }),
  ].filter(Boolean),
  infrastructureLogging: {
    level: 'info',
  },
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-source-map';
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  };
}

module.exports = options;
