import { NativeScriptConfig } from '@nativescript/core';

export default {
    id: 'com.akylas.nativescript.chartdemovue',
    appResourcesPath: 'App_Resources',
    webpackConfigPath: 'app.webpack.config.js',
    android: {
        maxLogcatObjectSize: 2048,
        v8Flags: '--expose_gc',
        markingMode: 'none'
    }
} as NativeScriptConfig;
