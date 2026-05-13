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
            <Slider row="1" maxValue="150" v-model="count" @valueChange="updateData" />
            <Slider row="2" maxValue="150" v-model="range" @valueChange="updateData" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { ScatterChart, ScatterShape } from '@nativescript-community/ui-chart/charts/ScatterChart';
import { LegendHorizontalAlignment, LegendOrientation, LegendVerticalAlignment } from '@nativescript-community/ui-chart/components/Legend';
import { ScatterData } from '@nativescript-community/ui-chart/data/ScatterData';
import { ScatterDataSet } from '@nativescript-community/ui-chart/data/ScatterDataSet';
import { Font, Frame } from '@nativescript/core';
import Vue from 'vue';

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

            // chart.getDescription().enabled=(false);

            chart.drawGridBackgroundEnabled = false;
            chart.touchEnabled = true;
            chart.maxHighlightDistance = 50;

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
            l.xOffset = 5;

            const yl = chart.axisLeft;
            // yl.typeface=(tfLight);
            yl.axisMinimum = 0; // this replaces setStartAtZero(true)

            chart.axisRight.enabled = false;

            const xl = chart.xAxis;
            // xl.typeface=(tfLight);
            xl.drawGridLines = false;
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
            set1.scatterShape = ScatterShape.SQUARE;
            set1.color = 'red';
            const set2 = new ScatterDataSet(values2, 'DS 2');
            set2.scatterShape = ScatterShape.CIRCLE;
            set2.scatterShapeHoleColor = 'green';
            set2.scatterShapeHoleRadius = 3;
            set2.color = 'blue';
            const set3 = new ScatterDataSet(values3, 'DS 3');
            set3.shapeRenderer = {
                renderShape(c, dataSet, viewPortHandler, posX, posY, renderPaint) {
                    const shapeHalf = dataSet.scatterShapeSize / 2;
                    c.drawLine(posX - shapeHalf, posY - shapeHalf, posX + shapeHalf, posY + shapeHalf, renderPaint);
                }
            };
            set3.color = 'yellow';

            set1.scatterShapeSize = 8;
            set2.scatterShapeSize = 8;
            set3.scatterShapeSize = 8;

            // create a data object with the data sets
            const data = new ScatterData([set1, set2, set3]);
            // data.valueTypeface=(tfLight);

            chart.data = data;
            chart.invalidate();
        },
        clearDataSet() {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
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
