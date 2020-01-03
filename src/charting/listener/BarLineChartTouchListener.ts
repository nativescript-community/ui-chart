import { Matrix } from 'nativescript-canvas';
import { GestureState, GestureStateEventData, GestureTouchEventData } from 'nativescript-gesturehandler';
import { BarLineChartBase } from '../charts/BarLineChartBase';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { Utils } from '../utils/Utils';
import { ChartGesture, ChartTouchListener } from './ChartTouchListener';

/**
 * TouchListener for Bar-, Line-, Scatter- and CandleStickChart with handles all
 * touch interaction. Longpress == Zoom out. Double-Tap == Zoom in.
 *
 * @author Philipp Jahoda
 */
export class BarLineChartTouchListener extends ChartTouchListener<BarLineChartBase<any, any, any>> {
    /**
     * the original touch-matrix from the chart
     */
    private mMatrix = new Matrix();

    /**
     * matrix for saving the original matrix state
     */
    private mSavedMatrix = new Matrix();

    /**
     * polet where the touch action started
     */
    private mTouchStartPoint = { x: 0, y: 0 };

    /**
     * center between two pointers (fingers on the display)
     */
    private mTouchPointCenter = { x: 0, y: 0 };

    private mSavedXDist = 1;
    private mSavedYDist = 1;
    // private mSavedDist = 1;

    private mClosestDataSetToTouch: IDataSet<any>;

    /**
     * used for tracking velocity of dragging
     */
    // private VelocityTracker this.mVelocityTracker;

    // private mDecelerationLastTime = 0;
    // private mDecelerationCurrentPoint = { x: 0, y: 0 };
    private mDecelerationVelocity = { x: 0, y: 0 };

    /**
     * the distance of movement that will be counted as a drag
     */
    private mDragTriggerDist;

    /**
     * the minimum distance between the pointers that will trigger a zoom gesture
     */
    private mMinScalePointerDistance;

