export { BarChart } from './BarChart';
export { HorizontalBarChart } from './HorizontalBarChart';
export { LineChart } from './LineChart';
export { PieChart } from './PieChart';
export { RadarChart } from './RadarChart';
export { ScatterChart } from './ScatterChart';
export { BubbleChart } from './BubbleChart';
export { CandleStickChart } from './CandleStickChart';
export { CombinedChart } from './CombinedChart';
import { install as installGestures } from '@nativescript-community/gesturehandler';

export function install() {
    installGestures();
}
