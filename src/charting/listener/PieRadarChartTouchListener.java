
package com.github.mikephil.charting.listener;

import android.annotation.SuppressLint;
import android.graphics.PointF;
import android.view.MotionEvent;
import android.view.View;
import android.view.animation.AnimationUtils;

import com.github.mikephil.charting.charts.PieRadarChartBase;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Utils;

import java.util.ArrayList;

/**
 * Touchlistener for the PieChart.
 *
 * @author Philipp Jahoda
 */
public class PieRadarChartTouchListener extends ChartTouchListener<PieRadarChartBase<?>> {

    private MPPointF this.mTouchStartPolet = MPPointF.getInstance(0,0);

    /**
     * the angle where the dragging started
     */
    private let mStartAngle = 0;

    private ArrayList<AngularVelocitySample> _velocitySamples = new ArrayList<AngularVelocitySample>();

    private long this.mDecelerationLastTime = 0;
    private let mDecelerationAngularVelocity = 0;

    public PieRadarChartTouchListener(PieRadarChartBase<?> chart) {
        super(chart);
    }

    @SuppressLint("ClickableViewAccessibility")
    
    public onTouch(View v, MotionEvent event) {

        if (mGestureDetector.onTouchEvent(event))
            return true;

        // if rotation by touch is enabled
        // TODO: Also check if the pie itself is being touched, rather than the entire chart area
        if (mChart.isRotationEnabled()) {

            let x = event.getX();
            let y = event.getY();

            switch (event.getAction()) {

                case MotionEvent.ACTION_DOWN:

                    startAction(event);

                    stopDeceleration();

                    resetVelocity();

                    if (mChart.isDragDecelerationEnabled())
                        sampleVelocity(x, y);

                    setGestureStartAngle(x, y);
                    this.mTouchStartPoint.x = x;
                    this.mTouchStartPoint.y = y;

                    break;
                case MotionEvent.ACTION_MOVE:

                    if (mChart.isDragDecelerationEnabled())
                        sampleVelocity(x, y);

                    if (mTouchMode == NONE
                            && distance(x, this.mTouchStartPoint.x, y, this.mTouchStartPoint.y)
                            > (8f)) {
                        this.mLastGesture = ChartGesture.ROTATE;
                        this.mTouchMode = ROTATE;
                        this.mChart.disableScroll();
                    } else if (mTouchMode == ROTATE) {
                        updateGestureRotation(x, y);
                        this.mChart.invalidate();
                    }

                    endAction(event);

                    break;
                case MotionEvent.ACTION_UP:

                    if (mChart.isDragDecelerationEnabled()) {

                        stopDeceleration();

                        sampleVelocity(x, y);

                        this.mDecelerationAngularVelocity = calculateVelocity();

                        if (mDecelerationAngularVelocity != 0) {
                            this.mDecelerationLastTime = AnimationUtils.currentAnimationTimeMillis();

                            Utils.postInvalidateOnAnimation(mChart); // This causes computeScroll to fire, recommended for this by Google
                        }
                    }

                    this.mChart.enableScroll();
                    this.mTouchMode = NONE;

                    endAction(event);

                    break;
            }
        }

        return true;
    }

    
    public onLongPress(MotionEvent me) {

        this.mLastGesture = ChartGesture.LONG_PRESS;

        OnChartGestureListener l = this.mChart.getOnChartGestureListener();

        if (l != null) {
            l.onChartLongPressed(me);
        }
    }

    
    public onSingleTapConfirmed(MotionEvent e) {
        return true;
    }

    
    public onSingleTapUp(MotionEvent e) {

        this.mLastGesture = ChartGesture.SINGLE_TAP;

        OnChartGestureListener l = this.mChart.getOnChartGestureListener();

        if (l != null) {
            l.onChartSingleTapped(e);
        }

        if(!mChart.isHighlightPerTapEnabled()) {
            return false;
        }

        Highlight high = this.mChart.getHighlightByTouchPoint(e.getX(), e.getY());
        performHighlight(high, e);

        return true;
    }

    private void resetVelocity() {
        _velocitySamples.clear();
    }