    /**
     * Constructor with initialization parameters.
     *
     * @param chart               instance of the chart
     * @param touchMatrix         the touch-matrix of the chart
     * @param dragTriggerDistance the minimum movement distance that will be interpreted as a "drag" gesture in dp (3dp equals
     *                            to about 9 pixels on a 5.5" FHD screen)
     */
    constructor(chart: BarLineChartBase<any, any, any>, touchMatrix: Matrix, dragTriggerDistance) {
        super(chart);
        this.mMatrix = touchMatrix;

        this.mDragTriggerDist = Utils.convertDpToPixel(dragTriggerDistance);

        this.mMinScalePointerDistance = Utils.convertDpToPixel(3.5);
    }
    onPanGestureState(event: GestureStateEventData) {
        // console.log('onPanGestureState', event.data.state, event.data.prevState, event.data.extraData);
        if (!this.mChart.isDragEnabled() && !this.mChart.isScaleXEnabled() && !this.mChart.isScaleYEnabled()) return;
        const state = event.data.state;
        switch (state) {
            // case GestureState.BEGAN:
            // this.stopDeceleration();
            // this.saveTouchStart(event);

            // break;
            case GestureState.ACTIVE:
                this.stopDeceleration();
                this.saveTouchStart(event);
                break;
            case GestureState.END:
            case GestureState.CANCELLED:
                if (this.mTouchMode == ChartTouchListener.DRAG) {
                    this.mTouchMode === ChartTouchListener.NONE;
                    this.stopDeceleration();

                    // this.mDecelerationLastTime = Date.now();

                    // this.mDecelerationCurrentPoint.x = event.data.extraData.x;
                    // this.mDecelerationCurrentPoint.y = event.data.extraData.y;

                    this.mDecelerationVelocity.x = event.data.extraData.velocityX;
                    this.mDecelerationVelocity.y = event.data.extraData.velocityY;

                    this.mChart.invalidate();
                    // Utils.postInvalidateOnAnimation(this.mChart); // This causes computeScroll to fire, recommended for this by
                    // Google
                }
                break;
        }
        // this.mMatrix = this.mChart.getViewPortHandler().refresh(this.mMatrix, this.mChart, true);
    }
    onPanGestureTouch(event: GestureTouchEventData) {
        // console.log('onPanGestureTouch', event.data.state, event.data.extraData, this.mChart.isDragEnabled(), this.mChart.isScaleXEnabled(), this.mChart.isScaleYEnabled(), this.mTouchMode);
        if (!this.mChart.isDragEnabled() && !this.mChart.isScaleXEnabled() && !this.mChart.isScaleYEnabled()) return;

        const data = event.data;
        // this.log('onGestureTouch', this._isPanning, this.panEnabled, this.isAnimating, data.state, data.extraData.translationY, this.prevDeltaY);

        if (data.state !== GestureState.ACTIVE) {
            return;
        }
        if (this.mTouchMode === ChartTouchListener.DRAG) {
            // this.mChart.disableScroll();

            let x = event.data.extraData.translationX;
            let y = event.data.extraData.translationY;

            this.performDrag(event, x, y);
        } else if (this.mTouchMode == ChartTouchListener.NONE) {
            if (this.mChart.isDragEnabled()) {
                const shouldPan = !this.mChart.isFullyZoomedOut() || !this.mChart.hasNoDragOffset();

                if (shouldPan) {
                    // let distanceX = Math.abs(event.getX() - this.mTouchStartPoint.x);
                    // let distanceY = Math.abs(event.getY() - this.mTouchStartPoint.y);

                    // Disable dragging in a direction that's disallowed
                    if (this.mChart.isDragXEnabled() && this.mChart.isDragYEnabled()) {
                        this.mLastGesture = ChartGesture.DRAG;
                        this.mTouchMode = ChartTouchListener.DRAG;
                    }
                } else {
                    if (this.mChart.isHighlightPerDragEnabled()) {
                        this.mLastGesture = ChartGesture.DRAG;

                        if (this.mChart.isHighlightPerDragEnabled()) this.performHighlightDrag(event);
                    }
                }
            }
        }
        this.mMatrix = this.mChart.getViewPortHandler().refresh(this.mMatrix, this.mChart, true);
    }
    onPinchGestureState(event: GestureStateEventData) {
        console.log('onPinchGestureState', event.data.state, event.data.prevState, event.data.extraData, this.mTouchMode);
        if (!this.mChart.isScaleXEnabled() && !this.mChart.isScaleYEnabled()) return;
        const state = event.data.state;
        switch (state) {
            case GestureState.ACTIVE:
                console.log('starting Pinch', (event.object as any).minSpan);
                // if (event.data.extraData.numberOfPointers >= 2) {
                // this.mChart.disableScroll();

                this.saveTouchStart(event);
                // this.mSavedScale = event.data.extraData.scale;
                // get the distance between the pointers on the x-axis
                this.mSavedXDist = BarLineChartTouchListener.getXDist(event);

                // get the distance between the pointers on the y-axis
                this.mSavedYDist = BarLineChartTouchListener.getYDist(event);

                // get the total distance between the pointers
                // this.mSavedDist = spacing(event);

                // if (this.mSavedScale > 10) {

                if (this.mChart.isPinchZoomEnabled()) {
                    this.mTouchMode = ChartTouchListener.PINCH_ZOOM;
                } else {
                    if (this.mChart.isScaleXEnabled() !== this.mChart.isScaleYEnabled()) {
                        this.mTouchMode = this.mChart.isScaleXEnabled() ? ChartTouchListener.X_ZOOM : ChartTouchListener.Y_ZOOM;
                    } else {
                        this.mTouchMode = this.mSavedXDist > this.mSavedYDist ? ChartTouchListener.X_ZOOM : ChartTouchListener.Y_ZOOM;
                    }
                }
                // }

                // determine the touch-pointer center
                this.mTouchPointCenter.x = event.data.extraData.focalX;
                this.mTouchPointCenter.y = event.data.extraData.focalY;
                // midPoint(mTouchPointCenter, event);
                // }
                break;
            // case GestureState.ACTIVE:
            //     if (this.mTouchMode === ChartTouchListener.X_ZOOM || this.mTouchMode === ChartTouchListener.Y_ZOOM || this.mTouchMode === ChartTouchListener.PINCH_ZOOM) {
            //         this.mChart.disableScroll();

            //         if (this.mChart.isScaleXEnabled() || this.mChart.isScaleYEnabled()) {
            //             if (event.data.extraData.numberOfPointers >= 2) {
            //                 if (this.mTouchMode === ChartTouchListener.PINCH_ZOOM) {
            //                     this.mLastGesture = ChartGesture.PINCH_ZOOM;
            //                     const t = this.getTrans(this.mTouchPointCenter.x, this.mTouchPointCenter.y);

            //                     const scale = event.data.extraData.scale;
            //                     const isZoomingOut = scale < 1;
            //                     const h = this.mChart.getViewPortHandler();

            //                     const canZoomMoreX = isZoomingOut ? h.canZoomOutMoreX() : h.canZoomInMoreX();

            //                     const canZoomMoreY = isZoomingOut ? h.canZoomOutMoreY() : h.canZoomInMoreY();

            //                     let scaleX = this.mChart.isScaleXEnabled() ? scale : 1;
            //                     let scaleY = this.mChart.isScaleYEnabled() ? scale : 1;

            //                     if (canZoomMoreY || canZoomMoreX) {
            //                         this.mMatrix.set(this.mSavedMatrix);
            //                         this.mMatrix.postScale(scaleX, scaleY, t.x, t.y);

            //                         // if (l != null)
            //                         // l.onChartScale(event, scaleX, scaleY);
            //                     }
            //                 } else if (this.mTouchMode === ChartTouchListener.X_ZOOM && this.mChart.isScaleXEnabled()) {
            //                     this.mLastGesture = ChartGesture.X_ZOOM;
            //                     const t = this.getTrans(this.mTouchPointCenter.x, this.mTouchPointCenter.y);

            //                     // let xDist = getXDist(event);
            //                     const scaleX = event.data.extraData.scale;
            //                     const h = this.mChart.getViewPortHandler();
            //                     // let scaleX = xDist / this.mSavedXDist; // x-axis scale

            //                     const isZoomingOut = scaleX < 1;
            //                     const canZoomMoreX = isZoomingOut ? h.canZoomOutMoreX() : h.canZoomInMoreX();

            //                     if (canZoomMoreX) {
            //                         this.mMatrix.set(this.mSavedMatrix);
            //                         this.mMatrix.postScale(scaleX, 1, t.x, t.y);

            //                         // if (l != null)
            //                         // l.onChartScale(event, scaleX, 1);
            //                     }
            //                 } else if (this.mTouchMode === ChartTouchListener.Y_ZOOM && this.mChart.isScaleYEnabled()) {
            //                     this.mLastGesture = ChartGesture.Y_ZOOM;
            //                     const t = this.getTrans(this.mTouchPointCenter.x, this.mTouchPointCenter.y);

            //                     // let yDist = getYDist(event);
            //                     // let scaleY = yDist / this.mSavedYDist; // y-axis scale
            //                     const scaleY = event.data.extraData.scale;
            //                     const h = this.mChart.getViewPortHandler();

            //                     const isZoomingOut = scaleY < 1;
            //                     const canZoomMoreY = isZoomingOut ? h.canZoomOutMoreY() : h.canZoomInMoreY();

            //                     if (canZoomMoreY) {
            //                         this.mMatrix.set(this.mSavedMatrix);
            //                         this.mMatrix.postScale(1, scaleY, t.x, t.y);

            //                         // if (l != null)
            //                         // l.onChartScale(event, 1, scaleY);
            //                     }
            //                 }
            //             }
            //         }
            //     }
            //     break;
            case GestureState.END:
            case GestureState.CANCELLED:
                if (
                    this.mTouchMode === ChartTouchListener.X_ZOOM ||
                    this.mTouchMode === ChartTouchListener.Y_ZOOM ||
                    this.mTouchMode === ChartTouchListener.PINCH_ZOOM ||
                    this.mTouchMode === ChartTouchListener.POST_ZOOM
                ) {
                    this.mTouchMode = ChartTouchListener.NONE;
                    console.log('ending pinch', this.mTouchMode);
                    // Range might have changed, which means that Y-axis labels
                    // could have changed in size, affecting Y-axis size.
                    // So we need to recalculate offsets.
                    this.mChart.calculateOffsets();
                    this.mChart.invalidate();
                }
                break;
        }
        // this.mMatrix = this.mChart.getViewPortHandler().refresh(this.mMatrix, this.mChart, true);
    }
    onPinchGestureTouch(event: GestureTouchEventData) {
        // console.log('onPinchGestureTouch', event.data.state, event.data.extraData, this.mChart.isScaleXEnabled(), this.mChart.isScaleYEnabled(), this.mTouchMode);
        if (!this.mChart.isScaleXEnabled() && !this.mChart.isScaleYEnabled()) return;

        if (event.data.state !== GestureState.ACTIVE) {
            return;
        }
        // const state = event.data.state;
        // switch (state) {
        //     case GestureState.BEGAN:
        //         if (event.data.extraData.numberOfPointers >= 2) {
        //             this.mChart.disableScroll();

        //             this.saveTouchStart(event);
        //             // this.mSavedScale = event.data.extraData.scale;
        //             // get the distance between the pointers on the x-axis
        //             // this.mSavedXDist = this.getXDist(event);

        //             // get the distance between the pointers on the y-axis
        //             // this.mSavedYDist = getYDist(event);

        //             // get the total distance between the pointers
        //             // this.mSavedDist = spacing(event);

        //             // if (this.mSavedScale > 10) {

        //             if (this.mChart.isPinchZoomEnabled()) {
        //                 this.mTouchMode = ChartTouchListener.PINCH_ZOOM;
        //             } else {
        //                 if (this.mChart.isScaleXEnabled() != this.mChart.isScaleYEnabled()) {
        //                     this.mTouchMode = this.mChart.isScaleXEnabled() ? ChartTouchListener.X_ZOOM : ChartTouchListener.Y_ZOOM;
        //                 } else {
        //                     this.mTouchMode = this.mSavedXDist > this.mSavedYDist ? ChartTouchListener.X_ZOOM : ChartTouchListener.Y_ZOOM;
        //                 }
        //             }
        //             // }

        //             // determine the touch-pointer center
        //             this.mTouchPointCenter.x = event.data.extraData.focalX;
        //             this.mTouchPointCenter.y = event.data.extraData.focalY;
        //             // midPoint(mTouchPointCenter, event);
        //         }
        //         break;
        //     case GestureState.ACTIVE:
        if (this.mTouchMode === ChartTouchListener.X_ZOOM || this.mTouchMode === ChartTouchListener.Y_ZOOM || this.mTouchMode === ChartTouchListener.PINCH_ZOOM) {
            // this.mChart.disableScroll();

            // if (this.mChart.isScaleXEnabled() || this.mChart.isScaleYEnabled()) {
            // if (event.data.extraData.numberOfPointers >= 2) {
            if (this.mTouchMode === ChartTouchListener.PINCH_ZOOM) {
                this.mLastGesture = ChartGesture.PINCH_ZOOM;
                const t = this.getTrans(this.mTouchPointCenter.x, this.mTouchPointCenter.y); //focalPoint

                const scale = event.data.extraData.scale;
                const isZoomingOut = scale < 1;
                const h = this.mChart.getViewPortHandler();

                const canZoomMoreX = isZoomingOut ? h.canZoomOutMoreX() : h.canZoomInMoreX();

                const canZoomMoreY = isZoomingOut ? h.canZoomOutMoreY() : h.canZoomInMoreY();

                let scaleX = this.mChart.isScaleXEnabled() ? scale : 1;
                let scaleY = this.mChart.isScaleYEnabled() ? scale : 1;

                if (canZoomMoreY || canZoomMoreX) {
                    this.mMatrix.set(this.mSavedMatrix);
                    this.mMatrix.postScale(scaleX, scaleY, t.x, t.y);

                    // if (l != null)
                    // l.onChartScale(event, scaleX, scaleY);
                }
            } else if (this.mTouchMode === ChartTouchListener.X_ZOOM && this.mChart.isScaleXEnabled()) {
                this.mLastGesture = ChartGesture.X_ZOOM;
                const t = this.getTrans(this.mTouchPointCenter.x, this.mTouchPointCenter.y);

                // let xDist = getXDist(event);
                const scaleX = event.data.extraData.scale;
                const h = this.mChart.getViewPortHandler();
                // let scaleX = xDist / this.mSavedXDist; // x-axis scale

                const isZoomingOut = scaleX < 1;
                const canZoomMoreX = isZoomingOut ? h.canZoomOutMoreX() : h.canZoomInMoreX();

                if (canZoomMoreX) {
                    this.mMatrix.set(this.mSavedMatrix);
                    this.mMatrix.postScale(scaleX, 1, t.x, t.y);

                    // if (l != null)
                    // l.onChartScale(event, scaleX, 1);
                }
            } else if (this.mTouchMode === ChartTouchListener.Y_ZOOM && this.mChart.isScaleYEnabled()) {
                this.mLastGesture = ChartGesture.Y_ZOOM;
                const t = this.getTrans(this.mTouchPointCenter.x, this.mTouchPointCenter.y);

                // let yDist = getYDist(event);
                // let scaleY = yDist / this.mSavedYDist; // y-axis scale
                const scaleY = event.data.extraData.scale;
                const h = this.mChart.getViewPortHandler();

                const isZoomingOut = scaleY < 1;
                const canZoomMoreY = isZoomingOut ? h.canZoomOutMoreY() : h.canZoomInMoreY();

                if (canZoomMoreY) {
                    this.mMatrix.set(this.mSavedMatrix);
                    this.mMatrix.postScale(1, scaleY, t.x, t.y);

                    // if (l != null)
                    // l.onChartScale(event, 1, scaleY);
                }
                // }
            }
            // }
        }
        //         break;
        //     case GestureState.END:
        //     case GestureState.CANCELLED:
        //         if (
        //             this.mTouchMode === ChartTouchListener.X_ZOOM ||
        //             this.mTouchMode === ChartTouchListener.Y_ZOOM ||
        //             this.mTouchMode === ChartTouchListener.PINCH_ZOOM ||
        //             this.mTouchMode === ChartTouchListener.POST_ZOOM
        //         ) {
        //             this.mTouchMode === ChartTouchListener.NONE;
        //             // Range might have changed, which means that Y-axis labels
        //             // could have changed in size, affecting Y-axis size.
        //             // So we need to recalculate offsets.
        //             this.mChart.calculateOffsets();
        //             this.mChart.invalidate();
        //         }
        //         break;
        // }
        this.mMatrix = this.mChart.getViewPortHandler().refresh(this.mMatrix, this.mChart, true);
    }

