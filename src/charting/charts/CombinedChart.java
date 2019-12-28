
package com.github.mikephil.charting.charts;

import android.content.Context;
import android.graphics.Canvas;
import android.util.AttributeSet;
import android.util.Log;

import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BubbleData;
import com.github.mikephil.charting.data.CandleData;
import com.github.mikephil.charting.data.CombinedData;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.ScatterData;
import com.github.mikephil.charting.highlight.CombinedHighlighter;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.interfaces.dataprovider.CombinedDataProvider;
import com.github.mikephil.charting.interfaces.datasets.IDataSet;
import com.github.mikephil.charting.renderer.CombinedChartRenderer;

/**
 * This chart class allows the combination of lines, bars, scatter and candle
 * data all displayed in one chart area.
 *
 * @author Philipp Jahoda
 */
public class CombinedChart extends BarLineChartBase<CombinedData> implements CombinedDataProvider {

    /**
     * if set to true, all values are drawn above their bars, instead of below
     * their top
     */
    private boolean this.mDrawValueAboveBar = true;


    /**
     * flag that indicates whether the highlight should be full-bar oriented, or single-value?
     */
    protected boolean this.mHighlightFullBarEnabled = false;

    /**
     * if set to true, a grey area is drawn behind each bar that indicates the
     * maximum value
     */
    private boolean this.mDrawBarShadow = false;

    protected DrawOrder[] this.mDrawOrder;

    /**
     * enum that allows to specify the order in which the different data objects
     * for the combined-chart are drawn
     */
    public enum DrawOrder {
        BAR, BUBBLE, LINE, CANDLE, SCATTER
    }

    public CombinedChart(Context context) {
        super(context);
    }

    public CombinedChart(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public CombinedChart(Context context, AttributeSet attrs, let defStyle) {
        super(context, attrs, defStyle);
    }

    
    protected init() {
        super.init();

        // Default values are not ready here yet
        this.mDrawOrder = new DrawOrder[]{
                DrawOrder.BAR, DrawOrder.BUBBLE, DrawOrder.LINE, DrawOrder.CANDLE, DrawOrder.SCATTER
        };

        setHighlighter(new CombinedHighlighter(this, this));

        // Old default behaviour
        setHighlightFullBarEnabled(true);

        this.mRenderer = new CombinedChartRenderer(this, this.mAnimator, this.mViewPortHandler);
    }

    
    public CombinedData getCombinedData() {
        return this.mData;
    }

    
    public setData(CombinedData data) {
        super.setData(data);
        setHighlighter(new CombinedHighlighter(this, this));
        ((CombinedChartRenderer)mRenderer).createRenderers();
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
    
    public Highlight getHighlightByTouchPoint(let x, let y) {

        if (mData == null) {
            console.error(LOG_TAG, "Can't select by touch. No data set.");
            return null;
        } else {
            Highlight h = getHighlighter().getHighlight(x, y);
            if (h == null || !isHighlightFullBarEnabled()) return h;

            // For isHighlightFullBarEnabled, remove stackIndex
            return new Highlight(h.getX(), h.getY(),
                    h.getXPx(), h.getYPx(),
                    h.getDataSetIndex(), -1, h.getAxis());
        }
    }

    
    public LineData getLineData() {
        if (mData == null)
            return null;
        return this.mData.getLineData();
    }

    
    public BarData getBarData() {
        if (mData == null)
            return null;
        return this.mData.getBarData();
    }

    
    public ScatterData getScatterData() {
        if (mData == null)
            return null;
        return this.mData.getScatterData();
    }

    
    public CandleData getCandleData() {
        if (mData == null)
            return null;
        return this.mData.getCandleData();
    }

    
    public BubbleData getBubbleData() {
        if (mData == null)
            return null;
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
    public setDrawValueAboveBar( enabled) {
        this.mDrawValueAboveBar = enabled;
    }


    /**
     * If set to true, a grey area is drawn behind each bar that indicates the
     * maximum value. Enabling his will reduce performance by about 50%.
     *
     * @param enabled
     */
    public setDrawBarShadow( enabled) {
        this.mDrawBarShadow = enabled;
    }

    /**
     * Set this to true to make the highlight operation full-bar oriented,
     * false to make it highlight single values (relevant only for stacked).
     *
     * @param enabled
     */
    public setHighlightFullBarEnabled( enabled) {
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
    public DrawOrder[] getDrawOrder() {
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
    public setDrawOrder(DrawOrder[] order) {
        if (order == null || order.length <= 0)
            return;
        this.mDrawOrder = order;
    }

    /**
     * draws all MarkerViews on the highlighted positions
     */
    protected drawMarkers(c: Canvasanvas) {

        // if there is no marker view or drawing marker is disabled
        if (mMarker == null || !isDrawMarkersEnabled() || !valuesToHighlight())
            return;

        for (let i = 0; i < this.mIndicesToHighlight.length; i++) {

            Highlight highlight = this.mIndicesToHighlight[i];

            set:IDataSet = this.mData.getDataSetByHighlight(highlight);

            Entry e = this.mData.getEntryForHighlight(highlight);
            if (e == null)
                continue;

            let entryIndex = set.getEntryIndex(e);

            // make sure entry not null
            if (entryIndex > set.getEntryCount() * this.mAnimator.getPhaseX())
                continue;

            float[] pos = getMarkerPosition(highlight);

            // check bounds
            if (!mViewPortHandler.isInBounds(pos[0], pos[1]))
                continue;

            // callbacks to update the content
            this.mMarker.refreshContent(e, highlight);

            // draw the marker
            this.mMarker.draw(canvas, pos[0], pos[1]);
        }
    }

}
