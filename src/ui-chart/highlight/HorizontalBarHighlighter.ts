import { BarHighlighter } from './BarHighlighter';
import { Highlight } from './Highlight';
import { BarDataProvider } from '../interfaces/dataprovider/BarDataProvider';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';

export class HorizontalBarHighlighter extends BarHighlighter {
    constructor(chart: BarDataProvider) {
        super(chart);
    }

    public getHighlight(x: number, y: number) {
        const pos = this.getValsForTouch(x, y);
        const barData = this.mChart.barData;
        return this.getHighlightForX(pos.y, y, x).map((h) => {
            const set = barData.getDataSetByIndex(h.dataSetIndex);
            if (set.stacked) {
                return this.getStackedHighlight(h, set, x, y, pos.y, pos.x);
            }
            return h;
        });
    }

    protected buildHighlights(set: IBarDataSet, dataSetIndex, xVal, rounding) {
        const yKey = set.yProperty;
        const highlights: Highlight[] = [];

        //noinspection unchecked
        let entries = set.getEntriesAndIndexesForXValue(xVal);
        if (entries.length === 0) {
            // Try to find closest x-value and take all entries for that x-value
            const closest = set.getEntryAndIndexForXValue(xVal, NaN, rounding);
            if (closest) {
                //noinspection unchecked
                entries = set.getEntriesAndIndexesForXValue(set.getEntryXValue(closest.entry, closest.index));
            }
        }

        if (entries.length === 0) {
            return highlights;
        }

        for (const r of entries) {
            const e = r.entry;
            const xVal = set.getEntryXValue(e, r.index);
            const pixels = this.mChart.getTransformer(set.axisDependency).getPixelForValues(e[yKey], xVal);

            highlights.push({
                entry: e,
                entryIndex: r.index,
                x: xVal,
                y: e[yKey],
                xPx: pixels.x,
                yPx: pixels.y,
                dataSetIndex,
                axis: set.axisDependency
            });
        }

        return highlights;
    }

    protected getDistance(x1, y1, x2, y2): number {
        return Math.abs(y1 - y2);
    }
}