    // public onTouch( v,  event) {

    //     // if (mVelocityTracker == null) {
    //     //     this.mVelocityTracker = VelocityTracker.obtain();
    //     // }
    //     // this.mVelocityTracker.addMovement(event);

    //     // if (event.getActionMasked() == MotionEvent.ACTION_CANCEL) {
    //     //     if (mVelocityTracker != null) {
    //     //         this.mVelocityTracker.recycle();
    //     //         this.mVelocityTracker = null;
    //     //     }
    //     // }

    //     // if (mTouchMode == NONE) {
    //     //     this.mGestureDetector.onTouchEvent(event);
    //     // }

    //     // if (!mChart.isDragEnabled() && (!mChart.isScaleXEnabled() && !mChart.isScaleYEnabled()))
    //     //     return true;

    //     // Handle touch events here...
    //     switch (event.getAction() & MotionEvent.ACTION_MASK) {

    //         case MotionEvent.ACTION_DOWN:

    //             // startAction(event);

    //             // stopDeceleration();

    //             // saveTouchStart(event);

    //             break;

    //         case MotionEvent.ACTION_POINTER_DOWN:

    //             // if (event.getPointerCount() >= 2) {

    //             //     this.mChart.disableScroll();

    //             //     saveTouchStart(event);

    //             //     // get the distance between the pointers on the x-axis
    //             //     this.mSavedXDist = getXDist(event);

