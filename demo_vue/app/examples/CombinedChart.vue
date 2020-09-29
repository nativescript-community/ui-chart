<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap" />
            <StackLayout orientation="horizontal">
                <Button text="redraw" @tap="redraw" />
            </StackLayout>
        </ActionBar>
        <GridLayout rows="*,auto,auto">
            <CombinedChart ref="chart" @loaded="onChartLoaded" @tap="onChartTap" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import { Color, Frame, ImageSource, Font } from '@nativescript/core';
import Vue from 'vue';
import { CombinedChart, DrawOrder } from '@nativescript-community/ui-chart/charts/CombinedChart';
import { LimitLine, LimitLabelPosition } from '@nativescript-community/ui-chart/components/LimitLine';
import { LegendForm, LegendVerticalAlignment, LegendHorizontalAlignment, LegendOrientation } from '@nativescript-community/ui-chart/components/Legend';
import { knownFolders, path } from '@nativescript/core/file-system';
import { CombinedData } from '@nativescript-community/ui-chart/data/CombinedData';
import { ColorTemplate } from '@nativescript-community/ui-chart/utils/ColorTemplate';
import { YAxisLabelPosition, AxisDependency } from '@nativescript-community/ui-chart/components/YAxis';
import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
import { DashPathEffect } from '@nativescript-community/ui-canvas';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
import { LineDataSet, Mode } from '@nativescript-community/ui-chart/data/LineDataSet';
import { BarDataSet } from '@nativescript-community/ui-chart/data/BarDataSet';
import { ScatterData } from '@nativescript-community/ui-chart/data/ScatterData';
import { BarData } from '@nativescript-community/ui-chart/data/BarData';
import { ScatterDataSet } from '@nativescript-community/ui-chart/data/ScatterDataSet';
import { CandleData } from '@nativescript-community/ui-chart/data/CandleData';
import { CandleDataSet } from '@nativescript-community/ui-chart/data/CandleDataSet';
import { BubbleData } from '@nativescript-community/ui-chart/data/BubbleData';
import { BubbleDataSet } from '@nativescript-community/ui-chart/data/BubbleDataSet';

