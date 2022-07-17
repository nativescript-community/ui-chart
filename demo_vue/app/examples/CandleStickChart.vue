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
import { Color, Frame, ImageSource, Font } from '@nativescript/core';
import Vue from 'vue';
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { LimitLine, LimitLabelPosition } from '@nativescript-community/ui-chart/components/LimitLine';
import { LegendForm, Legend, LegendOrientation, LegendVerticalAlignment, LegendHorizontalAlignment } from '@nativescript-community/ui-chart/components/Legend';
import { knownFolders, path } from '@nativescript/core/file-system';
import { LineDataSet, Mode } from '@nativescript-community/ui-chart/data/LineDataSet';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
import { ColorTemplate } from '@nativescript-community/ui-chart/utils/ColorTemplate';
import { YAxisLabelPosition, AxisDependency } from '@nativescript-community/ui-chart/components/YAxis';
import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
import { DashPathEffect, Style } from '@nativescript-community/ui-canvas';
import { CandleStickChart } from '@nativescript-community/ui-chart/charts/CandleStickChart';
import { CandleData } from '@nativescript-community/ui-chart/data/CandleData';
import { CandleDataSet } from '@nativescript-community/ui-chart/data/CandleDataSet';

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


            // chart.getDescription().setEnabled(false);

            chart.setMaxVisibleValueCount(60);

            // scaling can now only be done on x- and y-axis separately
            chart.setPinchZoom(false);
            chart.getLegend().setEnabled(false);

            chart.setDrawGridBackground(false);

            const xAxis = chart.getXAxis();
            xAxis.setPosition(XAxisPosition.BOTTOM);
            xAxis.setDrawGridLines(false);

            const leftAxis = chart.getAxisLeft();
            //        leftAxis.setEnabled(false);
            leftAxis.setLabelCount(7, false);
            leftAxis.setDrawGridLines(false);
            leftAxis.setDrawAxisLine(false);

            const rightAxis = chart.getAxisRight();
            rightAxis.setEnabled(false);
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
            console.log('setData', count, range);
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

                const even = i % 2 == 0;

                values.push({
                    high: val + high,
                    low: val - low,
                    open: even ? val + open : val - open,
                    close: even ? val - close : val + close,
                    icon
                });
            }
            const set1 = new CandleDataSet(values, 'Data Set');

            set1.setDrawIcons(false);
            set1.setAxisDependency(AxisDependency.LEFT);
            set1.setShadowColor('darkgray');
            // set1.setShowCandleBar(false);
            set1.setShadowWidth(0.7);
            set1.setDecreasingColor('red');
            set1.setDecreasingPaintStyle(Style.FILL);
            set1.setIncreasingColor(new Color(255, 122, 242, 84));
            set1.setIncreasingPaintStyle(Style.STROKE);
            set1.setNeutralColor('blue');
            //set1.setHighlightLineWidth(1f);

            const data = new CandleData([set1]);

            chart.setData(data);
            chart.invalidate();
        },
        clearDataSet() {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            const leftAxis = chart.getAxisLeft();
            const chartData = chart.getData();
            const chartDataset = chartData.getDataSets();
            chartDataset.forEach(d => {
                d.clear();
                d.notifyDataSetChanged();
            });
            chart.getData().notifyDataChanged();
            chart.notifyDataSetChanged();
        }
    },
    mounted() {}
});
</script>
