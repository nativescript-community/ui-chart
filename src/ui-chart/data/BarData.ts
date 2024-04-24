import { BarLineScatterCandleBubbleData } from './BarLineScatterCandleBubbleData';
import { BarDataSet } from './BarDataSet';
import { BarEntry } from './BarEntry';

/**
 * Data object that represents all data for the BarChart.
 *

 */
export class BarData extends BarLineScatterCandleBubbleData<BarEntry, BarDataSet> {
    /**
     * the width of the bars on the x-axis, in values (not pixels)
     */
    barWidth = 0.85;

    /**
     * if set to true, bar keep the same size with zoom scale
     */
    fixedBarScale: boolean = false;
    /**
     * Groups all BarDataSet objects this data object holds together by modifying the x-value of their entries.
     * Previously set x-values of entries will be overwritten. Leaves space between bars and groups as specified
     * by the parameters.
     * Do not forget to call notifyDataSetChanged() on your BarChart object after calling this method.
     *
     * @param fromX      the starting polet on the x-axis where the grouping should begin
     * @param groupSpace the space between groups of bars in values (not pixels) e.g. 0.8f for bar width 1
     * @param barSpace   the space between individual bars in values (not pixels) e.g. 0.1 for bar width 1
     * @param centered   whether to group bar around x values or between (default is false)
     */
    public groupBars(fromX, groupSpace, barSpace, centered = false, groupCondensed = false) {
        const setCount = this.mDataSets.length;
        if (setCount <= 1) {
            return;
        }
        const max = this.maxEntryCountSet;
        const maxEntryCount = max.entryCount;

        const groupSpaceWidthHalf = groupSpace / 2;
        const barSpaceHalf = barSpace / 2;
        const barWidthHalf = this.barWidth / 2;

        const interval = this.getGroupWidth(groupSpace, barSpace);
        if (!groupCondensed && centered) {
            fromX -= interval / 2;
        }
        for (let i = 0; i < maxEntryCount; i++) {
            const start = fromX;
            if (!centered) {
                fromX += groupSpaceWidthHalf;
            }
            if (groupCondensed) {
                const entries = this.mDataSets.reduce(
                    (acc, set) => {
                        if (i < set.entryCount) {
                            const xKey = set.xProperty;
                            const yKey = set.yProperty;
                            const entry = set.getEntryForIndex(i);
                            const yVal = entry[yKey];
                            if (entry && (entry.yVals || (yVal !== null && yVal !== undefined && yVal !== 0))) {
                                // TODO: this is bad we should not modify the entry!
                                acc.push([xKey, entry]);
                            }
                        }
                        return acc;
                    },
                    [] as [string, BarEntry][]
                );
                if (centered) {
                    fromX -= entries.length * (barWidthHalf + barSpaceHalf);
                }
                for (const entry of entries) {
                    fromX += barSpaceHalf;
                    fromX += barWidthHalf;
                    // if (i < set.entryCount) {
                    //     const xKey = set.xProperty;
                    //     const yKey = set.yProperty;
                    //     const entry = set.getEntryForIndex(i);

                    //     if (entry && (entry.yVals || (entry[yKey] !== null && entry[yKey] !== undefined))) {
                    // TODO: this is bad we should not modify the entry!
                    entry[1][entry[0]] = fromX;
                    // }
                    // }
                    fromX += barWidthHalf;
                    fromX += barSpaceHalf;
                }
            } else {
                for (const set of this.mDataSets) {
                    fromX += barSpaceHalf;
                    fromX += barWidthHalf;
                    if (i < set.entryCount) {
                        const xKey = set.xProperty;
                        const yKey = set.yProperty;
                        const entry = set.getEntryForIndex(i);
                        const yVal = entry[yKey];

                        if (entry && (entry.yVals || (yVal !== null && yVal !== undefined))) {
                            // TODO: this is bad we should not modify the entry!
                            entry[xKey] = fromX;
                        }
                    }
                    fromX += barWidthHalf;
                    fromX += barSpaceHalf;
                }
            }

            fromX += groupSpaceWidthHalf;
            const end = fromX;
            const innerInterval = end - start;
            const diff = interval - innerInterval;

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
        return this.mDataSets.length * (this.barWidth + barSpace) + groupSpace;
    }
}
