import { Color } from '@nativescript/core';
import { RadarChart } from '@nativescript-community/ui-chart/charts';
import { RadarData } from '@nativescript-community/ui-chart/data/RadarData';
import { RadarDataSet } from '@nativescript-community/ui-chart/data/RadarDataSet';

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
    const r = getRandomInt(0, 255);
    const g = getRandomInt(0, 255);
    const b = getRandomInt(0, 255);
    return new Color(255, r, g, b);
}

export function onChartLoaded(args) {
    const chart = args.object as RadarChart;

    chart.drawFameRate = true;
    chart.setLogEnabled(true);
    // chart.setDrawWeb(false);
    // chart.setHardwareAccelerationEnabled(true);

    const data = new Array(30).fill(0).map((v, i) => ({
        index: i,
        value: Math.random() * 1,
    }));

    const sets = [];
    const set = new RadarDataSet(data, 'Dataset Label', 'value');
    set.setColor(getRandomColor());
    set.setFillColor(getRandomColor());
    set.setDrawFilled(true);
    sets.push(set);

    // Create a data object with the data sets
    const rd = new RadarData(sets);

    // Set data
    chart.setData(rd);
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
