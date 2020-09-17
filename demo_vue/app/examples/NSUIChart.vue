<template>
    <Page>
        <ActionBar title="NS UI Chart">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
        <StackLayout @loaded="onLoaded">
            <RadCartesianChart width="300" height="400">
                <LineSeries v-tkCartesianSeries seriesName="Line" :items="randomData" legendTitle="value" categoryProperty="index" valueProperty="value"/>
                <CategoricalAxis v-tkCartesianHorizontalAxis allowPan="true" allowZoom="true" />
                <LinearAxis v-tkCartesianVerticalAxis allowPan="true" allowZoom="true" />
                <RadLegendView v-tkCartesianLegend position="Bottom" width="150"/>
            </RadCartesianChart>
            
        </StackLayout>
    </Page>
</template>

<script lang="ts">
import { Color, Frame } from '@nativescript/core';
import Vue from 'vue';
import { knownFolders, path } from '@nativescript/core/file-system';

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
            //properties: ['speed', 'bearing', 'altitude', 'computedSpeed', 'mslAltitude', 'pressure']
        };
    },
    computed: {
        //chartColor() {
        //    return (index: number) => {
        //        console.log('chartColor', index);
        //        if (!this.colors[index]) {
        //            this.colors[index] = getRandomColor();
        //        }
        //        return this.colors[index];
        //    };
        //},
        //locs() {
        //    return JSON.parse(
        //        knownFolders
        //            .currentApp()
        //            .getFile('assets/migration_test.json')
        //            .readTextSync()
        //    )[0].locs;
        //},
        randomData() {
            return new Array(1000).fill(0).map((v, i)=>({
                index:i,
                value: Math.random() * 1
            }))
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
            Frame.topmost().goBack();
        }
    },
    mounted() {}
});
</script>
