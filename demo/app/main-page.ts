import { fromObject } from '@nativescript/core';
export function onLoaded (args) {
    const page = args.object;
    console.log('onLoaded');

    page.bindingContext = fromObject({
        examples: [
            { title: 'Simple Bar Chart', moduleName: 'examples/BarChart' },
            { title: 'Simple Horizontal Bar Chart', moduleName: 'examples/HorizontalBarChart' },
            { title: 'Simple Line Chart', moduleName: 'examples/LineChart' },
            { title: 'Simple Pie Chart', moduleName: 'examples/PieChart' },
            { title: 'Simple Radar Chart', moduleName: 'examples/RadarChart' },
        ],
    });
};

export function goToExample  (args) {
    const page = args.object.page;

    console.log('goToExample');
    page.frame.navigate(page.bindingContext.examples[args.index].moduleName);
};
