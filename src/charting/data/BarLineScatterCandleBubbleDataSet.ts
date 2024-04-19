import { DataSet } from './DataSet';
import { Entry } from './Entry';
import { IBarLineScatterCandleBubbleDataSet } from '../interfaces/datasets/IBarLineScatterCandleBubbleDataSet';
import { Color } from '@nativescript/core/color';

/**
 * Baseclass of all DataSets for Bar-, Line-, Scatter- and CandleStickChart.
 *

 */
export abstract class BarLineScatterCandleBubbleDataSet<T extends Entry> extends DataSet<T> implements IBarLineScatterCandleBubbleDataSet<T> {
    /**
     * Sets the color that is used for drawing the highlight indicators. Dont
     * forget to resolve the color using getResources().getColor(...) or
     * new Color(255, ...).
     */
    highLightColor: string | Color = '#FFBB73';
}
