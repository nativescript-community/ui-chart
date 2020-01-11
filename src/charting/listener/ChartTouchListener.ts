import { Chart } from '../charts/Chart';
import { Highlight } from '../highlight/Highlight';
import {
    Manager,
    GestureHandlerTouchEvent,
    GestureHandlerStateEvent,
    GestureStateEventData,
    GestureTouchEventData,
    HandlerType,
    PanGestureHandler,
    PinchGestureHandler,
    TapGestureHandler,
    LongPressGestureHandler
} from 'nativescript-gesturehandler';

export enum ChartGesture {
    NONE,
    DRAG,
    X_ZOOM,
    Y_ZOOM,
    PINCH_ZOOM,
    ROTATE,
    SINGLE_TAP,
    DOUBLE_TAP,
    LONG_PRESS,
    FLING
}
/**
 * Created by philipp on 12/06/15.
 */
export abstract class ChartTouchListener<T extends Chart<any, any, any>> {
    /**
     * the last touch gesture that has been performed
     **/
    protected mLastGesture = ChartGesture.NONE;

    // states
    protected static NONE = 0;
    protected static DRAG = 1;
    protected static X_ZOOM = 2;
    protected static Y_ZOOM = 3;
    protected static PINCH_ZOOM = 4;
    protected static POST_ZOOM = 5;
    protected static ROTATE = 6;

    /**
     * integer field that holds the current touch-state
     */
    protected mTouchMode = ChartTouchListener.NONE;

    /**
     * the last highlighted object (via touch)
     */
    protected mLastHighlighted: Highlight;

    /**
     * the gesturedetector used for detecting taps and longpresses, ...
     */
    // protected mGestureDetector: GestureDetector;

    /**
     * the chart the listener represents
     */
    protected mChart: T;

    panGestureHandler: PanGestureHandler;
    pinchGestureHandler: PinchGestureHandler;
    tapGestureHandler: TapGestureHandler;
    doubleTapGestureHandler: TapGestureHandler;
    // longpressGestureHandler: LongPressGestureHandler;

    abstract onPanGestureState(event: GestureStateEventData);
    abstract onPanGestureTouch(event: GestureTouchEventData);
    abstract onPinchGestureState(event: GestureStateEventData);
    abstract onPinchGestureTouch(event: GestureTouchEventData);
    abstract onTapGesture(event: GestureStateEventData);
    abstract onDoubleTapGesture(event: GestureStateEventData);
    // abstract onLongPressGesture(event: GestureStateEventData);
    constructor(chart: T) {
        this.mChart = chart;

        const manager = Manager.getInstance();
        this.panGestureHandler = manager
            .createGestureHandler(HandlerType.PAN, 11230, {
                minPointers: 1,
                maxPointers: 1,
                shouldCancelWhenOutside: false
            })
            .on(GestureHandlerStateEvent, this.onPanGestureState, this)
            .on(GestureHandlerTouchEvent, this.onPanGestureTouch, this);

        this.pinchGestureHandler = manager
            .createGestureHandler(HandlerType.PINCH, 11231, {
                minSpan:20,
                shouldCancelWhenOutside: false
            })
            .on(GestureHandlerStateEvent, this.onPinchGestureState, this)
            .on(GestureHandlerTouchEvent, this.onPinchGestureTouch, this);
        this.doubleTapGestureHandler = manager.createGestureHandler(HandlerType.TAP, 11234, { numberOfTaps: 2 }).on(GestureHandlerStateEvent, this.onDoubleTapGesture, this);

        this.tapGestureHandler = manager.createGestureHandler(HandlerType.TAP, 11232, { waitFor: [11234] }).on(GestureHandlerStateEvent, this.onTapGesture, this);

        // this.longpressGestureHandler = manager
            // .createGestureHandler(HandlerType.LONG_PRESS, 11233, { minPointers: 1, maxPointers: 1, minDurationMs: 800 })
        //     .on(GestureHandlerStateEvent, this.onLongPressGesture, this);

        // this.mGestureDetector = new GestureDetector(chart.getContext(), this);
    }
    dispose() {
        console.log('ChartTouchListener', 'dispose');
        const chart = this.mChart;
        this.panGestureHandler.detachFromView(chart);
        this.pinchGestureHandler.detachFromView(chart);
        this.tapGestureHandler.detachFromView(chart);
        this.doubleTapGestureHandler.detachFromView(chart); 
        // this.longpressGestureHandler.detachFromView(chart);
    }
    init() {
        const chart = this.mChart;
        console.log('ChartTouchListener', 'init', chart, chart.nativeViewProtected);
        this.panGestureHandler.attachToView(chart);
        this.pinchGestureHandler.attachToView(chart);
        this.tapGestureHandler.attachToView(chart);
        this.doubleTapGestureHandler.attachToView(chart);
        // this.longpressGestureHandler.attachToView(chart);
    }
    /**
     * Calls the OnChartGestureListener to do the start callback
     *
     * @param me
     */
    // public startAction(MotionEvent me) {

    //     OnChartGestureListener l = this.mChart.getOnChartGestureListener();

    //     if (l != null)
    //         l.onChartGestureStart(me, this.mLastGesture);
    // }

    /**
     * Calls the OnChartGestureListener to do the end callback
     *
     * @param me
     */
    // public endAction(MotionEvent me) {

    //     OnChartGestureListener l = this.mChart.getOnChartGestureListener();

    //     if (l != null)
    //         l.onChartGestureEnd(me, this.mLastGesture);
    // }

    /**
     * Sets the last value that was highlighted via touch.
     *
     * @param high
     */
    public setLastHighlighted(high: Highlight) {
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
    public getLastGesture() {
        return this.mLastGesture;
    }

    /**
     * Perform a highlight operation.
     *
     * @param e
     */
    protected performHighlight(h: Highlight) {
        if (h == null || h === this.mLastHighlighted) {
            this.mChart.highlight(null, true);
            this.mLastHighlighted = null;
        } else {
            this.mChart.highlight(h, true);
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
    protected static distance(eventX, startX, eventY, startY) {
        let dx = eventX - startX;
        let dy = eventY - startY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
