import Vue from 'nativescript-vue';

import LineChart from './Basic.vue';
import BubbleChart from './BubbleChart.vue';
import CandleStickChart from './CandleStickChart.vue';
import Basic from './NSChart.vue';
import PieChart from './PieChart.vue';
import ScatterPlot from './ScatterPlot.vue';
import CombineChart from './CombinedChart.vue';
import Realtime from './Realtime.vue';
import { ChartTraceCategory, install } from '@nativescript-community/ui-chart';
import CanvasSVG from '@nativescript-community/ui-svg/vue';
import { Trace } from '@nativescript/core';

export function installPlugin() {
    install();
    Vue.use(CanvasSVG);
    Trace.addCategories(ChartTraceCategory);
    // Trace.enable();

    Vue.registerElement('LineChart', () => require('@nativescript-community/ui-chart/charts').LineChart);
    Vue.registerElement('BarChart', () => require('@nativescript-community/ui-chart/charts').BarChart);
    Vue.registerElement('PieChart', () => require('@nativescript-community/ui-chart/charts').PieChart);
    Vue.registerElement('RadarChart', () => require('@nativescript-community/ui-chart/charts').RadarChart);
    Vue.registerElement('CandleStickChart', () => require('@nativescript-community/ui-chart/charts').CandleStickChart);
    Vue.registerElement('BubbleChart', () => require('@nativescript-community/ui-chart/charts').BubbleChart);
    Vue.registerElement('ScatterChart', () => require('@nativescript-community/ui-chart/charts').ScatterChart);
    Vue.registerElement('CombinedChart', () => require('@nativescript-community/ui-chart/charts').CombinedChart);
}

export const demos = [
    { name: 'Basic', path: 'Basic', component: Basic },
    { name: 'LineChart', path: 'LineChart', component: LineChart },
    { name: 'BubbleChart', path: 'BubbleChart', component: BubbleChart },
    { name: 'CandleStickChart', path: 'CandleStickChart', component: CandleStickChart },
    { name: 'PieChart', path: 'PieChart', component: PieChart },
    { name: 'ScatterPlot', path: 'ScatterPlot', component: ScatterPlot },
    { name: 'CombineChart', path: 'CombineChart', component: CombineChart },
    { name: 'Realtime', path: 'Realtime', component: Realtime }
];
