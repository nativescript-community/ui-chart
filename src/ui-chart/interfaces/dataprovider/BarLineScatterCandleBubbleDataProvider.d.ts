import { ChartInterface } from './ChartInterface';
import { BarLineScatterCandleBubbleData } from '../../data/BarLineScatterCandleBubbleData';
import { AxisDependency } from '../../components/YAxis';
import { Transformer } from '../../utils/Transformer';

export interface BarLineScatterCandleBubbleDataProvider extends ChartInterface {
    getTransformer(axis?: AxisDependency): Transformer;
    readonly transformer: Transformer;
    isInverted(axis: AxisDependency);

    lowestVisibleX;
    highestVisibleX;

    data: BarLineScatterCandleBubbleData<any, any>;
}
