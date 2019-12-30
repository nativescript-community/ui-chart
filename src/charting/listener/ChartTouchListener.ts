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
    longpressGestureHandler: LongPressGestureHandler;

    abstract onPanGesture(event: GestureStateEventData);
    abstract onPinchGesture(event: GestureStateEventData);
    abstract onTapGesture(event: GestureStateEventData);
    abstract onLongPressGesture(event: GestureStateEventData);
    constructor(chart: T) {
        this.mChart = chart;

        const manager = Manager.getInstance();
        this.panGestureHandler = manager.createGestureHandler(HandlerType.PAN, 11230, {
            shouldCancelWhenOutside: false
        });
        this.panGestureHandler.on(GestureHandlerStateEvent, this.onPanGesture, this);

        this.pinchGestureHandler = manager.createGestureHandler(HandlerType.PINCH, 11231, {
            shouldCancelWhenOutside: false
        });
        this.pinchGestureHandler.on(GestureHandlerStateEvent, this.onPinchGesture, this);

        this.tapGestureHandler = manager.createGestureHandler(HandlerType.TAP, 11232, {});
        this.tapGestureHandler.on(GestureHandlerStateEvent, this.onTapGesture, this);

        this.longpressGestureHandler = manager.createGestureHandler(HandlerType.LONG_PRESS, 11233, {});
        this.longpressGestureHandler.on(GestureHandlerStateEvent, this.onLongPressGesture, this);

        // this.mGestureDetector = new GestureDetector(chart.getContext(), this);
    }
    dispose() {
        const chart = this.mChart;
        this.panGestureHandler.detachFromView(chart);
        this.pinchGestureHandler.detachFromView(chart);
        this.tapGestureHandler.detachFromView(chart);
        this.longpressGestureHandler.detachFromView(chart);
    }
    init() {
        const chart = this.mChart;
        this.panGestureHandler.attachToView(chart);
        this.pinchGestureHandler.attachToView(chart);
        this.tapGestureHandler.attachToView(chart);
        this.longpressGestureHandler.attachToView(chart);
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
