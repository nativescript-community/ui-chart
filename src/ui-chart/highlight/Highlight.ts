import { AxisDependency } from '../components/YAxis';
import { Entry } from '../data/Entry';

/**
 * Contains information needed to determine the highlighted value.
 *

 */
export class Highlight<T extends Entry = Entry> {
    /**
     * the x-value of the highlighted value
     */
    x: number;

    /**
     * the y-value of the highlighted value
     */
    y: number;

    /**
     * the x-pixel of the highlight
     */
    xPx?: number;

    /**
     * the y-pixel of the highlight
     */
    yPx?: number;

    /**
     * the x-pixel of the touch corresponding to the highlight
     */
    xTouchPx?: number;

    /**
     * the y-pixel of the touch corresponding to the highlight
     */
    yTouchPx?: number;

    /**
     * the index of the data object - in case it refers to more than one
     */
    dataIndex?: number;

    /**
     * the type of the data object if within CombinedChart (lineData, barData, scatterData, bubbleData, candleData)
     */
    dataType?: string;

    /**
     * the index of the dataset the highlighted value is in
     */
    dataSetIndex: number;

    /**
     * index which value of a stacked bar entry is highlighted, default -1
     */
    stackIndex?: number;

    /**
     * the axis the highlighted value belongs to
     */
    axis?: AxisDependency;

    /**
     * the x-position (pixels) on which this highlight object was last drawn
     */
    drawX?: number;

    /**
     * the y-position (pixels) on which this highlight object was last drawn
     */
    drawY?: number;

    /**
     * the associated entry
     */
    entry?: T;

    /**
     * the index of the dataset the highlighted value is in
     */
    entryIndex?: number;
}
