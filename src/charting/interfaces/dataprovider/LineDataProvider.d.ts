import { LineData } from '../../data/LineData';
import { BarLineScatterCandleBubbleDataProvider } from './BarLineScatterCandleBubbleDataProvider';
import { AxisDependency } from '../../components/YAxis';

export interface LineDataProvider extends BarLineScatterCandleBubbleDataProvider {
    getLineData(): LineData;

    getAxis(dependency: AxisDependency);
}
