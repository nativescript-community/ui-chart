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
import { DashPathEffect } from '@nativescript-community/ui-canvas';
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { LegendForm } from '@nativescript-community/ui-chart/components/Legend';
import { LimitLabelPosition, LimitLine } from '@nativescript-community/ui-chart/components/LimitLine';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
import { Font, Frame, ImageSource } from '@nativescript/core';
import { FontStyle, FontWeight } from '@nativescript/core/ui/styling/font';
import Vue from 'vue';

export default Vue.extend({
    props: ['title'],
    data() {
        return {
            range: 180,
            count: 45,
            hardwareAccelerated: true
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
            chart.touchEnabled = true;

            // set listeners
            // chart.setOnChartValueSelectedListener(this);
            chart.drawGridBackgroundEnabled = false;

            // create marker to display box when values are selected
            // MyMarkerView mv = new MyMarkerView(this, R.layout.custom_marker_view);

            // Set the marker to the chart
            // mv.setChartView(chart);
            // chart.setMarker(mv);

            // enable scaling and dragging
            chart.dragEnabled = true;
            chart.scaleEnabled = true;
            chart.highlightPerTapEnabled = true;
            chart.highlightPerDragEnabled = true;
            // chart.setScaleXEnabled(true);
            // chart.setScaleYEnabled(true);

            // force pinch zoom along both axis
            chart.pinchZoomEnabled = true;
            const legend = chart.legend;
            legend.enabled = true;
            legend.font = new Font('serif', 10, FontStyle.ITALIC, FontWeight.EXTRA_LIGHT);
            const xAxis = chart.xAxis;

            // vertical grid lines
            xAxis.enableGridDashedLine(10, 10, 0);

            const yAxis = chart.axisLeft;

            // disable dual axis (only use LEFT axis)
            chart.axisRight.enabled = false;
            yAxis.axisLineWidth = 3;
            yAxis.axisLineColor = 'blue';
            // horizontal grid lines
            yAxis.enableGridDashedLine(10, 30, 0);

            // axis range
            yAxis.axisMaximum = 200;
            yAxis.axisMinimum = -50;

            //         const rightAxis = chart.axisRight;
            //         rightAxis.enabled=(true);
            // rightAxis.axisLineColor=('red');
            // rightAxis.axisLineWidth=(2);
            // rightAxis.drawGridLines=(false)
            const llXAxis = new LimitLine(9, 'Index 10');
            llXAxis.lineWidth = 4;
            llXAxis.enableDashedLine(10, 10, 0);
            llXAxis.labelPosition = LimitLabelPosition.RIGHT_BOTTOM;
            llXAxis.textSize = 10;

            const ll1 = new LimitLine(150, 'Upper Limit');
            ll1.lineWidth = 4;
            ll1.enableDashedLine(10, 10, 0);
            ll1.labelPosition = LimitLabelPosition.RIGHT_TOP;
            ll1.textSize = 10;

            const ll2 = new LimitLine(-30, 'Lower Limit');
            ll2.lineWidth = 4;
            ll2.enableDashedLine(10, 10, 0);
            ll2.labelPosition = LimitLabelPosition.RIGHT_BOTTOM;
            ll2.textSize = 10;

            // draw limit lines behind data instead of on top
            yAxis.drawLimitLinesBehindData = true;
            xAxis.drawLimitLinesBehindData = true;

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
            const startSVG = ImageSource.fromFileSync('~/assets/star.png');
            // const startSVG = new SVG();
            // startSVG.src = '~/assets/star.svg';
            // startSVG.width = 30;
            // startSVG.cache = true;
            // startSVG.height = 30;
            const chart = this.$refs.chart['nativeView'] as LineChart;
            const values = new Array(Math.round(count)).fill(0).map((v, i) => ({
                y: Math.random() * range - 30,
                icon: startSVG
            }));
            let set1: LineDataSet;
            if (chart.data !== null && chart.data.dataSetCount > 0) {
                set1 = chart.data.getDataSetByIndex(0);
                set1.values = values;
                set1.notifyDataSetChanged();
                chart.data.notifyDataChanged();
                chart.notifyDataSetChanged();
            } else {
                // create a dataset and give it a type
                set1 = new LineDataSet(values, 'DataSet 1');

                set1.drawIconsEnabled = true;

                // draw dashed line
                set1.enableDashedLine(10, 5, 0);

                // black lines and points
                set1.color = 'black';
                set1.circleColor = 'black';

                // line thickness and point size
                set1.lineWidth = 1;
                set1.circleRadius = 3;

                // draw points as solid circles
                set1.drawCircleHoleEnabled = false;

                // customize legend entry
                set1.form = LegendForm.LINE;
                set1.formLineWidth = 1;
                set1.formLineDashEffect = new DashPathEffect([10, 5], 0);
                set1.formSize = 15;

                // text size of values
                set1.valueTextSize = 9;

                // draw selection line as dashed
                set1.enableHighlightDashPathEffect(10, 5, 0);

                // set the filled area
                set1.drawFilledEnabled = true;
                set1.fillFormatter = {
                    getFillLinePosition(dataSet, dataProvider) {
                        return chart.axisLeft.axisMinimum;
                    }
                };

                // set color of filled area
                set1.fillColor = 'black';

                const dataSets = [];
                dataSets.push(set1); // add the data sets

                // create a data object with the data sets
                const data = new LineData(dataSets);
                // set data
                chart.data = data;
            }
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
