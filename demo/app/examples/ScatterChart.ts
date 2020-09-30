import { Color, Font } from '@nativescript/core';
import { Style } from '@nativescript-community/ui-canvas';
import { ScatterChart, ScatterShape } from '@nativescript-community/ui-chart/charts/ScatterChart';
import { LegendHorizontalAlignment, LegendOrientation, LegendVerticalAlignment } from '@nativescript-community/ui-chart/components/Legend';
import { ScatterData } from '@nativescript-community/ui-chart/data/ScatterData';
import { ScatterDataSet } from '@nativescript-community/ui-chart/data/ScatterDataSet';
import { ColorTemplate } from '@nativescript-community/ui-chart/utils/ColorTemplate';

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
    const chart = args.object as ScatterChart;
    chart.drawFameRate = true;

    chart.setDrawGridBackground(false);
    chart.setTouchEnabled(true);
    chart.setMaxHighlightDistance(50);
    chart.setHighlightPerTapEnabled(true);

    // enable scaling and dragging
    chart.setDragEnabled(true);
    chart.setScaleEnabled(true);

    chart.setMaxVisibleValueCount(200);
    chart.setPinchZoom(true);

    const l = chart.getLegend();
    l.setVerticalAlignment(LegendVerticalAlignment.TOP);
    l.setHorizontalAlignment(LegendHorizontalAlignment.RIGHT);
    l.setOrientation(LegendOrientation.VERTICAL);
    l.setDrawInside(false);
    l.setTypeface(Font.default.withFontFamily('OpenSans-Light'));
    l.setXOffset(5);

    const yl = chart.getAxisLeft();
    yl.setAxisMinimum(0); // this replaces setStartAtZero(true)

    chart.getAxisRight().setEnabled(false);

    const xl = chart.getXAxis();
    xl.setDrawGridLines(false);

    const count = 20;
    const range = 100;
    const values1 = [];
    const values2 = [];
    const values3 = [];

    for (let i = 0; i < count; i++) {
        values1.push({ y: Math.random() * range + 3 });
        values2.push({ y: Math.random() * range + 3 + 0.33 });
        values3.push({ y: Math.random() * range + 3 + 0.66 });
    }

    // create a dataset and give it a type
    const set1 = new ScatterDataSet(values1, 'DS 1');
    set1.setScatterShape(ScatterShape.SQUARE);
    set1.setColor(ColorTemplate.COLORFUL_COLORS[0]);
    const set2 = new ScatterDataSet(values2, 'DS 2');
    set2.setScatterShape(ScatterShape.CIRCLE);
    set2.setScatterShapeHoleColor(ColorTemplate.COLORFUL_COLORS[3]);
    set2.setScatterShapeHoleRadius(3);
    set2.setColor(ColorTemplate.COLORFUL_COLORS[1]);
    const set3 = new ScatterDataSet(values3, 'DS 3');
    set3.setShapeRenderer({
        renderShape(c, dataSet, viewPortHandler, posX, posY, renderPaint) {
            const shapeHalf = dataSet.getScatterShapeSize() / 2;
            c.drawLine(posX - shapeHalf, posY - shapeHalf, posX + shapeHalf, posY + shapeHalf, renderPaint);
        }
    });
    set3.setColor(ColorTemplate.COLORFUL_COLORS[2]);

    set1.setScatterShapeSize(8);
    set2.setScatterShapeSize(8);
    set3.setScatterShapeSize(8);

    // create a data object with the data sets
    const data = new ScatterData([set1, set2, set3]);
    // data.setValueTypeface(tfLight);

    chart.setData(data);
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
