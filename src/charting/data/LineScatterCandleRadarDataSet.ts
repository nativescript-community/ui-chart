import { Entry } from './Entry';
import { ILineScatterCandleRadarDataSet } from '../interfaces/datasets/ILineScatterCandleRadarDataSet';
import { BarLineScatterCandleBubbleDataSet } from './BarLineScatterCandleBubbleDataSet';
import { Utils } from '../utils/Utils';
import { DashPathEffect, parseDashEffect } from '@nativescript-community/ui-canvas';

/**
 * Created by Philipp Jahoda on 11/07/15.
 */
export abstract class LineScatterCandleRadarDataSet<T extends Entry> extends BarLineScatterCandleBubbleDataSet<T> implements ILineScatterCandleRadarDataSet<T> {
    /**
     * Enables / disables the vertical highlight-indicator. If disabled, the indicator is not drawn.
     * @param enabled
     */
    drawVerticalHighlightIndicator = true;
    /**
     * Enables / disables the horizontal highlight-indicator. If disabled, the indicator is not drawn.
     * @param enabled
     */
    drawHorizontalHighlightIndicator = true;

    /** the width of the highlight indicator lines */
    highlightLineWidth = 0.5;

    /** the path effect for dashed highlight-lines */
    highlightDashPathEffect = null;

    constructor(yVals, label, xProperty?, yProperty?) {
        super(yVals, label, xProperty, yProperty);
        this.highlightLineWidth = 0.5;
    }

    /**
     * Enables / disables both vertical and horizontal highlight-indicators.
     * @param enabled
     */
    public set drawHighlightIndicators(enabled) {
        this.drawVerticalHighlightIndicator = enabled;
        this.drawHorizontalHighlightIndicator = enabled;
    }

    /**
     * Enables the highlight-line to be drawn in dashed mode, e.g. like this "- - - - - -"
     *
     * @param lineLength the length of the line pieces
     * @param spaceLength the length of space inbetween the line-pieces
     * @param phase offset, in degrees (normally, use 0)
     */
    public enableHighlightDashPathEffect(lineLength, spaceLength, phase) {
        this.highlightDashPathEffect = new DashPathEffect([lineLength, spaceLength], phase);
    }
}
