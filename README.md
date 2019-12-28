# Your Plugin Name

Experimental plugin to draw charts using nativescript-canvas. It is a direct JS port of [MPAndroidChart](https://github.com/PhilJay/MPAndroidChart)

The main goal was to prevent the need for marshalling all datasets. This is extremelly heavy, costly and uncessary!

The demo_vue app show the power of the future plugin:

* It is the fastest drawing library in comparaison to ```nativescript-ui-chart``` and ```nativescript-mpchart```. This is due to:
    - do not marshal or recreate any subset of the data sets. Directly uses the provided array.
    - can share the same data array beetween multiple datasets
    - still use the power of native arrays to NOT marshal arrays of positions while drawing lines with ```nativescript-canvas```
* Same JS codebase for iOS and Android. Makes maintaining the library very easy.
* smaller apps size because no native libs or no native framework. All done with the power of {N}

