import { Color } from '@nativescript/core';
import { LineChart } from '@nativescript-community/ui-chart/charts';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
import { LegendDirection, LegendHorizontalAlignment, LegendVerticalAlignment } from '@nativescript-community/ui-chart/components/Legend';

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
    const chart = args.object as LineChart;

    chart.drawFameRate = true;
    // chart.setLogEnabled(true);
    chart.setScaleEnabled(true);
    chart.setDragEnabled(true);
    // chart.setHardwareAccelerationEnabled(true);

    const data = new Array(10).fill(0).map((v, i) => ({
        index: i,
        value: Math.random() * 1,
    }));

    const sets = [];
    const set = new LineDataSet(data, 'Dataset Label', 'index', 'value');
    set.setColor(getRandomColor());
    sets.push(set);

    // create a data object with the data sets
    const ld = new LineData(sets);
    let xAxis = chart.getXAxis();
    xAxis.setPosition(XAxisPosition.BOTTOM);
    const legend = chart.getLegend();
    // legend.setDirection(LegendDirection.LEFT_TO_RIGHT);
    // legend.setHorizontalAlignment(LegendHorizontalAlignment.CENTER);
    // legend.setVerticalAlignment(LegendVerticalAlignment.TOP)
    legend.setYOffset(10);

    // set data
    chart.setData(ld);
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
