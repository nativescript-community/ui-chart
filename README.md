<!-- ⚠️ This README has been generated from the file(s) "blueprint.md" ⚠️--><!-- ⚠️ This README has been generated from the file(s) "blueprint.md" ⚠️-->
<!--  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      DO NOT EDIT THIS READEME DIRECTLY! Edit "bluesprint.md" instead.
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -->
<h1 align="center">@nativescript-community/ui-chart</h1>
<p align="center">
		<a href="https://npmcharts.com/compare/@nativescript-community/ui-chart?minimal=true"><img alt="Downloads per month" src="https://img.shields.io/npm/dm/@nativescript-community/ui-chart.svg" height="20"/></a>
<a href="https://www.npmjs.com/package/@nativescript-community/ui-chart"><img alt="NPM Version" src="https://img.shields.io/npm/v/@nativescript-community/ui-chart.svg" height="20"/></a>
	</p>

<p align="center">
  <b>A powerful chart / graph plugin, supporting line, bar, pie, radar, bubble, and candlestick charts as well as scaling, panning and animations.</b></br>
  <sub><sub>
</p>

<br />



[](#table-of-contents)


[](#table-of-contents)

## Table of Contents

* [Installation](#installation)
* [Migration to 2.x](#migration-to-2x)
* [Usage](#usage)
* [Plain NativeScript](#plain-nativescript)
	* [XML](#xml)
	* [TypeScript](#typescript)
* [NativeScript + Vue](#nativescript--vue)
* [NativeScript + Angular](#nativescript--angular)
* [About](#about)
	* [Examples:](#examples)
* [Demos and Development](#demos-and-development)
	* [Repo Setup](#repo-setup)
	* [Build](#build)
	* [Demos](#demos)
* [Contributing](#contributing)
	* [Update repo ](#update-repo-)
	* [Update readme ](#update-readme-)
	* [Update doc ](#update-doc-)
	* [Publish](#publish)
	* [modifying submodules](#modifying-submodules)
* [Questions](#questions)



[](#installation)


[](#installation)

## Installation

-   `tns plugin add @nativescript-community/ui-chart`

---


[](#migration-to-2x)


[](#migration-to-2x)

## Migration to 2.x

In 2.x most methods like `setColor`/`getColor` have been changed to properties like `color`
You can either to it manually and update them all (you should get tsc errors for removed or renamed methods), or you can use a regexp like `/set([A-Z])(\w*?)\(/` to search and replace (first group should be lowercase in the replace) with something like `\L$1$2=(`
Then use typings to fix potential name change


[](#usage)


[](#usage)

## Usage

For gestures to work, make sure to add the following code block inside main application file (e.g. app.ts):

```typescript
import { install } from '@nativescript-community/ui-chart';
install();
```

You can also check [Wiki](https://github.com/nativescript-community/ui-chart/wiki) for any useful material.


[](#plain-nativescript)


[](#plain-nativescript)

## Plain NativeScript

<span style="color:red">IMPORTANT: </span>Make sure you include `xmlns:ch="@nativescript-community/ui-chart"` on the Page element.

### XML

```XML
<Page xmlns="http://schemas.nativescript.org/tns.xsd" xmlns:ch="@nativescript-community/ui-chart">
    <ScrollView>
        <StackLayout>
            <Label text="Line Chart" fontSize="20"/>
            <ch:LineChart id="line-chart" backgroundColor="lightgray" width="300" height="350" loaded="onLineChartLoaded"/>
        </StackLayout>
    </ScrollView>
</Page>
```

### TypeScript

```typescript
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';

export function onLineChartLoaded(args) {
    const chart = args.object as LineChart;

    chart.dragEnabled = true;
    chart.scaleEnabled = true;

    const data = new Array(500).fill(0).map((v, i) => ({
        index: i,
        value: Math.random() * 1,
    }));

    const sets = [];
    const set = new LineDataSet(data, 'Legend Label', 'index', 'value');
    set.color = 'blue';
    sets.push(set);

    // Create a data object with the data sets
    const ld = new LineData(sets);

    // Set data
    chart.data = ld;
}
```


[](#nativescript--vue)


[](#nativescript--vue)

## NativeScript + Vue

```javascript
Vue.registerElement('LineChart', () => require('@nativescript-community/ui-chart').LineChart);
```

```html
<LineChart ref="chart" width="300" height="400" @loaded="onChartLoaded"> </LineChart>
```

```javascript
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
```

```javascript
onChartLoaded() {
    const chart = this.$refs.chart['nativeView'] as LineChart;
    chart.backgroundColor = 'white';

    chart.drawGridBackground = false;

    // enable scaling and dragging
    chart.dragEnabled = true;
    chart.scaleEnabled = true;

    // force pinch zoom along both axis
    chart.petPinchZoomEnabled = true;

    // disable dual axis (only use LEFT axis)
    chart.axisRight.enabled = false;

    const myData = new Array(500).fill(0).map((v, i) => ({
        index: i,
        value: Math.random() * 1,
    }));

    const sets = [];
    const set = new LineDataSet(myData, 'Legend Label', 'index', 'value');
    set.setColor('blue');
    sets.push(set);

    // Create a data object with the data sets
    const ld = new LineData(sets);

    // Set data
    chart.data = ld;
}
```


[](#nativescript--angular)


[](#nativescript--angular)

## NativeScript + Angular
Register the element in app.module.ts
```javascript
registerElement('LineChart', () => require('@nativescript-community/ui-chart').LineChart);
```

```html
<LineChart width="300" height="400" (loaded)="onChartLoaded($event)"> </LineChart>
```

```javascript
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
```

```javascript
onChartLoaded(args) {
    const chart = args.object as LineChart;
    chart.backgroundColor = 'white';

    chart.drawGridBackground = false;

    // enable scaling and dragging
    chart.dragEnabled = true;
    chart.scaleEnabled = true;

    // force pinch zoom along both axis
    chart.petPinchZoomEnabled = true;

    // disable dual axis (only use LEFT axis)
    chart.axisRight.enabled = false;

    const myData = new Array(500).fill(0).map((v, i) => ({
        index: i,
        value: Math.random() * 1,
    }));

    const sets = [];
    const set = new LineDataSet(myData, 'Legend Label', 'index', 'value');
    set.color = 'blue';
    sets.push(set);

    // Create a data object with the data sets
    const ld = new LineData(sets);

    // Set data
    chart.data = ld;
}
```


[](#about)


[](#about)

## About

This plugin is based on [MPAndroidChart](https://github.com/PhilJay/MPAndroidChart), a powerful & easy to use chart library. Therefore, special thanks goes to Philipp Jahoda, the creator of [MPAndroidChart](https://github.com/PhilJay/MPAndroidChart) and the rest of his team.

Instead of directly importing existing native libraries, this library has been rewritten in TypeScript, using [@nativescript-community/ui-canvas](https://github.com/nativescript-community/ui-canvas) plugin API as a basis. Plugin 'ui-canvas' is an extremely powerful tool that converts Android Native Canvas API to a cross-platform API for NativeScript framework. In few words, 'ui-chart' has the same code-base for both Android and iOS.

Additionally, [@nativescript-community/gesturehandler](https://github.com/nativescript-community/gesturehandler) plugin is used for handling chart gestures.

In short, these are the benefits of rewriting library into a NativeScript plugin:

-   Same codebase for Android and iOS. Makes maintaining the library very easy.
-   Smaller apps size because there are no native libs or native frameworks to consume space. All done with the power of {N}

Originally, the main goal was to prevent the need for marshalling all datasets. This is extremely heavy, costly and unnecessary!

Upon running demo samples, one can conclude it is the fastest drawing library, in comparison to `nativescript-ui-chart` and `nativescript-mpchart`.

That is because:

-   It does not marshal or recreate any subset of the data sets, but directly uses the provided array instead
-   It can share the same data array between multiple datasets
-   It can still use the power of native arrays to NOT marshal arrays of positions while drawing lines with [@nativescript-community/ui-canvas](https://github.com/nativescript-community/ui-canvas)

### Examples:

- [Basic](demo-snippets/vue/Basic.vue)
- [Basic](demo-snippets/vue/BubbleChart.vue)
- [Basic](demo-snippets/vue/CandleStickChart.vue)
- [Basic](demo-snippets/vue/CombinedChart.vue)
- [Basic](demo-snippets/vue/NSChart.vue)
- [Basic](demo-snippets/vue/PieChart.vue)
- [Basic](demo-snippets/vue/Realtime.vue)
- [Basic](demo-snippets/vue/ScatterPlot.vue)


[](#demos-and-development)


[](#demos-and-development)

## Demos and Development


### Repo Setup

The repo uses submodules. If you did not clone with ` --recursive` then you need to call
```
git submodule update --init
```

The package manager used to install and link dependencies must be `pnpm` or `yarn`. `npm` wont work.

To develop and test:
if you use `yarn` then run `yarn`
if you use `pnpm` then run `pnpm i`

**Interactive Menu:**

To start the interactive menu, run `npm start` (or `yarn start` or `pnpm start`). This will list all of the commonly used scripts.

### Build

```bash
npm run build.all
```
WARNING: it seems `yarn build.all` wont always work (not finding binaries in `node_modules/.bin`) which is why the doc explicitly uses `npm run`

### Demos

```bash
npm run demo.[ng|react|svelte|vue].[ios|android]

npm run demo.svelte.ios # Example
```

Demo setup is a bit special in the sense that if you want to modify/add demos you dont work directly in `demo-[ng|react|svelte|vue]`
Instead you work in `demo-snippets/[ng|react|svelte|vue]`
You can start from the `install.ts` of each flavor to see how to register new demos 


[](#contributing)


[](#contributing)

## Contributing

### Update repo 

You can update the repo files quite easily

First update the submodules

```bash
npm run update
```

Then commit the changes
Then update common files

```bash
npm run sync
```
Then you can run `yarn|pnpm`, commit changed files if any

### Update readme 
```bash
npm run readme
```

### Update doc 
```bash
npm run doc
```

### Publish

The publishing is completely handled by `lerna` (you can add `-- --bump major` to force a major release)
Simply run 
```shell
npm run publish
```

### modifying submodules

The repo uses https:// for submodules which means you won't be able to push directly into the submodules.
One easy solution is t modify `~/.gitconfig` and add
```
[url "ssh://git@github.com/"]
	pushInsteadOf = https://github.com/
```


[](#questions)


[](#questions)

## Questions

If you have any questions/issues/comments please feel free to create an issue or start a conversation in the [NativeScript Community Discord](https://nativescript.org/discord).

[](#demos-and-development)

## Demos and Development


### Repo Setup

The repo uses submodules. If you did not clone with ` --recursive` then you need to call
```
git submodule update --init
```

The package manager used to install and link dependencies must be `pnpm` or `yarn`. `npm` wont work.

To develop and test:
if you use `yarn` then run `yarn`
if you use `pnpm` then run `pnpm i`

**Interactive Menu:**

To start the interactive menu, run `npm start` (or `yarn start` or `pnpm start`). This will list all of the commonly used scripts.

### Build

```bash
npm run build.all
```
WARNING: it seems `yarn build.all` wont always work (not finding binaries in `node_modules/.bin`) which is why the doc explicitly uses `npm run`

### Demos

```bash
npm run demo.[ng|react|svelte|vue].[ios|android]

npm run demo.svelte.ios # Example
```

Demo setup is a bit special in the sense that if you want to modify/add demos you dont work directly in `demo-[ng|react|svelte|vue]`
Instead you work in `demo-snippets/[ng|react|svelte|vue]`
You can start from the `install.ts` of each flavor to see how to register new demos 


[](#contributing)

## Contributing

### Update repo 

You can update the repo files quite easily

First update the submodules

```bash
npm run update
```

Then commit the changes
Then update common files

```bash
npm run sync
```
Then you can run `yarn|pnpm`, commit changed files if any

### Update readme 
```bash
npm run readme
```

### Update doc 
```bash
npm run doc
```

### Publish

The publishing is completely handled by `lerna` (you can add `-- --bump major` to force a major release)
Simply run 
```shell
npm run publish
```

### modifying submodules

The repo uses https:// for submodules which means you won't be able to push directly into the submodules.
One easy solution is t modify `~/.gitconfig` and add
```
[url "ssh://git@github.com/"]
	pushInsteadOf = https://github.com/
```

[](#questions)

## Questions

If you have any questions/issues/comments please feel free to create an issue or start a conversation in the [NativeScript Community Discord](https://nativescript.org/discord).