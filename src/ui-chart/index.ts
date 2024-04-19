export { BarChart } from './charts/BarChart';
export { HorizontalBarChart } from './charts/HorizontalBarChart';
export { LineChart } from './charts/LineChart';
export { PieChart } from './charts/PieChart';
export { RadarChart } from './charts/RadarChart';
export { ScatterChart } from './charts/ScatterChart';
export { BubbleChart } from './charts/BubbleChart';
export { CandleStickChart } from './charts/CandleStickChart';
export { CombinedChart } from './charts/CombinedChart';
import { install as installGestures } from '@nativescript-community/gesturehandler';

export { ChartTraceCategory } from './utils/Utils';
export function install() {
    installGestures();
}
