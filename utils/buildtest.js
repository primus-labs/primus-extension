// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';

var webpack = require('webpack'),
  path = require('path'),
  fs = require('fs'),
  config = require('../webpack.config'),
  ZipPlugin = require('zip-webpack-plugin');

delete config.chromeExtensionBoilerplate;

config.mode = 'development';

var packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

function getLocalTimestamp() {
  const pad = (num) => String(num).padStart(2, '0');
  const now = new Date();

  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

config.plugins = (config.plugins || []).concat(
  new ZipPlugin({
    filename: `${packageInfo.name}-${packageInfo.version}-${getLocalTimestamp()}.zip`,
    path: path.join(__dirname, '../', 'zip'),
  })
);

webpack(config, function (err) {
  if (err) throw err;
});
