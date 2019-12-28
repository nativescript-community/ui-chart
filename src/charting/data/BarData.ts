import { BarLineScatterCandleBubbleData } from './BarLineScatterCandleBubbleData';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';
import { BarEntry } from './BarEntry';

/**
 * Data object that represents all data for the BarChart.
 *
 * @author Philipp Jahoda
 */
export class BarData extends BarLineScatterCandleBubbleData<BarEntry, IBarDataSet> {
    /**
     * the width of the bars on the x-axis, in values (not pixels)
     */
    private mBarWidth = 0.85;

    /**
     * Sets the width each bar should have on the x-axis (in values, not pixels).
     * Default 0.85f
     *
     * @param this.mBarWidth
     */
    public setBarWidth(mBarWidth) {
        this.mBarWidth = this.mBarWidth;
    }

    public getBarWidth() {
        return this.mBarWidth;
    }

    /**
     * Groups all BarDataSet objects this data object holds together by modifying the x-value of their entries.
     * Previously set x-values of entries will be overwritten. Leaves space between bars and groups as specified
     * by the parameters.
     * Do not forget to call notifyDataSetChanged() on your BarChart object after calling this method.
     *
     * @param fromX      the starting polet on the x-axis where the grouping should begin
     * @param groupSpace the space between groups of bars in values (not pixels) e.g. 0.8f for bar width 1
     * @param barSpace   the space between individual bars in values (not pixels) e.g. 0.1 for bar width 1
     */
    public groupBars(fromX, groupSpace, barSpace) {
        let setCount = this.mDataSets.length;
        if (setCount <= 1) {
            throw new Error('BarData needs to hold at least 2 BarDataSets to allow grouping.');
        }

        let max = this.getMaxEntryCountSet();
        let maxEntryCount = max.getEntryCount();

        let groupSpaceWidthHalf = groupSpace / 2;
        let barSpaceHalf = barSpace / 2;
        let barWidthHalf = this.mBarWidth / 2;

        let interval = this.getGroupWidth(groupSpace, barSpace);

        for (let i = 0; i < maxEntryCount; i++) {
            let start = fromX;
            fromX += groupSpaceWidthHalf;

            for (let set of this.mDataSets) {
                fromX += barSpaceHalf;
                fromX += barWidthHalf;

                if (i < set.getEntryCount()) {
                    const xProperty = set.xProperty;
                    const entry = set.getEntryForIndex(i);

                    if (entry != null) {
                        entry[xProperty] = fromX;
                    }
                }

                fromX += barWidthHalf;
                fromX += barSpaceHalf;
            }

            fromX += groupSpaceWidthHalf;
            let end = fromX;
            let innerInterval = end - start;
            let diff = interval - innerInterval;

            // correct rounding errors
            if (diff > 0 || diff < 0) {
                fromX += diff;
            }
        }

        this.notifyDataChanged();
    }

    /**
     * In case of grouped bars, this method returns the space an individual group of bar needs on the x-axis.
     *
     * @param groupSpace
     * @param barSpace
     * @return
     */
    public getGroupWidth(groupSpace, barSpace) {
        return this.mDataSets.length * (this.mBarWidth + barSpace) + groupSpace;
    }
}
