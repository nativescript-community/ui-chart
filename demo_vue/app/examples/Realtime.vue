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
import { Color, Frame, ImageSource, Font } from '@nativescript/core';
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
            chart.drawFameRate = true;

            chart.backgroundColor = 'white';

            // disable description text
            // chart.getDescription().setEnabled(false);
            chart.setLogEnabled(true);
            // enable touch gestures
            chart.setTouchEnabled(true);

            // enable touch gestures
            chart.setTouchEnabled(true);

            // enable scaling and dragging
            chart.setDragEnabled(true);
            chart.setScaleEnabled(true);
            chart.setDrawGridBackground(false);

            // if disabled, scaling can be done on x- and y-axis separately
            chart.setPinchZoom(true);

            // set an alternative background color
            chart.backgroundColor = 'lightgray';

            const data = new LineData();
            data.setValueTextColor('white');

            // add empty data
            chart.setData(data);

            // get the legend (only possible after setting data)
            const l = chart.getLegend();

            // modify the legend ...
            l.setForm(LegendForm.LINE);
            l.setTypeface(Font.default.withFontFamily('OpenSans-Light'));
            l.setTextColor('white');

            const xl = chart.getXAxis();
            xl.setTypeface(Font.default.withFontFamily('OpenSans-Light'));
            xl.setTextColor('white');
            xl.setDrawGridLines(false);
            xl.setAvoidFirstLastClipping(true);
            xl.setEnabled(true);

            const leftAxis = chart.getAxisLeft();
            leftAxis.setTypeface(Font.default.withFontFamily('OpenSans-Light'));
            leftAxis.setTextColor('white');
            leftAxis.setAxisMaximum(100);
            leftAxis.setAxisMinimum(0);
            leftAxis.setDrawGridLines(true);

            const rightAxis = chart.getAxisRight();
            rightAxis.setEnabled(false);

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
            const data = chart.getData();

            if (data != null) {
                let set = data.getDataSetByIndex(0);
                // set.addEntry(...); // can be called as well

                if (set == null) {
                    set = this.createSet();
                    data.addDataSet(set);
                }

                data.addEntry({ y: Math.random() * 40 + 30 }, 0);
                // data.addEntry(new Entry(set.getEntryCount(), (float) (Math.random() * 40) + 30), 0);
                data.notifyDataChanged();

                // let the chart know it's data has changed
                chart.notifyDataSetChanged();

                // limit the number of visible entries
                chart.setVisibleXRangeMaximum(120);
                // chart.setVisibleYRange(30, AxisDependency.LEFT);

                // move to the latest entry
                chart.moveViewToX(data.getEntryCount());

                // this automatically refreshes the chart (calls invalidate())
                // chart.moveViewTo(data.getXValCount()-7, 55f,
                // AxisDependency.LEFT);
            }
        },

        createSet() {
            const chart = this.$refs.chart['nativeView'] as LineChart;
            const set = new LineDataSet(null, 'Dynamic Data');
            set.setAxisDependency(AxisDependency.LEFT);
            set.setColor(ColorTemplate.getHoloBlue());
            set.setCircleColor('white');
            set.setLineWidth(2);
            set.setCircleRadius(4);
            set.setFillAlpha(65);
            set.setFillColor(ColorTemplate.getHoloBlue());
            set.setHighLightColor(new Color(255, 244, 117, 117));
            set.setValueTextColor('white');
            set.setValueTextSize(9);
            set.setDrawValues(false);
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
