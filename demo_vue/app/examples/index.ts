import NSChart, { title as nsChartTitle } from './NSChart.vue';
import NSUIChart, { title as nsUIChartTitle } from './NSUIChart.vue';
import NSMPChart, { title as nsMPChartTitle } from './NSMPAndroidChart.vue';

export const getExamples = () => {
    return [
        {
            title: nsChartTitle,
            component: NSChart
        },
        {
            title: nsUIChartTitle,
            component: NSUIChart
        },
        {
            title: nsMPChartTitle,
            component: NSMPChart
        }
    ];
};