    //             //     // get the distance between the pointers on the y-axis
    //             //     this.mSavedYDist = getYDist(event);

    //             //     // get the total distance between the pointers
    //             //     this.mSavedDist = spacing(event);

    //             //     if (mSavedDist > 10) {

    //             //         if (mChart.isPinchZoomEnabled()) {
    //             //             this.mTouchMode = PINCH_ZOOM;
    //             //         } else {
    //             //             if (mChart.isScaleXEnabled() != this.mChart.isScaleYEnabled()) {
    //             //                 this.mTouchMode = this.mChart.isScaleXEnabled() ? X_ZOOM : Y_ZOOM;
    //             //             } else {
    //             //                 this.mTouchMode = this.mSavedXDist > this.mSavedYDist ? X_ZOOM : Y_ZOOM;
    //             //             }
    //             //         }
    //             //     }

    //             //     // determine the touch-pointer center
    //             //     midPoint(mTouchPointCenter, event);
    //             // }
    //             break;

    //         case MotionEvent.ACTION_MOVE:

    //             // if (mTouchMode == DRAG) {

    //             //     this.mChart.disableScroll();

    //             //     let x = this.mChart.isDragXEnabled() ? event.getX() - this.mTouchStartPoint.x : 0;
    //             //     let y = this.mChart.isDragYEnabled() ? event.getY() - this.mTouchStartPoint.y : 0;

