import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'com.akylas.nativescript.chartdemo',
  appResourcesPath: 'App_Resources',
  webpackConfigPath: 'app.webpack.config.js',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  }
} as NativeScriptConfig;