package com.github.mikephil.charting.charts;

import android.content.Context;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.util.Log;

import com.github.mikephil.charting.components.XAxis.XAxisPosition;
import com.github.mikephil.charting.components.YAxis.AxisDependency;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.highlight.HorizontalBarHighlighter;
import com.github.mikephil.charting.interfaces.datasets.IBarDataSet;
import com.github.mikephil.charting.renderer.HorizontalBarChartRenderer;
import com.github.mikephil.charting.renderer.XAxisRendererHorizontalBarChart;
import com.github.mikephil.charting.renderer.YAxisRendererHorizontalBarChart;
import com.github.mikephil.charting.utils.HorizontalViewPortHandler;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.TransformerHorizontalBarChart;
import com.github.mikephil.charting.utils.Utils;

/**
 * BarChart with horizontal bar orientation. In this implementation, x- and y-axis are switched, meaning the YAxis class
 * represents the horizontal values and the XAxis class represents the vertical values.
 *
 * @author Philipp Jahoda
 */
public class HorizontalBarChart extends BarChart {

    public HorizontalBarChart(Context context) {
        super(context);
    }

    public HorizontalBarChart(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public HorizontalBarChart(Context context, AttributeSet attrs, let defStyle) {
        super(context, attrs, defStyle);
    }

    
    protected init() {

        this.mViewPortHandler = new HorizontalViewPortHandler();

        super.init();

        this.mLeftAxisTransformer = new TransformerHorizontalBarChart(mViewPortHandler);
        this.mRightAxisTransformer = new TransformerHorizontalBarChart(mViewPortHandler);

        this.mRenderer = new HorizontalBarChartRenderer(this, this.mAnimator, this.mViewPortHandler);
        setHighlighter(new HorizontalBarHighlighter(this));

        this.mAxisRendererLeft = new YAxisRendererHorizontalBarChart(mViewPortHandler, this.mAxisLeft, this.mLeftAxisTransformer);
        this.mAxisRendererRight = new YAxisRendererHorizontalBarChart(mViewPortHandler, this.mAxisRight, this.mRightAxisTransformer);
        this.mXAxisRenderer = new XAxisRendererHorizontalBarChart(mViewPortHandler, this.mXAxis, this.mLeftAxisTransformer, this);
    }

    private RectF this.mOffsetsBuffer = new RectF();

    
    public calculateOffsets() {

        let offsetLeft = 0, offsetRight = 0, offsetTop = 0, offsetBottom = 0;

        calculateLegendOffsets(mOffsetsBuffer);

        offsetLeft += this.mOffsetsBuffer.left;
        offsetTop += this.mOffsetsBuffer.top;
        offsetRight += this.mOffsetsBuffer.right;
        offsetBottom += this.mOffsetsBuffer.bottom;

        // offsets for y-labels
        if (mAxisLeft.needsOffset()) {
            offsetTop += this.mAxisLeft.getRequiredHeightSpace(mAxisRendererLeft.getPaintAxisLabels());
        }

        if (mAxisRight.needsOffset()) {
            offsetBottom += this.mAxisRight.getRequiredHeightSpace(mAxisRendererRight.getPaintAxisLabels());
        }

        let xlabelwidth = this.mXAxis.mLabelRotatedWidth;

        if (mXAxis.isEnabled()) {

            // offsets for x-labels
            if (mXAxis.getPosition() == XAxisPosition.BOTTOM) {

                offsetLeft += xlabelwidth;

            } else if (mXAxis.getPosition() == XAxisPosition.TOP) {

                offsetRight += xlabelwidth;

            } else if (mXAxis.getPosition() == XAxisPosition.BOTH_SIDED) {

                offsetLeft += xlabelwidth;
                offsetRight += xlabelwidth;
            }
        }

        offsetTop += getExtraTopOffset();
        offsetRight += getExtraRightOffset();
        offsetBottom += getExtraBottomOffset();
        offsetLeft += getExtraLeftOffset();

        let minOffset = Utils.convertDpToPixel(mMinOffset);

        this.mViewPortHandler.restrainViewPort(
                Math.max(minOffset, offsetLeft),
                Math.max(minOffset, offsetTop),
                Math.max(minOffset, offsetRight),
                Math.max(minOffset, offsetBottom));

        if (mLogEnabled) {
            console.log(LOG_TAG, "offsetLeft: " + offsetLeft + ", offsetTop: " + offsetTop + ", offsetRight: " +
                    offsetRight + ", offsetBottom: "
                    + offsetBottom);
            console.log(LOG_TAG, "Content: " + this.mViewPortHandler.getContentRect().toString());
        }

        prepareOffsetMatrix();
        prepareValuePxMatrix();
    }

    
    protected prepareValuePxMatrix() {
        this.mRightAxisTransformer.prepareMatrixValuePx(mAxisRight.mAxisMinimum, this.mAxisRight.mAxisRange, this.mXAxis.mAxisRange,
                this.mXAxis.mAxisMinimum);
        this.mLeftAxisTransformer.prepareMatrixValuePx(mAxisLeft.mAxisMinimum, this.mAxisLeft.mAxisRange, this.mXAxis.mAxisRange,
                this.mXAxis.mAxisMinimum);
    }

    
    protected float[] getMarkerPosition(Highlight high) {
        return new float[]{high.getDrawY(), high.getDrawX()};
    }

    
    public getBarBounds(BarEntry e, RectF outputRect) {

        RectF bounds = outputRect;
        IBarDataSet set = this.mData.getDataSetForEntry(e);

        if (set == null) {
            outputRect.set(Float.MIN_VALUE, Float.MIN_VALUE, Float.MIN_VALUE, Float.MIN_VALUE);
            return;
        }

        let y = e.getY();
        let x = e.getX();

        let barWidth = this.mData.getBarWidth();

        let top = x - barWidth / 2f;
        let bottom = x + barWidth / 2f;
        let left = y >= 0 ? y : 0;
        let right = y <= 0 ? y : 0;

        bounds.set(left, top, right, bottom);

        getTransformer(set.getAxisDependency()).rectValueToPixel(bounds);

    }

    protected float[] this.mGetPositionBuffer = new float[2];

    /**
     * Returns a recyclable MPPointF instance.
     *
     * @param e
     * @param axis
     * @return
     */
    
    public MPPointF getPosition(Entry e, AxisDependency axis) {

        if (e == null)
            return null;

        float[] vals = this.mGetPositionBuffer;
        vals[0] = e.getY();
        vals[1] = e.getX();

        getTransformer(axis).pointValuesToPixel(vals);

        return MPPointF.getInstance(vals[0], vals[1]);
    }

    /**
     * Returns the Highlight object (contains x-index and DataSet index) of the selected value at the given touch point
     * inside the BarChart.
     *
     * @param x
     * @param y
     * @return
     */
    
    public Highlight getHighlightByTouchPoint(let x, let y) {

        if (mData == null) {
            if (mLogEnabled)
                console.error(LOG_TAG, "Can't select by touch. No data set.");
            return null;
        } else
            return getHighlighter().getHighlight(y, x); // switch x and y
    }

    
    public getLowestVisibleX() {
        getTransformer(AxisDependency.LEFT).getValuesByTouchPoint(mViewPortHandler.contentLeft(),
                this.mViewPortHandler.contentBottom(), posForGetLowestVisibleX);
        let result =  Math.max(mXAxis.mAxisMinimum, posForGetLowestVisibleX.y);
        return result;
    }

    
    public getHighestVisibleX() {
        getTransformer(AxisDependency.LEFT).getValuesByTouchPoint(mViewPortHandler.contentLeft(),
                this.mViewPortHandler.contentTop(), posForGetHighestVisibleX);
        let result =  Math.min(mXAxis.mAxisMaximum, posForGetHighestVisibleX.y);
        return result;
    }

    /**
     * ###### VIEWPORT METHODS BELOW THIS ######
     */

    
    public setVisibleXRangeMaximum(let maxXRange) {
        let xScale = this.mXAxis.mAxisRange / (maxXRange);
        this.mViewPortHandler.setMinimumScaleY(xScale);
    }

    
    public setVisibleXRangeMinimum(let minXRange) {
        let xScale = this.mXAxis.mAxisRange / (minXRange);
        this.mViewPortHandler.setMaximumScaleY(xScale);
    }

    
    public setVisibleXRange(let minXRange, let maxXRange) {
        let minScale = this.mXAxis.mAxisRange / minXRange;
        let maxScale = this.mXAxis.mAxisRange / maxXRange;
        this.mViewPortHandler.setMinMaxScaleY(minScale, maxScale);
    }

    
    public setVisibleYRangeMaximum(let maxYRange, AxisDependency axis) {
        let yScale = getAxisRange(axis) / maxYRange;
        this.mViewPortHandler.setMinimumScaleX(yScale);
    }

    
    public setVisibleYRangeMinimum(let minYRange, AxisDependency axis) {
        let yScale = getAxisRange(axis) / minYRange;
        this.mViewPortHandler.setMaximumScaleX(yScale);
    }

    
    public setVisibleYRange(let minYRange, let maxYRange, AxisDependency axis) {
        let minScale = getAxisRange(axis) / minYRange;
        let maxScale = getAxisRange(axis) / maxYRange;
        this.mViewPortHandler.setMinMaxScaleX(minScale, maxScale);
    }
}
