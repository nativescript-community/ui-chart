import { Color, Font } from '@nativescript/core';
import { LineChart } from '@nativescript-community/ui-chart/charts';
import { LegendForm } from '@nativescript-community/ui-chart/components/Legend';
import { AxisDependency } from '@nativescript-community/ui-chart/components/YAxis';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
import { ColorTemplate } from '@nativescript-community/ui-chart/utils/ColorTemplate';

let timer = null;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
    const r = getRandomInt(0, 255);
    const g = getRandomInt(0, 255);
    const b = getRandomInt(0, 255);
    return new Color(255, r, g, b);
}

function addEntry(chart) {
    // In case user leaves this page
    if (!chart || !chart.nativeView) {
        stop();
        return;
    }

    const data = chart.getData();

    if (data != null) {
        let set = data.getDataSetByIndex(0);
        // set.addEntry(...); // can be called as well

        if (set == null) {
            set = createSet(chart);
            data.addDataSet(set);
        }

        data.addEntry({ y: Math.random() * 40 + 30 }, 0);
        data.notifyDataChanged();

        // let the chart know it's data has changed
        chart.notifyDataSetChanged();

        // Limit the number of visible entries
        chart.setVisibleXRangeMaximum(120);
        // chart.setVisibleYRange(30, AxisDependency.LEFT);

        // Move to the latest entry
        chart.moveViewToX(data.getEntryCount());
    }
}

function createSet(chart) {
    const set = new LineDataSet(null, 'Dynamic Data');
    set.setAxisDependency(AxisDependency.LEFT);
    set.setColor(ColorTemplate.getHoloBlue());
    set.setCircleColor('white');
    set.setLineWidth(2);
    set.setCircleRadius(4);
    set.setFillAlpha(65);
    set.setFillColor(ColorTemplate.getHoloBlue());
    set.setHighLightColor(new Color(255, 244, 117, 117));
    set.setValueTextColor('white');
    set.setValueTextSize(9);
    set.setDrawValues(false);
    return set;
}

export function onNavigatedTo(args) {
    const page = args.object;
    page.bindingContext = args.context;
}

export function onChartLoaded(args) {
    const chart = args.object as LineChart;

    chart.drawFameRate = true;
    chart.backgroundColor = 'white';

    // enable touch gestures
    chart.setTouchEnabled(true);

    // enable touch gestures
    chart.setTouchEnabled(true);

    // enable scaling and dragging
    chart.setDragEnabled(true);
    chart.setScaleEnabled(true);
    chart.setDrawGridBackground(false);

    // if disabled, scaling can be done on x- and y-axis separately
    chart.setPinchZoom(true);

    // set an alternative background color
    chart.backgroundColor = 'lightgray';

    const data = new LineData();
    data.setValueTextColor('white');

    // add empty data
    chart.setData(data);

    // get the legend (only possible after setting data)
    const l = chart.getLegend();

    // modify the legend ...
    l.setForm(LegendForm.LINE);
    l.setTypeface(Font.default.withFontFamily('OpenSans-Light'));
    l.setTextColor('white');

    const xl = chart.getXAxis();
    xl.setTypeface(Font.default.withFontFamily('OpenSans-Light'));
    xl.setTextColor('white');
    xl.setDrawGridLines(false);
    xl.setAvoidFirstLastClipping(true);
    xl.setEnabled(true);

    const leftAxis = chart.getAxisLeft();
    leftAxis.setTypeface(Font.default.withFontFamily('OpenSans-Light'));
    leftAxis.setTextColor('white');
    leftAxis.setAxisMaximum(100);
    leftAxis.setAxisMinimum(0);
    leftAxis.setDrawGridLines(true);

    const rightAxis = chart.getAxisRight();
    rightAxis.setEnabled(false);

    // Draw points over time
}

export function start(args) {
    if (!timer) {
        timer = setInterval((e) => addEntry(args.object.page.getViewById('chart')), 25);
    }
}

export function stop(args = null) {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

export function tryAddEntry(args) {
    // Do not add any entries while timer is running
    if (!timer) {
        addEntry(args.object.page.getViewById('chart'));
    }
}

export function onNavigationButtonTap(args) {
    args.object.page.frame.goBack();
}
