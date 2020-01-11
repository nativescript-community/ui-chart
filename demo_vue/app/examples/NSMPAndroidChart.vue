<template>
    <Page>
        <ActionBar title="NS MPChart">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
        <StackLayout @loaded="onLoaded">
            <MPLineChart ref="lineChart" scaleEnable highlightPerTapEnabled highlightPerDragEnabled backgroundColor="lightgray" width="100%" height="100%" :items="dataSets"> </MPLineChart>
        </StackLayout>
    </Page>
</template>

<script lang="ts">
import * as frameModule from '@nativescript/core/ui/frame';
import Vue from 'vue';
import { knownFolders, path } from '@nativescript/core/file-system';
import { profile } from '@nativescript/core/profiling/profiling';
import { LineData } from 'nativescript-chart/charting/data/LineData';
import { Color } from '@nativescript/core/color/color';
import { DataLineChartInterface, DataSetChartInterface, DataSetLabelInterface, YAxisFormatterInterface } from 'nativescript-mpchart-fork-adrianoop';
import { MPLineChart } from 'nativescript-mpchart-fork-adrianoop/chart/line-chart/nativescript-line-chart';
export const title = 'NS MPChart';

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
    name: 'NSMPChart',
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
    computed: {
        locs() {
            return JSON.parse(
                knownFolders
                    .currentApp()
                    .getFile('assets/migration_test.json')
                    .readTextSync()
            )[0].locs;
        },
        dataSets() {
            const locs = this.locs;
            const sets: Array<DataLineChartInterface> = [];
            ['speed', 'bearing', 'altitude', 'computedSpeed', 'mslAltitude', 'pressure'].forEach((prop, i) => {
                //
                const set = {
                    lineColor: getRandomColor(),
                    legendLabel: prop,
                    dataSet: locs
                        .filter(l => l[prop] !== undefined && l[prop] !== null)
                        .map((l, index) => ({
                            x: index,
                            y: l[prop]
                        })) as Array<DataSetChartInterface>
                };
                
                sets.push(set);
            });
            return sets;
        }
    },
    methods: {
        onLoaded() {
        },
        onNavigationButtonTap() {
            frameModule.topmost().goBack();
        }
    },
    mounted() {
        const chart = this.$refs.lineChart['nativeView'] as MPLineChart;
        chart.once('drawn', () => {
            alert('drawn in ' + (Date.now() - this.startTime) + 'ms');
        });
    }
});
</script>