    //             //     this.performDrag(event, x, y);

    //             // } else if (mTouchMode == X_ZOOM || this.mTouchMode == Y_ZOOM || this.mTouchMode == PINCH_ZOOM) {

    //             //     this.mChart.disableScroll();

    //             //     if (mChart.isScaleXEnabled() || this.mChart.isScaleYEnabled())
    //             //         performZoom(event);

    //             // } else if (mTouchMode == NONE
    //             //         && Math.abs(distance(event.getX(), this.mTouchStartPoint.x, event.getY(),
    //             //         this.mTouchStartPoint.y)) > this.mDragTriggerDist) {

    //             //     if (mChart.isDragEnabled()) {

    //             //         boolean shouldPan = !mChart.isFullyZoomedOut() ||
    //             //                 !mChart.hasNoDragOffset();

    //             //         if (shouldPan) {

    //             //             let distanceX = Math.abs(event.getX() - this.mTouchStartPoint.x);
    //             //             let distanceY = Math.abs(event.getY() - this.mTouchStartPoint.y);

    //             //             // Disable dragging in a direction that's disallowed
    //             //             if ((mChart.isDragXEnabled() || distanceY >= distanceX) &&
    //             //                     (mChart.isDragYEnabled() || distanceY <= distanceX)) {

    //             //                 this.mLastGesture = ChartGesture.DRAG;
    //             //                 this.mTouchMode = DRAG;
    //             //             }

    //             //         } else {

    //             //             if (mChart.isHighlightPerDragEnabled()) {
    //             //                 this.mLastGesture = ChartGesture.DRAG;

    //             //                 if (mChart.isHighlightPerDragEnabled())
    //             //                     performHighlightDrag(event);
    //             //             }
    //             //         }

    //             //     }

    //             // }
    //             break;

    //         case MotionEvent.ACTION_UP:

    //             // final VelocityTracker velocityTracker = this.mVelocityTracker;
    //             // const pointerId = event.getPointerId(0);
    //             // velocityTracker.computeCurrentVelocity(1000, Utils.getMaximumFlingVelocity());
    //             // const velocityY = velocityTracker.getYVelocity(pointerId);
    //             // const velocityX = velocityTracker.getXVelocity(pointerId);

    //             // if (Math.abs(velocityX) > Utils.getMinimumFlingVelocity() ||
    //             //         Math.abs(velocityY) > Utils.getMinimumFlingVelocity()) {

    //             //     if (mTouchMode == DRAG && this.mChart.isDragDecelerationEnabled()) {

    //             //         stopDeceleration();

    //             //         this.mDecelerationLastTime = AnimationUtils.currentAnimationTimeMillis();

    //             //         this.mDecelerationCurrentPoint.x = event.getX();
    //             //         this.mDecelerationCurrentPoint.y = event.getY();

    //             //         this.mDecelerationVelocity.x = velocityX;
    //             //         this.mDecelerationVelocity.y = velocityY;

    //             //         Utils.postInvalidateOnAnimation(mChart); // This causes computeScroll to fire, recommended for this by
    //             //         // Google
    //             //     }
    //             // }

