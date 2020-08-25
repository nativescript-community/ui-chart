<template>
    <Page>
        <ActionBar title="NS UI Chart">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
        <StackLayout @loaded="onLoaded">
            <RadCartesianChart>
                <Palette v-tkCartesianPalette v-for="key of properties" :key="key + 'p'" :seriesName="key">
                    <PaletteEntry v-tkCartesianPaletteEntry strokeWidth="3" :fillColor="chartColor(key)" :strokeColor="chartColor(key)" />
                </Palette>
                <LinearAxis
                    v-tkCartesianHorizontalAxis
                    allowZoom="true"
                    :minimum="locs[0].relativeTimestamp"
                    :maximum="locs[locs.length - 1].relativeTimestamp"
                    labelLayoutMode="Inner"
                    labelFitMode="None"
                    labelFormat="%.1f"
                    ticksColor="transparent"
                    labelTextColor="transparent"
                />
                <LinearAxis v-tkCartesianVerticalAxis allowZoom="true" labelFitMode="None" labelFormat="%.1f" ticksColor="transparent" labelTextColor="black" />
                <RadCartesianChartGrid v-tkCartesianGrid horizontalLinesVisible="false" verticalLinesVisible="false" horizontalStripLinesVisible="false" verticalStripLinesVisible="false">
                </RadCartesianChartGrid>
                <LineSeries v-tkCartesianSeries v-for="key of properties" :legendTitle="key" :seriesName="key" :key="key" :items="locs" categoryProperty="relativeTimestamp" :valueProperty="key" />
                <RadLegendView titleColor="black" v-tkCartesianLegend position="Bottom" width="100%" :enableSelection="true"></RadLegendView>
            </RadCartesianChart>
        </StackLayout>
    </Page>
</template>

<script lang="ts">
import * as frameModule from '@nativescript/core/ui/frame';
import Vue from 'vue';
import { LineChart } from 'nativescript-chart/charts/LineChart';
import { LimitLine, LimitLabelPosition } from 'nativescript-chart/components/LimitLine';
import { LegendForm } from 'nativescript-chart/components/Legend';
import { knownFolders, path } from '@nativescript/core/file-system';
import { profile } from '@nativescript/core/profiling/profiling';
import { LineDataSet } from 'nativescript-chart/data/LineDataSet';
import { LineData } from 'nativescript-chart/data/LineData';
import { Color } from '@nativescript/core/color/color';
import { ColorTemplate } from 'nativescript-chart/utils/ColorTemplate';

export const title = 'NS UI Chart';

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
    name: 'NSUIChart',
    data() {
        return {
            title: title,
            isBusy: true,
            colors: [],
            properties: ['speed', 'bearing', 'altitude', 'computedSpeed', 'mslAltitude', 'pressure']
        };
    },
    computed: {
        chartColor() {
            return (index: number) => {
                console.log('chartColor', index);
                if (!this.colors[index]) {
                    this.colors[index] = getRandomColor();
                }
                return this.colors[index];
            };
        },
        locs() {
            return JSON.parse(
                knownFolders
                    .currentApp()
                    .getFile('assets/migration_test.json')
                    .readTextSync()
            )[0].locs;
        }
    },
    created() {
        this.startTime = Date.now();
        console.log('created', this.startTime);
    },
    methods: {
        onLoaded() {
            console.log('onLoaded', this.startTime);
        },
        onNavigationButtonTap() {
            frameModule.topmost().goBack();
        }
    },
    mounted() {}
});
</script>
