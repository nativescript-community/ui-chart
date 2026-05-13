<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap" />
            <StackLayout orientation="horizontal">
                <Button text="redraw" @tap="redraw" />
                <Button text="reset" @tap="reset" />
            </StackLayout>
        </ActionBar>
        <GridLayout rows="*,auto,auto">
            <PieChart ref="chart" @loaded="onChartLoaded" @tap="onChartTap" />
            <Slider row="1" maxValue="150" v-model="count" @valueChange="updateData" />
            <Slider row="2" maxValue="150" v-model="range" @valueChange="updateData" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import { PieChart } from '@nativescript-community/ui-chart/charts/PieChart';
import { LegendHorizontalAlignment, LegendOrientation, LegendVerticalAlignment } from '@nativescript-community/ui-chart/components/Legend';
import { PieData } from '@nativescript-community/ui-chart/data/PieData';
import { PieDataSet } from '@nativescript-community/ui-chart/data/PieDataSet';
import { PieEntry } from '@nativescript-community/ui-chart/data/PieEntry';
import { ColorTemplate } from '@nativescript-community/ui-chart/utils/ColorTemplate';
import { Font, Frame, ImageSource } from '@nativescript/core';
import Vue from 'vue';

const parties = [
    'Party A',
    'Party B',
    'Party C',
    'Party D',
    'Party E',
    'Party F',
    'Party G',
    'Party H',
    'Party I',
    'Party J',
    'Party K',
    'Party L',
    'Party M',
    'Party N',
    'Party O',
    'Party P',
    'Party Q',
    'Party R',
    'Party S',
    'Party T',
    'Party U',
    'Party V',
    'Party W',
    'Party X',
    'Party Y',
    'Party Z'
];
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
            const chart = this.$refs.chart['nativeView'] as PieChart;
            chart.drawFrameRate = true;

            // chart.backgroundColor = 'white';

            // chart.getDescription().enabled=(false);

            chart.usePercentValues = true;
            chart.description.enabled = false;
            chart.extraOffsets = [5, 10, 5, 5];

            // chart.dragDecelerationFrictionCoef=(0.95);

            // chart.centerTextTypeface=(Font.default.withFontFamily('OpenSans-Light'));
            chart.centerText = 'MPAndroidChart\ndeveloped by Philipp Jahoda';
            // chart.centerTextColor=('black');

            chart.drawHoleEnabled = true;
            chart.holeColor = 'white';

            chart.transparentCircleColor = 'white';
            chart.transparentCircleAlpha = 110;

            chart.holeRadius = 58;
            chart.transparentCircleRadiusPercent = 61;

            chart.drawCenterText = true;

            chart.rotationAngle = 0;
            // enable rotation of the chart by touch
            chart.rotationEnabled = true;
            chart.highlightPerTapEnabled = true;

            const l = chart.legend;
            l.verticalAlignment = LegendVerticalAlignment.TOP;
            l.horizontalAlignment = LegendHorizontalAlignment.RIGHT;
            l.orientation = LegendOrientation.VERTICAL;
            l.drawInside = false;
            l.xEntrySpace = 7;
            l.yEntrySpace = 0;
            l.yOffset = 0;

            // entry label styling
            chart.entryLabelColor = 'white';
            chart.entryLabelTypeface = Font.default.withFontFamily('OpenSans');
            chart.entryLabelTextSize = 12;

            this.updateData();
            chart.animateX(1400);
        },
        onChartTap(e) {
            console.log('onChartTap', e.data.extraData, e.highlight);
        },
        redraw() {
            const chart = this.$refs.chart['nativeView'] as PieChart;
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
            const chart = this.$refs.chart['nativeView'] as PieChart;
            // NOTE: The order of the entries when being added to the entries array determines their position around the center of
            // the chart.
            const entries = [];
            for (let i = 0; i < count; i++) {
                entries.push({
                    y: Math.random() * range + range / 5,
                    label: parties[i % parties.length],
                    icon
                });
            }

            const dataSet = new PieDataSet(entries, 'Election Results');

            // dataSet.drawIconsEnabled=(false);
            dataSet.drawValuesEnabled = true;

            dataSet.sliceSpace = 3;
            dataSet.iconsOffset = { x: 0, y: 40 };
            dataSet.selectionShift = 5;

            // add a lot of colors
            const colors = [];
            colors.push(...ColorTemplate.VORDIPLOM_COLORS);
            colors.push(...ColorTemplate.JOYFUL_COLORS);
            colors.push(...ColorTemplate.COLORFUL_COLORS);
            colors.push(...ColorTemplate.LIBERTY_COLORS);
            colors.push(...ColorTemplate.PASTEL_COLORS);

            // colors.push(ColorTemplate.getHoloBlue());

            dataSet.colors = colors;
            //dataSet.selectionShift=(0f);

            const data = new PieData([dataSet]);
            data.valueFormatter = {
                getFormattedValue(value: number, entry: PieEntry, index, count, dataSetIndex, viewPortHandler) {
                    return Math.round(value * 100) + '%';
                }
            };
            data.valueTextSize = 11;
            data.valueTextColor = 'white';
            data.valueTypeface = Font.default.withFontFamily('OpenSans-Light');
            chart.data = data;
            chart.invalidate();
        }
    },
    mounted() {}
});
</script>
