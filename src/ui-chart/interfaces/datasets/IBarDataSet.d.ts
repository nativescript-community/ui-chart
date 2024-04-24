import { BarEntry } from '../../data/BarEntry';
import { IBarLineScatterCandleBubbleDataSet } from './IBarLineScatterCandleBubbleDataSet';

/**
 * Created by philipp on 21/10/15.
 */
export interface IBarDataSet extends IBarLineScatterCandleBubbleDataSet<BarEntry> {
    /**
     * Returns true if this DataSet is stacked (stacksize > 1) or not.
     */
    readonly stacked: boolean;

    /**
     * Returns the maximum number of bars that can be stacked upon another in
     * this DataSet. This should return 1 for non stacked bars, and > 1 for stacked bars.
     */
    stackSize: number;

    /**
     * Returns the color used for drawing the bar-shadows. The bar shadows is a
     * surface behind the bar that indicates the maximum value.
     */
    barShadowColor: string | Color;

    /**
     * Returns the width used for drawing borders around the bars.
     * If borderWidth === 0, no border will be drawn.
     */
    barBorderWidth: number;

    /**
     * Returns the color drawing borders around the bars.
     */
    barBorderColor: string | Color;

    /**
     * Returns the alpha value (transparency) that is used for drawing the
     * highlight indicator.
     */
    highLightAlpha: number;

    /**
     * Returns the labels used for the different value-stacks in the legend.
     * This is only relevant for stacked bar entries.
     */
    stackLabels: string[];
}
