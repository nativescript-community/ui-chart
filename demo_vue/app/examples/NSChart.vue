<template>
    <Page>
        <ActionBar title="NS Chart">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
            <StackLayout orientation="horizontal">
                <Button text="redraw" @tap="redraw" />
                <Button text="reset" @tap="reset" />
                <Button text="clear" @tap="clearDataSet" />
            </StackLayout>
            <!-- <Switch text /> -->
        </ActionBar>
        <ScrollView>
            <StackLayout @loaded="onLoaded" height="2000">
                <LineChart ref="lineChart" backgroundColor="lightgray" width="300" height="400" @tap="onChartTap"> </LineChart>
                <Label fontSize="10" backgroundColor="#68F1AF">speed</Label>
            </StackLayout>
        </ScrollView>
    </Page>
</template>

<script lang="ts">
import { Color, Frame } from '@nativescript/core';
import Vue from 'vue';
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { LimitLine, LimitLabelPosition } from '@nativescript-community/ui-chart/components/LimitLine';
import { LegendForm } from '@nativescript-community/ui-chart/components/Legend';
import { knownFolders, path } from '@nativescript/core/file-system';
import { LineDataSet, Mode } from '@nativescript-community/ui-chart/data/LineDataSet';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
import { ColorTemplate } from '@nativescript-community/ui-chart/utils/ColorTemplate';
import { YAxisLabelPosition, AxisDependency } from '@nativescript-community/ui-chart/components/YAxis';
import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';

