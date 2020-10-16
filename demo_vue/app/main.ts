import Vue from 'nativescript-vue';
import App from './App.vue';

import { install } from '@nativescript-community/gesturehandler';
install();

// setShowDebug(true);

Vue.registerElement('LineChart', () => require('@nativescript-community/ui-chart/charts').LineChart);
Vue.registerElement('BarChart', () => require('@nativescript-community/ui-chart/charts').BarChart);
Vue.registerElement('PieChart', () => require('@nativescript-community/ui-chart/charts').PieChart);
Vue.registerElement('RadarChart', () => require('@nativescript-community/ui-chart/charts').RadarChart);
Vue.registerElement('CandleStickChart', () => require('@nativescript-community/ui-chart/charts').CandleStickChart);
Vue.registerElement('BubbleChart', () => require('@nativescript-community/ui-chart/charts').BubbleChart);
Vue.registerElement('ScatterChart', () => require('@nativescript-community/ui-chart/charts').ScatterChart);
Vue.registerElement('CombinedChart', () => require('@nativescript-community/ui-chart/charts').CombinedChart);

declare let com;
// import { MPLineChart } from 'nativescript-mpchart-fork-adrianoop/chart/line-chart/nativescript-line-chart';
// class CustomLineChart extends com.github.mikephil.charting.charts.LineChart {
//     _owner: WeakRef<CustomMPLineChart>;
//     constructor(context) {
//         super(context);
//     }
//     onDraw(canvas) {
//         super.onDraw(canvas);
//         const owner = this._owner && this._owner.get();
//         if (owner) {
//             owner.notify({ eventName: 'drawn', object: owner });
//         }
//     }
// }

// class CustomMPLineChart extends MPLineChart {
//     createNativeView() {
//         var lineChartView = new CustomLineChart(this._context);
//         lineChartView._owner = new WeakRef(this);
//         return lineChartView;
//     }
// }
// Vue.registerElement('MPLineChart', () => MPLineChart);

// Prints Vue logs when --env.production is *NOT* set while building
Vue.config.silent = true;

Vue.config.errorHandler = (e, vm, info) => {
    if (e) {
        console.log('[Vue][Error]', `[${info}]`, e, e.stack);
    }
};

Vue.config.warnHandler = function (msg, vm, trace) {
    console.warn('[Vue][Warn]', `[${msg}]`);
    // cwarn(msg, trace);
};
new Vue({
    render: (h) => h('frame', [h(App)]),
}).$start();
