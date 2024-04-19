<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap" />
            <StackLayout orientation="horizontal">
                <Button text="add" @tap="addEntry" />
                <Button text="start" @tap="start" />
                <Button text="stop" @tap="stop" />
            </StackLayout>
        </ActionBar>
        <GridLayout rows="*,auto,auto">
            <LineChart ref="chart" @loaded="onChartLoaded" @tap="onChartTap" :hardwareAccelerated="hardwareAccelerated" />
            <Switch row="1" v-model="hardwareAccelerated" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import { LineChart } from '@nativescript-community/ui-chart/charts/LineChart';
import { LegendForm } from '@nativescript-community/ui-chart/components/Legend';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
import { Font, Frame } from '@nativescript/core';
import Vue from 'vue';

export default Vue.extend({
    props: ['title'],
    data() {
        return {
            hardwareAccelerated: false
        };
    },
    created() {},

    methods: {
        onChartLoaded() {
            const chart = this.$refs.chart['nativeView'] as LineChart;
            chart.drawFrameRate = true;

            // disable description text
            // chart.getDescription().enabled=(false);
            // enable touch gestures
            chart.touchEnabled = true;

            // enable touch gestures
            chart.touchEnabled = true;

            // enable scaling and dragging
            chart.dragEnabled = true;
            chart.scaleEnabled = true;
            chart.drawGridBackgroundEnabled = false;

            // if disabled, scaling can be done on x- and y-axis separately
            chart.pinchZoomEnabled = true;

            // set an alternative background color
            // chart.backgroundColor = 'lightgray';

            const data = new LineData();
            // data.valueTextColor=('white');

            // add empty data
            chart.data = data;

            // get the legend (only possible after setting data)
            const l = chart.legend;

            // modify the legend ...
            l.form = LegendForm.LINE;
            l.typeface = Font.default.withFontFamily('OpenSans-Light');
            l.textColor = 'white';

            const xl = chart.xAxis;
            xl.typeface = Font.default.withFontFamily('OpenSans-Light');
            xl.textColor = 'white';
            xl.drawGridLines = false;
            xl.avoidFirstLastClipping = true;
            xl.enabled = true;

            const leftAxis = chart.axisLeft;
            leftAxis.typeface = Font.default.withFontFamily('OpenSans-Light');
            leftAxis.textColor = 'white';
            leftAxis.axisMaximum = 100;
            leftAxis.axisMinimum = 0;
            leftAxis.drawGridLines = true;

            const rightAxis = chart.axisRight;
            rightAxis.enabled = false;

            // draw points over time
        },
        start() {
            if (!this.timer) {
                this.timer = setInterval(this.addEntry, 25);
            }
        },
        stop() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },
        addEntry() {
            // In case user leaves this page
            if (!this.$refs.chart) {
                this.stop();
                return;
            }

            const chart = this.$refs.chart['nativeView'] as LineChart;
            const data = chart.data;

            if (data) {
                let set = data.getDataSetByIndex(0);
                // set.addEntry(...); // can be called as well

                if (!set) {
                    set = this.createSet(chart);
                    data.addDataSet(set);
                }
                set.batchEntryOperations(() => {
                    set.addEntry({ y: Math.random() * 40 + 30 });
                    if (set.entryCount >= 120) {
                        set.removeFirst();
                    }
                });
                data.calcMinMax();
                // chart.visibleXRangeMaximum=(120);
                // data.addEntry(new Entry(set.entrCount, (float) (Math.random() * 40) + 30), 0);
                // set.notifyDataSetChanged();
                // data.notifyDataChanged();

                // let the chart know it's data has changed
                chart.notifyDataSetChanged();

                // limit the number of visible entries
                // chart.visibleYRange=(30, AxisDependency.LEFT);

                // move to the latest entry
                chart.moveViewToX(data.entryCount);

                // this automatically refreshes the chart (calls invalidate())
                // chart.moveViewTo(data.getXValCount()-7, 55f,
                // AxisDependency.LEFT);
            }
        },

        createSet(createSet: LineChart) {
            const set = new LineDataSet(null, 'Dynamic Data');
            set.color = 'blue';
            set.circleColor = 'white';
            set.lineWidth = 2;
            set.circleRadius = 4;
            set.fillAlpha = 65;
            set.fillColor = 'red';
            // set.highLightColor=(new Color(255, 244, 117, 117));
            // set.valueTextColor=('white');
            // set.valueTextSize=(9);
            set.drawValuesEnabled = false;
            return set;
        },
        onChartTap(e) {
            console.log('onChartTap', e.data.extraData, e.highlight);
        },
        redraw() {
            const chart = this.$refs.chart['nativeView'] as LineChart;
            chart.invalidate();
        },
        reset() {
            this.updateData();
        },
        onNavigationButtonTap() {
            Frame.topmost().goBack();
        }
    },
    mounted() {}
});
</script>
