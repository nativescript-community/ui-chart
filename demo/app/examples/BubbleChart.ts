import { Color } from '@nativescript/core';
import { BubbleChart } from '@nativescript-community/ui-chart/charts';
import { BubbleData } from '@nativescript-community/ui-chart/data/BubbleData';
import { BubbleDataSet } from '@nativescript-community/ui-chart/data/BubbleDataSet';

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
    const chart = args.object as BubbleChart;

    chart.drawFameRate = true;
    // chart.setLogEnabled(true);
    chart.setScaleEnabled(true);
    chart.setDragEnabled(true);
    chart.getAxisRight().setEnabled(false);
    chart.setHighlightPerTapEnabled(true);
    // chart.setHardwareAccelerationEnabled(true);

    const data = new Array(10).fill(0).map(function (v, i) {
        return { y: Math.random() * 1, size: Math.random() * 1 };
    });

    const sets = [];
    const set = new BubbleDataSet(data, 'Dataset Label');
    set.setDrawIcons(true);
    set.setColor(getRandomColor());
    set.setDrawValues(true);
    sets.push(set);

    // Create a data object with the data sets
    const bd = new BubbleData(sets);

    // Set data
    chart.setData(bd);
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
