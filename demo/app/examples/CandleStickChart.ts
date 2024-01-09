import { Color } from '@nativescript/core';
import { Style } from '@nativescript-community/ui-canvas';
import { CandleStickChart } from '@nativescript-community/ui-chart/charts';
import { CandleData } from '@nativescript-community/ui-chart/data/CandleData';
import { CandleDataSet } from '@nativescript-community/ui-chart/data/CandleDataSet';

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
    const chart = args.object as CandleStickChart;

    chart.drawFrameRate = true;
    // chart.setLogEnabled(true);
    chart.setScaleEnabled(true);
    chart.setDragEnabled(true);
    chart.getAxisRight().setEnabled(false);
    chart.setHighlightPerTapEnabled(true);
    // chart.setHardwareAccelerationEnabled(true);

    const count = 10;
    const range = 100;
    const data = [];

    for (let i = 0; i < count; i++) {
        const multi = range + 1;
        const val = Math.random() * 40 + multi;

        const high = Math.random() * 9 + 8;
        const low = Math.random() * 9 + 8;

        const open = Math.random() * 6 + 1;
        const close = Math.random() * 6 + 1;

        const even = i % 2 === 0;

        data.push({
            high: val + high,
            low: val - low,
            open: even ? val + open : val - open,
            close: even ? val - close : val + close,
        });
    }

    const sets = [];
    const set = new CandleDataSet(data, 'Dataset Label');
    set.setShadowColor('darkgray');
    set.setShadowWidth(0.7);
    set.setDecreasingColor('red');
    set.setDecreasingPaintStyle(Style.FILL);
    set.setIncreasingColor(new Color(255, 122, 242, 84));
    set.setIncreasingPaintStyle(Style.STROKE);
    set.setNeutralColor('blue');
    set.setDrawValues(true);
    sets.push(set);

    // Create a data object with the data sets
    const cd = new CandleData(sets);

    // Set data
    chart.setData(cd);
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
