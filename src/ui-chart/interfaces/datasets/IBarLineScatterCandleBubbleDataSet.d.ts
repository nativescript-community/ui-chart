import { Entry } from '../../data/Entry';
import { IDataSet } from './IDataSet';

/**
 * Created by philipp on 21/10/15.
 */
export interface IBarLineScatterCandleBubbleDataSet<T extends Entry> extends IDataSet<T> {
    /**
     * Returns the color that is used for drawing the highlight indicators.
     */
    highlightColor: string | Color;
}
