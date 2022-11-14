import { BarLineChartBase } from '../charts/BarLineChartBase';
import { Chart } from '../charts/Chart';
import { Highlight } from '../highlight/Highlight';

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
     * the chart the listener represents
     */
    protected mChart: T;

    constructor(chart: T) {
        this.mChart = chart;
    }
    dispose() {}
    init() {}
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
        const dx = eventX - startX;
        const dy = eventY - startY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
