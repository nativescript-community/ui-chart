const webpackConfig = require('./webpack.config.js');
const webpack = require('webpack');
const { resolve } = require('path');

module.exports = (env, params = {}) => {
    const { development } = env;
    const projectRoot = __dirname;
    const config = webpackConfig(env, params);
    if (development) {
        const srcPath = resolve(projectRoot, '..', 'src', 'charting');
        config.resolve.alias['@nativescript-community/ui-chart'] = srcPath;
        config.resolve.alias['@nativescript-community/ui-chart$'] = resolve(srcPath, 'charts');
        config.plugins.push(new webpack.ContextReplacementPlugin(new RegExp('@nativescript-community/ui-chart'), srcPath));
    }
    return config;
};
