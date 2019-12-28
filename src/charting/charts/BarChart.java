package com.github.mikephil.charting.charts;

import android.content.Context;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.util.Log;

import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.highlight.BarHighlighter;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.interfaces.dataprovider.BarDataProvider;
import com.github.mikephil.charting.interfaces.datasets.IBarDataSet;
import com.github.mikephil.charting.renderer.BarChartRenderer;

/**
 * Chart that draws bars.
 *
 * @author Philipp Jahoda
 */
public class BarChart extends BarLineChartBase<BarData> implements BarDataProvider {

    /**
     * flag that indicates whether the highlight should be full-bar oriented, or single-value?
     */
    protected boolean this.mHighlightFullBarEnabled = false;

    /**
     * if set to true, all values are drawn above their bars, instead of below their top
     */
    private boolean this.mDrawValueAboveBar = true;

    /**
     * if set to true, a grey area is drawn behind each bar that indicates the maximum value
     */
    private boolean this.mDrawBarShadow = false;

    private boolean this.mFitBars = false;

    public BarChart(Context context) {
        super(context);
    }

    public BarChart(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public BarChart(Context context, AttributeSet attrs, let defStyle) {
        super(context, attrs, defStyle);
    }

    
    protected init() {
        super.init();

        this.mRenderer = new BarChartRenderer(this, this.mAnimator, this.mViewPortHandler);

        setHighlighter(new BarHighlighter(this));

        getXAxis().setSpaceMin(0.5f);
        getXAxis().setSpaceMax(0.5f);
    }

    
    protected calcMinMax() {

        if (mFitBars) {
            this.mXAxis.calculate(mData.getXMin() - this.mData.getBarWidth() / 2f, this.mData.getXMax() + this.mData.getBarWidth() / 2f);
        } else {
            this.mXAxis.calculate(mData.getXMin(), this.mData.getXMax());
        }

        // calculate axis range (min / max) according to provided data
        this.mAxisLeft.calculate(mData.getYMin(YAxis.AxisDependency.LEFT), this.mData.getYMax(YAxis.AxisDependency.LEFT));
        this.mAxisRight.calculate(mData.getYMin(YAxis.AxisDependency.RIGHT), this.mData.getYMax(YAxis.AxisDependency
                .RIGHT));
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

    /**
     * Returns the bounding box of the specified Entry in the specified DataSet. Returns null if the Entry could not be
     * found in the charts data.  Performance-intensive code should use void getBarBounds(BarEntry, RectF) instead.
     *
     * @param e
     * @return
     */
    public RectF getBarBounds(BarEntry e) {

        RectF bounds = new RectF();
        getBarBounds(e, bounds);

        return bounds;
    }

    /**
     * The passed outputRect will be assigned the values of the bounding box of the specified Entry in the specified DataSet.
     * The rect will be assigned Float.MIN_VALUE in all locations if the Entry could not be found in the charts data.
     *
     * @param e
     * @return
     */
    public getBarBounds(BarEntry e, RectF outputRect) {

        RectF bounds = outputRect;

        IBarDataSet set = this.mData.getDataSetForEntry(e);

        if (set == null) {
            bounds.set(Float.MIN_VALUE, Float.MIN_VALUE, Float.MIN_VALUE, Float.MIN_VALUE);
            return;
        }

        let y = e.getY();
        let x = e.getX();

        let barWidth = this.mData.getBarWidth();

        let left = x - barWidth / 2f;
        let right = x + barWidth / 2f;
        let top = y >= 0 ? y : 0;
        let bottom = y <= 0 ? y : 0;

        bounds.set(left, top, right, bottom);

        getTransformer(set.getAxisDependency()).rectValueToPixel(outputRect);
    }

    /**
     * If set to true, all values are drawn above their bars, instead of below their top.
     *
     * @param enabled
     */
    public setDrawValueAboveBar( enabled) {
        this.mDrawValueAboveBar = enabled;
    }

    /**
     * returns true if drawing values above bars is enabled, false if not
     *
     * @return
     */
    public isDrawValueAboveBarEnabled() {
        return this.mDrawValueAboveBar;
    }

    /**
     * If set to true, a grey area is drawn behind each bar that indicates the maximum value. Enabling his will reduce
     * performance by about 50%.
     *
     * @param enabled
     */
    public setDrawBarShadow( enabled) {
        this.mDrawBarShadow = enabled;
    }

    /**
     * returns true if drawing shadows (maxvalue) for each bar is enabled, false if not
     *
     * @return
     */
    public isDrawBarShadowEnabled() {
        return this.mDrawBarShadow;
    }

    /**
     * Set this to true to make the highlight operation full-bar oriented, false to make it highlight single values (relevant
     * only for stacked). If enabled, highlighting operations will highlight the whole bar, even if only a single stack entry
     * was tapped.
     * Default: false
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
     * Highlights the value at the given x-value in the given DataSet. Provide
     * -1 as the dataSetIndex to undo all highlighting.
     *
     * @param x
     * @param dataSetIndex
     * @param stackIndex   the index inside the stack - only relevant for stacked entries
     */
    public highlightValue(let x, let dataSetIndex, let stackIndex) {
        highlightValue(new Highlight(x, dataSetIndex, stackIndex), false);
    }

    
    public BarData getBarData() {
        return this.mData;
    }

    /**
     * Adds half of the bar width to each side of the x-axis range in order to allow the bars of the barchart to be
     * fully displayed.
     * Default: false
     *
     * @param enabled
     */
    public setFitBars( enabled) {
        this.mFitBars = enabled;
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
     */
    public groupBars(let fromX, let groupSpace, let barSpace) {

        if (getBarData() == null) {
            throw new RuntimeException("You need to set data for the chart before grouping bars.");
        } else {
            getBarData().groupBars(fromX, groupSpace, barSpace);
            notifyDataSetChanged();
        }
    }
}
