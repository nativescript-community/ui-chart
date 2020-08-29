import { DataSet } from './DataSet';
import { Entry } from './Entry';
import { IBarLineScatterCandleBubbleDataSet } from '../interfaces/datasets/IBarLineScatterCandleBubbleDataSet';
import { Color } from '@nativescript/core/color';

/**
 * Baseclass of all DataSets for Bar-, Line-, Scatter- and CandleStickChart.
 *
 * @author Philipp Jahoda
 */
export abstract class BarLineScatterCandleBubbleDataSet<T extends Entry> extends DataSet<T> implements IBarLineScatterCandleBubbleDataSet<T> {
    /**
     * default highlight color
     */
    mHighLightColor: string | Color = '#FFBB73';

    // constructor(values, label) {
    //     super(values, label);
    // }

    /**
     * Sets the color that is used for drawing the highlight indicators. Dont
     * forget to resolve the color using getResources().getColor(...) or
     * new Color(255, ...).
     *
     * @param color
     */
    public setHighLightColor(color) {
        this.mHighLightColor = color;
    }

    public getHighLightColor() {
        return this.mHighLightColor;
    }
}
