import NSChart, { title as nsChartTitle } from './NSChart.vue';
import NSUIChart, { title as nsUIChartTitle } from './NSUIChart.vue';

export const getExamples = () =>
    [
        {
            title: nsChartTitle,
            component: NSChart
        },
        {
            title: nsUIChartTitle,
            component: NSUIChart
        }
    ] as any[];
