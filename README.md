[![npm](https://img.shields.io/npm/v/@nativescript-community/ui-chart.svg)](https://www.npmjs.com/package/@nativescript-community/ui-chart)
[![npm](https://img.shields.io/npm/dt/@nativescript-community/ui-chart.svg?label=npm%20downloads)](https://www.npmjs.com/package/@nativescript-community/ui-chart)
[![GitHub forks](https://img.shields.io/github/forks/nativescript-community/ui-chart.svg)](https://github.com/nativescript-community/ui-chart/network)
[![GitHub stars](https://img.shields.io/github/stars/nativescript-community/ui-chart.svg)](https://github.com/nativescript-community/ui-chart/stargazers)

## Installation

* `tns plugin add @nativescript-community/ui-chart`

---

### Usage

For gestures to work, make sure to add the following code block inside main application file (e.g. app.ts):
```typescript
import { install } from '@nativescript-community/gesturehandler';
install();
```

## Plain NativeScript

<span style="color:red">IMPORTANT: </span>_Make sure you include `xmlns:cv="@nativescript-community/ui-chart"` on the Page element.

### XML

```XML
<Page xmlns="http://schemas.nativescript.org/tns.xsd" xmlns:chart="@nativescript-community/ui-chart">
    <ScrollView>
        <StackLayout>
            <Label text="Radar Chart" fontSize="20"/>
            <chart:RadarChart id="radar-chart" backgroundColor="lightgray" width="300" height="350" loaded="onRadarChartLoaded"/>
        </StackLayout>
    </ScrollView>
</Page>
```

### TypeScript

```typescript
import { Color } from '@nativescript/core';
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';

export function onLineChartLoaded(args) {
    const chart = args.object as LineChart;

    chart.setScaleEnabled(true);
    chart.setDragEnabled(true);

    const data = new Array(500).fill(0).map((v, i) => ({
        index: i,
        value: Math.random() * 1,
    }));

    const sets = [];
    const set = new LineDataSet(data, 'value', 'index', 'value');
    set.setColor(Color.BLUE);
    sets.push(set);

    // Create a data object with the data sets
    const ld = new LineData(sets);

    // Set data
    chart.setData(ld);
}
```

## NativeScript + Vue
```javascript
```

## About

This plugin is based on [MPAndroidChart](https://github.com/PhilJay/MPAndroidChart), a powerful & easy to use chart library. Therefore, special thanks goes to Philipp Jahoda, the creator of [MPAndroidChart](https://github.com/PhilJay/MPAndroidChart) and the rest of his team.

Instead of directly importing existing native libraries, this library has been rewritten in TypeScript, using '@nativescript-community/ui-canvas' plugin API as a basis. Plugin 'ui-canvas'
is an extremely powerful tool that converts Android Native Canvas API to a cross-platform API for NativeScript framework. In few words, 'ui-chart' has the same code-base for both Android and iOS.

In short, these are the benefits of rewriting library into a NativeScript plugin:
* Same codebase for Android and iOS. Makes maintaining the library very easy.
* Smaller apps size because there are no native libs or native frameworks to consume space. All done with the power of {N}

The main goal was to prevent the need for marshalling all datasets. This is extremelly heavy, costly and unnecessary!

Demo samples manifest the power of 'ui-chart' plugin:

* It is the fastest drawing library in comparison to ```@nativescript-community/ui-chart``` and ```nativescript-mpchart```. This is due to:
    - do not marshal or recreate any subset of the data sets. Directly uses the provided array.
    - can share the same data array between multiple datasets
    - still use the power of native arrays to NOT marshal arrays of positions while drawing lines with ```@nativescript-community/ui-canvas```

## Documentation

The NativeScript 'ui-chart' plugin is based on the [MPAndroidChart](https://github.com/PhilJay/MPAndroidChart) library.
In few words, its API is identical. 


