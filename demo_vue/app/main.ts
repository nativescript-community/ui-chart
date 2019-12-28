// require('./ts_helpers');
import Vue from 'nativescript-vue';
import App from './App.vue';
import './styles.scss';
import RadChart from 'nativescript-ui-chart/vue';

Vue.use(RadChart);

// setShowDebug(true);

Vue.registerElement('LineChart', () => require('nativescript-chart/charting/charts/LineChart').LineChart);

import { MPLineChart } from 'nativescript-mpchart-fork-adrianoop/chart/line-chart/nativescript-line-chart';
class CustomLineChart extends (com as any).github.mikephil.charting.charts.LineChart {
    _owner: WeakRef<CustomMPLineChart>;
    constructor(context) {
        super(context);
    }
    onDraw(canvas) {
        super.onDraw(canvas);
        const owner = this._owner && this._owner.get();
        if (owner) {
            owner.notify({ eventName: 'drawn', object: owner });
        }
    }
}

class CustomMPLineChart extends MPLineChart {
    createNativeView() {
        var lineChartView = new CustomLineChart(this._context);
        lineChartView._owner = new WeakRef(this);
        return lineChartView;
    }
}
Vue.registerElement('MPLineChart', () => CustomMPLineChart);

// Prints Vue logs when --env.production is *NOT* set while building
Vue.config.silent = true;
// setShowDebug(true)
// Vue.config.silent = (TNS_ENV === 'production')

// if (isAndroid) {
//     application.on(application.launchEvent, () => {
//         console.log('launchEvent', !!application.android.context);
//         registerLicense(
//             'XTUN3Q0ZGSjlTY054SWd2N2NpMTlmdW5LZ3B6OG5NWEhBaFFoSXd5RU9TZnlYd0htWm1SUDF2SjBiR25VUUE9PQoKYXBwVG9rZW49NWI5MTdkMTAtOThhYy00YjU2LTk1NGEtMzYxYWFhNzE4ZjQ3CnBhY2thZ2VOYW1lPWNvbS5ha3lsYXMubmF0aXZlc2NyaXB0LmNhcnRvZGVtbwpvbmxpbmVMaWNlbnNlPTEKcHJvZHVjdHM9c2RrLWFuZHJvaWQtNC4qCndhdGVybWFyaz1jYXJ0b2RiCg==',
//             result => {
//                 console.log('registeredLicense', result);
//             }
//         );
//     });
// } else {
//     registerLicense(
//         'XTUMwQ0ZRQ0lvQ0lPaXVqaWV3cHUrVHpuRnBIbFg0UzJPd0lVUENLckxhYnNIR21OZVQ3T3g2dndEU2Q3UkdnPQoKYXBwVG9rZW49ZTkzNGZlZjgtNjg0MS00ZjUzLTk5OTktYWM1NzljNDFlNjk1CmJ1bmRsZUlkZW50aWZpZXI9Y29tLmFreWxhcy5uYXRpdmVzY3JpcHQuY2FydG9kZW1vCm9ubGluZUxpY2Vuc2U9MQpwcm9kdWN0cz1zZGstaW9zLTQuKgp3YXRlcm1hcms9Y2FydG9kYgo='
//     );
// }

new Vue({
    render: h => h('frame', [h(App)])
}).$start();
