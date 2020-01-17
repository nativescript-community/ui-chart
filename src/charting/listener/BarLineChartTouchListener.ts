import { Matrix } from 'nativescript-canvas';
import { BarLineChartBase } from '../charts/BarLineChartBase';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { Utils } from '../utils/Utils';
import { ChartGesture, ChartTouchListener } from './ChartTouchListener';
import {
    Manager,
    GestureHandlerTouchEvent,
    GestureHandlerStateEvent,
    GestureState,
    GestureStateEventData,
    GestureTouchEventData,
    HandlerType,
    PanGestureHandler,
    PinchGestureHandler,
    TapGestureHandler,
    LongPressGestureHandler
} from 'nativescript-gesturehandler';

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

    panGestureHandler: PanGestureHandler;
    pinchGestureHandler: PinchGestureHandler;
    tapGestureHandler: TapGestureHandler;
    doubleTapGestureHandler: TapGestureHandler;
    // longpressGestureHandler: LongPressGestureHandler;

    // abstract onPanGestureState(event: GestureStateEventData);
    // abstract onPanGestureTouch(event: GestureTouchEventData);
    // abstract onPinchGestureState(event: GestureStateEventData);
    // abstract onPinchGestureTouch(event: GestureTouchEventData);
    // abstract onTapGesture(event: GestureStateEventData);
    // abstract onDoubleTapGesture(event: GestureStateEventData);

    getOrCreateDoubleTapGestureHandler() {
        if (!this.doubleTapGestureHandler) {
            const manager = Manager.getInstance();
            this.doubleTapGestureHandler = manager.createGestureHandler(HandlerType.TAP, 11234, { numberOfTaps: 2 }).on(GestureHandlerStateEvent, this.onDoubleTapGesture, this);
        }
        return this.doubleTapGestureHandler;
    }
    getOrCreateTapGestureHandler() {
        if (!this.tapGestureHandler) {
            const manager = Manager.getInstance();
            this.tapGestureHandler = manager.createGestureHandler(HandlerType.TAP, 11232, { waitFor: [11234] }).on(GestureHandlerStateEvent, this.onTapGesture, this);
        }
        return this.tapGestureHandler;
    }
    getOrCreatePinchGestureHandler() {
        if (!this.pinchGestureHandler) {
            const manager = Manager.getInstance();

            this.pinchGestureHandler = manager
                .createGestureHandler(HandlerType.PINCH, 11231, {
                    minSpan: 20,
                    shouldCancelWhenOutside: false
                })
                .on(GestureHandlerStateEvent, this.onPinchGestureState, this)
                .on(GestureHandlerTouchEvent, this.onPinchGestureTouch, this);
        }
        return this.pinchGestureHandler;
    }
    getOrCreatePanGestureHandler() {
        if (!this.panGestureHandler) {
            const manager = Manager.getInstance();
            this.panGestureHandler = manager
                .createGestureHandler(HandlerType.PAN, 11230, {
                    minPointers: 1,
                    maxPointers: 1,
                    shouldCancelWhenOutside: false
                })
                .on(GestureHandlerStateEvent, this.onPanGestureState, this)
                .on(GestureHandlerTouchEvent, this.onPanGestureTouch, this);
        }
        return this.panGestureHandler;
    }

    setDoubleTap(enabled: boolean) {
        if (enabled) {
            this.getOrCreateDoubleTapGestureHandler().attachToView(this.mChart);
        } else if (this.doubleTapGestureHandler) {
            this.doubleTapGestureHandler.detachFromView(this.mChart);
        }
    }
    setTap(enabled: boolean) {
        if (enabled) {
            this.getOrCreateTapGestureHandler().attachToView(this.mChart);
        } else if (this.tapGestureHandler) {
            this.tapGestureHandler.detachFromView(this.mChart);
        }
    }
    setPinch(enabled: boolean) {
        if (enabled) {
            this.getOrCreatePinchGestureHandler().attachToView(this.mChart);
        } else if (this.pinchGestureHandler) {
            this.pinchGestureHandler.detachFromView(this.mChart);
        }
    }
    setPan(enabled: boolean) {
        if (enabled) {
            this.getOrCreatePanGestureHandler().attachToView(this.mChart);
        } else if (this.panGestureHandler) {
            this.panGestureHandler.detachFromView(this.mChart);
        }
    }
    dispose() {
        super.dispose();
        const chart = this.mChart;
        this.panGestureHandler && this.panGestureHandler.detachFromView(chart);
        this.pinchGestureHandler && this.pinchGestureHandler.detachFromView(chart);
        this.tapGestureHandler && this.tapGestureHandler.detachFromView(chart);
        this.doubleTapGestureHandler && this.doubleTapGestureHandler.detachFromView(chart);
        // this.longpressGestureHandler.detachFromView(chart);
    }
    init() {
        super.init();

        if (this.mChart.isDoubleTapToZoomEnabled()) {
            this.setDoubleTap(true);
        }
        if (this.mChart.isHighlightPerTapEnabled()) {
            this.setTap(true);
        }
        if (this.mChart.isHighlightPerDragEnabled() || this.mChart.isDragEnabled()) {
            this.setPan(true);
        }
        if (this.mChart.isPinchZoomEnabled()) {
            this.setPinch(true);
        }
        // this.longpressGestureHandler.attachToView(chart);
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
        const chart = this.mChart;
        if (chart.hasListeners('pan')) {
            chart.notify({ eventName: 'pan', data: event.data, object: chart });
        }

        if (!chart.isDragEnabled() && !chart.isScaleXEnabled() && !chart.isScaleYEnabled()) return;

        const data = event.data;

        if (data.state !== GestureState.ACTIVE) {
            return;
        }
        if (this.mTouchMode === ChartTouchListener.DRAG) {
            // this.mChart.disableScroll();

            let x = event.data.extraData.translationX;
            let y = event.data.extraData.translationY;

            this.performDrag(event, x, y);
            this.mMatrix = chart.getViewPortHandler().refresh(this.mMatrix, chart, true);
        } else if (this.mTouchMode == ChartTouchListener.NONE) {
            if (this.mChart.isDragEnabled()) {
                const shouldPan = !chart.isFullyZoomedOut() || !chart.hasNoDragOffset();

                if (shouldPan) {
                    // let distanceX = Math.abs(event.getX() - this.mTouchStartPoint.x);
                    // let distanceY = Math.abs(event.getY() - this.mTouchStartPoint.y);

                    // Disable dragging in a direction that's disallowed
                    if (chart.isDragXEnabled() && chart.isDragYEnabled()) {
                        this.mLastGesture = ChartGesture.DRAG;
                        this.mTouchMode = ChartTouchListener.DRAG;
                    }
                } else {
                    if (chart.isHighlightPerDragEnabled()) {
                        this.mLastGesture = ChartGesture.DRAG;

                        if (chart.isHighlightPerDragEnabled()) this.performHighlightDrag(event);
                    }
                }
            }
        }
    }
    onPinchGestureState(event: GestureStateEventData) {
        // console.log('onPinchGestureState', event.data.state, event.data.prevState, event.data.extraData, this.mTouchMode);
        if (!this.mChart.isScaleXEnabled() && !this.mChart.isScaleYEnabled()) return;
        const state = event.data.state;
        switch (state) {
            case GestureState.ACTIVE:
                // console.log('starting Pinch', (event.object as any).minSpan);
                // if (event.data.extraData.numberOfPointers >= 2) {
                // this.mChart.disableScroll();

                this.saveTouchStart(event);
                // this.mSavedScale = event.data.extraData.scale;
                // get the distance between the pointers on the x-axis
                this.mSavedXDist = BarLineChartTouchListener.getXDist(event);

                // get the distance between the pointers on the y-axis
                this.mSavedYDist = BarLineChartTouchListener.getYDist(event);

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
                break;
            case GestureState.END:
            case GestureState.CANCELLED:
                if (
                    this.mTouchMode === ChartTouchListener.X_ZOOM ||
                    this.mTouchMode === ChartTouchListener.Y_ZOOM ||
                    this.mTouchMode === ChartTouchListener.PINCH_ZOOM ||
                    this.mTouchMode === ChartTouchListener.POST_ZOOM
                ) {
                    this.mTouchMode = ChartTouchListener.NONE;
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
        const chart = this.mChart;
        if (chart.hasListeners('pinch')) {
            chart.notify({ eventName: 'pinch', data: event.data, object: chart });
        }
        // console.log('onPinchGestureTouch', event.data.state, event.data.extraData, this.mChart.isScaleXEnabled(), this.mChart.isScaleYEnabled(), this.mTouchMode);
        if (!chart.isScaleXEnabled() && !chart.isScaleYEnabled()) return;

        if (event.data.state !== GestureState.ACTIVE) {
            return;
        }

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
            this.mMatrix = this.mChart.getViewPortHandler().refresh(this.mMatrix, this.mChart, true);
            // }
        }

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
     * Highlights upon dragging, generates callbacks for the selection-listener.
     *
     * @param e
     */
    private performHighlightDrag(event: GestureTouchEventData) {
        // console.log('performHighlightDrag', event);
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
            yTrans = -(vph.getChartHeight() - y - vph.offsetBottom());
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

    onDoubleTapGesture(event: GestureStateEventData) {
        if (event.data.state === GestureState.END && event.data.prevState === GestureState.ACTIVE) {
            const chart = this.mChart;
            // check if double-tap zooming is enabled
            if (chart.hasListeners('doubleTap')) {
                const h = chart.getHighlightByTouchPoint(event.data.extraData.x, event.data.extraData.y);
                chart.notify({ eventName: 'doubleTap', data: event.data, object: chart, highlight: h });
            }
            if (chart.isDoubleTapToZoomEnabled() && chart.getData().getEntryCount() > 0) {
                const trans = this.getTrans(event.data.extraData.x, event.data.extraData.y);

                chart.zoom(chart.isScaleXEnabled() ? 1.4 : 1, chart.isScaleYEnabled() ? 1.4 : 1, trans.x, trans.y);

                if (chart.isLogEnabled()) console.log('BarlineChartTouch', 'Double-Tap, Zooming In, x: ' + trans.x + ', y: ' + trans.y);

                // MPPointF.recycleInstance(trans);
            }
        }
    }
    public onTapGesture(event: GestureStateEventData) {
        // console.log('onTapGesture', event.data.extraData);
        if (event.data.state === GestureState.END && event.data.prevState === GestureState.ACTIVE) {
            this.mLastGesture = ChartGesture.SINGLE_TAP;
            const chart = this.mChart;

            // OnChartGestureListener l = this.mChart.getOnChartGestureListener();
            const h = chart.getHighlightByTouchPoint(event.data.extraData.x, event.data.extraData.y);
            if (chart.hasListeners('tap')) {
                chart.notify({ eventName: 'tap', data: event.data, object: chart, highlight: h });
            }

            // if (l != null) {
            //     l.onChartSingleTapped(e);
            // }
            if (!chart.isHighlightPerTapEnabled()) {
                return;
            }

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
