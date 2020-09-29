[![npm](https://img.shields.io/npm/v/@nativescript-community/ui-chart.svg)](https://www.npmjs.com/package/@nativescript-community/ui-chart)
[![npm](https://img.shields.io/npm/dt/@nativescript-community/ui-chart.svg?label=npm%20downloads)](https://www.npmjs.com/package/@nativescript-community/ui-chart)
[![GitHub forks](https://img.shields.io/github/forks/nativescript-community/ui-chart.svg)](https://github.com/nativescript-community/ui-chart/network)
[![GitHub stars](https://img.shields.io/github/stars/nativescript-community/ui-chart.svg)](https://github.com/nativescript-community/ui-chart/stargazers)

## Installation

* `tns plugin add @nativescript-community/ui-chart`

---

This plugin is based on [MPAndroidChart](https://github.com/PhilJay/MPAndroidChart), a powerful & easy to use chart library. Therefore, special thanks goes to Philipp Jahoda, the creator of [MPAndroidChart](https://github.com/PhilJay/MPAndroidChart) and the rest of his team.

Instead of directly importing existing native libraries, this library has been rewritten in TypeScript, using '@nativescript-community/ui-canvas' plugin API. Plugin 'ui-canvas'
is an extremely powerful tool that converts Android Native Canvas API to a cross-platform API for NativeScript framework. In few words, 'ui-chart' has the same code-base for both Android and iOS.

In short, these are the benefits of rewriting library into a NativeScript plugin:
* Same codebase for iOS and Android. Makes maintaining the library very easy.
* Smaller apps size because there are no native libs or native frameworks to consume space. All done with the power of {N}

The main goal was to prevent the need for marshalling all datasets. This is extremelly heavy, costly and unnecessary!

Demo samples manifest the power of 'ui-chart' plugin:

* It is the fastest drawing library in comparison to ```@nativescript-community/ui-chart``` and ```nativescript-mpchart```. This is due to:
    - do not marshal or recreate any subset of the data sets. Directly uses the provided array.
    - can share the same data array beetween multiple datasets
    - still use the power of native arrays to NOT marshal arrays of positions while drawing lines with ```@nativescript-community/ui-canvas```