    //             // if (mTouchMode == X_ZOOM ||
    //             //         this.mTouchMode == Y_ZOOM ||
    //             //         this.mTouchMode == PINCH_ZOOM ||
    //             //         this.mTouchMode == POST_ZOOM) {

    //             //     // Range might have changed, which means that Y-axis labels
    //             //     // could have changed in size, affecting Y-axis size.
    //             //     // So we need to recalculate offsets.
    //             //     this.mChart.calculateOffsets();
    //             //     this.mChart.postInvalidate();
    //             // }

    //             // this.mTouchMode = NONE;
    //             // this.mChart.enableScroll();

    //             // if (mVelocityTracker != null) {
    //             //     this.mVelocityTracker.recycle();
    //             //     this.mVelocityTracker = null;
    //             // }

    //             endAction(event);

    //             break;
    //         case MotionEvent.ACTION_POINTER_UP:
    //             Utils.velocityTrackerPointerUpCleanUpIfNecessary(event, this.mVelocityTracker);

    //             this.mTouchMode = POST_ZOOM;
    //             break;

    //         case MotionEvent.ACTION_CANCEL:

    //             this.mTouchMode = NONE;
    //             endAction(event);
    //             break;
    //     }

    //     // perform the transformation, update the chart
    //     this.mMatrix = this.mChart.getViewPortHandler().refresh(mMatrix, this.mChart, true);

    //     return true; // indicate event was handled
    // }

    /**
     * ################ ################ ################ ################
     */
    /** BELOW CODE PERFORMS THE ACTUAL TOUCH ACTIONS */

    /**
     * Saves the current Matrix state and the touch-start point.
     *
     * @param event
     */
    private saveTouchStart(event: GestureStateEventData) {
        this.mSavedMatrix.set(this.mMatrix);
        // const extraData = event.data.extraData;
        // this.mTouchStartPoint.x = extraData.focalX || extraData.x;
        // this.mTouchStartPoint.y = extraData.focalY || extraData.y;
        // this.mClosestDataSetToTouch = this.mChart.getDataSetByTouchPoint(this.mTouchStartPoint.x, this.mTouchStartPoint.y);
    }

    /**
     * Performs all necessary operations needed for dragging.
     *
     * @param event
     */
    private performDrag(event, distanceX, distanceY) {
        this.mLastGesture = ChartTouchListener.DRAG;

        this.mMatrix.set(this.mSavedMatrix);

        // OnChartGestureListener l = this.mChart.getOnChartGestureListener();

        // check if axis is inverted
        if (this.inverted()) {
            // if there is an inverted horizontalbarchart
            // TOOD: uncomment
            // if (this.mChart instanceof HorizontalBarChart) {
            // distanceX = -distanceX;
            // } else {
            distanceY = -distanceY;
            // }
        }

        this.mMatrix.postTranslate(distanceX, distanceY);

        // if (l != null)
        // l.onChartTranslate(event, distanceX, distanceY);
    }

    /**
     * Performs the all operations necessary for pinch and axis zoom.
     *
     * @param event
     */
    // private  performZoom( scale) {

    //     // if (event.getPointerCount() >= 2) { // two finger zoom

    //         // OnChartGestureListener l = this.mChart.getOnChartGestureListener();

    //         // get the distance between the pointers of the touch event
    //         let totalDist = spacing(event);

    //         if (totalDist > this.mMinScalePointerDistance) {

    //             // get the translation
    //             MPPointF t = getTrans(mTouchPointCenter.x, this.mTouchPointCenter.y);
    //             ViewPortHandler h = this.mChart.getViewPortHandler();

    //             // take actions depending on the activated touch mode
    //             if (mTouchMode == PINCH_ZOOM) {

    //                 this.mLastGesture = ChartGesture.PINCH_ZOOM;

    //                 let scale = totalDist / this.mSavedDist; // total scale

    //                 boolean isZoomingOut = (scale < 1);

    //                 boolean canZoomMoreX = isZoomingOut ?
    //                         h.canZoomOutMoreX() :
    //                         h.canZoomInMoreX();

    //                 boolean canZoomMoreY = isZoomingOut ?
    //                         h.canZoomOutMoreY() :
    //                         h.canZoomInMoreY();

    //                 let scaleX = (mChart.isScaleXEnabled()) ? scale : 1;
    //                 let scaleY = (mChart.isScaleYEnabled()) ? scale : 1;

    //                 if (canZoomMoreY || canZoomMoreX) {

    //                     this.mMatrix.set(mSavedMatrix);
    //                     this.mMatrix.postScale(scaleX, scaleY, t.x, t.y);

    //                     if (l != null)
    //                         l.onChartScale(event, scaleX, scaleY);
    //                 }

    //             } else if (mTouchMode == X_ZOOM && this.mChart.isScaleXEnabled()) {

    //                 this.mLastGesture = ChartGesture.X_ZOOM;

    //                 let xDist = getXDist(event);
    //                 let scaleX = xDist / this.mSavedXDist; // x-axis scale

    //                 boolean isZoomingOut = (scaleX < 1);
    //                 boolean canZoomMoreX = isZoomingOut ?
    //                         h.canZoomOutMoreX() :
    //                         h.canZoomInMoreX();