function getRandom(range, start) {
    return Math.random() * range + start;
}
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
export default Vue.extend({
    props: ['title'],
    data() {
        return {
            range: 180,
            count: 12
        };
    },
    created() {},

    methods: {
        onChartLoaded() {
            const chart = this.$refs.chart['nativeView'] as CombinedChart;
            chart.drawFameRate = true;

            chart.backgroundColor = 'white';
            chart.setDrawGridBackground(false);
            chart.setDrawBarShadow(false);
            chart.setHighlightFullBarEnabled(false);

            // draw bars behind lines
            chart.setDrawOrder([DrawOrder.BAR, DrawOrder.BUBBLE, DrawOrder.CANDLE, DrawOrder.LINE, DrawOrder.SCATTER]);

            const l = chart.getLegend();
            l.setWordWrapEnabled(true);
            l.setVerticalAlignment(LegendVerticalAlignment.BOTTOM);
            l.setHorizontalAlignment(LegendHorizontalAlignment.CENTER);
            l.setOrientation(LegendOrientation.HORIZONTAL);
            l.setDrawInside(false);

            const rightAxis = chart.getAxisRight();
            rightAxis.setDrawGridLines(false);
            rightAxis.setAxisMinimum(0); // this replaces setStartAtZero(true)

            const leftAxis = chart.getAxisLeft();
            leftAxis.setDrawGridLines(false);
            leftAxis.setAxisMinimum(0); // this replaces setStartAtZero(true)

            const xAxis = chart.getXAxis();
            xAxis.setPosition(XAxisPosition.BOTH_SIDED);
            xAxis.setAxisMinimum(0);
            xAxis.setGranularity(1);
            xAxis.setValueFormatter({
                getAxisLabel(value, axis) {
                    return months[value % months.length];
                }
            });

            const data = new CombinedData();

            data.setData(this.generateLineData());
            data.setData(this.generateBarData());
            data.setData(this.generateBubbleData());
            data.setData(this.generateScatterData());
            data.setData(this.generateCandleData());
            data.setValueTypeface(Font.default.withFontFamily('OpenSans-Light'));

            xAxis.setAxisMaximum(data.getXMax() + 0.25);

            chart.setData(data);
            chart.invalidate();

            // draw points over time
            chart.animateX(1500);
        },
        generateLineData() {
            const d = new LineData();

            const entries = [];

            for (let index = 0; index < this.count; index++) entries.push({ x: index + 0.5, y: getRandom(15, 5) });

            const set = new LineDataSet(entries, 'Line DataSet');
            set.setColor(new Color(255, 240, 238, 70));
            set.setLineWidth(2.5);
            set.setCircleColor(new Color(255, 240, 238, 70));
            set.setCircleRadius(5);
            set.setFillColor(new Color(255, 240, 238, 70));
            set.setMode(Mode.CUBIC_BEZIER);
            set.setDrawValues(true);
            set.setValueTextSize(10);
            set.setValueTextColor(new Color(255, 240, 238, 70));

            set.setAxisDependency(AxisDependency.LEFT);
            d.addDataSet(set);

            return d;
        },
        generateBarData() {
            const entries1 = [];
            const entries2 = [];

            for (let index = 0; index < this.count; index++) {
                entries1.push({ x: 0, y: getRandom(25, 25) });

                // stacked
                entries2.push({ x: 0, y: [getRandom(13, 12), getRandom(13, 12)] });
            }

            const set1 = new BarDataSet(entries1, 'Bar 1');
            set1.setColor(new Color(255, 60, 220, 78));
            set1.setValueTextColor(new Color(255, 60, 220, 78));
            set1.setValueTextSize(10);
            set1.setAxisDependency(AxisDependency.LEFT);

            const set2 = new BarDataSet(entries2, '');
            set2.setStackLabels(['Stack 1', 'Stack 2']);
            set2.setColors([new Color(255, 61, 165, 255), new Color(255, 23, 197, 255)]);
            set2.setValueTextColor(new Color(255, 61, 165, 255));
            set2.setValueTextSize(10);
            set2.setAxisDependency(AxisDependency.LEFT);

            const groupSpace = 0.06;
            const barSpace = 0.02; // x2 dataset
            const barWidth = 0.45; // x2 dataset
            // (0.45 + 0.02) * 2 + 0.06 = 1.00 -> interval per "group"

            const d = new BarData([set1, set2]);
            d.setBarWidth(barWidth);

            // make this BarData object grouped
            d.groupBars(0, groupSpace, barSpace); // start at x = 0

            return d;
        },
        generateScatterData() {
            const d = new ScatterData();

            const entries = [];

            for (let index = 0; index < this.count; index += 0.5) entries.push({ x: index + 0.25, y: getRandom(10, 55) });

            const set = new ScatterDataSet(entries, 'Scatter DataSet');
            set.setColors(ColorTemplate.MATERIAL_COLORS);
            set.setScatterShapeSize(7.5);
            set.setDrawValues(false);
            set.setValueTextSize(10);
            d.addDataSet(set);

            return d;
        },
        generateCandleData() {
            const d = new CandleData();

            const entries = [];

            for (let index = 0; index < this.count; index += 2) entries.push({ x: index + 1, high: 90, low: 70, open: 85, close: 75 });

            const set = new CandleDataSet(entries, 'Candle DataSet');
            set.setDecreasingColor(new Color(255, 142, 150, 175));
            set.setShadowColor('darkgray');
            set.setBarSpace(0.3);
            set.setValueTextSize(10);
            set.setDrawValues(false);
            d.addDataSet(set);

            return d;
        },
        generateBubbleData() {
            const bd = new BubbleData();

            const entries = [];

            for (let index = 0; index < this.count; index++) {
                const y = getRandom(10, 105);
                const size = getRandom(100, 105);
                entries.push({ x: index + 0.5, y, size });
            }

            const set = new BubbleDataSet(entries, 'Bubble DataSet');
            set.setColors(ColorTemplate.VORDIPLOM_COLORS);
            set.setValueTextSize(10);
            set.setValueTextColor('white');
            set.setHighlightCircleWidth(1.5);
            set.setDrawValues(true);
            bd.addDataSet(set);

            return bd;
        },
        onChartTap(e) {
            console.log('onChartTap', e.data.extraData, e.highlight);
        },
        redraw() {
            const chart = this.$refs.chart['nativeView'] as CombinedChart;
            chart.invalidate();
        },
        onNavigationButtonTap() {
            Frame.topmost().goBack();
        }
    },
    mounted() {}
});
</script>
