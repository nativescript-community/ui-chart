import { AxisDependency } from '../components/YAxis';

/**
 * Contains information needed to determine the highlighted value.
 *
 * @author Philipp Jahoda
 */
export interface Highlight {
    /**
     * the x-value of the highlighted value
     */
    x;

    /**
     * the y-value of the highlighted value
     */
    y;

    /**
     * the x-pixel of the highlight
     */
    xPx?;

    /**
     * the y-pixel of the highlight
     */
    yPx?;

    /**
     * the index of the data object - in case it refers to more than one
     */
    dataIndex?;

    /**
     * the index of the dataset the highlighted value is in
     */
    dataSetIndex?;

    /**
     * index which value of a stacked bar entry is highlighted, default -1
     */
    stackIndex?;

    /**
     * the axis the highlighted value belongs to
     */
    axis?: AxisDependency;

    /**
     * the x-position (pixels) on which this highlight object was last drawn
     */
    drawX?;

    /**
     * the y-position (pixels) on which this highlight object was last drawn
     */
    drawY?;

    /**
     * the associated entry
     */
    entry?;
}
