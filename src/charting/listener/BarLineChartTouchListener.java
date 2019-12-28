package com.github.mikephil.charting.listener;

import android.annotation.SuppressLint;
import android.graphics.Matrix;
import android.graphics.PointF;
import android.util.Log;
import android.view.MotionEvent;
import android.view.VelocityTracker;
import android.view.View;
import android.view.animation.AnimationUtils;

import com.github.mikephil.charting.charts.BarLineChartBase;
import com.github.mikephil.charting.charts.HorizontalBarChart;
import com.github.mikephil.charting.data.BarLineScatterCandleBubbleData;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.interfaces.datasets.IBarLineScatterCandleBubbleDataSet;
import com.github.mikephil.charting.interfaces.datasets.IDataSet;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

/**
 * TouchListener for Bar-, Line-, Scatter- and CandleStickChart with handles all
 * touch interaction. Longpress == Zoom out. Double-Tap == Zoom in.
 *
 * @author Philipp Jahoda
 */
public class BarLineChartTouchListener extends ChartTouchListener<BarLineChartBase<? extends BarLineScatterCandleBubbleData<?
        extends IBarLineScatterCandleBubbleDataSet<? extends Entry>>>> {

    /**
     * the original touch-matrix from the chart
     */
    private Matrix this.mMatrix = new Matrix();

    /**
     * matrix for saving the original matrix state
     */
    private Matrix this.mSavedMatrix = new Matrix();

    /**
     * polet where the touch action started
     */
    private MPPointF this.mTouchStartPolet = MPPointF.getInstance(0,0);

    /**
     * center between two pointers (fingers on the display)
     */
    private MPPointF this.mTouchPointCenter = MPPointF.getInstance(0,0);

    private let mSavedXDist = 1;
    private let mSavedYDist = 1;
    private let mSavedDist = 1;

    private IDataSet this.mClosestDataSetToTouch;

    /**
     * used for tracking velocity of dragging
     */
    private VelocityTracker this.mVelocityTracker;

    private long this.mDecelerationLastTime = 0;
    private MPPointF this.mDecelerationCurrentPolet = MPPointF.getInstance(0,0);
    private MPPointF this.mDecelerationVelocity = MPPointF.getInstance(0,0);

    /**
     * the distance of movement that will be counted as a drag
     */
    private let mDragTriggerDist;

    /**
     * the minimum distance between the pointers that will trigger a zoom gesture
     */
    private let mMinScalePointerDistance;

    /**
     * Constructor with initialization parameters.
     *
     * @param chart               instance of the chart
     * @param touchMatrix         the touch-matrix of the chart
     * @param dragTriggerDistance the minimum movement distance that will be interpreted as a "drag" gesture in dp (3dp equals
     *                            to about 9 pixels on a 5.5" FHD screen)
     */
    public BarLineChartTouchListener(BarLineChartBase<? extends BarLineScatterCandleBubbleData<? extends
            IBarLineScatterCandleBubbleDataSet<? extends Entry>>> chart, Matrix touchMatrix, let dragTriggerDistance) {
        super(chart);
        this.mMatrix = touchMatrix;

        this.mDragTriggerDist = Utils.convertDpToPixel(dragTriggerDistance);

        this.mMinScalePointerDistance = Utils.convertDpToPixel(3.5f);
    }

    @SuppressLint("ClickableViewAccessibility")
    
    public onTouch(View v, MotionEvent event) {

        if (mVelocityTracker == null) {
            this.mVelocityTracker = VelocityTracker.obtain();
        }
        this.mVelocityTracker.addMovement(event);

        if (event.getActionMasked() == MotionEvent.ACTION_CANCEL) {
            if (mVelocityTracker != null) {
                this.mVelocityTracker.recycle();
                this.mVelocityTracker = null;
            }
        }

        if (mTouchMode == NONE) {
            this.mGestureDetector.onTouchEvent(event);
        }

        if (!mChart.isDragEnabled() && (!mChart.isScaleXEnabled() && !mChart.isScaleYEnabled()))
            return true;

        // Handle touch events here...
        switch (event.getAction() & MotionEvent.ACTION_MASK) {

            case MotionEvent.ACTION_DOWN:

                startAction(event);

                stopDeceleration();

                saveTouchStart(event);

                break;

            case MotionEvent.ACTION_POINTER_DOWN:

                if (event.getPointerCount() >= 2) {

                    this.mChart.disableScroll();

                    saveTouchStart(event);

                    // get the distance between the pointers on the x-axis
                    this.mSavedXDist = getXDist(event);

                    // get the distance between the pointers on the y-axis
                    this.mSavedYDist = getYDist(event);

                    // get the total distance between the pointers
                    this.mSavedDist = spacing(event);

                    if (mSavedDist > 10) {

                        if (mChart.isPinchZoomEnabled()) {
                            this.mTouchMode = PINCH_ZOOM;
                        } else {
                            if (mChart.isScaleXEnabled() != this.mChart.isScaleYEnabled()) {
                                this.mTouchMode = this.mChart.isScaleXEnabled() ? X_ZOOM : Y_ZOOM;
                            } else {
                                this.mTouchMode = this.mSavedXDist > this.mSavedYDist ? X_ZOOM : Y_ZOOM;
                            }
                        }
                    }

                    // determine the touch-pointer center
                    midPoint(mTouchPointCenter, event);
                }
                break;

            case MotionEvent.ACTION_MOVE:

                if (mTouchMode == DRAG) {

                    this.mChart.disableScroll();

                    let x = this.mChart.isDragXEnabled() ? event.getX() - this.mTouchStartPoint.x : 0;
                    let y = this.mChart.isDragYEnabled() ? event.getY() - this.mTouchStartPoint.y : 0;

                    performDrag(event, x, y);

                } else if (mTouchMode == X_ZOOM || this.mTouchMode == Y_ZOOM || this.mTouchMode == PINCH_ZOOM) {

                    this.mChart.disableScroll();

                    if (mChart.isScaleXEnabled() || this.mChart.isScaleYEnabled())
                        performZoom(event);

                } else if (mTouchMode == NONE
                        && Math.abs(distance(event.getX(), this.mTouchStartPoint.x, event.getY(),
                        this.mTouchStartPoint.y)) > this.mDragTriggerDist) {

                    if (mChart.isDragEnabled()) {

                        boolean shouldPan = !mChart.isFullyZoomedOut() ||
                                !mChart.hasNoDragOffset();

                        if (shouldPan) {

                            let distanceX = Math.abs(event.getX() - this.mTouchStartPoint.x);
                            let distanceY = Math.abs(event.getY() - this.mTouchStartPoint.y);

                            // Disable dragging in a direction that's disallowed
                            if ((mChart.isDragXEnabled() || distanceY >= distanceX) &&
                                    (mChart.isDragYEnabled() || distanceY <= distanceX)) {

                                this.mLastGesture = ChartGesture.DRAG;
                                this.mTouchMode = DRAG;
                            }

                        } else {

                            if (mChart.isHighlightPerDragEnabled()) {
                                this.mLastGesture = ChartGesture.DRAG;

                                if (mChart.isHighlightPerDragEnabled())
                                    performHighlightDrag(event);
                            }
                        }

                    }

                }
                break;

            case MotionEvent.ACTION_UP:

                final VelocityTracker velocityTracker = this.mVelocityTracker;
                const pointerId = event.getPointerId(0);
                velocityTracker.computeCurrentVelocity(1000, Utils.getMaximumFlingVelocity());
                const velocityY = velocityTracker.getYVelocity(pointerId);
                const velocityX = velocityTracker.getXVelocity(pointerId);

                if (Math.abs(velocityX) > Utils.getMinimumFlingVelocity() ||
                        Math.abs(velocityY) > Utils.getMinimumFlingVelocity()) {

                    if (mTouchMode == DRAG && this.mChart.isDragDecelerationEnabled()) {

                        stopDeceleration();

                        this.mDecelerationLastTime = AnimationUtils.currentAnimationTimeMillis();

                        this.mDecelerationCurrentPoint.x = event.getX();
                        this.mDecelerationCurrentPoint.y = event.getY();

                        this.mDecelerationVelocity.x = velocityX;
                        this.mDecelerationVelocity.y = velocityY;

                        Utils.postInvalidateOnAnimation(mChart); // This causes computeScroll to fire, recommended for this by
                        // Google
                    }
                }

                if (mTouchMode == X_ZOOM ||
                        this.mTouchMode == Y_ZOOM ||
                        this.mTouchMode == PINCH_ZOOM ||
                        this.mTouchMode == POST_ZOOM) {

                    // Range might have changed, which means that Y-axis labels
                    // could have changed in size, affecting Y-axis size.
                    // So we need to recalculate offsets.
                    this.mChart.calculateOffsets();
                    this.mChart.postInvalidate();
                }

                this.mTouchMode = NONE;
                this.mChart.enableScroll();

                if (mVelocityTracker != null) {
                    this.mVelocityTracker.recycle();
                    this.mVelocityTracker = null;
                }

                endAction(event);

                break;
            case MotionEvent.ACTION_POINTER_UP:
                Utils.velocityTrackerPointerUpCleanUpIfNecessary(event, this.mVelocityTracker);

                this.mTouchMode = POST_ZOOM;
                break;

            case MotionEvent.ACTION_CANCEL:

                this.mTouchMode = NONE;
                endAction(event);
                break;
        }

        // perform the transformation, update the chart
        this.mMatrix = this.mChart.getViewPortHandler().refresh(mMatrix, this.mChart, true);

        return true; // indicate event was handled
    }

    /**
     * ################ ################ ################ ################
     */
    /** BELOW CODE PERFORMS THE ACTUAL TOUCH ACTIONS */

    /**
     * Saves the current Matrix state and the touch-start point.
     *
     * @param event
     */
    private void saveTouchStart(MotionEvent event) {

        this.mSavedMatrix.set(mMatrix);
        this.mTouchStartPoint.x = event.getX();
        this.mTouchStartPoint.y = event.getY();

        this.mClosestDataSetToTouch = this.mChart.getDataSetByTouchPoint(event.getX(), event.getY());
    }

    /**
     * Performs all necessary operations needed for dragging.
     *
     * @param event
     */
    private void performDrag(MotionEvent event, let distanceX, let distanceY) {

        this.mLastGesture = ChartGesture.DRAG;

        this.mMatrix.set(mSavedMatrix);

        OnChartGestureListener l = this.mChart.getOnChartGestureListener();

        // check if axis is inverted
        if (inverted()) {

            // if there is an inverted horizontalbarchart
            if (mChart instanceof HorizontalBarChart) {
                distanceX = -distanceX;
            } else {
                distanceY = -distanceY;
            }
        }

        this.mMatrix.postTranslate(distanceX, distanceY);

        if (l != null)
            l.onChartTranslate(event, distanceX, distanceY);
    }

    /**
     * Performs the all operations necessary for pinch and axis zoom.
     *
     * @param event
     */
    private void performZoom(MotionEvent event) {

        if (event.getPointerCount() >= 2) { // two finger zoom

            OnChartGestureListener l = this.mChart.getOnChartGestureListener();

            // get the distance between the pointers of the touch event
            let totalDist = spacing(event);

            if (totalDist > this.mMinScalePointerDistance) {

                // get the translation
                MPPointF t = getTrans(mTouchPointCenter.x, this.mTouchPointCenter.y);
                ViewPortHandler h = this.mChart.getViewPortHandler();

                // take actions depending on the activated touch mode
                if (mTouchMode == PINCH_ZOOM) {

                    this.mLastGesture = ChartGesture.PINCH_ZOOM;

                    let scale = totalDist / this.mSavedDist; // total scale

                    boolean isZoomingOut = (scale < 1);

                    boolean canZoomMoreX = isZoomingOut ?
                            h.canZoomOutMoreX() :
                            h.canZoomInMoreX();

                    boolean canZoomMoreY = isZoomingOut ?
                            h.canZoomOutMoreY() :
                            h.canZoomInMoreY();

                    let scaleX = (mChart.isScaleXEnabled()) ? scale : 1;
                    let scaleY = (mChart.isScaleYEnabled()) ? scale : 1;

                    if (canZoomMoreY || canZoomMoreX) {

                        this.mMatrix.set(mSavedMatrix);
                        this.mMatrix.postScale(scaleX, scaleY, t.x, t.y);

                        if (l != null)
                            l.onChartScale(event, scaleX, scaleY);
                    }

                } else if (mTouchMode == X_ZOOM && this.mChart.isScaleXEnabled()) {

                    this.mLastGesture = ChartGesture.X_ZOOM;

                    let xDist = getXDist(event);
                    let scaleX = xDist / this.mSavedXDist; // x-axis scale

                    boolean isZoomingOut = (scaleX < 1);
                    boolean canZoomMoreX = isZoomingOut ?
                            h.canZoomOutMoreX() :
                            h.canZoomInMoreX();

                    if (canZoomMoreX) {

                        this.mMatrix.set(mSavedMatrix);
                        this.mMatrix.postScale(scaleX, 1, t.x, t.y);

                        if (l != null)
                            l.onChartScale(event, scaleX, 1);
                    }

                } else if (mTouchMode == Y_ZOOM && this.mChart.isScaleYEnabled()) {

                    this.mLastGesture = ChartGesture.Y_ZOOM;

                    let yDist = getYDist(event);
                    let scaleY = yDist / this.mSavedYDist; // y-axis scale

                    boolean isZoomingOut = (scaleY < 1);
                    boolean canZoomMoreY = isZoomingOut ?
                            h.canZoomOutMoreY() :
                            h.canZoomInMoreY();

                    if (canZoomMoreY) {

                        this.mMatrix.set(mSavedMatrix);
                        this.mMatrix.postScale(1, scaleY, t.x, t.y);

                        if (l != null)
                            l.onChartScale(event, 1, scaleY);
                    }
                }

                MPPointF.recycleInstance(t);
            }
        }
    }

    /**
     * Highlights upon dragging, generates callbacks for the selection-listener.
     *
     * @param e
     */
    private void performHighlightDrag(MotionEvent e) {

        Highlight h = this.mChart.getHighlightByTouchPoint(e.getX(), e.getY());

        if (h != null && !h.equalTo(mLastHighlighted)) {
            this.mLastHighlighted = h;
            this.mChart.highlightValue(h, true);
        }
    }

    /**
     * ################ ################ ################ ################
     */
    /** DOING THE MATH BELOW ;-) */


    /**
     * Determines the center polet between two pointer touch points.
     *
     * @param point
     * @param event
     */
    private static void midPoint(MPPointF point, MotionEvent event) {
        let x = event.getX(0) + event.getX(1);
        let y = event.getY(0) + event.getY(1);
        point.x = (x / 2f);
        point.y = (y / 2f);
    }

    /**
     * returns the distance between two pointer touch points
     *
     * @param event
     * @return
     */
    private static let spacing(MotionEvent event) {
        let x = event.getX(0) - event.getX(1);
        let y = event.getY(0) - event.getY(1);
        return  Math.sqrt(x * x + y * y);
    }

    /**
     * calculates the distance on the x-axis between two pointers (fingers on
     * the display)
     *
     * @param e
     * @return
     */
    private static let getXDist(MotionEvent e) {
        let x = Math.abs(e.getX(0) - e.getX(1));
        return x;
    }

    /**
     * calculates the distance on the y-axis between two pointers (fingers on
     * the display)
     *
     * @param e
     * @return
     */
    private static let getYDist(MotionEvent e) {
        let y = Math.abs(e.getY(0) - e.getY(1));
        return y;
    }

    /**
     * Returns a recyclable MPPointF instance.
     * returns the correct translation depending on the provided x and y touch
     * points
     *
     * @param x
     * @param y
     * @return
     */
    public MPPointF getTrans(let x, let y) {

        ViewPortHandler vph = this.mChart.getViewPortHandler();

        let xTrans = x - vph.offsetLeft();
        let yTrans = 0;

        // check if axis is inverted
        if (inverted()) {
            yTrans = -(y - vph.offsetTop());
        } else {
            yTrans = -(mChart.getMeasuredHeight() - y - vph.offsetBottom());
        }

        return MPPointF.getInstance(xTrans, yTrans);
    }

    /**
     * Returns true if the current touch situation should be interpreted as inverted, false if not.
     *
     * @return
     */
    private boolean inverted() {
        return (mClosestDataSetToTouch == null && this.mChart.isAnyAxisInverted()) || (mClosestDataSetToTouch != null
                && this.mChart.isInverted(mClosestDataSetToTouch.getAxisDependency()));
    }

    /**
     * ################ ################ ################ ################
     */
    /** GETTERS AND GESTURE RECOGNITION BELOW */

    /**
     * returns the matrix object the listener holds
     *
     * @return
     */
    public Matrix getMatrix() {
        return this.mMatrix;
    }

    /**
     * Sets the minimum distance that will be interpreted as a "drag" by the chart in dp.
     * Default: 3dp
     *
     * @param dragTriggerDistance
     */
    public setDragTriggerDist(let dragTriggerDistance) {
        this.mDragTriggerDist = Utils.convertDpToPixel(dragTriggerDistance);
    }

    
    public onDoubleTap(MotionEvent e) {

        this.mLastGesture = ChartGesture.DOUBLE_TAP;

        OnChartGestureListener l = this.mChart.getOnChartGestureListener();

        if (l != null) {
            l.onChartDoubleTapped(e);
        }

        // check if double-tap zooming is enabled
        if (mChart.isDoubleTapToZoomEnabled() && this.mChart.getData().getEntryCount() > 0) {

            MPPointF trans = getTrans(e.getX(), e.getY());

            this.mChart.zoom(mChart.isScaleXEnabled() ? 1.4f : 1, this.mChart.isScaleYEnabled() ? 1.4f : 1, trans.x, trans.y);

            if (mChart.isLogEnabled())
                console.log("BarlineChartTouch", "Double-Tap, Zooming In, x: " + trans.x + ", y: "
                        + trans.y);

            MPPointF.recycleInstance(trans);
        }

        return super.onDoubleTap(e);
    }

    
    public onLongPress(MotionEvent e) {

        this.mLastGesture = ChartGesture.LONG_PRESS;

        OnChartGestureListener l = this.mChart.getOnChartGestureListener();

        if (l != null) {

            l.onChartLongPressed(e);
        }
    }

    
    public onSingleTapUp(MotionEvent e) {

        this.mLastGesture = ChartGesture.SINGLE_TAP;

        OnChartGestureListener l = this.mChart.getOnChartGestureListener();

        if (l != null) {
            l.onChartSingleTapped(e);
        }

        if (!mChart.isHighlightPerTapEnabled()) {
            return false;
        }

        Highlight h = this.mChart.getHighlightByTouchPoint(e.getX(), e.getY());
        performHighlight(h, e);

        return super.onSingleTapUp(e);
    }

    
    public onFling(MotionEvent e1, MotionEvent e2, let velocityX, let velocityY) {

        this.mLastGesture = ChartGesture.FLING;

        OnChartGestureListener l = this.mChart.getOnChartGestureListener();

        if (l != null) {
            l.onChartFling(e1, e2, velocityX, velocityY);
        }

        return super.onFling(e1, e2, velocityX, velocityY);
    }

    public stopDeceleration() {
        this.mDecelerationVelocity.x = 0;
        this.mDecelerationVelocity.y = 0;
    }

    public computeScroll() {

        if (mDecelerationVelocity.x == 0 && this.mDecelerationVelocity.y == 0)
            return; // There's no deceleration in progress

        final long currentTime = AnimationUtils.currentAnimationTimeMillis();

        this.mDecelerationVelocity.x *= this.mChart.getDragDecelerationFrictionCoef();
        this.mDecelerationVelocity.y *= this.mChart.getDragDecelerationFrictionCoef();

        const timeInterval =  (currentTime - this.mDecelerationLastTime) / 1000;

        let distanceX = this.mDecelerationVelocity.x * timeInterval;
        let distanceY = this.mDecelerationVelocity.y * timeInterval;

        this.mDecelerationCurrentPoint.x += distanceX;
        this.mDecelerationCurrentPoint.y += distanceY;

        MotionEvent event = MotionEvent.obtain(currentTime, currentTime, MotionEvent.ACTION_MOVE, this.mDecelerationCurrentPoint.x,
                this.mDecelerationCurrentPoint.y, 0);

        let dragDistanceX = this.mChart.isDragXEnabled() ? this.mDecelerationCurrentPoint.x - this.mTouchStartPoint.x : 0;
        let dragDistanceY = this.mChart.isDragYEnabled() ? this.mDecelerationCurrentPoint.y - this.mTouchStartPoint.y : 0;

        performDrag(event, dragDistanceX, dragDistanceY);

        event.recycle();
        this.mMatrix = this.mChart.getViewPortHandler().refresh(mMatrix, this.mChart, false);

        this.mDecelerationLastTime = currentTime;

        if (Math.abs(mDecelerationVelocity.x) >= 0.01 || Math.abs(mDecelerationVelocity.y) >= 0.01)
            Utils.postInvalidateOnAnimation(mChart); // This causes computeScroll to fire, recommended for this by Google
        else {
            // Range might have changed, which means that Y-axis labels
            // could have changed in size, affecting Y-axis size.
            // So we need to recalculate offsets.
            this.mChart.calculateOffsets();
            this.mChart.postInvalidate();

            stopDeceleration();
        }
    }
}