    //                 if (canZoomMoreX) {

    //                     this.mMatrix.set(mSavedMatrix);
    //                     this.mMatrix.postScale(scaleX, 1, t.x, t.y);

    //                     if (l != null)
    //                         l.onChartScale(event, scaleX, 1);
    //                 }

    //             } else if (mTouchMode == Y_ZOOM && this.mChart.isScaleYEnabled()) {

    //                 this.mLastGesture = ChartGesture.Y_ZOOM;

    //                 let yDist = getYDist(event);
    //                 let scaleY = yDist / this.mSavedYDist; // y-axis scale

    //                 boolean isZoomingOut = (scaleY < 1);
    //                 boolean canZoomMoreY = isZoomingOut ?
    //                         h.canZoomOutMoreY() :
    //                         h.canZoomInMoreY();

    //                 if (canZoomMoreY) {

    //                     this.mMatrix.set(mSavedMatrix);
    //                     this.mMatrix.postScale(1, scaleY, t.x, t.y);

    //                     if (l != null)
    //                         l.onChartScale(event, 1, scaleY);
    //                 }
    //             }

    //             MPPointF.recycleInstance(t);
    //         }
    //     }
    // }

    /**
     * Highlights upon dragging, generates callbacks for the selection-listener.
     *
     * @param e
     */
    private performHighlightDrag(event: GestureTouchEventData) {
        const h = this.mChart.getHighlightByTouchPoint(event.data.extraData.x, event.data.extraData.y);

        if (h != null && h !== this.mLastHighlighted) {
            this.mLastHighlighted = h;
            this.mChart.highlight(h, true);
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
    // private static void midPoint(MPPointF point, MotionEvent event) {
    //     let x = event.getX(0) + event.getX(1);
    //     let y = event.getY(0) + event.getY(1);
    //     point.x = (x / 2f);
    //     point.y = (y / 2f);
    // }

    /**
     * returns the distance between two pointer touch points
     *
     * @param event
     * @return
     */
    // private static  spacing( event: GestureStateEventData) {

    //     let x = event.getX(0) - event.getX(1);
    //     let y = event.getY(0) - event.getY(1);
    //     return  Math.sqrt(x * x + y * y);
    // }

    /**
     * calculates the distance on the x-axis between two pointers (fingers on
     * the display)
     *
     * @param e
     * @return
     */
    private static getXDist(e: GestureStateEventData) {
        let x = Math.abs(e.data.extraData.positions[0] - e.data.extraData.positions[2]);
        return x;
    }

    /**
     * calculates the distance on the y-axis between two pointers (fingers on
     * the display)
     *
     * @param e
     * @return
     */
    private static getYDist(e: GestureStateEventData) {
        let y = Math.abs(e.data.extraData.positions[1] - e.data.extraData.positions[3]);
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
    public getTrans(x, y) {
        const vph = this.mChart.getViewPortHandler();

        let xTrans = x - vph.offsetLeft();
        let yTrans = 0;

        // check if axis is inverted
        if (this.inverted()) {
            yTrans = -(y - vph.offsetTop());
        } else {
            yTrans = -(this.mChart.getMeasuredHeight() - y - vph.offsetBottom());
        }

        return { x: xTrans, y: yTrans };
    }

    /**
     * Returns true if the current touch situation should be interpreted as inverted, false if not.
     *
     * @return
     */
    private inverted() {
        return (
            (this.mClosestDataSetToTouch == null && this.mChart.isAnyAxisInverted()) || (this.mClosestDataSetToTouch != null && this.mChart.isInverted(this.mClosestDataSetToTouch.getAxisDependency()))
        );
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
    public getMatrix() {
        return this.mMatrix;
    }

    /**
     * Sets the minimum distance that will be interpreted as a "drag" by the chart in dp.
     * Default: 3dp
     *
     * @param dragTriggerDistance
     */
    public setDragTriggerDist(dragTriggerDistance) {
        this.mDragTriggerDist = Utils.convertDpToPixel(dragTriggerDistance);
    }

    // public onDoubleTap( e) {

    //     this.mLastGesture = ChartGesture.DOUBLE_TAP;

    //     OnChartGestureListener l = this.mChart.getOnChartGestureListener();

    //     if (l != null) {
    //         l.onChartDoubleTapped(e);
    //     }

    //     // check if double-tap zooming is enabled
    //     if (mChart.isDoubleTapToZoomEnabled() && this.mChart.getData().getEntryCount() > 0) {

    //         MPPointF trans = getTrans(e.getX(), e.getY());

    //         this.mChart.zoom(mChart.isScaleXEnabled() ? 1.4f : 1, this.mChart.isScaleYEnabled() ? 1.4f : 1, trans.x, trans.y);

    //         if (mChart.isLogEnabled())
    //             console.log("BarlineChartTouch", "Double-Tap, Zooming In, x: " + trans.x + ", y: "
    //                     + trans.y);

    //         MPPointF.recycleInstance(trans);
    //     }

    //     return super.onDoubleTap(e);
    // }

    // public onLongPressGesture(event: GestureStateEventData) {
    //     console.log('onLongPressGesture', event.data.state, event.data.prevState, event.data.extraData);
    //     if (event.data.state === GestureState.ACTIVE) {
    //         // this.mLastGesture = ChartGesture.LONG_PRESS;
    //     }

    //     // OnChartGestureListener l = this.mChart.getOnChartGestureListener();

    //     // if (l != null) {

    //     //     l.onChartLongPressed(e);
    //     // }
    // }
    onDoubleTapGesture(event: GestureStateEventData) {
        // console.log('onDoubleTapGesture', event.data.state, event.data.prevState, event.data.extraData);
        if (event.data.state === GestureState.END && event.data.prevState === GestureState.ACTIVE) {
            // check if double-tap zooming is enabled
            if (this.mChart.isDoubleTapToZoomEnabled() && this.mChart.getData().getEntryCount() > 0) {
                const trans = this.getTrans(event.data.extraData.x, event.data.extraData.y);

                this.mChart.zoom(this.mChart.isScaleXEnabled() ? 1.4 : 1, this.mChart.isScaleYEnabled() ? 1.4 : 1, trans.x, trans.y);

                if (this.mChart.isLogEnabled()) console.log('BarlineChartTouch', 'Double-Tap, Zooming In, x: ' + trans.x + ', y: ' + trans.y);

                // MPPointF.recycleInstance(trans);
            }
        }
    }
    public onTapGesture(event: GestureStateEventData) {
        // console.log('onTapGesture', event.data.state, event.data.prevState, event.data.extraData);
        if (event.data.state === GestureState.END && event.data.prevState === GestureState.ACTIVE) {
            this.mLastGesture = ChartGesture.SINGLE_TAP;
            // OnChartGestureListener l = this.mChart.getOnChartGestureListener();

            // if (l != null) {
            //     l.onChartSingleTapped(e);
            // }
            if (!this.mChart.isHighlightPerTapEnabled()) {
                return;
            }

            const h = this.mChart.getHighlightByTouchPoint(event.data.extraData.x, event.data.extraData.y);
            this.performHighlight(h);
        }
    }

    // public onFling(MotionEvent e1, MotionEvent e2, let velocityX, let velocityY) {

    //     this.mLastGesture = ChartGesture.FLING;

    //     OnChartGestureListener l = this.mChart.getOnChartGestureListener();

    //     if (l != null) {
    //         l.onChartFling(e1, e2, velocityX, velocityY);
    //     }

    //     return super.onFling(e1, e2, velocityX, velocityY);
    // }

    public stopDeceleration() {
        this.mDecelerationVelocity.x = 0;
        this.mDecelerationVelocity.y = 0;
    }

    // public computeScroll() {

    //     if (this.mDecelerationVelocity.x == 0 && this.mDecelerationVelocity.y == 0)
    //         return; // There's no deceleration in progress

    //     const  currentTime = Date.now();;

    //     this.mDecelerationVelocity.x *= this.mChart.getDragDecelerationFrictionCoef();
    //     this.mDecelerationVelocity.y *= this.mChart.getDragDecelerationFrictionCoef();

    //     const timeInterval =  (currentTime - this.mDecelerationLastTime) / 1000;

    //     let distanceX = this.mDecelerationVelocity.x * timeInterval;
    //     let distanceY = this.mDecelerationVelocity.y * timeInterval;

    //     this.mDecelerationCurrentPoint.x += distanceX;
    //     this.mDecelerationCurrentPoint.y += distanceY;

    //     MotionEvent event = MotionEvent.obtain(currentTime, currentTime, MotionEvent.ACTION_MOVE, this.mDecelerationCurrentPoint.x,
    //             this.mDecelerationCurrentPoint.y, 0);

    //     let dragDistanceX = this.mChart.isDragXEnabled() ? this.mDecelerationCurrentPoint.x - this.mTouchStartPoint.x : 0;
    //     let dragDistanceY = this.mChart.isDragYEnabled() ? this.mDecelerationCurrentPoint.y - this.mTouchStartPoint.y : 0;

    //     performDrag(event, dragDistanceX, dragDistanceY);

    //     event.recycle();
    //     this.mMatrix = this.mChart.getViewPortHandler().refresh(mMatrix, this.mChart, false);

    //     this.mDecelerationLastTime = currentTime;

    //     if (Math.abs(mDecelerationVelocity.x) >= 0.01 || Math.abs(mDecelerationVelocity.y) >= 0.01)
    //         Utils.postInvalidateOnAnimation(mChart); // This causes computeScroll to fire, recommended for this by Google
    //     else {
    //         // Range might have changed, which means that Y-axis labels
    //         // could have changed in size, affecting Y-axis size.
    //         // So we need to recalculate offsets.
    //         this.mChart.calculateOffsets();
    //         this.mChart.postInvalidate();

    //         stopDeceleration();
    //     }
    // }
}
