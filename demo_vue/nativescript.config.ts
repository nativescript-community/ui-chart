import { NativeScriptConfig } from '@nativescript/core';

export default {
    id: 'com.akylas.nativescript.chartdemovue',
    appResourcesPath: 'App_Resources',
    webpackConfigPath: 'webpack.config.js',
    // profiling: 'timeline',
    android: {
        maxLogcatObjectSize: 2048,
        v8Flags: '--expose_gc',
        markingMode: 'none'
    }
} as NativeScriptConfig;
