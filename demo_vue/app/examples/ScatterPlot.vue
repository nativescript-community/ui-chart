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
            <ScatterChart ref="chart" @loaded="onChartLoaded" @tap="onChartTap" />
            <Slider row="1" maxValue="150" v-model="count"  @valueChange="updateData" />
            <Slider row="2" maxValue="150" v-model="range"  @valueChange="updateData" />
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
import { DashPathEffect } from '@nativescript-community/ui-canvas';
import { ScatterChart, ScatterShape } from '@nativescript-community/ui-chart/charts/ScatterChart';
import { ScatterData } from '@nativescript-community/ui-chart/data/ScatterData';
import { ScatterDataSet } from '@nativescript-community/ui-chart/data/ScatterDataSet';

export default Vue.extend({
    props: ['title'],
    data() {
        return {
            range: 100,
            count: 45
        };
    },
    created() {},

    methods: {
        onChartLoaded() {
            const chart = this.$refs.chart['nativeView'] as ScatterChart;
            chart.drawFrameRate = true;

            // chart.backgroundColor = 'white';

            // chart.getDescription().setEnabled(false);

            chart.setDrawGridBackground(false);
            chart.setTouchEnabled(true);
            chart.setMaxHighlightDistance(50);

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
            // yl.setTypeface(tfLight);
            yl.setAxisMinimum(0); // this replaces setStartAtZero(true)

            chart.getAxisRight().setEnabled(false);

            const xl = chart.getXAxis();
            // xl.setTypeface(tfLight);
            xl.setDrawGridLines(false);
            //xAxis.addLimitLine(llXAxis);
            this.updateData();
        },
        onChartTap(e) {
            console.log('onChartTap', e.data.extraData, e.highlight);
        },
        redraw() {
            const chart = this.$refs.chart['nativeView'] as ScatterChart;
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
            const chart = this.$refs.chart['nativeView'] as ScatterChart;
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
            set1.setColor('red');
            const set2 = new ScatterDataSet(values2, 'DS 2');
            set2.setScatterShape(ScatterShape.CIRCLE);
            set2.setScatterShapeHoleColor('green');
            set2.setScatterShapeHoleRadius(3);
            set2.setColor('blue');
            const set3 = new ScatterDataSet(values3, 'DS 3');
            set3.setShapeRenderer({
                renderShape(c, dataSet, viewPortHandler, posX, posY, renderPaint) {
                    const shapeHalf = dataSet.getScatterShapeSize() / 2;

                    c.drawLine(posX - shapeHalf, posY - shapeHalf, posX + shapeHalf, posY + shapeHalf, renderPaint);
                }
            });
            set3.setColor('yellow');

            set1.setScatterShapeSize(8);
            set2.setScatterShapeSize(8);
            set3.setScatterShapeSize(8);

            // create a data object with the data sets
            const data = new ScatterData([set1, set2, set3]);
            // data.setValueTypeface(tfLight);

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
