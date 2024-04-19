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
    lastHighlighted: Highlight;

    /**
     * the chart the listener represents
     */
    readonly chart: T;

    constructor(chart: T) {
        this.chart = chart;
    }
    dispose() {}
    init() {}

    /**
     * returns the touch mode the listener is currently in
     */
    public get touchMode() {
        return this.mTouchMode;
    }

    /**
     * Returns the last gesture that has been performed on the chart.
     */
    public get lastGesture() {
        return this.mLastGesture;
    }

    /**
     * Perform a highlight operation.
     *
     * @param e
     */
    protected performHighlight(h: Highlight) {
        if (!h || h === this.lastHighlighted) {
            this.chart.highlight(null, true);
            this.lastHighlighted = null;
        } else {
            this.chart.highlight(h, true);
            this.lastHighlighted = h;
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
