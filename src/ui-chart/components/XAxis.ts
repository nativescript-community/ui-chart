import { AxisBase } from './AxisBase';
import { Utils } from '../utils/Utils';
import { Chart } from '../charts/Chart';

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
    labelRotationAngle = 0;

    /**
     * if set to true, the chart will avoid that the first and last label entry
     * in the chart "clip" off the edge of the chart
     */
    avoidFirstLastClipping = true;

    /**
     * the position of the x-labels relative to the chart
     */
    position = XAxisPosition.TOP;

    constructor(chart: WeakRef<Chart<any, any, any>>) {
        super(chart);
        this.yOffset = 4;
    }
}
