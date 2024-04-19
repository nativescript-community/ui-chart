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
import { Align } from '@nativescript-community/ui-canvas';
import { CombinedChart, DrawOrder } from '@nativescript-community/ui-chart/charts/CombinedChart';
import { LegendHorizontalAlignment, LegendOrientation, LegendVerticalAlignment } from '@nativescript-community/ui-chart/components/Legend';
import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
import { BarData } from '@nativescript-community/ui-chart/data/BarData';
import { BarDataSet } from '@nativescript-community/ui-chart/data/BarDataSet';
import { BubbleData } from '@nativescript-community/ui-chart/data/BubbleData';
import { BubbleDataSet } from '@nativescript-community/ui-chart/data/BubbleDataSet';
import { CandleData } from '@nativescript-community/ui-chart/data/CandleData';
import { CandleDataSet } from '@nativescript-community/ui-chart/data/CandleDataSet';
import { CombinedData } from '@nativescript-community/ui-chart/data/CombinedData';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
import { LineDataSet, Mode } from '@nativescript-community/ui-chart/data/LineDataSet';
import { ScatterData } from '@nativescript-community/ui-chart/data/ScatterData';
import { ScatterDataSet } from '@nativescript-community/ui-chart/data/ScatterDataSet';
import { Color, Font, Frame } from '@nativescript/core';
import Vue from 'vue';

function getRandom(range, start) {
    return Math.random() * range + start;
}
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
            try {
                const chart = this.$refs.chart['nativeView'] as CombinedChart;
                chart.drawFrameRate = true;

                // chart.drawGridBackgroundEnabled=(false);
                // chart.drawBarShadowEnabled=(false);
                chart.highlightFullBarEnabled = false;

                chart.dragEnabled = true;
                chart.scaleEnabled = true;
                chart.highlightPerTapEnabled = true;
                chart.highlightPerDragEnabled = true;
                // chart.setScaleXEnabled(true);
                // chart.setScaleYEnabled(true);

                // force pinch zoom along both axis
                chart.pinchZoomEnabled = true;

                // draw bars behind lines
                chart.drawOrder = [DrawOrder.BAR, DrawOrder.BUBBLE, DrawOrder.CANDLE, DrawOrder.LINE, DrawOrder.SCATTER];

                const l = chart.legend;
                l.wordWrapEnabled = true;
                l.verticalAlignment = LegendVerticalAlignment.BOTTOM;
                l.horizontalAlignment = LegendHorizontalAlignment.CENTER;
                l.orientation = LegendOrientation.HORIZONTAL;
                l.drawInside = false;

                const rightAxis = chart.axisRight;
                rightAxis.drawGridLines = false;
                rightAxis.axisMinimum = 0; // this replaces setStartAtZero(true)

                const leftAxis = chart.axisLeft;
                leftAxis.drawGridLines = false;
                leftAxis.axisMinimum = 0; // this replaces setStartAtZero(true)

                const xAxis = chart.xAxis;
                xAxis.position = XAxisPosition.BOTH_SIDED;
                xAxis.labelTextAlign = Align.CENTER;
                xAxis.axisMinimum = -0.25;
                xAxis.granularity = 1;
                xAxis.valueFormatter = {
                    getAxisLabel(value, axis) {
                        return months[value % months.length];
                    }
                };

                const data = new CombinedData();

                data.lineData = this.generateLineData();
                data.barData = this.generateBarData();
                data.bubbleData = this.generateBubbleData();
                data.scatterData = this.generateScatterData();
                data.candleData = this.generateCandleData();
                data.valueTypeface = Font.default.withFontFamily('OpenSans-Light');

                chart.data = data;
                xAxis.axisMaximum = 12.25;
                chart.invalidate();

                // draw points over time
                // chart.animateX(1500);
            } catch (error) {
                console.error(error);
            }
        },
        generateLineData() {
            const d = new LineData();

            const entries = [];

            for (let index = 0; index < this.count; index++) entries.push({ x: index + 0.5, y: getRandom(15, 5) });

            const set = new LineDataSet(entries, 'Line DataSet', 'x');
            set.color = new Color(255, 240, 238, 70);
            set.lineWidth = 2.5;
            set.circleColor = new Color(255, 240, 238, 70);
            set.circleRadius = 5;
            set.fillColor = new Color(255, 240, 238, 70);
            set.mode = Mode.CUBIC_BEZIER;
            set.drawValuesEnabled = true;
            set.valueTextSize = 10;
            set.valueTextColor = new Color(255, 240, 238, 70);

            // set.axisDependency=(AxisDependency.LEFT);
            d.addDataSet(set);

            return d;
        },
        generateBarData() {
            const entries1 = [];
            const entries2 = [];

            for (let index = 0; index < this.count; index++) {
                entries1.push({ x: 0, y: getRandom(25, 25) });

                // stacked
                entries2.push({ x: 0, yVals: [getRandom(13, 12), getRandom(13, 12)] });
            }

            const set1 = new BarDataSet(entries1, 'Bar 1', 'x');
            set1.color = new Color(255, 60, 220, 78);
            set1.valueTextColor = new Color(255, 60, 220, 78);
            set1.valueTextSize = 10;
            // set1.axisDependency=(AxisDependency.LEFT);

            const set2 = new BarDataSet(entries2, '', 'x');
            set2.stackLabels = ['Stack 1', 'Stack 2'];
            set2.colors = [new Color(255, 61, 165, 255), new Color(255, 123, 197, 0)];
            set2.valueTextColor = new Color(255, 61, 165, 255);
            set2.valueTextSize = 10;
            // set2.axisDependency=(AxisDependency.LEFT);

            const groupSpace = 0.06;
            const barSpace = 0.02; // x2 dataset
            const barWidth = 0.45; // x2 dataset
            // (0.45 + 0.02) * 2 + 0.06 = 1.00 -> interval per "group"

            const d = new BarData([set1, set2]);
            d.barWidth = barWidth;

            // make this BarData object grouped
            d.groupBars(0, groupSpace, barSpace); // start at x = 0
            //
            return d;
        },
        generateScatterData() {
            const d = new ScatterData();

            const entries = [];

            for (let index = 0; index < this.count; index += 0.5) entries.push({ x: index + 0.25, y: getRandom(10, 55) });

            const set = new ScatterDataSet(entries, 'Scatter DataSet', 'x');
            // set.colors=(ColorTemplate.MATERIAL_COLORS);
            set.scatterShapeSize = 7.5;
            set.drawValuesEnabled = false;
            set.valueTextSize = 10;
            d.addDataSet(set);

            return d;
        },
        generateCandleData() {
            const d = new CandleData();

            const entries = [];

            for (let index = 0; index < this.count; index += 2) entries.push({ x: index + 1, high: 90, low: 70, open: 85, close: 75 });

            const set = new CandleDataSet(entries, 'Candle DataSet', 'x');
            set.decreasingColor = new Color(255, 142, 150, 175);
            set.shadowColor = 'darkgray';
            set.barSpace = 0.3;
            set.valueTextSize = 10;
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

            const set = new BubbleDataSet(entries, 'Bubble DataSet', 'x');
            // set.colors=(ColorTemplate.VORDIPLOM_COLORS);
            set.valueTextSize = 10;
            set.valueTextColor = 'white';
            set.highlightCircleWidth = 1.5;
            set.drawValuesEnabled = true;
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
