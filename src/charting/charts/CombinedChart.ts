import { Canvas } from '@nativescript-community/ui-canvas';
import { BarLineScatterCandleBubbleDataSet } from '../data/BarLineScatterCandleBubbleDataSet';
import { CombinedData } from '../data/CombinedData';
import { Entry } from '../data/Entry';
import { CombinedHighlighter } from '../highlight/CombinedHighlighter';
import { CombinedDataProvider } from '../interfaces/dataprovider/CombinedDataProvider';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { BarLineChartBase } from './BarLineChartBase';
import { CombinedChartRenderer } from '../renderer/CombinedChartRenderer';

/**
 * enum that allows to specify the order in which the different data objects
 * for the combined-chart are drawn
 */
export enum DrawOrder {
    BAR,
    BUBBLE,
    LINE,
    CANDLE,
    SCATTER,
}
/**
 * This chart class allows the combination of lines, bars, scatter and candle
 * data all displayed in one chart area.
 *
 * @author Philipp Jahoda
 */
export class CombinedChart extends BarLineChartBase<Entry, BarLineScatterCandleBubbleDataSet<Entry>, CombinedData> implements CombinedDataProvider {
    /**
     * if set to true, all values are drawn above their bars, instead of below
     * their top
     */
    mDrawValueAboveBar = true;

    /**
     * flag that indicates whether the highlight should be full-bar oriented, or single-value?
     */
    mHighlightFullBarEnabled = false;

    /**
     * if set to true, a grey area is drawn behind each bar that indicates the
     * maximum value
     */
    mDrawBarShadow = false;

    mDrawOrder: DrawOrder[];

    protected init() {
        super.init();

        // Default values are not ready here yet
        this.mDrawOrder = [DrawOrder.BAR, DrawOrder.BUBBLE, DrawOrder.LINE, DrawOrder.CANDLE, DrawOrder.SCATTER];

        this.setHighlighter(new CombinedHighlighter(this, this));

        // Old default behaviour
        this.setHighlightFullBarEnabled(true);

        this.mRenderer = new CombinedChartRenderer(this, this.mAnimator, this.mViewPortHandler);
    }

    public getCombinedData() {
        return this.mData;
    }

    public setData(data: CombinedData) {
        super.setData(data);
        this.setHighlighter(new CombinedHighlighter(this, this));
        (this.mRenderer as CombinedChartRenderer).createRenderers();
        this.mRenderer.initBuffers();
    }

    /**
     * Returns the Highlight object (contains x-index and DataSet index) of the selected value at the given touch
     * point
     * inside the CombinedChart.
     *
     * @param x
     * @param y
     * @return
     */

    public getHighlightByTouchPoint(x, y) {
        if (this.mData == null) {
            console.error("Can't select by touch. No data set.");
            return null;
        } else {
            const h = this.getHighlighter().getHighlight(x, y);
            if (h == null || !this.isHighlightFullBarEnabled()) return h;

            // For isHighlightFullBarEnabled, remove stackIndex
            return Object.assign({}, h, {});
        }
    }

    public getLineData() {
        if (this.mData == null) return null;
        return this.mData.getLineData();
    }

    public getBarData() {
        if (this.mData == null) return null;
        return this.mData.getBarData();
    }

    public getScatterData() {
        if (this.mData == null) return null;
        return this.mData.getScatterData();
    }

    public getCandleData() {
        if (this.mData == null) return null;
        return this.mData.getCandleData();
    }

    public getBubbleData() {
        if (this.mData == null) return null;
        return this.mData.getBubbleData();
    }

    public isDrawBarShadowEnabled() {
        return this.mDrawBarShadow;
    }

    public isDrawValueAboveBarEnabled() {
        return this.mDrawValueAboveBar;
    }

    /**
     * If set to true, all values are drawn above their bars, instead of below
     * their top.
     *
     * @param enabled
     */
    public setDrawValueAboveBar(enabled) {
        this.mDrawValueAboveBar = enabled;
    }

    /**
     * If set to true, a grey area is drawn behind each bar that indicates the
     * maximum value. Enabling his will reduce performance by about 50%.
     *
     * @param enabled
     */
    public setDrawBarShadow(enabled) {
        this.mDrawBarShadow = enabled;
    }

    /**
     * Set this to true to make the highlight operation full-bar oriented,
     * false to make it highlight single values (relevant only for stacked).
     *
     * @param enabled
     */
    public setHighlightFullBarEnabled(enabled) {
        this.mHighlightFullBarEnabled = enabled;
    }

    /**
     * @return true the highlight operation is be full-bar oriented, false if single-value
     */

    public isHighlightFullBarEnabled() {
        return this.mHighlightFullBarEnabled;
    }

    /**
     * Returns the currently set draw order.
     *
     * @return
     */
    public getDrawOrder() {
        return this.mDrawOrder;
    }

    /**
     * Sets the order in which the provided data objects should be drawn. The
     * earlier you place them in the provided array, the further they will be in
     * the background. e.g. if you provide new DrawOrer[] { DrawOrder.BAR,
     * DrawOrder.LINE }, the bars will be drawn behind the lines.
     *
     * @param order
     */
    public setDrawOrder(order: DrawOrder[]) {
        if (order == null || order.length <= 0) return;
        this.mDrawOrder = order;
    }

    /**
     * draws all MarkerViews on the highlighted positions
     */
    protected drawMarkers(c: Canvas) {
        // if there is no marker view or drawing marker is disabled
        if (this.mMarker == null || !this.isDrawMarkersEnabled() || !this.valuesToHighlight()) return;

        for (let i = 0; i < this.mIndicesToHighlight.length; i++) {
            const highlight = this.mIndicesToHighlight[i];

            const set: IDataSet<Entry> = this.mData.getDataSetByHighlight(highlight);

            const e = this.mData.getEntryForHighlight(highlight);
            if (e == null) continue;

            const entryIndex = set.getEntryIndex(e);

            // make sure entry not null
            if (entryIndex > set.getEntryCount() * this.mAnimator.getPhaseX()) continue;

            const pos = this.getMarkerPosition(highlight);

            // check bounds
            if (!this.mViewPortHandler.isInBounds(pos[0], pos[1])) continue;

            // callbacks to update the content
            this.mMarker.refreshContent(e, highlight);

            // draw the marker
            this.mMarker.draw(c, pos[0], pos[1]);
        }
    }
}
