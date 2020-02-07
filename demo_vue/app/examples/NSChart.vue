<template>
    <Page>
        <ActionBar title="NS Chart">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
            <Button text="redraw" @tap="redraw" />
            <!-- <Switch text /> -->
        </ActionBar>
        <ScrollView>
            <StackLayout @loaded="onLoaded" height="2000">
                <LineChart ref="lineChart" backgroundColor="lightgray" width="300" height="400" @tap="onChartTap"> </LineChart>
                <Label fontSize="10">speed</Label>
            </StackLayout>
        </ScrollView>
    </Page>
</template>

<script lang="ts">
import * as frameModule from '@nativescript/core/ui/frame';
import Vue from 'vue';
import LineChart from 'nativescript-chart/charts/LineChart';
import { LimitLine, LimitLabelPosition } from 'nativescript-chart/components/LimitLine';
import { LegendForm } from 'nativescript-chart/components/Legend';
import { knownFolders, path } from '@nativescript/core/file-system';
import { profile } from '@nativescript/core/profiling/profiling';
import { LineDataSet, Mode } from 'nativescript-chart/data/LineDataSet';
import { LineData } from 'nativescript-chart/data/LineData';
import { Color } from '@nativescript/core/color/color';
import { ColorTemplate } from 'nativescript-chart/utils/ColorTemplate';

export const title = 'NS Chart';
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
    var r = getRandomInt(0, 255);
    var g = getRandomInt(0, 255);
    var b = getRandomInt(0, 255);
    return new Color(255, r, g, b);
}
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
        // console.log('created', this.startTime);
    },
    computed: {
        chartColor() {
            return (index: number) => {
                // console.log('chartColor', index);
                if (!this.colors[index]) {
                    this.colors[index] = getRandomColor();
                }
                return this.colors[index];
            };
        }
    },
    methods: {
        onLoaded() {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            chart.drawFameRate = true;
            chart.setLogEnabled(true);
            chart.setScaleEnabled(true);
            chart.setDragEnabled(true);
            // chart.setHardwareAccelerationEnabled(true);
        },
        onChartTap(e) {
            console.log('onChartTap', e.data.extraData, e.highlight);
        },
        redraw() {
            const chart = this.$refs.lineChart['nativeView'] as LineChart;
            chart.invalidate();
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
            // const jsonData = this.loadData();
            // const locs = jsonData[2].locs;

            const data = new Array(1_000).fill(0).map((v,i)=>({
                index:i,
                value: Math.random() * 1
            }))
            console.log('setData', data.length, data[0]);
            const sets = [];
             const set = new LineDataSet(data, 'value', 'index', 'value');
             set.setColor(getRandomColor());
             sets.push(set)
        //     ['speed', 'bearing', 'altitude', 'computedSpeed', 'mslAltitude', 'pressure'].forEach((prop, i) => {
        //         if (!locs[0][prop]) {
        //             return;
        //         }
        //         const set = new LineDataSet(locs, prop, 'timestamp', prop);
        //         console.log('creating set', prop, i, locs[0][prop], locs.length);
        //         // if (i === 0) {
        //         // set.setMode(Mode.CUBIC_BEZIER);

        //         // }
        //         // if (i === 1) {
        //         // set.enableDashedLine(6,2, 0);
        //         // }
        //         // if (i === 2) {
        //         // set.setMode(Mode.HORIZONTAL_BEZIER);

        //         // }
        //         // if (i === 3) {
        //         //     set.setVisible(false);
        //         // }
        //         set.setDrawValues(true);
        //         // set.setDrawIcons(false);
        //         // // line thickness and point size
        //         // set.setLineWidth(3);
        //         // set.setCircleRadius(3);
        //         const color = getRandomColor();
        //         set.setColor(color);
        //         set.setDrawFilled(true);
        //         set.setFillColor(color);
        //         // set.setGradientColor(color, getRandomColor());

        //         // // draw points as solid circles
        //         // set.setDrawCircleHole(false);
        //         // set.setDrawCircles(false);

        //         // // customize legend entry
        //         // set.setFormLineWidth(1);
        //         // set1.setFormLineDashEffect(new DashPathEffect(new float[]{10f, 5f}, 0f));
        //         // set.setFormSize(10);
        //         // set.setDrawFilled(true);
        //         sets.push(set);
        //     });

        //     // const set = new LineDataSet(locs, 'DataSet 1', 'relativeTimestamp', 'mslAltitude');
        //     // // set.xProperty = 'relativeTimestamp';
        //     // // set.yProperty = 'mslAltitude';
        //     // set.setDrawIcons(false);
        //     // // // line thickness and point size
        //     // set.setLineWidth(3);
        //     // set.setCircleRadius(3);

        //     // // // draw points as solid circles
        //     // set.setDrawCircleHole(false);
        //     // set.setDrawCircles(false);

        //     // // // customize legend entry
        //     // set.setFormLineWidth(1);
        //     // // set1.setFormLineDashEffect(new DashPathEffect(new float[]{10f, 5f}, 0f));
        //     // set.setFormSize(10);
        //     // set.setDrawFilled(true);

        //     // create a data object with the data sets
            const linedata = new LineData(sets);

        //     // set data
            chart.setData(linedata);
        }
    },
    mounted() {
        // console.log('mounted');
        const chart = this.$refs.lineChart['nativeView'] as LineChart;
        // chart.setLogEnabled(true);
        // background color
        // chart.backgroundColor = 'white';

        // disable description text
        // chart.getDescription().setEnabled(false);
        // chart.setTouchEnabled(true);

        // set listeners
        // chart.on('valueSelected', (e: any) => console.log(e.highlight));
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
