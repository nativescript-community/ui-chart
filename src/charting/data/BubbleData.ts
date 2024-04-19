import { BubbleDataSet } from './BubbleDataSet';
import { BarLineScatterCandleBubbleData } from './BarLineScatterCandleBubbleData';
import { BubbleEntry } from './BubbleEntry';

export class BubbleData extends BarLineScatterCandleBubbleData<BubbleEntry, BubbleDataSet> {
    /**
     * Sets the width of the circle that surrounds the bubble when highlighted
     * for all DataSet objects this data object contains, in dp.
     *
     * @param width
     */
    public set highlightCircleWidth(width: number) {
        for (let index = 0; index < this.mDataSets.length; index++) {
            this.mDataSets[index].highlightCircleWidth = width;
        }
    }
}
