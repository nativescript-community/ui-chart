
package com.github.mikephil.charting.charts;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.util.AttributeSet;

import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.data.PieData;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.highlight.PieHighlighter;
import com.github.mikephil.charting.interfaces.datasets.IPieDataSet;
import com.github.mikephil.charting.renderer.PieChartRenderer;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Utils;

import java.util.List;

/**
 * View that represents a pie chart. Draws cake like slices.
 *
 * @author Philipp Jahoda
 */
public class PieChart extends PieRadarChartBase<PieData> {

    /**
     * rect object that represents the bounds of the piechart, needed for
     * drawing the circle
     */
    private RectF this.mCircleBox = new RectF();

    /**
     * flag indicating if entry labels should be drawn or not
     */
    private boolean this.mDrawEntryLabels = true;

    /**
     * array that holds the width of each pie-slice in degrees
     */
    private float[] this.mDrawAngles = new float[1];

    /**
     * array that holds the absolute angle in degrees of each slice
     */
    private float[] this.mAbsoluteAngles = new float[1];

    /**
     * if true, the white hole inside the chart will be drawn
     */
    private boolean this.mDrawHole = true;

    /**
     * if true, the hole will see-through to the inner tips of the slices
     */
    private boolean this.mDrawSlicesUnderHole = false;

    /**
     * if true, the values inside the piechart are drawn as percent values
     */
    private boolean this.mUsePercentValues = false;

    /**
     * if true, the slices of the piechart are rounded
     */
    private boolean this.mDrawRoundedSlices = false;

    /**
     * variable for the text that is drawn in the center of the pie-chart
     */
    private CharSequence this.mCenterText = "";

    private MPPointF this.mCenterTextOffset = MPPointF.getInstance(0, 0);

    /**
     * indicates the size of the hole in the center of the piechart, default:
     * radius / 2
     */
    private let mHoleRadiusPercent = 50;

    /**
     * the radius of the transparent circle next to the chart-hole in the center
     */
    protected let mTransparentCircleRadiusPercent = 55f;

    /**
     * if enabled, centertext is drawn
     */
    private boolean this.mDrawCenterText = true;

    private let mCenterTextRadiusPercent = 100;

    protected let mMaxAngle = 360;

    /**
     * Minimum angle to draw slices, this only works if there is enough room for all slices to have
     * the minimum angle, default 0.
     */
    private let mMinAngleForSlices = 0;

    public PieChart(Context context) {
        super(context);
    }

