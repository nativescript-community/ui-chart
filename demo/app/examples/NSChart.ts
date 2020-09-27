import { BarDataSet } from '@nativescript-community/ui-chart/data/BarDataSet';
import { BarData } from '@nativescript-community/ui-chart/data/BarData';
import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
import { RadarDataSet } from '@nativescript-community/ui-chart/data/RadarDataSet';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
import { RadarData } from '@nativescript-community/ui-chart/data/RadarData';
import { PieData } from '@nativescript-community/ui-chart/data/PieData';
import { PieDataSet } from '@nativescript-community/ui-chart/data/PieDataSet';
import { BarChart } from '@nativescript-community/ui-chart/charts/BarChart';
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { RadarChart } from '@nativescript-community/ui-chart/charts/RadarChart';
import { PieChart } from '@nativescript-community/ui-chart/charts/PieChart';
import { Color, knownFolders } from '@nativescript/core';
import { Easing } from '@nativescript-community/ui-chart/animation/ChartAnimator';

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
    const r = getRandomInt(0, 255);
    const g = getRandomInt(0, 255);
    const b = getRandomInt(0, 255);
    return new Color(255, r, g, b);
}

function loadData() {
    return JSON.parse(knownFolders.currentApp().getFile('assets/migration_test.json').readTextSync());
}

export function onBarChartLoaded(args) {
    const chart = args.object as BarChart;

    chart.drawFameRate = true;
    chart.setLogEnabled(true);
    chart.setScaleEnabled(true);
    chart.setDragEnabled(true);
    chart.getAxisRight().setEnabled(false);
    chart.setHighlightPerTapEnabled(true);
    // chart.setHardwareAccelerationEnabled(true);

    const data = new Array(5).fill(0).map(function (v, i) {
        return { index: i, value: Math.random() * 1 };
    });

    console.log('setData', data.length, data[0]);
    const sets = [];
    const set = new BarDataSet(data, 'value', 'index', 'value');
    set.setDrawIcons(true);
    set.setColor(getRandomColor());
    set.setDrawValues(true);
    sets.push(set);

    // create a data object with the data sets
    const bardata = new BarData(sets);

    // set data
    chart.setData(bardata);
}

export function onLineChartLoaded(args) {
    const chart = args.object as LineChart;

    chart.drawFameRate = true;
    chart.setLogEnabled(true);
    chart.setScaleEnabled(true);
    chart.setDragEnabled(true);
    // chart.setHardwareAccelerationEnabled(true);

    const data = new Array(1000).fill(0).map((v, i) => ({
        index: i,
        value: Math.random() * 1,
    }));

    console.log('setData', data.length, data[0]);
    const sets = [];
    const set = new LineDataSet(data, 'value', 'index', 'value');
    set.setColor(getRandomColor());
    sets.push(set);

    // create a data object with the data sets
    const linedata = new LineData(sets);

    // set data
    chart.setData(linedata);
}

export function onRadarChartLoaded(args) {
    const chart = args.object as RadarChart;

    chart.drawFameRate = true;
    chart.setLogEnabled(true);
    // chart.setDrawWeb(false);
    // chart.setScaleEnabled(true);
    // chart.setDragEnabled(true);
    // chart.setHardwareAccelerationEnabled(true);

    const data = new Array(30).fill(0).map((v, i) => ({
        index: i,
        value: Math.random() * 1,
    }));

    const sets = [];
    const set = new RadarDataSet(data, 'value', 'value');
    set.setColor(getRandomColor());
    set.setFillColor(getRandomColor());
    set.setDrawFilled(true);
    sets.push(set);

    // create a data object with the data sets
    const linedata = new RadarData(sets);

    // set data
    chart.setData(linedata);
    // setTimeout(() => chart.animateXY(500, 500, Easing.Quadratic.InOut, Easing.Quadratic.InOut), 1000);
}

export function onPieChartLoaded(args) {
    const chart = args.object as PieChart;

    chart.drawFameRate = true;
    chart.setLogEnabled(true);
    chart.setHighlightPerTapEnabled(true);
    //chart.setHoleRadius(10);
    //chart.setDrawHoleEnabled(false);
    // chart.setHardwareAccelerationEnabled(true);

    const data = new Array(5).fill(0).map(function (v, i) {
        return { label: i + '', value: Math.random() * 100, color: getRandomColor() };
    });

    // Generate pie colors
    // const colors = [];
    // while (colors.length < data.length) {
    //     const c = getRandomColor();
    //     if (!colors.includes(c)) {
    //         colors.push(c);
    //     }
    // }

    const sets = [];
    const set = new PieDataSet(data, 'My pie dataset', 'value');
    set.setColors(data.map((d) => d.color));
    set.setDrawValues(true);
    sets.push(set);

    // create a data object with the data sets
    const piedata = new PieData(sets);

    // set data
    chart.setData(piedata);
}

export function redraw(args) {
    const page = args.object.page;

    const bc = page.getViewById('bar-chart');
    if (bc) {
        bc.invalidate();
    }

    const hbc = page.getViewById('horizontal-bar-chart');
    if (hbc) {
        hbc.invalidate();
    }

    const lc = page.getViewById('line-chart');
    if (lc) {
        lc.invalidate();
    }

    const pc = page.getViewById('pie-chart');
    if (pc) {
        pc.invalidate();
    }

    const rc = page.getViewById('radar-chart');
    if (rc) {
        rc.invalidate();
    }
}

export function onNavigationButtonTap(args) {
    args.object.page.frame.goBack();
}
