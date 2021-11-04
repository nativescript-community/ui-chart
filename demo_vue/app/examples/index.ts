import NSChart, { title as nsChartTitle } from './NSChart.vue';
import NSUIChart, { title as nsUIChartTitle } from './NSUIChart.vue';
import Basic from './Basic.vue';
import BubbleChart from './BubbleChart.vue';
import ScatterPlot from './ScatterPlot.vue';
import CombinedChart from './CombinedChart.vue';
import CandleStick from './CandleStickChart.vue';
import Realtime from './Realtime.vue';

export const getExamples = () =>
    [
        { component: NSChart, title: nsChartTitle },
        { component: Basic, title: 'Simple line chart.' },
        // {  component:Multiple, title: 'Show multiple data sets.' },
        // {  component:Dual Axis, title: 'Line chart with dual y-axes.' },
        // {  component:Inverted Axis, title: 'Inverted y-axis.' },
        // {  component:Cubic, title: 'Line chart with a cubic line shape.' },
        // {  component:Colorful, title: 'Colorful line chart.' },
        // {  component:Performance, title: 'Render 30.000 data points smoothly.' },
        // {  component:Filled, title: 'Colored area between two lines.' },

        // {  component:Basic, title: 'Simple bar chart.' },
        // {  component:Basic 2, title: 'Variation of the simple bar chart.' },
        // {  component:Multiple, title: 'Show multiple data sets.' },
        // {  component:Horizontal, title: 'Render bar chart horizontally.' },
        // {  component:Stacked, title: 'Stacked bar chart.' },
        // {  component:Negative, title: 'Positive and negative values with unique colors.' },
        // {  component:Negative Horizontal, title: 'demonstrates how to create a HorizontalBarChart with positive and negative values.' },
        // {  component:Stacked 2, title: 'Stacked bar chart with negative values.' },
        // {  component:Sine, title: 'Sine function in bar chart format.' },

        // {  component:Basic, title: 'Simple pie chart.' },
        // {  component:Value Lines, title: 'Stylish lines drawn outward from slices.' },
        // {  component:Half Pie, title: '180° (half) pie chart.' },

        // {  component:Combined Chart, title: 'Bar and line chart together.' },
        { component: ScatterPlot, title: 'Simple scatter plot.' },
        { component: BubbleChart, title: 'Simple bubble chart.' },
        { component: CandleStick, title: 'Simple financial chart.' },
        { component: CombinedChart, title: 'Combined chart.' },

        // {  component:Multiple, title: 'Various types of charts as fragments.' },
        // {  component:View Pager, title: 'Swipe through different charts.' },
        // {  component:Tall Bar Chart, title: 'Bars bigger than your screen!' },
        // {  component:Many Bar Charts, title: 'More bars than your screen can handle!' },

        // ////
        // {  component:Even More Line Charts },

        // {  component:Dynamic, title: 'Build a line chart by adding points and sets.' },
        { component: Realtime, title: 'Add data points in realtime.' }
        // {  component:Hourly, title: 'Uses the current time to add a data point for each hour.' }
    ] as any[];