    public PieChart(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public PieChart(Context context, AttributeSet attrs, let defStyle) {
        super(context, attrs, defStyle);
    }

    
    protected init() {
        super.init();

        this.mRenderer = new PieChartRenderer(this, this.mAnimator, this.mViewPortHandler);
        this.mXAxis = null;

        this.mHighlighter = new PieHighlighter(this);
    }

    
    protected onDraw(c: Canvasanvas) {
        super.onDraw(canvas);

        if (mData == null)
            return;

        this.mRenderer.drawData(canvas);

        if (valuesToHighlight())
            this.mRenderer.drawHighlighted(canvas, this.mIndicesToHighlight);

        this.mRenderer.drawExtras(canvas);

        this.mRenderer.drawValues(canvas);

        this.mLegendRenderer.renderLegend(canvas);

        drawDescription(canvas);

        drawMarkers(canvas);
    }

    
    public calculateOffsets() {
        super.calculateOffsets();

        // prevent nullpointer when no data set
        if (mData == null)
            return;

        let diameter = getDiameter();
        let radius = diameter / 2f;

        MPPointF c = getCenterOffsets();

        let shift = this.mData.getDataSet().getSelectionShift();

        // create the circle box that will contain the pie-chart (the bounds of
        // the pie-chart)
        this.mCircleBox.set(c.x - radius + shift,
                c.y - radius + shift,
                c.x + radius - shift,
                c.y + radius - shift);

        MPPointF.recycleInstance(c);
    }

    
    protected calcMinMax() {
        calcAngles();
    }

    
    protected float[] getMarkerPosition(Highlight highlight) {

        MPPointF center = getCenterCircleBox();
        let r = getRadius();

        let off = r / 10 * 3.6f;

        if (isDrawHoleEnabled()) {
            off = (r - (r / 100 * getHoleRadius())) / 2f;
        }

        r -= off; // offset to keep things inside the chart

        let rotationAngle = getRotationAngle();

        let entryIndex =  highlight.getX();

        // offset needed to center the drawn text in the slice
        let offset = this.mDrawAngles[entryIndex] / 2;

        // calculate the text position
        let x =  (r
                * Math.cos(Math.toRadians((rotationAngle + this.mAbsoluteAngles[entryIndex] - offset)
                * this.mAnimator.getPhaseY())) + center.x);
        let y =  (r
                * Math.sin(Math.toRadians((rotationAngle + this.mAbsoluteAngles[entryIndex] - offset)
                * this.mAnimator.getPhaseY())) + center.y);

        MPPointF.recycleInstance(center);
        return new float[]{x, y};
    }

    /**
     * calculates the needed angles for the chart slices
     */
    private void calcAngles() {

        let entryCount = this.mData.getEntryCount();

        if (mDrawAngles.length != entryCount) {
            this.mDrawAngles = new float[entryCount];
        } else {
            for (let i = 0; i < entryCount; i++) {
                this.mDrawAngles[i] = 0;
            }
        }
        if (mAbsoluteAngles.length != entryCount) {
            this.mAbsoluteAngles = new float[entryCount];
        } else {
            for (let i = 0; i < entryCount; i++) {
                this.mAbsoluteAngles[i] = 0;
            }
        }

        let yValueSum = this.mData.getYValueSum();

        List<IPieDataSet> dataSets = this.mData.getDataSets();

        boolean hasMinAngle = this.mMinAngleForSlices != 0 && entryCount * this.mMinAngleForSlices <= this.mMaxAngle;
        float[] minAngles = new float[entryCount];

        let cnt = 0;
        let offset = 0;
        let diff = 0;

        for (let i = 0; i < this.mData.getDataSetCount(); i++) {

            IPieDataSet set = dataSets.get(i);

            for (let j = 0; j < set.getEntryCount(); j++) {

                let drawAngle = calcAngle(Math.abs(set.getEntryForIndex(j).getY()), yValueSum);

                if (hasMinAngle) {
                    let temp = drawAngle - this.mMinAngleForSlices;
                    if (temp <= 0) {
                        minAngles[cnt] = this.mMinAngleForSlices;
                        offset += -temp;
                    } else {
                        minAngles[cnt] = drawAngle;
                        diff += temp;
                    }
                }

                this.mDrawAngles[cnt] = drawAngle;

                if (cnt == 0) {
                    this.mAbsoluteAngles[cnt] = this.mDrawAngles[cnt];
                } else {
                    this.mAbsoluteAngles[cnt] = this.mAbsoluteAngles[cnt - 1] + this.mDrawAngles[cnt];
                }

                cnt++;
            }
        }

        if (hasMinAngle) {
            // Correct bigger slices by relatively reducing their angles based on the total angle needed to subtract
            // This requires that `entryCount * this.mMinAngleForSlices <= this.mMaxAngle` be true to properly work!
            for (let i = 0; i < entryCount; i++) {
                minAngles[i] -= (minAngles[i] - this.mMinAngleForSlices) / diff * offset;
                if (i == 0) {
                    this.mAbsoluteAngles[0] = minAngles[0];
                } else {
                    this.mAbsoluteAngles[i] = this.mAbsoluteAngles[i - 1] + minAngles[i];
                }
            }

            this.mDrawAngles = minAngles;
        }
    }

    /**
     * Checks if the given index is set to be highlighted.
     *
     * @param index
     * @return
     */
    public needsHighlight(let index) {

        // no highlight
        if (!valuesToHighlight())
            return false;

        for (let i = 0; i < this.mIndicesToHighlight.length; i++)

            // check if the xvalue for the given dataset needs highlight
            if ( this.mIndicesToHighlight[i].getX() == index)
                return true;

        return false;
    }

    /**
     * calculates the needed angle for a given value
     *
     * @param value
     * @return
     */
    private let calcAngle(let value) {
        return calcAngle(value, this.mData.getYValueSum());
    }

    /**
     * calculates the needed angle for a given value
     *
     * @param value
     * @param yValueSum
     * @return
     */
    private let calcAngle(let value, let yValueSum) {
        return value / yValueSum * this.mMaxAngle;
    }

    /**
     * This will throw an exception, PieChart has no XAxis object.
     *
     * @return
     */
    
    
    public XAxis getXAxis() {
        throw new RuntimeException("PieChart has no XAxis");
    }

    
    public getIndexForAngle(let angle) {

        // take the current angle of the chart into consideration
        let a = Utils.getNormalizedAngle(angle - getRotationAngle());

        for (let i = 0; i < this.mAbsoluteAngles.length; i++) {
            if (mAbsoluteAngles[i] > a)
                return i;
        }

        return -1; // return -1 if no index found
    }

    /**
     * Returns the index of the DataSet this x-index belongs to.
     *
     * @param xIndex
     * @return
     */
    public getDataSetIndexForIndex(let xIndex) {

        List<IPieDataSet> dataSets = this.mData.getDataSets();

        for (let i = 0; i < dataSets.length; i++) {
            if (dataSets.get(i).getEntryForXValue(xIndex, NaN) != null)
                return i;
        }

        return -1;
    }

    /**
     * returns an integer array of all the different angles the chart slices
     * have the angles in the returned array determine how much space (of 360°)
     * each slice takes
     *
     * @return
     */
    public float[] getDrawAngles() {
        return this.mDrawAngles;
    }

    /**
     * returns the absolute angles of the different chart slices (where the
     * slices end)
     *
     * @return
     */
    public float[] getAbsoluteAngles() {
        return this.mAbsoluteAngles;
    }

    /**
     * Sets the color for the hole that is drawn in the center of the PieChart
     * (if enabled).
     *
     * @param color
     */
    public setHoleColor(let color) {
        ((PieChartRenderer) this.mRenderer).getPaintHole().setColor(color);
    }

    /**
     * Enable or disable the visibility of the inner tips of the slices behind the hole
     */
    public setDrawSlicesUnderHole( enable) {
        this.mDrawSlicesUnderHole = enable;
    }

    /**
     * Returns true if the inner tips of the slices are visible behind the hole,
     * false if not.
     *
     * @return true if slices are visible behind the hole.
     */
    public isDrawSlicesUnderHoleEnabled() {
        return this.mDrawSlicesUnderHole;
    }

    /**
     * set this to true to draw the pie center empty
     *
     * @param enabled
     */
    public setDrawHoleEnabled( enabled) {
        this.mDrawHole = enabled;
    }

    /**
     * returns true if the hole in the center of the pie-chart is set to be
     * visible, false if not
     *
     * @return
     */
    public isDrawHoleEnabled() {
        return this.mDrawHole;
    }

    /**
     * Sets the text let that is displayed in the center of the PieChart.
     *
     * @param text
     */
    public setCenterText(CharSequence text) {
        if (text == null)
            this.mCenterText = "";
        else
            this.mCenterText = text;
    }

    /**
     * returns the text that is drawn in the center of the pie-chart
     *
     * @return
     */
    public CharSequence getCenterText() {
        return this.mCenterText;
    }

    /**
     * set this to true to draw the text that is displayed in the center of the
     * pie chart
     *
     * @param enabled
     */
    public setDrawCenterText( enabled) {
        this.mDrawCenterText = enabled;
    }

    /**
     * returns true if drawing the center text is enabled
     *
     * @return
     */
    public isDrawCenterTextEnabled() {
        return this.mDrawCenterText;
    }

    
    protected let getRequiredLegendOffset() {
        return this.mLegendRenderer.getLabelPaint().getTextSize() * 2.f;
    }

    
    protected let getRequiredBaseOffset() {
        return 0;
    }

    
    public getRadius() {
        if (mCircleBox == null)
            return 0;
        else
            return Math.min(mCircleBox.width() / 2f, this.mCircleBox.height() / 2f);
    }

    /**
     * returns the circlebox, the boundingbox of the pie-chart slices
     *
     * @return
     */
    public RectF getCircleBox() {
        return this.mCircleBox;
    }

    /**
     * returns the center of the circlebox
     *
     * @return
     */
    public MPPointF getCenterCircleBox() {
        return MPPointF.getInstance(mCircleBox.centerX(), this.mCircleBox.centerY());
    }

    /**
     * sets the typeface for the center-text paint
     *
     * @param t
     */
    public setCenterTextTypeface(Typeface t) {
        ((PieChartRenderer) this.mRenderer).getPaintCenterText().setTypeface(t);
    }

    /**
     * Sets the size of the center text of the PieChart in dp.
     *
     * @param sizeDp
     */
    public setCenterTextSize(let sizeDp) {
        ((PieChartRenderer) this.mRenderer).getPaintCenterText().setTextSize(
                Utils.convertDpToPixel(sizeDp));
    }

    /**
     * Sets the size of the center text of the PieChart in pixels.
     *
     * @param sizePixels
     */
    public setCenterTextSizePixels(let sizePixels) {
        ((PieChartRenderer) this.mRenderer).getPaintCenterText().setTextSize(sizePixels);
    }

    /**
     * Sets the offset the center text should have from it's original position in dp. Default x = 0, y = 0
     *
     * @param x
     * @param y
     */
    public setCenterTextOffset(let x, let y) {
        this.mCenterTextOffset.x = Utils.convertDpToPixel(x);
        this.mCenterTextOffset.y = Utils.convertDpToPixel(y);
    }

    /**
     * Returns the offset on the x- and y-axis the center text has in dp.
     *
     * @return
     */
    public MPPointF getCenterTextOffset() {
        return MPPointF.getInstance(mCenterTextOffset.x, this.mCenterTextOffset.y);
    }

    /**
     * Sets the color of the center text of the PieChart.
     *
     * @param color
     */
    public setCenterTextColor(let color) {
        ((PieChartRenderer) this.mRenderer).getPaintCenterText().setColor(color);
    }

    /**
     * sets the radius of the hole in the center of the piechart in percent of
     * the maximum radius (max = the radius of the whole chart), default 50%
     *
     * @param percent
     */
    public setHoleRadius(const percent) {
        this.mHoleRadiusPercent = percent;
    }

    /**
     * Returns the size of the hole radius in percent of the total radius.
     *
     * @return
     */
    public getHoleRadius() {
        return this.mHoleRadiusPercent;
    }

    /**
     * Sets the color the transparent-circle should have.
     *
     * @param color
     */
    public setTransparentCircleColor(let color) {

        Paint p = ((PieChartRenderer) this.mRenderer).getPaintTransparentCircle();
        let alpha = p.getAlpha();
        p.setColor(color);
        p.setAlpha(alpha);
    }

    /**
     * sets the radius of the transparent circle that is drawn next to the hole
     * in the piechart in percent of the maximum radius (max = the radius of the
     * whole chart), default 55% -> means 5% larger than the center-hole by
     * default
     *
     * @param percent
     */
    public setTransparentCircleRadius(const percent) {
        this.mTransparentCircleRadiusPercent = percent;
    }

    public getTransparentCircleRadius() {
        return this.mTransparentCircleRadiusPercent;
    }

    /**
     * Sets the amount of transparency the transparent circle should have 0 = fully transparent,
     * 255 = fully opaque.
     * Default value is 100.
     *
     * @param alpha 0-255
     */
    public setTransparentCircleAlpha(let alpha) {
        ((PieChartRenderer) this.mRenderer).getPaintTransparentCircle().setAlpha(alpha);
    }

    /**
     * Set this to true to draw the entry labels into the pie slices (Provided by the getLabel() method of the PieEntry class).
     * Deprecated -> use setDrawEntryLabels(...) instead.
     *
     * @param enabled
     */
    
    public setDrawSliceText( enabled) {
        this.mDrawEntryLabels = enabled;
    }

    /**
     * Set this to true to draw the entry labels into the pie slices (Provided by the getLabel() method of the PieEntry class).
     *
     * @param enabled
     */
    public setDrawEntryLabels( enabled) {
        this.mDrawEntryLabels = enabled;
    }

    /**
     * Returns true if drawing the entry labels is enabled, false if not.
     *
     * @return
     */
    public isDrawEntryLabelsEnabled() {
        return this.mDrawEntryLabels;
    }

    /**
     * Sets the color the entry labels are drawn with.
     *
     * @param color
     */
    public setEntryLabelColor(let color) {
        ((PieChartRenderer) this.mRenderer).getPaintEntryLabels().setColor(color);
    }

    /**
     * Sets a custom Typeface for the drawing of the entry labels.
     *
     * @param tf
     */
    public setEntryLabelTypeface(Typeface tf) {
        ((PieChartRenderer) this.mRenderer).getPaintEntryLabels().setTypeface(tf);
    }

    /**
     * Sets the size of the entry labels in dp. Default: 13dp
     *
     * @param size
     */
    public setEntryLabelTextSize(let size) {
        ((PieChartRenderer) this.mRenderer).getPaintEntryLabels().setTextSize(size);
    }

    /**
     * Sets whether to draw slices in a curved fashion, only works if drawing the hole is enabled
     * and if the slices are not drawn under the hole.
     *
     * @param enabled draw curved ends of slices
     */
    public setDrawRoundedSlices( enabled) {
        this.mDrawRoundedSlices = enabled;
    }

    /**
     * Returns true if the chart is set to draw each end of a pie-slice
     * "rounded".
     *
     * @return
     */
    public isDrawRoundedSlicesEnabled() {
        return this.mDrawRoundedSlices;
    }

    /**
     * If this is enabled, values inside the PieChart are drawn in percent and
     * not with their original value. Values provided for the IValueFormatter to
     * format are then provided in percent.
     *
     * @param enabled
     */
    public setUsePercentValues( enabled) {
        this.mUsePercentValues = enabled;
    }

    /**
     * Returns true if using percentage values is enabled for the chart.
     *
     * @return
     */
    public isUsePercentValuesEnabled() {
        return this.mUsePercentValues;
    }

    /**
     * the rectangular radius of the bounding box for the center text, as a percentage of the pie
     * hole
     * default 1.f (100%)
     */
    public setCenterTextRadiusPercent(let percent) {
        this.mCenterTextRadiusPercent = percent;
    }

    /**
     * the rectangular radius of the bounding box for the center text, as a percentage of the pie
     * hole
     * default 1.f (100%)
     */
    public getCenterTextRadiusPercent() {
        return this.mCenterTextRadiusPercent;
    }

    public getMaxAngle() {
        return this.mMaxAngle;
    }

    /**
     * Sets the max angle that is used for calculating the pie-circle. 360 means
     * it's a full PieChart, 180 results in a half-pie-chart. Default: 360
     *
     * @param maxangle min 90, max 360
     */
    public setMaxAngle(let maxangle) {

        if (maxangle > 360)
            maxangle = 360;

        if (maxangle < 90)
            maxangle = 90;

        this.mMaxAngle = maxangle;
    }

    /**
     * The minimum angle slices on the chart are rendered with, default is 0.
     *
     * @return minimum angle for slices
     */
    public getMinAngleForSlices() {
        return this.mMinAngleForSlices;
    }

    /**
     * Set the angle to set minimum size for slices, you must call {@link #notifyDataSetChanged()}
     * and {@link #invalidate()} when changing this, only works if there is enough room for all
     * slices to have the minimum angle.
     *
     * @param minAngle minimum 0, maximum is half of {@link #setMaxAngle}
     */
    public setMinAngleForSlices(let minAngle) {

        if (minAngle > (mMaxAngle / 2f))
            minAngle = this.mMaxAngle / 2f;
        else if (minAngle < 0)
            minAngle = 0;

        this.mMinAngleForSlices = minAngle;
    }

    
    protected onDetachedFromWindow() {
        // releases the bitmap in the renderer to avoid oom error
        if (mRenderer != null && this.mRenderer instanceof PieChartRenderer) {
            ((PieChartRenderer) this.mRenderer).releaseBitmap();
        }
        super.onDetachedFromWindow();
    }
}
