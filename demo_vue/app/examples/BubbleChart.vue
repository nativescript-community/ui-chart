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
import { Color, Frame, ImageSource, Font } from '@nativescript/core';
import Vue from 'vue';
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { LimitLine, LimitLabelPosition } from '@nativescript-community/ui-chart/components/LimitLine';
import { LegendForm, Legend, LegendOrientation, LegendVerticalAlignment, LegendHorizontalAlignment } from '@nativescript-community/ui-chart/components/Legend';
import { knownFolders, path } from '@nativescript/core/file-system';
import { Mode } from '@nativescript-community/ui-chart/data/LineDataSet';
import { ColorTemplate } from '@nativescript-community/ui-chart/utils/ColorTemplate';
import { YAxisLabelPosition, AxisDependency } from '@nativescript-community/ui-chart/components/YAxis';
import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
import { DashPathEffect } from '@nativescript-community/ui-canvas';
import { BubbleChart } from '@nativescript-community/ui-chart/charts/BubbleChart';
import { BubbleData } from '@nativescript-community/ui-chart/data/BubbleData';
import { BubbleDataSet } from '@nativescript-community/ui-chart/data/BubbleDataSet';

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
            chart.drawFameRate = true;

            // chart.backgroundColor = 'white';

            // chart.getDescription().setEnabled(false);

            chart.setDrawGridBackground(false);

            chart.setTouchEnabled(true);

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

            const yl = chart.getAxisLeft();
            yl.setTypeface(Font.default.withFontFamily('OpenSans-Light'));
            yl.setSpaceTop(30);
            yl.setSpaceBottom(30);
            yl.setDrawZeroLine(false);

            chart.getAxisRight().setEnabled(false);

            const xl = chart.getXAxis();
            xl.setPosition(XAxisPosition.BOTTOM);
            xl.setTypeface(Font.default.withFontFamily('OpenSans-Light'));
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
            set1.setDrawIcons(false);
            set1.setColor(ColorTemplate.COLORFUL_COLORS[0], 130);
            set1.setDrawValues(true);

            const set2 = new BubbleDataSet(values2, 'DS 2');
            set2.setDrawIcons(false);
            set2.setIconsOffset({ x: 0, y: 15 });
            set2.setColor(ColorTemplate.COLORFUL_COLORS[1], 130);
            set2.setDrawValues(true);

            const set3 = new BubbleDataSet(values3, 'DS 3');
            set3.setColor(ColorTemplate.COLORFUL_COLORS[2], 130);
            set3.setDrawValues(true);

            // create a data object with the data sets
            const data = new BubbleData([set1, set2, set3]);
            data.setDrawValues(false);
            data.setValueTypeface(Font.default.withFontFamily('OpenSans-Light'));
            data.setValueTextSize(8);
            data.setValueTextColor('white');
            data.setHighlightCircleWidth(1.5);

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
