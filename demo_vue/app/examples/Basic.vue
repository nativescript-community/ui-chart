<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap" />
            <StackLayout orientation="horizontal">
                <Button text="redraw" @tap="redraw" />
                <Button text="reset" @tap="reset" />
                <Button text="anim" @tap="animate" />
                <Button text="clear" @tap="clearDataSet" />
            </StackLayout>
        </ActionBar>
        <GridLayout rows="*,auto,auto,auto">
            <LineChart ref="chart" @loaded="onChartLoaded" @tap="onChartTap" :hardwareAccelerated="hardwareAccelerated" />
            <Slider row="1" maxValue="500" v-model="count" @valueChange="updateData" />
            <Slider row="2" maxValue="180" v-model="range" @valueChange="updateData" />
            <Switch row="3" v-model="hardwareAccelerated" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import { Color, Font, Frame, ImageSource } from '@nativescript/core';
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
import { DashPathEffect } from '@nativescript-community/ui-canvas';
import { SVG } from '@nativescript-community/ui-svg';
import { FontStyle, FontWeight } from '@nativescript/core/ui/styling/font';

export default Vue.extend({
    props: ['title'],
    data() {
        return {
            range: 180,
            count: 45,
            hardwareAccelerated: true,
        };
    },
    created() {},

    methods: {
        onChartLoaded() {
            const chart = this.$refs.chart['nativeView'] as LineChart;
            chart.drawFrameRate = true;

            // chart.backgroundColor = 'white';
            // disable description text
            // chart.getDescription().setEnabled(false);

            // enable touch gestures
            chart.setTouchEnabled(true);

            // set listeners
            // chart.setOnChartValueSelectedListener(this);
            chart.setDrawGridBackground(false);

            // create marker to display box when values are selected
            // MyMarkerView mv = new MyMarkerView(this, R.layout.custom_marker_view);

            // Set the marker to the chart
            // mv.setChartView(chart);
            // chart.setMarker(mv);

            // enable scaling and dragging
            chart.setDragEnabled(true);
            chart.setScaleEnabled(true);
            chart.setHighlightPerTapEnabled(true);
            chart.setHighlightPerDragEnabled(true);
            // chart.setScaleXEnabled(true);
            // chart.setScaleYEnabled(true);

            // force pinch zoom along both axis
            chart.setPinchZoom(true);
            const legend = chart.getLegend();
            legend.setEnabled(true);
            legend.setFont(new Font("serif", 10, FontStyle.ITALIC, FontWeight.EXTRA_LIGHT));
            const xAxis = chart.getXAxis();

            // vertical grid lines
            xAxis.enableGridDashedLine(10, 10, 0);

            const yAxis = chart.getAxisLeft();

            // disable dual axis (only use LEFT axis)
            chart.getAxisRight().setEnabled(false);

            // horizontal grid lines
            yAxis.enableGridDashedLine(10, 10, 0);

            // axis range
            yAxis.setAxisMaximum(200);
            yAxis.setAxisMinimum(-50);

            const llXAxis = new LimitLine(9, 'Index 10');
            llXAxis.setLineWidth(4);
            llXAxis.enableDashedLine(10, 10, 0);
            llXAxis.setLabelPosition(LimitLabelPosition.RIGHT_BOTTOM);
            llXAxis.setTextSize(10);

            const ll1 = new LimitLine(150, 'Upper Limit');
            ll1.setLineWidth(4);
            ll1.enableDashedLine(10, 10, 0);
            ll1.setLabelPosition(LimitLabelPosition.RIGHT_TOP);
            ll1.setTextSize(10);

            const ll2 = new LimitLine(-30, 'Lower Limit');
            ll2.setLineWidth(4);
            ll2.enableDashedLine(10, 10, 0);
            ll2.setLabelPosition(LimitLabelPosition.RIGHT_BOTTOM);
            ll2.setTextSize(10);

            // draw limit lines behind data instead of on top
            yAxis.setDrawLimitLinesBehindData(true);
            xAxis.setDrawLimitLinesBehindData(true);

            // add limit lines
            yAxis.addLimitLine(ll1);
            yAxis.addLimitLine(ll2);
            //xAxis.addLimitLine(llXAxis);

            this.updateData();

            // draw points over time
            chart.animateX(1000);
        },
        onChartTap(e) {
            console.log('onChartTap', e.data.extraData, e.highlight);
        },
        redraw() {
            const chart = this.$refs.chart['nativeView'] as LineChart;
            chart.invalidate();
        },
        animate() {
            const chart = this.$refs.chart['nativeView'] as LineChart;
            chart.animateY(1000);
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
            // const start = ImageSource.fromFileOrResourceSync('~/assets/star.png');
            const startSVG = new SVG();
            startSVG.src = '~/assets/star.svg';
            startSVG.width = 30;
            startSVG.cache = true;
            startSVG.height = 30;
            const chart = this.$refs.chart['nativeView'] as LineChart;
            const values = new Array(Math.round(count)).fill(0).map((v, i) => ({
                y: Math.random() * range - 30,
                icon: startSVG,
            }));
            let set1: LineDataSet;
            if (chart.getData() !== null && chart.getData().getDataSetCount() > 0) {
                set1 = chart.getData().getDataSetByIndex(0);
                set1.setValues(values);
                set1.notifyDataSetChanged();
                chart.getData().notifyDataChanged();
                chart.notifyDataSetChanged();
            } else {
                // create a dataset and give it a type
                set1 = new LineDataSet(values, 'DataSet 1');

                set1.setDrawIcons(true);

                // draw dashed line
                set1.enableDashedLine(10, 5, 0);

                // black lines and points
                set1.setColor('black');
                set1.setCircleColor('black');

                // line thickness and point size
                set1.setLineWidth(1);
                set1.setCircleRadius(3);

                // draw points as solid circles
                set1.setDrawCircleHole(false);

                // customize legend entry
                set1.setForm(LegendForm.LINE);
                set1.setFormLineWidth(1);
                set1.setFormLineDashEffect(new DashPathEffect([10, 5], 0));
                set1.setFormSize(15);

                // text size of values
                set1.setValueTextSize(9);

                // draw selection line as dashed
                set1.enableDashedHighlightLine(10, 5, 0);

                // set the filled area
                set1.setDrawFilled(true);
                set1.setFillFormatter({
                    getFillLinePosition(dataSet, dataProvider) {
                        return chart.getAxisLeft().getAxisMinimum();
                    },
                });

                // set color of filled area
                set1.setFillColor('black');

                const dataSets = [];
                dataSets.push(set1); // add the data sets

                // create a data object with the data sets
                const data = new LineData(dataSets);
                // set data
                chart.setData(data);
            }
        },
        clearDataSet() {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            const leftAxis = chart.getAxisLeft();
            const chartData = chart.getData();
            const chartDataset = chartData.getDataSets();
            chartDataset.forEach((d) => {
                d.clear();
                d.notifyDataSetChanged();
            });
            chart.getData().notifyDataChanged();
            chart.notifyDataSetChanged();
        },
    },
    mounted() {},
});
</script>
