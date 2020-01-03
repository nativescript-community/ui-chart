<template>
    <Page>
        <ActionBar title="NS Chart">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
        <StackLayout @loaded="onLoaded">
            <LineChart ref="lineChart" backgroundColor="lightgray" width="100%"> </LineChart>
        </StackLayout>
    </Page>
</template>

<script lang="ts">
import * as frameModule from '@nativescript/core/ui/frame';
import Vue from 'vue';
import LineChart from 'nativescript-chart/charting/charts/LineChart';
import { LimitLine, LimitLabelPosition } from 'nativescript-chart/charting/components/LimitLine';
import { LegendForm } from 'nativescript-chart/charting/components/Legend';
import { knownFolders, path } from '@nativescript/core/file-system';
import { profile } from '@nativescript/core/profiling/profiling';
import { LineDataSet } from 'nativescript-chart/charting/data/LineDataSet';
import { LineData } from 'nativescript-chart/charting/data/LineData';
import { Color } from '@nativescript/core/color/color';
import { ColorTemplate } from 'nativescript-chart/charting/utils/ColorTemplate';

export const title = 'NS Chart';

export default Vue.extend({
    name: 'NSChart',
    data() {
        return {
            title: title,
            isBusy: true
        };
    },
    created() {
        this.startTime = Date.now();
        console.log('created', this.startTime);
    },
    methods: {
        onLoaded() {
            console.log('onLoaded', this.startTime);

            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            // chart.setLogEnabled(true);
            chart.setHardwareAccelerationEnabled(true);
        },
        onNavigationButtonTap() {
            frameModule.topmost().goBack();
        },
        loadData() {
            return JSON.parse(
                knownFolders
                    .currentApp()
                    .getFile('assets/migration_test.json')
                    .readTextSync()
            );
        },
        setData() {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            // chart.setLogEnabled(true);
            const jsonData = this.loadData();
            const locs = jsonData[0].locs;

            const sets = [];
            ['speed', 'bearing', 'altitude', 'computedSpeed', 'mslAltitude', 'pressure'].forEach((prop, i) => {
                const set = new LineDataSet(locs, prop, 'relativeTimestamp', prop);
                // set.xProperty = 'relativeTimestamp';
                // set.yProperty = 'mslAltitude';
                // set.setDrawIcons(false);
                // // line thickness and point size
                // set.setLineWidth(3);
                // set.setCircleRadius(3);
                set.setColor(ColorTemplate.MATERIAL_COLORS[i % ColorTemplate.MATERIAL_COLORS.length]);

                // // draw points as solid circles
                // set.setDrawCircleHole(false);
                set.setDrawCircles(false);

                // // customize legend entry
                // set.setFormLineWidth(1);
                // set1.setFormLineDashEffect(new DashPathEffect(new float[]{10f, 5f}, 0f));
                // set.setFormSize(10);
                // set.setDrawFilled(true);
                sets.push(set);
            });

            // const set = new LineDataSet(locs, 'DataSet 1', 'relativeTimestamp', 'mslAltitude');
            // // set.xProperty = 'relativeTimestamp';
            // // set.yProperty = 'mslAltitude';
            // set.setDrawIcons(false);
            // // // line thickness and point size
            // set.setLineWidth(3);
            // set.setCircleRadius(3);

            // // // draw points as solid circles
            // set.setDrawCircleHole(false);
            // set.setDrawCircles(false);

            // // // customize legend entry
            // set.setFormLineWidth(1);
            // // set1.setFormLineDashEffect(new DashPathEffect(new float[]{10f, 5f}, 0f));
            // set.setFormSize(10);
            // set.setDrawFilled(true);

            // create a data object with the data sets
            const data = new LineData(sets);

            // set data
            chart.setData(data);
        }
    },
    mounted() {
        console.log('mounted');
        const chart = this.$refs.lineChart['nativeView'] as LineChart;
        // chart.setLogEnabled(true);
        // background color
        // chart.backgroundColor = 'white';

        // disable description text
        // chart.getDescription().setEnabled(false);
        // chart.setTouchEnabled(true);

        // set listeners
        chart.on('valueSelected', (e: any) => console.log(e.entry, e.highlight));
        // chart.setDrawGridBackground(false);

        // enable scaling and dragging
        // chart.setDragEnabled(true);
        // chart.setScaleEnabled(true);

        // // force pinch zoom along both axis
        // chart.setPinchZoom(true);

        // const xAxis = chart.getXAxis();
        // xAxis.setAxisLineColor(new Color('red'));
        // xAxis.enableGridDashedLine(10, 10, 0);

        // const yAxis = chart.getAxisLeft();
        // // disable dual axis (only use LEFT axis)
        // chart.getAxisRight().setEnabled(false);

        // // horizontal grid lines
        // yAxis.enableGridDashedLine(10, 10, 0);

        // // axis range
        // yAxis.setAxisMaximum(200);
        // yAxis.setAxisMinimum(-50);

        // const llXAxis = new LimitLine(9, 'Index 10');
        // llXAxis.setLineWidth(4);
        // llXAxis.enableDashedLine(10, 10, 0);
        // llXAxis.setLabelPosition(LimitLabelPosition.RIGHT_BOTTOM);
        // llXAxis.setTextSize(10);
        // // llXAxis.setTypeface(tfRegular);

        // const ll1 = new LimitLine(150, 'Upper Limit');
        // ll1.setLineWidth(4);
        // ll1.enableDashedLine(10, 10, 0);
        // ll1.setLabelPosition(LimitLabelPosition.RIGHT_TOP);
        // ll1.setTextSize(10);
        // // ll1.setTypeface(tfRegular);

        // const ll2 = new LimitLine(-30, 'Lower Limit');
        // ll2.setLineWidth(4);
        // ll2.enableDashedLine(10, 10, 0);
        // ll2.setLabelPosition(LimitLabelPosition.RIGHT_BOTTOM);
        // ll2.setTextSize(10);
        // // ll2.setTypeface(tfRegular);

        // // draw limit lines behind data instead of on top
        // yAxis.setDrawLimitLinesBehindData(true);
        // xAxis.setDrawLimitLinesBehindData(true);

        // // add limit lines
        // yAxis.addLimitLine(ll1);
        // yAxis.addLimitLine(ll2);

        // // get the legend (only possible after setting data)
        // const l = chart.getLegend();

        // // draw legend entries as lines
        // l.setForm(LegendForm.SQUARE);

        chart.once('drawn', () => {
            alert('drawn in ' + (Date.now() - this.startTime) + 'ms');
        });
        this.setData();
    }
});
</script>
