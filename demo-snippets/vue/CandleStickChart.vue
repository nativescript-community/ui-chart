<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap" />
            <StackLayout orientation="horizontal">
                <Button text="redraw" @tap="redraw" />
                <Button text="reset" @tap="reset" />
                <Button text="clear" @tap="clearDataSet" />
            </StackLayout>
        </ActionBar>
        <GridLayout rows="*,auto,auto">
            <CandleStickChart ref="chart" @loaded="onChartLoaded" @tap="onChartTap" />
            <Slider row="1" maxValue="3000" v-model="count" @valueChange="updateData" />
            <Slider row="2" maxValue="200" v-model="range" @valueChange="updateData" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import { Style } from '@nativescript-community/ui-canvas';
import { CandleStickChart } from '@nativescript-community/ui-chart/charts/CandleStickChart';
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
import { AxisDependency } from '@nativescript-community/ui-chart/components/YAxis';
import { CandleData } from '@nativescript-community/ui-chart/data/CandleData';
import { CandleDataSet } from '@nativescript-community/ui-chart/data/CandleDataSet';
import { Color, Frame, ImageSource } from '@nativescript/core';
import Vue from 'vue';

export default Vue.extend({
    props: ['title'],
    data() {
        return {
            range: 100,
            count: 40
        };
    },
    created() {},

    methods: {
        onChartLoaded() {
            const chart = this.$refs.chart['nativeView'] as CandleStickChart;
            chart.drawFrameRate = true;

            // chart.getDescription().enabled=(false);

            chart.maxVisibleValueCount = 60;

            // scaling can now only be done on x- and y-axis separately
            chart.pinchZoomEnabled = false;
            chart.legend.enabled = false;

            chart.drawGridBackgroundEnabled = false;

            const xAxis = chart.xAxis;
            xAxis.position = XAxisPosition.BOTTOM;
            xAxis.drawGridLines = false;

            const leftAxis = chart.axisLeft;
            //        leftAxis.enabled=(false);
            leftAxis.labelCount = 7;
            leftAxis.drawGridLines = false;
            leftAxis.drawAxisLine = false;

            const rightAxis = chart.axisRight;
            rightAxis.enabled = false;
            this.updateData();
        },
        onChartTap(e) {
            console.log('onChartTap', e.data.extraData, e.highlight);
        },
        redraw() {
            const chart = this.$refs.chart['nativeView'] as CandleStickChart;
            chart.invalidate();
        },
        reset() {
            this.updateData();
        },
        onNavigationButtonTap() {
            Frame.topmost().goBack();
        },
        updateData() {
            this.setData(this.count, this.range);
        },
        setData(count, range) {
            const chart = this.$refs.chart['nativeView'] as CandleStickChart;
            const values1 = [];
            chart.resetTracking();

            const values = [];
            const icon = ImageSource.fromFileOrResourceSync('~/assets/star.png');

            for (let i = 0; i < count; i++) {
                const multi = range + 1;
                const val = Math.random() * 40 + multi;

                const high = Math.random() * 9 + 8;
                const low = Math.random() * 9 + 8;

                const open = Math.random() * 6 + 1;
                const close = Math.random() * 6 + 1;

                const even = i % 2 === 0;

                values.push({
                    high: val + high,
                    low: val - low,
                    open: even ? val + open : val - open,
                    close: even ? val - close : val + close,
                    icon
                });
            }
            const set1 = new CandleDataSet(values, 'Data Set');

            set1.drawIconsEnabled = false;
            set1.axisDependency = AxisDependency.LEFT;
            set1.shadowColor = 'darkgray';
            // set1.showCandleBar=(false);
            set1.shadowWidth = 0.7;
            set1.decreasingColor = 'red';
            set1.decreasingPaintStyle = Style.FILL;
            set1.increasingColor = new Color(255, 122, 242, 84);
            set1.increasingPaintStyle = Style.STROKE;
            set1.neutralColor = 'blue';
            //set1.highlightLineWidth=(1f);

            const data = new CandleData([set1]);

            chart.data = data;
            chart.invalidate();
        },
        clearDataSet() {
            const chart = this.$refs.chart['nativeView'] as LineChart;
            const leftAxis = chart.axisLeft;
            const chartData = chart.data;
            const chartDataset = chartData.dataSets;
            chartDataset.forEach((d) => {
                d.clear();
                d.notifyDataSetChanged();
            });
            chart.data.notifyDataChanged();
            chart.notifyDataSetChanged();
        }
    },
    mounted() {}
});
</script>
