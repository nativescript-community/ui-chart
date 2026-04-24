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
            <BubbleChart ref="chart" @loaded="onChartLoaded" @tap="onChartTap" />
            <Slider row="1" maxValue="150" v-model="count" @valueChange="updateData" />
            <Slider row="2" maxValue="150" v-model="range" @valueChange="updateData" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import { BubbleChart } from '@nativescript-community/ui-chart/charts/BubbleChart';
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { LegendHorizontalAlignment, LegendOrientation, LegendVerticalAlignment } from '@nativescript-community/ui-chart/components/Legend';
import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
import { BubbleData } from '@nativescript-community/ui-chart/data/BubbleData';
import { BubbleDataSet } from '@nativescript-community/ui-chart/data/BubbleDataSet';
import { Font, Frame, ImageSource } from '@nativescript/core';
import Vue from 'vue';

export default Vue.extend({
    props: ['title'],
    data() {
        return {
            range: 50,
            count: 10
        };
    },
    created() {},

    methods: {
        onChartLoaded() {
            const chart = this.$refs.chart['nativeView'] as BubbleChart;
            chart.drawFrameRate = true;

            // chart.backgroundColor = 'white';

            // chart.getDescription().enabled=(false);

            chart.drawGridBackgroundEnabled = false;

            chart.touchEnabled = true;

            // enable scaling and dragging
            chart.dragEnabled = true;
            chart.scaleEnabled = true;

            chart.maxVisibleValueCount = 200;
            chart.pinchZoomEnabled = true;

            const l = chart.legend;
            l.verticalAlignment = LegendVerticalAlignment.TOP;
            l.horizontalAlignment = LegendHorizontalAlignment.RIGHT;
            l.orientation = LegendOrientation.VERTICAL;
            l.drawInside = false;
            l.typeface = Font.default.withFontFamily('OpenSans-Light');

            const yl = chart.axisLeft;
            yl.typeface = Font.default.withFontFamily('OpenSans-Light');
            yl.spaceTop = 30;
            yl.spaceBottom = 30;
            yl.drawZeroLine = false;

            chart.axisRight.enabled = false;

            const xl = chart.xAxis;
            xl.position = XAxisPosition.BOTTOM;
            xl.typeface = Font.default.withFontFamily('OpenSans-Light');
            this.updateData();
        },
        onChartTap(e) {
            console.log('onChartTap', e.data.extraData, e.highlight);
        },
        redraw() {
            const chart = this.$refs.chart['nativeView'] as BubbleChart;
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
            const icon = ImageSource.fromFileOrResourceSync('~/assets/star.png');
            const chart = this.$refs.chart['nativeView'] as BubbleChart;
            const values1 = [];
            const values2 = [];
            const values3 = [];

            for (let i = 0; i < count; i++) {
                values1.push({
                    y: Math.random() * range,
                    size: Math.random() * range,
                    icon
                });
                values2.push({
                    y: Math.random() * range,
                    size: Math.random() * range,
                    icon
                });
                values3.push({
                    y: Math.random() * range,
                    size: Math.random() * range
                });
            }

            // create a dataset and give it a type
            const set1 = new BubbleDataSet(values1, 'DS 1');
            set1.drawIconsEnabled = false;
            set1.setColor('red', 130);
            set1.drawValuesEnabled = true;

            const set2 = new BubbleDataSet(values2, 'DS 2');
            set2.drawIconsEnabled = false;
            set2.iconsOffset = { x: 0, y: 15 };
            set2.setColor('green', 130);
            set2.drawValuesEnabled = true;

            const set3 = new BubbleDataSet(values3, 'DS 3');
            set3.setColor('blue', 130);
            set3.drawValuesEnabled = true;

            // create a data object with the data sets
            const data = new BubbleData([set1, set2, set3]);
            data.drawValuesEnabled = false;
            data.valueTypeface = Font.default.withFontFamily('OpenSans-Light');
            data.valueTextSize = 8;
            data.valueTextColor = 'white';
            data.highlightCircleWidth = 1.5;

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
