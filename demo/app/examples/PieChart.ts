import { Color } from '@nativescript/core';
import { PieChart } from '@nativescript-community/ui-chart/charts';
import { PieData } from '@nativescript-community/ui-chart/data/PieData';
import { PieDataSet } from '@nativescript-community/ui-chart/data/PieDataSet';

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
    const r = getRandomInt(0, 255);
    const g = getRandomInt(0, 255);
    const b = getRandomInt(0, 255);
    return new Color(255, r, g, b);
}

export function onNavigatedTo(args) {
    const page = args.object;
    page.bindingContext = args.context;
}

export function onChartLoaded(args) {
    const chart = args.object as PieChart;

    chart.drawFameRate = true;
    chart.setLogEnabled(true);
    chart.setHighlightPerTapEnabled(true);
    //chart.setHoleRadius(10);
    //chart.setDrawHoleEnabled(false);
    //chart.setHardwareAccelerationEnabled(true);

    const data = new Array(5).fill(0).map(function (v, i) {
        return { label: i + '', value: Math.random() * 100, color: getRandomColor() };
    });

    const sets = [];
    const set = new PieDataSet(data, 'Dataset Label', 'value');
    set.setColors(data.map((d) => d.color));
    set.setDrawValues(true);
    sets.push(set);

    // Create a data object with the data sets
    const pd = new PieData(sets);

    // Set data
    chart.setData(pd);
}

export function redraw(args) {
    const page = args.object.page;

    const chart = page.getViewById('chart');
    if (chart) {
        chart.invalidate();
    }
}

export function onNavigationButtonTap(args) {
    args.object.page.frame.goBack();
}
