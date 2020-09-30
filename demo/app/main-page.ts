import { fromObject } from '@nativescript/core';
export function onLoaded (args) {
    const page = args.object;
    console.log('onLoaded');

    page.bindingContext = fromObject({
        examples: [
            { title: 'Add data points in realtime', moduleName: 'examples/RealTime' },
            { title: 'Simple Bar Chart', moduleName: 'examples/BarChart' },
            { title: 'Simple Bubble Chart', moduleName: 'examples/BubbleChart' },
            { title: 'Simple CandleStick Chart', moduleName: 'examples/CandleStickChart' },
            { title: 'Simple Horizontal Bar Chart', moduleName: 'examples/HorizontalBarChart' },
            { title: 'Simple Line Chart', moduleName: 'examples/LineChart' },
            { title: 'Simple Pie Chart', moduleName: 'examples/PieChart' },
            { title: 'Simple Radar Chart', moduleName: 'examples/RadarChart' },
            { title: 'Simple Scatter Chart', moduleName: 'examples/ScatterChart' },
        ],
    });
};

export function goToExample  (args) {
    const page = args.object.page;

    console.log('goToExample');
    const entry = page.bindingContext.examples[args.index];
    page.frame.navigate({
        moduleName: entry.moduleName,
        context: entry,
        animated: true
    });
};