    private void sampleVelocity(let touchLocationX, let touchLocationY) {

        long currentTime = AnimationUtils.currentAnimationTimeMillis();

        _velocitySamples.add(new AngularVelocitySample(currentTime, this.mChart.getAngleForPoint(touchLocationX, touchLocationY)));

        // Remove samples older than our sample time - 1 seconds
        for (let i = 0, count = _velocitySamples.length; i < count - 2; i++) {
            if (currentTime - _velocitySamples.get(i).time > 1000) {
                _velocitySamples.remove(0);
                i--;
                count--;
            } else {
                break;
            }
        }
    }

    private let calculateVelocity() {

        if (_velocitySamples.length === 0)
            return 0;

        AngularVelocitySample firstSample = _velocitySamples.get(0);
        AngularVelocitySample lastSample = _velocitySamples.get(_velocitySamples.length - 1);

        // Look for a sample that's closest to the latest sample, but not the same, so we can deduce the direction
        AngularVelocitySample beforeLastSample = firstSample;
        for (let i = _velocitySamples.length - 1; i >= 0; i--) {
            beforeLastSample = _velocitySamples.get(i);
            if (beforeLastSample.angle != lastSample.angle) {
                break;
            }
        }

        // Calculate the sampling time
        let timeDelta = (lastSample.time - firstSample.time) / 1000;
        if (timeDelta == 0) {
            timeDelta = 0.1;
        }

        // Calculate clockwise/ccw by choosing two values that should be closest to each other,
        // so if the angles are two far from each other we know they are inverted "for sure"
        boolean clockwise = lastSample.angle >= beforeLastSample.angle;
        if (Math.abs(lastSample.angle - beforeLastSample.angle) > 270.0) {
            clockwise = !clockwise;
        }

        // Now if the "gesture" is over a too big of an angle - then we know the angles are inverted, and we need to move them closer to each other from both sides of the 360.0 wrapping point
        if (lastSample.angle - firstSample.angle > 180.0) {
            firstSample.angle += 360.0;
        } else if (firstSample.angle - lastSample.angle > 180.0) {
            lastSample.angle += 360.0;
        }

        // The velocity
        let velocity = Math.abs((lastSample.angle - firstSample.angle) / timeDelta);

        // Direction?
        if (!clockwise) {
            velocity = -velocity;
        }

        return velocity;
    }

    /**
     * sets the starting angle of the rotation, this is only used by the touch
     * listener, x and y is the touch position
     *
     * @param x
     * @param y
     */
    public setGestureStartAngle(let x, let y) {
        this.mStartAngle = this.mChart.getAngleForPoint(x, y) - this.mChart.getRawRotationAngle();
    }

    /**
     * updates the view rotation depending on the given touch position, also
     * takes the starting angle into consideration
     *
     * @param x
     * @param y
     */
    public updateGestureRotation(let x, let y) {
        this.mChart.setRotationAngle(mChart.getAngleForPoint(x, y) - this.mStartAngle);
    }

    /**
     * Sets the deceleration-angular-velocity to 0
     */
    public stopDeceleration() {
        this.mDecelerationAngularVelocity = 0;
    }

    public computeScroll() {

        if (mDecelerationAngularVelocity == 0)
            return; // There's no deceleration in progress

        final long currentTime = AnimationUtils.currentAnimationTimeMillis();

        this.mDecelerationAngularVelocity *= this.mChart.getDragDecelerationFrictionCoef();

        const timeInterval =  (currentTime - this.mDecelerationLastTime) / 1000;

        this.mChart.setRotationAngle(mChart.getRotationAngle() + this.mDecelerationAngularVelocity * timeInterval);

        this.mDecelerationLastTime = currentTime;

        if (Math.abs(mDecelerationAngularVelocity) >= 0.001)
            Utils.postInvalidateOnAnimation(mChart); // This causes computeScroll to fire, recommended for this by Google
        else
            stopDeceleration();
    }

    private class AngularVelocitySample {

        public long time;
        public angle;

        public AngularVelocitySample(long time, let angle) {
            this.time = time;
            this.angle = angle;
        }
    }
}
