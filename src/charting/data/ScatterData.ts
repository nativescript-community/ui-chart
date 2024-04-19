import { BarLineScatterCandleBubbleData } from './BarLineScatterCandleBubbleData';
import { ScatterDataSet } from './ScatterDataSet';
import { Entry } from './Entry';

export class ScatterData extends BarLineScatterCandleBubbleData<Entry, ScatterDataSet> {
    /**
     * Returns the maximum shape-size across all DataSets.
     */
    public get greatestShapeSize() {
        let max = 0;
        for (let index = 0; index < this.mDataSets.length; index++) {
            const size = this.mDataSets[index].scatterShapeSize;

            if (size > max) {
                max = size;
            }
        }
        return max;
    }
}
