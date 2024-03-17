const { resolve } = require('node:path');

const publicPath = resolve(__dirname, '..', 'public');

exports.publicPath = publicPath;
