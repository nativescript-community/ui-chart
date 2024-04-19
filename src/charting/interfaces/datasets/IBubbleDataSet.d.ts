/**
 * Created by philipp on 21/10/15.
 */
import { IBarLineScatterCandleBubbleDataSet } from './IBarLineScatterCandleBubbleDataSet';
import { BubbleEntry } from '../../data/BubbleEntry';

export interface IBubbleDataSet extends IBarLineScatterCandleBubbleDataSet<BubbleEntry> {
    /**
     * Sets the width of the circle that surrounds the bubble when highlighted,
     * in dp.
     *
     * @param width
     */
    highlightCircleWidth: number;

    readonly maxSize: number;

    normalizeSizeEnabled: boolean;
}
