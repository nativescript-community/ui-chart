import { ChartInterface } from './ChartInterface';
import { BarLineScatterCandleBubbleData } from '../../data/BarLineScatterCandleBubbleData';
import { AxisDependency } from '../../components/YAxis';
import { Transformer } from '../../utils/Transformer';

export interface BarLineScatterCandleBubbleDataProvider extends ChartInterface {

    getTransformer( axis: AxisDependency): Transformer;
    isInverted( axis: AxisDependency);

    getLowestVisibleX();
    getHighestVisibleX();

    getData(): BarLineScatterCandleBubbleData<any, any>;
}
