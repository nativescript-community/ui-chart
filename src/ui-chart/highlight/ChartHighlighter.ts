import { BarLineScatterCandleBubbleDataProvider } from '../interfaces/dataprovider/BarLineScatterCandleBubbleDataProvider';
import { IHighlighter } from './IHighlighter';
import { Highlight } from './Highlight';
import { AxisDependency } from '../components/YAxis';
import { Rounding } from '../data/DataSet';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { Entry } from '../data/Entry';
import { LineDataSet } from '../data/LineDataSet';

export class ChartHighlighter<T extends BarLineScatterCandleBubbleDataProvider> implements IHighlighter {
    /**
     * instance of the data-provider
     */
    protected mChart: T;

    /**
     * buffer for storing previously highlighted values
     */
    protected mHighlightBuffer: Highlight[] = [];

    constructor(chart: T) {
        this.mChart = chart;
    }

    public getHighlight(x, y) {
        const pos = this.getValsForTouch(x, y);
        const xVal = pos.x;

        return this.getHighlightForX(xVal, x, y);
    }

    /**
     * Returns a recyclable MPPointD instance.
     * Returns the corresponding xPos for a given touch-position in pixels.
     *
     * @param x
     * @param y
     * @return
     */
    protected getValsForTouch(x, y) {
        // take any transformer to determine the x-axis value
        const pos = this.mChart.transformer.getValuesByTouchPoint(x, y);
        return pos;
    }

    /**
     * Returns the corresponding Highlight for a given xVal and x- and y-touch position in pixels.
     *
     * @param xVal
     * @param x
     * @param y
     * @return
     */
    protected getHighlightForX(xVal, x, y) {
        const closestValues = this.getHighlightsAtXValue(xVal, x, y);
        if (closestValues.length <= 1) {
            return closestValues;
        }
        const chart = this.mChart;
        let axis: AxisDependency;
        if (chart.highlightsFilterByAxis) {
            const leftAxisMinDist = this.getMinimumDistance(closestValues, y, AxisDependency.LEFT);
            const rightAxisMinDist = this.getMinimumDistance(closestValues, y, AxisDependency.RIGHT);

            axis = leftAxisMinDist < rightAxisMinDist ? AxisDependency.LEFT : AxisDependency.RIGHT;
        }
        // const detail = this.getClosestHighlightByPixel(closestValues, x, y, chart.maxHighlightDistance, axis);

        // return [detail];
        return this.sortedHighlights(closestValues, x, y, chart.maxHighlightDistance, axis);
    }

    /**
     * Returns the minimum distance from a touch value (in pixels) to the
     * closest value (in pixels) that is displayed in the chart.
     *
     * @param closestValues
     * @param pos
     * @param axis
     * @return
     */
    protected getMinimumDistance(closestValues: Highlight[], pos, axis) {
        let distance = Infinity;

        for (let i = 0; i < closestValues.length; i++) {
            const high = closestValues[i];

            if (high.axis === axis) {
                const tempDistance = Math.abs(this.getHighlightPos(high) - pos);
                if (tempDistance < distance) {
                    distance = tempDistance;
                }
            }
        }

        return distance;
    }

    protected getHighlightPos(h: Highlight) {
        return h.yPx;
    }

    protected getChartData() {
        return this.mChart.data;
    }

    /**
     * Returns a list of Highlight objects representing the entries closest to the given xVal.
     * The returned list contains two objects per DataSet (closest rounding up, closest rounding down).
     *
     * @param xVal the transformed x-value of the x-touch position
     * @return
     */
    public getHighlightsAtXValue(xVal, x?, y?) {
        this.mHighlightBuffer = [];

        const data = this.getChartData();

        if (!data) return this.mHighlightBuffer;

        for (let i = 0, dataSetCount = data.dataSetCount; i < dataSetCount; i++) {
            const dataSet = data.getDataSetByIndex(i);

            // don't include DataSets that cannot be highlighted
            if (!dataSet.highlightEnabled) continue;
            this.mHighlightBuffer.push(...this.buildHighlights(dataSet, i, x, y, xVal, Rounding.CLOSEST));
        }

        return this.mHighlightBuffer;
    }

    /**
     * An array of `Highlight` objects corresponding to the selected xValue and dataSetIndex.
     *
     * @param set
     * @param dataSetIndex
     * @param xVal
     * @param rounding
     * @return
     */
    protected buildHighlights(set: IDataSet<Entry>, dataSetIndex, touchX, touchY, xVal, rounding) {
        const yKey = set.yProperty;
        const highlights: Highlight[] = [];

        if (set['setIgnoreFiltered']) {
            (set as LineDataSet).ignoreFiltered = true;
        }
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
        if (entries.length === 0) return highlights;

        for (const r of entries) {
            const e = r.entry;
            const index = r.index;
            const xVal = set.getEntryXValue(e, index);
            // const pixels = this.mChart.getTransformer(set.axisDependency).getPixelForValues(xVal, e[yKey]);
            const pixels = this.mChart.getPixelForEntry(set, e, index);
            highlights.push({
                entry: e,
                entryIndex: index,
                x: xVal,
                y: e[yKey],
                xTouchPx: touchX,
                yTouchPx: touchY,
                xPx: pixels.x,
                yPx: pixels.y,
                dataSetIndex,
                axis: set.axisDependency
            });
        }
        if (set['setIgnoreFiltered']) {
            (set as LineDataSet).ignoreFiltered = false;
        }

        return highlights;
    }

    /**
     * Returns the Highlight of the DataSet that contains the closest value on the
     * y-axis.
     *
     * @param closestValues        contains two Highlight objects per DataSet closest to the selected x-position (determined by
     *                             rounding up an down)
     * @param x
     * @param y
     * @param minSelectionDistance
     * @param axis                 the closest axis
     * @return
     */
    public getClosestHighlightByPixel(closestValues: Highlight[], x: number, y: number, minSelectionDistance: number, axis?: AxisDependency) {
        let closest: Highlight = null;
        let distance = minSelectionDistance;

        for (let i = 0; i < closestValues.length; i++) {
            const high = closestValues[i];

            if (axis !== undefined || high.axis === axis) {
                const cDistance = this.getDistance(x, y, high.xPx, high.yPx);
                if (cDistance < distance) {
                    closest = high;
                    distance = cDistance;
                }
            }
        }

        return closest;
    }
    /**
     * Returns sorted highlights based on distance to touch x,y
     *
     * @param closestValues        contains two Highlight objects per DataSet closest to the selected x-position (determined by
     *                             rounding up an down)
     * @param x
     * @param y
     * @param minSelectionDistance
     * @param axis                 the closest axis
     * @return
     */
    public sortedHighlights(closestValues: Highlight[], x: number, y: number, minSelectionDistance: number, axis?: AxisDependency) {
        if (axis !== undefined) {
            closestValues = closestValues.filter((h) => h.axis === axis);
        }
        return closestValues
            .map((h) => ({ h, d: this.getDistance(x, y, h.xPx, h.yPx) }))
            .sort((h1, h2) => h1.d - h2.d)
            .filter((v) => v.d < minSelectionDistance)
            .map((v) => v.h);
    }

    /**
     * Calculates the distance between the two given points.
     *
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @return
     */
    protected getDistance(x1: number, y1: number, x2: number, y2: number) {
        //return Math.abs(y1 - y2);
        //return Math.abs(x1 - x2);
        return Math.hypot(x1 - x2, y1 - y2);
    }

    protected getData() {
        return this.mChart.data;
    }
}
