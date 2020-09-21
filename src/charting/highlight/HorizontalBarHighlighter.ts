import { BarHighlighter } from './BarHighlighter';
import { Highlight } from './Highlight';
import { BarDataProvider } from '../interfaces/dataprovider/BarDataProvider';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';

export class HorizontalBarHighlighter extends BarHighlighter
{
    constructor(chart: BarDataProvider)
    {
        super(chart);
    }
    
    public getHighlight(x: number, y: number): Highlight
    {
        const pos = this.getValsForTouch(x, y);
        const high = this.getHighlightForX(pos.y, y, x);
        if(high === null)
        {
            return null;
        }
        
        const barData = this.mChart.getBarData();
        const set = barData.getDataSetByIndex(high.dataSetIndex);
        if (set.isStacked())
        {
            return this.getStackedHighlight(high, set, pos.y, pos.x);
        }

        return high;
    }

    protected buildHighlights(set: IBarDataSet, dataSetIndex, xVal, rounding) {
        const xProperty = set.xProperty;
        const yProperty = set.yProperty;
        const highlights: Highlight[] = [];

        //noinspection unchecked
        let entries = set.getEntriesForXValue(xVal);
        if (entries.length == 0) {
            // Try to find closest x-value and take all entries for that x-value
            const closest = set.getEntryForXValue(xVal, NaN, rounding);
            if (closest !== null) {
                //noinspection unchecked
                entries = set.getEntriesForXValue(closest[xProperty]);
            }
        }

        if (entries.length == 0) {
            return highlights;
        }

        for (let e of entries) {
            const pixels = this.mChart.getTransformer(set.getAxisDependency()).getPixelForValues(e[yProperty], e[xProperty]);

            highlights.push({
                entry:e,
                x: e[xProperty],
                y: e[yProperty],
                xPx: pixels.x,
                yPx: pixels.y,
                dataSetIndex,
                axis: set.getAxisDependency()
            });
        }

        return highlights;
    }

    protected getDistance(x1, y1, x2, y2): number
    {
        return Math.abs(y1 - y2);
    }
}
