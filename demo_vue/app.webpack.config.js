const webpackConfig = require('./webpack.config.js');
const webpack = require('webpack');
const { resolve } = require('path');

module.exports = (env, params = {}) => {
    const { development } = env;
    const projectRoot = __dirname;
    const config = webpackConfig(env, params);
    if (development) {
        const srcPath = resolve(projectRoot, '..', 'src', 'charting');
        config.resolve.alias['nativescript-chart'] = srcPath;
        config.plugins.push(new webpack.ContextReplacementPlugin(/nativescript-chart/, srcPath));
    }
    return config;
};
