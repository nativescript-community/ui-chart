import { ChartHighlighter } from './ChartHighlighter';
import { Highlight } from './Highlight';
import { BarData } from '../data/BarData';
import { BarDataProvider } from '../interfaces/dataprovider/BarDataProvider';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';

export class BarHighlighter extends ChartHighlighter<BarDataProvider> {
    constructor(chart: BarDataProvider) {
        super(chart);
    }

    protected getChartData() {
        return this.mChart.barData;
    }

    public getHighlight(x: number, y: number) {
        const pos = this.getValsForTouch(x, y);
        const xVal = pos.x;

        return this.getHighlightForX(xVal, x, y).map((high) => {
            const barData = this.getChartData();

            const set = barData.getDataSetByIndex(high.dataSetIndex);
            if (set.stacked) {
                return this.getStackedHighlight(high, set, x, y, xVal, pos.y);
            }

            // MPPointD.recycleInstance(pos);

            return high;
        });
    }

    /**
     * This method creates the Highlight object that also indicates which value of a stacked BarEntry has been
     * selected.
     *
     * @param high the Highlight to work with looking for stacked values
     * @param set
     * @param xVal
     * @param yVal
     * @return
     */
    public getStackedHighlight(high: Highlight, set: IBarDataSet, touchX, touchY, xVal, yVal): Highlight {
        const { entry, index } = set.getEntryAndIndexForXValue(xVal, yVal);
        if (!entry) {
            return null;
        }

        // not stacked
        if (!entry.yVals) {
            return high;
        }

        const ranges = entry.ranges;
        if (ranges.length > 0) {
            const yKey = set.yProperty;
            const stackIndex = this.getClosestStackIndex(ranges, yVal);
            const pixels = this.mChart.getTransformer(set.axisDependency).getPixelForValues(high.x, ranges[stackIndex][1]);

            //MPPointD.recycleInstance(pixels);

            return {
                x: set.getEntryXValue(entry, index),
                y: entry[yKey],
                xTouchPx: touchX,
                yTouchPx: touchY,
                xPx: pixels.x,
                yPx: pixels.y,
                dataSetIndex: high.dataSetIndex,
                stackIndex,
                axis: high.axis
            };
        }

        return null;
    }

    /**
     * Returns the index of the closest value inside the values array / ranges (stacked barchart) to the value
     * given as
     * a parameter.
     *
     * @param ranges
     * @param value
     * @return
     */
    protected getClosestStackIndex(ranges: any[], value): number {
        if (!ranges || ranges.length === 0) {
            return 0;
        }

        for (let i = 0; i < ranges.length; i++) {
            if (ranges[i].includes(value)) {
                return i;
            }
        }

        const length = Math.max(ranges.length - 1, 0);
        return value > ranges[length][1] ? length : 0;
    }

    protected getDistance(x1, y1, x2, y2): number {
        return Math.abs(x1 - x2);
    }

    protected getData(): BarData {
        return this.mChart.barData;
    }
}
