import { BarLineChartBase } from './BarLineChartBase';
import { AxisDependency } from '../components/YAxis';
import { BarData } from '../data/BarData';
import { BarEntry } from '../data/BarEntry';
import { BarDataProvider } from '../interfaces/dataprovider/BarDataProvider';
import { Entry } from '../data/Entry';
import { BarDataSet } from '../data/BarDataSet';
import { BarHighlighter } from '../highlight/BarHighlighter';
import { Highlight } from '../highlight/Highlight';
import { BarChartRenderer } from '../renderer/BarChartRenderer';
import { Canvas, Paint, RectF } from '@nativescript-community/ui-canvas';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';
import { BaseCustomRenderer } from '../renderer/DataRenderer';

const LOG_TAG = 'BarChart';

export interface CustomRenderer extends BaseCustomRenderer {
    drawBar?: (c: Canvas, e: BarEntry, dataSet: IBarDataSet, left: number, top: number, right: number, bottom: number, paint: Paint) => void;
    drawHighlight?: (c: Canvas, e: Highlight, left: number, top: number, right: number, bottom: number, paint: Paint) => void;
}

export class BarChart extends BarLineChartBase<Entry, BarDataSet, BarData> implements BarDataProvider {
    protected mRenderer: BarChartRenderer;
    /**
     * Set this to true to make the highlight operation full-bar oriented, false to make it highlight single values (relevant
     * only for stacked). If enabled, highlighting operations will highlight the whole bar, even if only a single stack entry
     * was tapped.
     * Default: false
     *
     * @param enabled
     */
    highlightFullBarEnabled = false;

    /**
     * Adds half of the bar width to each side of the x-axis range in order to allow the bars of the barchart to be
     * fully displayed.
     * Default: false
     */
    fitBars: boolean;

    /**
     * if set to true, all values are drawn above their bars, instead of below their top
     */
    drawValueAboveBarEnabled = true;

    /**
     * if set to true, a grey area is drawn behind each bar that indicates the maximum value
     */
    drawBarShadowEnabled: boolean;

    customRenderer: CustomRenderer;

    protected init() {
        super.init();

        this.renderer = new BarChartRenderer(this, this.animator, this.viewPortHandler);

        this.highlighter = new BarHighlighter(this);

        this.xAxis.spaceMin = 0.5;
        this.xAxis.spaceMax = 0.5;
    }

    protected calcMinMax() {
        if (this.fitBars) {
            this.xAxis.calculate(this.mData.xMin - this.mData.barWidth / 2, this.mData.xMax + this.mData.barWidth / 2);
        } else {
            this.xAxis.calculate(this.mData.xMin, this.mData.xMax);
        }

        // calculate axis range (min / max) according to provided data
        if (this.mAxisLeft.enabled) {
            this.mAxisLeft.calculate(this.mData.getYMin(AxisDependency.LEFT), this.mData.getYMax(AxisDependency.LEFT));
        }
        if (this.mAxisRight?.enabled) {
            this.mAxisRight.calculate(this.mData.getYMin(AxisDependency.RIGHT), this.mData.getYMax(AxisDependency.RIGHT));
        }
    }

    /**
     * Returns the Highlight object (contains x-index and DataSet index) of the selected value at the given touch
     * point
     * inside the BarChart.
     *
     * @param x
     * @param y
     * @return
     */
    public getHighlightsByTouchPoint(x: number, y: number) {
        if (!this.mData) {
            console.error(LOG_TAG, "Can't select by touch. No data set.");
            return null;
        }
        return this.highlighter.getHighlight(x, y);
    }
    /**
     * Returns the Highlight object (contains x-index and DataSet index) of the selected value at the given touch
     * point
     * inside the BarChart.
     *
     * @param x
     * @param y
     * @return
     */
    public getHighlightByTouchPoint(x: number, y: number): Highlight {
        // if (h === null || !this.highlightFullBarEnabled) {
        return this.getHighlightsByTouchPoint(x, y)?.[0];
        // }
        // For isHighlightFullBarEnabled, remove stackIndex
        // return {
        //     x: h.x,
        //     y: h.y,
        //     xPx: h.xPx,
        //     yPx: h.yPx,
        //     dataSetIndex: h.dataSetIndex,
        //     axis: h.axis
        // };
    }

    /**
     * Returns the bounding box of the specified Entry in the specified DataSet. Returns null if the Entry could not be
     * found in the charts data.
     *
     * @param e
     * @return
     */
    public getBarBounds(e: BarEntry): RectF {
        // WARNING: wont work if index is used as xKey(xKey not set)
        const { set, index } = this.mData.getDataSetAndIndexForEntry(e);
        if (!set) {
            return new RectF(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
        }

        const xKey = set.xProperty;
        const yKey = set.yProperty;

        const x = set.getEntryXValue(e, index);
        const y = e[yKey];

        const barWidth = this.mData.barWidth;

        const left = x - barWidth / 2;
        const right = x + barWidth / 2;
        const top = y >= 0 ? y : 0;
        const bottom = y <= 0 ? y : 0;

        const outputRect = new RectF(left, top, right, bottom);
        this.getTransformer(set.axisDependency).rectValueToPixel(outputRect);
        return outputRect;
    }

    /**
     * Highlights the value at the given x-value in the given DataSet. Provide
     * -1 as the dataSetIndex to undo all highlighting.
     *
     * @param x
     * @param dataSetIndex
     * @param stackIndex   the index inside the stack - only relevant for stacked entries
     * @param callListener
     */
    public highlightValue(x: number, dataSetIndex: number, stackIndex: number, callListener = false) {
        this.highlight({ x, y: 0, dataSetIndex, stackIndex }, callListener);
    }

    public get barData(): BarData {
        return this.mData;
    }

    /**
     * Groups all BarDataSet objects this data object holds together by modifying the x-value of their entries.
     * Previously set x-values of entries will be overwritten. Leaves space between bars and groups as specified
     * by the parameters.
     * Calls notifyDataSetChanged() afterwards.
     *
     * @param fromX      the starting polet on the x-axis where the grouping should begin
     * @param groupSpace the space between groups of bars in values (not pixels) e.g. 0.8f for bar width 1
     * @param barSpace   the space between individual bars in values (not pixels) e.g. 0.1 for bar width 1
     * @param centered   whether to group bar around x values or between (default is false)
     * @param groupCondensed   whether to condensed grouped bar (no space for "0" bars)
     */
    public groupBars(fromX, groupSpace, barSpace, centered?, groupCondensed?) {
        this.barData.groupBars(fromX, groupSpace, barSpace, centered, groupCondensed);
        this.notifyDataSetChanged();
    }
}
