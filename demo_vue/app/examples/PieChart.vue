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
            "Party A", "Party B", "Party C", "Party D", "Party E", "Party F", "Party G", "Party H",
            "Party I", "Party J", "Party K", "Party L", "Party M", "Party N", "Party O", "Party P",
            "Party Q", "Party R", "Party S", "Party T", "Party U", "Party V", "Party W", "Party X",
            "Party Y", "Party Z"
]
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

            // chart.getDescription().setEnabled(false);

            chart.setUsePercentValues(true);
        chart.getDescription().setEnabled(false);
        chart.setExtraOffsets(5, 10, 5, 5);

        chart.setDragDecelerationFrictionCoef(0.95);

        chart.setCenterTextTypeface(Font.default.withFontFamily('OpenSans-Light'));
        chart.setCenterText('MPAndroidChart\ndeveloped by Philipp Jahoda');

        chart.setDrawHoleEnabled(true);
        chart.setHoleColor('white');

        chart.setTransparentCircleColor('white');
        chart.setTransparentCircleAlpha(110);

        chart.setHoleRadius(58);
        chart.setTransparentCircleRadius(61);

        chart.setDrawCenterText(true);

        chart.setRotationAngle(0);
        // enable rotation of the chart by touch
        chart.setRotationEnabled(true);
        chart.setHighlightPerTapEnabled(true);

        const l = chart.getLegend();
        l.setVerticalAlignment(LegendVerticalAlignment.TOP);
        l.setHorizontalAlignment(LegendHorizontalAlignment.RIGHT);
        l.setOrientation(LegendOrientation.VERTICAL);
        l.setDrawInside(false);
        l.setXEntrySpace(7);
        l.setYEntrySpace(0);
        l.setYOffset(0);

        // entry label styling
        chart.setEntryLabelColor('white');
        chart.setEntryLabelTypeface(Font.default.withFontFamily('OpenSans'));
        chart.setEntryLabelTextSize(12);

            this.updateData();
            chart.animateY(1400);
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
        let entries = [];
        for (let i = 0; i < count ; i++) {
            entries.push({
                y: ((Math.random() * range) + range / 5),
                label:parties[i % parties.length],
                icon
            });
        }

        const dataSet = new PieDataSet(entries, "Election Results");

        dataSet.setDrawIcons(false);

        dataSet.setSliceSpace(3);
        dataSet.setIconsOffset({x:0, y:40});
        dataSet.setSelectionShift(5);

        // add a lot of colors
const colors = [];
colors.push(...ColorTemplate.VORDIPLOM_COLORS)
colors.push(...ColorTemplate.JOYFUL_COLORS)
colors.push(...ColorTemplate.COLORFUL_COLORS)
colors.push(...ColorTemplate.LIBERTY_COLORS)
colors.push(...ColorTemplate.PASTEL_COLORS)
        
        colors.push(ColorTemplate.getHoloBlue());

        dataSet.setColors(colors);
        //dataSet.setSelectionShift(0f);

        const data = new PieData([dataSet]);
        data.setValueFormatter({
            getFormattedValue(value: number, entry: PieEntry, index, count, dataSetIndex, viewPortHandler) {
                return value * 100 + '%'
            }
        });
        data.setValueTextSize(11);
        data.setValueTextColor('white');
        data.setValueTypeface(Font.default.withFontFamily('OpenSans-Light'));
        chart.setData(data);
            chart.invalidate();
        }
    },
    mounted() {}
});
</script>
