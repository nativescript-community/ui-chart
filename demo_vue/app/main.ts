// require('./ts_helpers');
import Vue from 'nativescript-vue';
import App from './App.vue';
import './styles.scss';
import RadChart from 'nativescript-ui-chart/vue';

import {install} from 'nativescript-gesturehandler'
install();

Vue.use(RadChart);

// setShowDebug(true);

Vue.registerElement('LineChart', () => require('nativescript-chart/charting/charts/LineChart').default);


declare var com;
import { MPLineChart } from 'nativescript-mpchart-fork-adrianoop/chart/line-chart/nativescript-line-chart';
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
Vue.registerElement('MPLineChart', () => MPLineChart);

// Prints Vue logs when --env.production is *NOT* set while building
Vue.config.silent = false;

Vue.config.errorHandler = (e, vm, info) => {
    if (e) {
        console.log('[Vue][Error]', `[${info}]`, e, e.stack);
    }
};

Vue.config.warnHandler = function(msg, vm, trace) {
    console.warn('[Vue][Warn]', `[${msg}]`);
    // cwarn(msg, trace);
};
new Vue({
    render: h => h('frame', [h(App)])
}).$start();
