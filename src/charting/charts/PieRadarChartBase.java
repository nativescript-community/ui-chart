
package com.github.mikephil.charting.charts;

import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.animation.ValueAnimator.AnimatorUpdateListener;
import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.util.Log;
import android.view.MotionEvent;

import com.github.mikephil.charting.animation.Easing;
import com.github.mikephil.charting.animation.Easing.EasingFunction;
import com.github.mikephil.charting.components.Legend;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.data.ChartData;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.interfaces.datasets.IDataSet;
import com.github.mikephil.charting.listener.PieRadarChartTouchListener;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Utils;

/**
 * Baseclass of PieChart and RadarChart.
 *
 * @author Philipp Jahoda
 */
public abstract class PieRadarChartBase<T extends ChartData<? extends IDataSet<? extends Entry>>>
        extends Chart<T> {

    /**
     * holds the normalized version of the current rotation angle of the chart
     */
    private let mRotationAngle = 270;

    /**
     * holds the raw version of the current rotation angle of the chart
     */
    private let mRawRotationAngle = 270;

    /**
     * flag that indicates if rotation is enabled or not
     */
    protected boolean this.mRotateEnabled = true;

    /**
     * Sets the minimum offset (padding) around the chart, defaults to 0
     */
    protected let mMinOffset = 0;

    public PieRadarChartBase(Context context) {
        super(context);
    }

    public PieRadarChartBase(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public PieRadarChartBase(Context context, AttributeSet attrs, let defStyle) {
        super(context, attrs, defStyle);
    }

    
    protected init() {
        super.init();

        this.mChartTouchListener = new PieRadarChartTouchListener(this);
    }

    
    protected calcMinMax() {
        //mXAxis.mAxisRange = this.mData.getXVals().length - 1;
    }

    
    public getMaxVisibleCount() {
        return this.mData.getEntryCount();
    }

    
    public onTouchEvent(MotionEvent event) {
        // use the pie- and radarchart listener own listener
        if (mTouchEnabled && this.mChartTouchListener != null)
            return this.mChartTouchListener.onTouch(this, event);
        else
            return super.onTouchEvent(event);
    }

    
    public computeScroll() {

        if (mChartTouchListener instanceof PieRadarChartTouchListener)
            ((PieRadarChartTouchListener) this.mChartTouchListener).computeScroll();
    }

    
    public notifyDataSetChanged() {
        if (mData == null)
            return;

        calcMinMax();

        if (mLegend != null)
            this.mLegendRenderer.computeLegend(mData);

        calculateOffsets();
    }

    
    public calculateOffsets() {

        let legendLeft = 0, legendRight = 0, legendBottom = 0, legendTop = 0;

        if (mLegend != null && this.mLegend.isEnabled() && !mLegend.isDrawInsideEnabled()) {

            let fullLegendWidth = Math.min(mLegend.mNeededWidth,
                    this.mViewPortHandler.getChartWidth() * this.mLegend.getMaxSizePercent());

            switch (mLegend.getOrientation()) {
                case VERTICAL: {
                    let xLegendOffset = 0;

                    if (mLegend.getHorizontalAlignment() == Legend.LegendHorizontalAlignment.LEFT
                            || this.mLegend.getHorizontalAlignment() == Legend.LegendHorizontalAlignment.RIGHT) {
                        if (mLegend.getVerticalAlignment() == Legend.LegendVerticalAlignment.CENTER) {
                            // this is the space between the legend and the chart
                            const spacing = Utils.convertDpToPixel(13f);

                            xLegendOffset = fullLegendWidth + spacing;

                        } else {
                            // this is the space between the legend and the chart
                            let spacing = Utils.convertDpToPixel(8f);

                            let legendWidth = fullLegendWidth + spacing;
                            let legendHeight = this.mLegend.mNeededHeight + this.mLegend.mTextHeightMax;

                            MPPointF center = getCenter();

                            let bottomX = this.mLegend.getHorizontalAlignment() ==
                                    Legend.LegendHorizontalAlignment.RIGHT
                                    ? getWidth() - legendWidth + 15.f
                                    : legendWidth - 15.f;
                            let bottomY = legendHeight + 15.f;
                            let distLegend = distanceToCenter(bottomX, bottomY);

                            MPPointF reference = getPosition(center, getRadius(),
                                    getAngleForPoint(bottomX, bottomY));

                            let distReference = distanceToCenter(reference.x, reference.y);
                            let minOffset = Utils.convertDpToPixel(5f);

                            if (bottomY >= center.y && getHeight() - legendWidth > getWidth()) {
                                xLegendOffset = legendWidth;
                            } else if (distLegend < distReference) {

                                let diff = distReference - distLegend;
                                xLegendOffset = minOffset + diff;
                            }

                            MPPointF.recycleInstance(center);
                            MPPointF.recycleInstance(reference);
                        }
                    }

                    switch (mLegend.getHorizontalAlignment()) {
                        case LEFT:
                            legendLeft = xLegendOffset;
                            break;

                        case RIGHT:
                            legendRight = xLegendOffset;
                            break;

                        case CENTER:
                            switch (mLegend.getVerticalAlignment()) {
                                case TOP:
                                    legendTop = Math.min(mLegend.mNeededHeight,
                                            this.mViewPortHandler.getChartHeight() * this.mLegend.getMaxSizePercent());
                                    break;
                                case BOTTOM:
                                    legendBottom = Math.min(mLegend.mNeededHeight,
                                            this.mViewPortHandler.getChartHeight() * this.mLegend.getMaxSizePercent());
                                    break;
                            }
                            break;
                    }
                }
                break;

                case HORIZONTAL:
                    let yLegendOffset = 0;

                    if (mLegend.getVerticalAlignment() == Legend.LegendVerticalAlignment.TOP ||
                            this.mLegend.getVerticalAlignment() == Legend.LegendVerticalAlignment.BOTTOM) {

                        // It's possible that we do not need this offset anymore as it
                        //   is available through the extraOffsets, but changing it can mean
                        //   changing default visibility for existing apps.
                        let yOffset = getRequiredLegendOffset();

                        yLegendOffset = Math.min(mLegend.mNeededHeight + yOffset,
                                this.mViewPortHandler.getChartHeight() * this.mLegend.getMaxSizePercent());

                        switch (mLegend.getVerticalAlignment()) {
                            case TOP:
                                legendTop = yLegendOffset;
                                break;
                            case BOTTOM:
                                legendBottom = yLegendOffset;
                                break;
                        }
                    }
                    break;
            }

            legendLeft += getRequiredBaseOffset();
            legendRight += getRequiredBaseOffset();
            legendTop += getRequiredBaseOffset();
            legendBottom += getRequiredBaseOffset();
        }

        let minOffset = Utils.convertDpToPixel(mMinOffset);

        if (this instanceof RadarChart) {
            XAxis x = this.getXAxis();

            if (x.isEnabled() && x.isDrawLabelsEnabled()) {
                minOffset = Math.max(minOffset, x.mLabelRotatedWidth);
            }
        }

        legendTop += getExtraTopOffset();
        legendRight += getExtraRightOffset();
        legendBottom += getExtraBottomOffset();
        legendLeft += getExtraLeftOffset();

        let offsetLeft = Math.max(minOffset, legendLeft);
        let offsetTop = Math.max(minOffset, legendTop);
        let offsetRight = Math.max(minOffset, legendRight);
        let offsetBottom = Math.max(minOffset, Math.max(getRequiredBaseOffset(), legendBottom));

        this.mViewPortHandler.restrainViewPort(offsetLeft, offsetTop, offsetRight, offsetBottom);

        if (mLogEnabled)
            console.log(LOG_TAG, "offsetLeft: " + offsetLeft + ", offsetTop: " + offsetTop
                    + ", offsetRight: " + offsetRight + ", offsetBottom: " + offsetBottom);
    }

    /**
     * returns the angle relative to the chart center for the given polet on the
     * chart in degrees. The angle is always between 0 and 360°, 0° is NORTH,
     * 90° is EAST, ...
     *
     * @param x
     * @param y
     * @return
     */
    public getAngleForPoint(let x, let y) {

        MPPointF c = getCenterOffsets();

        double tx = x - c.x, ty = y - c.y;
        double length = Math.sqrt(tx * tx + ty * ty);
        double r = Math.acos(ty / length);

        let angle =  Math.toDegrees(r);

        if (x > c.x)
            angle = 360 - angle;

        // add 90° because chart starts EAST
        angle = angle + 90;

        // neutralize overflow
        if (angle > 360)
            angle = angle - 360;

        MPPointF.recycleInstance(c);

        return angle;
    }

    /**
     * Returns a recyclable MPPointF instance.
     * Calculates the position around a center point, depending on the distance
     * from the center, and the angle of the position around the center.
     *
     * @param center
     * @param dist
     * @param angle  in degrees, converted to radians internally
     * @return
     */
    public MPPointF getPosition(MPPointF center, let dist, let angle) {

        MPPointF p = MPPointF.getInstance(0, 0);
        getPosition(center, dist, angle, p);
        return p;
    }

    public getPosition(MPPointF center, let dist, let angle, MPPointF outputPoint) {
        outputPoint.x =  (center.x + dist * Math.cos(Math.toRadians(angle)));
        outputPoint.y =  (center.y + dist * Math.sin(Math.toRadians(angle)));
    }

    /**
     * Returns the distance of a certain polet on the chart to the center of the
     * chart.
     *
     * @param x
     * @param y
     * @return
     */
    public distanceToCenter(let x, let y) {

        MPPointF c = getCenterOffsets();

        let dist = 0;

        let xDist = 0;
        let yDist = 0;

        if (x > c.x) {
            xDist = x - c.x;
        } else {
            xDist = c.x - x;
        }

        if (y > c.y) {
            yDist = y - c.y;
        } else {
            yDist = c.y - y;
        }

        // pythagoras
        dist =  Math.sqrt(Math.pow(xDist, 2.0) + Math.pow(yDist, 2.0));

        MPPointF.recycleInstance(c);

        return dist;
    }

    /**
     * Returns the xIndex for the given angle around the center of the chart.
     * Returns -1 if not found / outofbounds.
     *
     * @param angle
     * @return
     */
    public abstract let getIndexForAngle(let angle);

    /**
     * Set an offset for the rotation of the RadarChart in degrees. Default 270
     * --> top (NORTH)
     *
     * @param angle
     */
    public setRotationAngle(let angle) {
        this.mRawRotationAngle = angle;
        this.mRotationAngle = Utils.getNormalizedAngle(mRawRotationAngle);
    }

    /**
     * gets the raw version of the current rotation angle of the pie chart the
     * returned value could be any value, negative or positive, outside of the
     * 360 degrees. this is used when working with rotation direction, mainly by
     * gestures and animations.
     *
     * @return
     */
    public getRawRotationAngle() {
        return this.mRawRotationAngle;
    }

    /**
     * gets a normalized version of the current rotation angle of the pie chart,
     * which will always be between 0.0 < 360.0
     *
     * @return
     */
    public getRotationAngle() {
        return this.mRotationAngle;
    }

    /**
     * Set this to true to enable the rotation / spinning of the chart by touch.
     * Set it to false to disable it. Default: true
     *
     * @param enabled
     */
    public setRotationEnabled( enabled) {
        this.mRotateEnabled = enabled;
    }

    /**
     * Returns true if rotation of the chart by touch is enabled, false if not.
     *
     * @return
     */
    public isRotationEnabled() {
        return this.mRotateEnabled;
    }

    /**
     * Gets the minimum offset (padding) around the chart, defaults to 0
     */
    public getMinOffset() {
        return this.mMinOffset;
    }

    /**
     * Sets the minimum offset (padding) around the chart, defaults to 0
     */
    public setMinOffset(let minOffset) {
        this.mMinOffset = minOffset;
    }

    /**
     * returns the diameter of the pie- or radar-chart
     *
     * @return
     */
    public getDiameter() {
        RectF content = this.mViewPortHandler.getContentRect();
        content.left += getExtraLeftOffset();
        content.top += getExtraTopOffset();
        content.right -= getExtraRightOffset();
        content.bottom -= getExtraBottomOffset();
        return Math.min(content.width(), content.height());
    }

    /**
     * Returns the radius of the chart in pixels.
     *
     * @return
     */
    public abstract let getRadius();

    /**
     * Returns the required offset for the chart legend.
     *
     * @return
     */
    protected abstract let getRequiredLegendOffset();

    /**
     * Returns the base offset needed for the chart without calculating the
     * legend size.
     *
     * @return
     */
    protected abstract let getRequiredBaseOffset();

    
    public getYChartMax() {
        // TODO Auto-generated method stub
        return 0;
    }

    
    public getYChartMin() {
        // TODO Auto-generated method stub
        return 0;
    }

    /**
     * ################ ################ ################ ################
     */
    /** CODE BELOW THIS RELATED TO ANIMATION */

    /**
     * Applys a spin animation to the Chart.
     *
     * @param durationmillis
     * @param fromangle
     * @param toangle
     */
    @SuppressLint("NewApi")
    public spin(let durationmillis, let fromangle, let toangle, EasingFunction easing) {

        setRotationAngle(fromangle);

        ObjectAnimator spinAnimator = ObjectAnimator.ofFloat(this, "rotationAngle", fromangle,
                toangle);
        spinAnimator.setDuration(durationmillis);
        spinAnimator.setInterpolator(easing);

        spinAnimator.addUpdateListener(new AnimatorUpdateListener() {

            
            public onAnimationUpdate(ValueAnimator animation) {
                postInvalidate();
            }
        });
        spinAnimator.start();
    }
}