export const title = 'NS Chart';
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
    var r = getRandomInt(0, 255);
    var g = getRandomInt(0, 255);
    var b = getRandomInt(0, 255);
    return new Color(255, r, g, b);
}
export default Vue.extend({
    name: 'NSChart',
    data() {
        return {
            title: title,
            isBusy: true
        };
    },
    created() {
        this.startTime = Date.now();
        // console.log('created', this.startTime);
    },
    computed: {
        chartColor() {
            return (index: number) => {
                // console.log('chartColor', index);
                if (!this.colors[index]) {
                    this.colors[index] = getRandomColor();
                }
                return this.colors[index];
            };
        }
    },
    methods: {
        onLoaded() {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            chart.drawFameRate = true;
            // chart.setViewPortOffsets(0, 0, 0, 0);
            // chart.backgroundColor = '#68F1AF';

            // no description text
            // chart.getDescription().setEnabled(false);

            // enable touch gestures
            // chart.setTouchEnabled(true);

            // enable scaling and dragging
            // chart.setDragEnabled(true);
            // chart.setHighlightPerDragEnabled(true);
            // chart.setHighlightPerTapEnabled(true);
            // chart.setScaleEnabled(true);

            // if disabled, scaling can be done on x- and y-axis separately
            // chart.setPinchZoom(false);

            // chart.setDrawGridBackground(false);
            // chart.setMaxHighlightDistance(300);
            chart.setLogEnabled(true);
            // chart.getLegend().setEnabled(false);
            // chart.getAxisRight().setEnabled(false);
            // const x = chart.getXAxis();
            // x.setEnabled(false);

            // const y = chart.getAxisLeft();
            // y.setLabelCount(6, false);
            // y.setTextColor('white');
            // y.setPosition(YAxisLabelPosition.INSIDE_CHART);
            // y.setDrawGridLines(false);
            // y.setAxisLineColor('white');
            // chart.setHardwareAccelerationEnabled(true);
        },
        onChartTap(e) {
            console.log('onChartTap', e.data.extraData, e.highlight);
        },
        redraw() {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            chart.invalidate();
        },
        reset() {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            this.setWeatherData();
        },
        onNavigationButtonTap() {
            Frame.topmost().goBack();
        },
        loadData() {
            return JSON.parse(
                knownFolders
                    .currentApp()
                    .getFile('assets/migration_test.json')
                    .readTextSync()
            );
        },
        setWeatherData() {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            const values = [
                { t: 1601112480000, v: 1.5984 },
                { t: 1601112540000, v: 1.6872 },
                { t: 1601112600000, v: 1.776 },
                { t: 1601112660000, v: 1.7284 },
                { t: 1601112720000, v: 1.6808 },
                { t: 1601112780000, v: 1.6332 },
                { t: 1601112840000, v: 1.5856 },
                { t: 1601112900000, v: 1.538 },
                { t: 1601112960000, v: 1.538 },
                { t: 1601113020000, v: 1.538 },
                { t: 1601113080000, v: 1.538 },
                { t: 1601113140000, v: 1.538 },
                { t: 1601113200000, v: 1.538 },
                { t: 1601113260000, v: 1.538 },
                { t: 1601113320000, v: 1.538 },
                { t: 1601113380000, v: 1.538 },
                { t: 1601113440000, v: 1.538 },
                { t: 1601113500000, v: 1.538 },
                { t: 1601113560000, v: 1.4968 },
                { t: 1601113620000, v: 1.4556 },
                { t: 1601113680000, v: 1.4144 },
                { t: 1601113740000, v: 1.3732 },
                { t: 1601113800000, v: 1.332 },
                { t: 1601113860000, v: 1.332 },
                { t: 1601113920000, v: 1.332 },
                { t: 1601113980000, v: 1.332 },
                { t: 1601114040000, v: 1.332 },
                { t: 1601114100000, v: 1.332 },
                { t: 1601114160000, v: 1.3732 },
                { t: 1601114220000, v: 1.4144 },
                { t: 1601114280000, v: 1.4556 },
                { t: 1601114340000, v: 1.4968 },
                { t: 1601114400000, v: 1.538 },
                { t: 1601114460000, v: 1.4034 },
                { t: 1601114520000, v: 1.2688 },
                { t: 1601114580000, v: 1.1342 },
                { t: 1601114640000, v: 0.9996 },
                { t: 1601114700000, v: 0.865 },
                { t: 1601114760000, v: 0.9226 },
                { t: 1601114820000, v: 0.9802 },
                { t: 1601114880000, v: 1.0378 },
                { t: 1601114940000, v: 1.0954 },
                { t: 1601115000000, v: 1.153 },
                { t: 1601115060000, v: 1.0722 },
                { t: 1601115120000, v: 0.9914 },
                { t: 1601115180000, v: 0.9106 },
                { t: 1601115240000, v: 0.8298 },
                { t: 1601115300000, v: 0.749 },
                { t: 1601115360000, v: 0.6258 },
                { t: 1601115420000, v: 0.5026 },
                { t: 1601115480000, v: 0.3794 },
                { t: 1601115540000, v: 0.2562 },
                { t: 1601115600000, v: 0.133 },
                { t: 1601115660000, v: 0.1474 },
                { t: 1601115720000, v: 0.1618 },
                { t: 1601115780000, v: 0.1762 },
                { t: 1601115840000, v: 0.1906 },
                { t: 1601115900000, v: 0.205 },
                { t: 1601115960000, v: 0.2482 },
                { t: 1601116020000, v: 0.2914 },
                { t: 1601116080000, v: 0.3346 }
            ];
            const now = values[0].t;
            const count = values.length;
            const textColor = 'black';
            const limitColor = new Color(255 * 0.5, 0, 0, 0);
            chart.setNoDataText(null);
            chart.setAutoScaleMinMaxEnabled(true);
            chart.getLegend().setEnabled(false);
            const xAxis = chart.getXAxis();
            xAxis.setEnabled(true);
            xAxis.setTextColor(textColor);
            xAxis.setDrawGridLines(false);
            xAxis.setDrawMarkTicks(true);
            let lastValue = 0;
            xAxis.setValueFormatter({
                getAxisLabel: f => {
                    let val = values[f];
                    if (val) {
                        const result = Math.floor((val.t - now) / 600000) * 10;
                        if (result !== lastValue) {
                            lastValue = result;
                            return result === 0 ? '' : result + 'm';
                        }
                    }

                    return '';
                }
            });
            xAxis.setLabelCount(6, true);
            xAxis.setPosition(XAxisPosition.BOTTOM);

            const rightAxis = chart.getAxisRight();
            rightAxis.setEnabled(false);
            // rightAxis.setAxisMinimum(0);
            // rightAxis.setTextColor(Color(textColor).setAlpha(0.5).toRgbString());
            // rightAxis.setDrawGridLines(false);
            // rightAxis.setDrawAxisLine(false);
            // rightAxis.setDrawLabels(false);
            // rightAxis.setLabelCount(4);
            // rightAxis.setAxisMaximum(6000);

            const leftAxis = chart.getAxisLeft();
            leftAxis.removeAllLimitLines();
            leftAxis.setAxisMinimum(0);
            leftAxis.setDrawGridLines(false);
            leftAxis.setDrawLabels(false);
            leftAxis.setDrawAxisLine(false);

            let limitLine = new LimitLine(0, 'light'.toUpperCase());
            limitLine.setLineWidth(0);
            limitLine.setXOffset(0);
            limitLine.setTextColor(limitColor);
            limitLine.setLabelPosition(LimitLabelPosition.LEFT_TOP);
            leftAxis.addLimitLine(limitLine);

            limitLine = new LimitLine(2.5, 'medium'.toUpperCase());
            limitLine.setLineWidth(1);
            limitLine.setLineColor(limitColor);
            limitLine.enableDashedLine(2, 2, 0);
            limitLine.setXOffset(0);
            limitLine.setTextColor(limitColor);
            limitLine.setLabelPosition(LimitLabelPosition.LEFT_TOP);
            leftAxis.addLimitLine(limitLine);
            limitLine = new LimitLine(7.6, 'heavy'.toUpperCase());
            limitLine.setLineWidth(1);
            limitLine.setLineColor(limitColor);
            limitLine.enableDashedLine(2, 2, 0);
            limitLine.setXOffset(0);
            limitLine.setTextColor(limitColor);
            limitLine.setLabelPosition(LimitLabelPosition.LEFT_TOP);
            leftAxis.addLimitLine(limitLine);

            let min = 10000;
            let max = -10000;
            values.forEach(h => {
                if (h.v < min) {
                    min = h.v;
                }
                if (h.v > max) {
                    max = h.v;
                }
            });
            console.log(JSON.stringify(values));
            leftAxis.setAxisMaximum(Math.max(max, 2.4));
            leftAxis.setDrawLimitLines(true);
            console.log('test1', values[0]);
            const precipChartSet = new LineDataSet(values, 'precipIntensity', undefined, 'v');
            // precipChartSet.setAxisDependency(AxisDependency.LEFT);
            precipChartSet.setLineWidth(1);
            precipChartSet.setDrawIcons(false);
            precipChartSet.setDrawValues(false);
            // precipChartSet.setDrawCircles(true);
            precipChartSet.setDrawFilled(true);
            precipChartSet.setColor('#4681C3');
            precipChartSet.setFillColor('#4681C3');
            precipChartSet.setFillAlpha(150);
            // precipChartSet.setCubicIntensity(0.2);
            precipChartSet.setMode(Mode.CUBIC_BEZIER);

            chart.setData(new LineData([precipChartSet].filter(s => !!s)));
        },
        setData(count, range) {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            const values = new Array(count).fill(0).map((v, i) => ({
                index: i,
                value: Math.random() * (range + 1) + 20
            }));
            const sets = [];
            const set1 = new LineDataSet(values, 'value', 'index', 'value');
            set1.setMode(Mode.CUBIC_BEZIER);
            set1.setCubicIntensity(0.2);
            set1.setDrawFilled(true);
            set1.setDrawCircles(false);
            set1.setLineWidth(1.8);
            set1.setCircleRadius(4);
            set1.setCircleColor('white');
            set1.setHighLightColor('rgb(244, 117, 117)');
            set1.setColor('white');
            set1.setFillColor('white');
            set1.setFillAlpha(100);
            set1.setDrawHorizontalHighlightIndicator(false);
            set1.setFillFormatter({
                getFillLinePosition(dataSet, dataProvider) {
                    return chart.getAxisLeft().getAxisMinimum();
                }
            });

            // create a data object with the data sets
            const data = new LineData([set1]);
            data.setValueTextSize(9);
            data.setDrawValues(false);
            // set data
            chart.setData(data);
            //    chart.animateXY(2000, 2000);
        },
        clearDataSet() {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            const leftAxis = chart.getAxisLeft();
            leftAxis.removeAllLimitLines();
            const chartData = chart.getData();
            const chartDataset = chartData.getDataSets();
            chartDataset.forEach(d => {d.clear(); d.notifyDataSetChanged();});
            chart.getData().notifyDataChanged();
            chart.notifyDataSetChanged();
        }
    },
    mounted() {
        // console.log('mounted');
        const chart = this.$refs.lineChart['nativeView'] as LineChart;
        // chart.setLogEnabled(true);
        // background color
        // chart.backgroundColor = 'white';

        // disable description text
        // chart.getDescription().setEnabled(false);
        // chart.setTouchEnabled(true);

        // set listeners
        // chart.on('valueSelected', (e: any) => console.log(e.highlight));
        // chart.setDrawGridBackground(false);

        // enable scaling and dragging
        // chart.setDragEnabled(true);
        // chart.setScaleEnabled(true);

        // // force pinch zoom along both axis
        // chart.setPinchZoom(true);

        // const xAxis = chart.getXAxis();
        // xAxis.setAxisLineColor(new Color('red'));
        // xAxis.enableGridDashedLine(10, 10, 0);

        // const yAxis = chart.getAxisLeft();
        // // disable dual axis (only use LEFT axis)
        // chart.getAxisRight().setEnabled(false);

        // // horizontal grid lines
        // yAxis.enableGridDashedLine(10, 10, 0);

        // // axis range
        // yAxis.setAxisMaximum(200);
        // yAxis.setAxisMinimum(-50);

        // const llXAxis = new LimitLine(9, 'Index 10');
        // llXAxis.setLineWidth(4);
        // llXAxis.enableDashedLine(10, 10, 0);
        // llXAxis.setLabelPosition(LimitLabelPosition.RIGHT_BOTTOM);
        // llXAxis.setTextSize(10);
        // // llXAxis.setTypeface(tfRegular);

        // const ll1 = new LimitLine(150, 'Upper Limit');
        // ll1.setLineWidth(4);
        // ll1.enableDashedLine(10, 10, 0);
        // ll1.setLabelPosition(LimitLabelPosition.RIGHT_TOP);
        // ll1.setTextSize(10);
        // // ll1.setTypeface(tfRegular);

        // const ll2 = new LimitLine(-30, 'Lower Limit');
        // ll2.setLineWidth(4);
        // ll2.enableDashedLine(10, 10, 0);
        // ll2.setLabelPosition(LimitLabelPosition.RIGHT_BOTTOM);
        // ll2.setTextSize(10);
        // // ll2.setTypeface(tfRegular);

        // // draw limit lines behind data instead of on top
        // yAxis.setDrawLimitLinesBehindData(true);
        // xAxis.setDrawLimitLinesBehindData(true);

        // // add limit lines
        // yAxis.addLimitLine(ll1);
        // yAxis.addLimitLine(ll2);

        // // get the legend (only possible after setting data)
        // const l = chart.getLegend();

        // // draw legend entries as lines
        // l.setForm(LegendForm.SQUARE);

        chart.once('drawn', () => {
            console.log('drawn in ' + (Date.now() - this.startTime) + 'ms');
        });
        // this.setData(34, 53);
        this.setWeatherData();
    }
});
</script>
