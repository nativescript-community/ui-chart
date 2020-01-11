import { AxisBase } from './AxisBase';
import { Utils } from '../utils/Utils';

/**
 * enum for the position of the x-labels relative to the chart
 */
export enum XAxisPosition {
    TOP,
    BOTTOM,
    BOTH_SIDED,
    TOP_INSIDE,
    BOTTOM_INSIDE
}

/**
 * Class representing the x-axis labels settings. Only use the setter methods to
 * modify it. Do not access public variables directly. Be aware that not all
 * features the XLabels class provides are suitable for the RadarChart.
 *
 * @author Philipp Jahoda
 */
export class XAxis extends AxisBase {
    /**
     * width of the x-axis labels in pixels - this is automatically
     * calculated by the computeSize() methods in the renderers
     */
    public mLabelWidth = 1;

    /**
     * height of the x-axis labels in pixels - this is automatically
     * calculated by the computeSize() methods in the renderers
     */
    public mLabelHeight = 1;

    /**
     * width of the (rotated) x-axis labels in pixels - this is automatically
     * calculated by the computeSize() methods in the renderers
     */
    public mLabelRotatedWidth = 1;

    /**
     * height of the (rotated) x-axis labels in pixels - this is automatically
     * calculated by the computeSize() methods in the renderers
     */
    public mLabelRotatedHeight = 1;

    /**
     * This is the angle for drawing the X axis labels (in degrees)
     */
    protected mLabelRotationAngle = 0;

    /**
     * if set to true, the chart will avoid that the first and last label entry
     * in the chart "clip" off the edge of the chart
     */
    private mAvoidFirstLastClipping = false;

    /**
     * the position of the x-labels relative to the chart
     */
    private mPosition = XAxisPosition.TOP;

    constructor() {
        super();

        this.mYOffset = 4; // -3
    }

    /**
     * returns the position of the x-labels
     */
    public getPosition() {
        return this.mPosition;
    }

    /**
     * sets the position of the x-labels
     *
     * @param pos
     */
    public setPosition(pos) {
        this.mPosition = pos;
    }

    /**
     * returns the angle for drawing the X axis labels (in degrees)
     */
    public getLabelRotationAngle() {
        return this.mLabelRotationAngle;
    }

    /**
     * sets the angle for drawing the X axis labels (in degrees)
     *
     * @param angle the angle in degrees
     */
    public setLabelRotationAngle(angle) {
        this.mLabelRotationAngle = angle;
    }

    /**
     * if set to true, the chart will avoid that the first and last label entry
     * in the chart "clip" off the edge of the chart or the screen
     *
     * @param enabled
     */
    public setAvoidFirstLastClipping(enabled) {
        this.mAvoidFirstLastClipping = enabled;
    }

    /**
     * returns true if avoid-first-lastclipping is enabled, false if not
     *
     * @return
     */
    public isAvoidFirstLastClippingEnabled() {
        return this.mAvoidFirstLastClipping;
    }
}
