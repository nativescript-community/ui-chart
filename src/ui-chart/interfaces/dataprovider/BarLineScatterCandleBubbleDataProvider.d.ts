import { ChartInterface } from './ChartInterface';
import { BarLineScatterCandleBubbleData } from '../../data/BarLineScatterCandleBubbleData';
import { AxisDependency } from '../../components/YAxis';
import { Transformer } from '../../utils/Transformer';
import { MPPointF } from '@nativescript-community/ui-chart/utils/MPPointF';
import { Entry } from '@nativescript-community/ui-chart/data/Entry';
import { IDataSet } from '../datasets/IDataSet';

export interface BarLineScatterCandleBubbleDataProvider extends ChartInterface {
    getTransformer(axis?: AxisDependency): Transformer;
    getPixelForEntry(set: IDataSet<Entry>, entry: Entry, index): MPPointF;
    readonly transformer: Transformer;
    isInverted(axis: AxisDependency);

    lowestVisibleX;
    highestVisibleX;

    data: BarLineScatterCandleBubbleData<any, any>;
}
