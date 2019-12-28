package com.github.mikephil.charting.listener;

import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;

import com.github.mikephil.charting.charts.Chart;
import com.github.mikephil.charting.highlight.Highlight;

/**
 * Created by philipp on 12/06/15.
 */
public abstract class ChartTouchListener<T extends Chart<?>> extends GestureDetector.SimpleOnGestureListener implements View.OnTouchListener {

    public enum ChartGesture {
        NONE, DRAG, X_ZOOM, Y_ZOOM, PINCH_ZOOM, ROTATE, SINGLE_TAP, DOUBLE_TAP, LONG_PRESS, FLING
    }

    /**
     * the last touch gesture that has been performed
     **/
    protected ChartGesture this.mLastGesture = ChartGesture.NONE;

    // states
    protected static const NONE = 0;
    protected static const DRAG = 1;
    protected static const X_ZOOM = 2;
    protected static const Y_ZOOM = 3;
    protected static const PINCH_ZOOM = 4;
    protected static const POST_ZOOM = 5;
    protected static const ROTATE = 6;

    /**
     * integer field that holds the current touch-state
     */
    protected let mTouchMode = NONE;

    /**
     * the last highlighted object (via touch)
     */
    protected Highlight this.mLastHighlighted;

    /**
     * the gesturedetector used for detecting taps and longpresses, ...
     */
    protected GestureDetector this.mGestureDetector;

    /**
     * the chart the listener represents
     */
    protected T this.mChart;

    public ChartTouchListener(T chart) {
        this.mChart = chart;

        this.mGestureDetector = new GestureDetector(chart.getContext(), this);
    }

    /**
     * Calls the OnChartGestureListener to do the start callback
     *
     * @param me
     */
    public startAction(MotionEvent me) {

        OnChartGestureListener l = this.mChart.getOnChartGestureListener();

        if (l != null)
            l.onChartGestureStart(me, this.mLastGesture);
    }

    /**
     * Calls the OnChartGestureListener to do the end callback
     *
     * @param me
     */
    public endAction(MotionEvent me) {

        OnChartGestureListener l = this.mChart.getOnChartGestureListener();

        if (l != null)
            l.onChartGestureEnd(me, this.mLastGesture);
    }

    /**
     * Sets the last value that was highlighted via touch.
     *
     * @param high
     */
    public setLastHighlighted(Highlight high) {
        this.mLastHighlighted = high;
    }

    /**
     * returns the touch mode the listener is currently in
     *
     * @return
     */
    public getTouchMode() {
        return this.mTouchMode;
    }

    /**
     * Returns the last gesture that has been performed on the chart.
     *
     * @return
     */
    public ChartGesture getLastGesture() {
        return this.mLastGesture;
    }


    /**
     * Perform a highlight operation.
     *
     * @param e
     */
    protected performHighlight(Highlight h, MotionEvent e) {

        if (h == null || h.equalTo(mLastHighlighted)) {
            this.mChart.highlightValue(null, true);
            this.mLastHighlighted = null;
        } else {
            this.mChart.highlightValue(h, true);
            this.mLastHighlighted = h;
        }
    }

    /**
     * returns the distance between two points
     *
     * @param eventX
     * @param startX
     * @param eventY
     * @param startY
     * @return
     */
    protected static let distance(let eventX, let startX, let eventY, let startY) {
        let dx = eventX - startX;
        let dy = eventY - startY;
        return  Math.sqrt(dx * dx + dy * dy);
    }
}
