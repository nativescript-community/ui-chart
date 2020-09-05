import { Entry } from './Entry';
import { ILineScatterCandleRadarDataSet } from '../interfaces/datasets/ILineScatterCandleRadarDataSet';
import { BarLineScatterCandleBubbleDataSet } from './BarLineScatterCandleBubbleDataSet';
import { Utils } from '../utils/Utils';
import { DashPathEffect, parseDashEffect } from '@nativescript-community/ui-canvas';

/**
 * Created by Philipp Jahoda on 11/07/15.
 */
export abstract class LineScatterCandleRadarDataSet<T extends Entry> extends BarLineScatterCandleBubbleDataSet<T> implements ILineScatterCandleRadarDataSet<T> {
    protected mDrawVerticalHighlightIndicator = true;
    protected mDrawHorizontalHighlightIndicator = true;

    /** the width of the highlight indicator lines */
    protected mHighlightLineWidth = 0.5;

    /** the path effect for dashed highlight-lines */
    protected mHighlightDashPathEffect = null;

    constructor(yVals, label, xProperty?, yProperty?) {
        super(yVals, label, xProperty, yProperty);
        this.mHighlightLineWidth = Utils.convertDpToPixel(0.5);
    }

    /**
     * Enables / disables the horizontal highlight-indicator. If disabled, the indicator is not drawn.
     * @param enabled
     */
    public setDrawHorizontalHighlightIndicator(enabled) {
        this.mDrawHorizontalHighlightIndicator = enabled;
    }

    /**
     * Enables / disables the vertical highlight-indicator. If disabled, the indicator is not drawn.
     * @param enabled
     */
    public setDrawVerticalHighlightIndicator(enabled) {
        this.mDrawVerticalHighlightIndicator = enabled;
    }

    /**
     * Enables / disables both vertical and horizontal highlight-indicators.
     * @param enabled
     */
    public setDrawHighlightIndicators(enabled) {
        this.setDrawVerticalHighlightIndicator(enabled);
        this.setDrawHorizontalHighlightIndicator(enabled);
    }

    public isVerticalHighlightIndicatorEnabled() {
        return this.mDrawVerticalHighlightIndicator;
    }

    public isHorizontalHighlightIndicatorEnabled() {
        return this.mDrawHorizontalHighlightIndicator;
    }

    /**
     * Sets the width of the highlight line in dp.
     * @param width
     */
    public setHighlightLineWidth(width) {
        this.mHighlightLineWidth = Utils.convertDpToPixel(width);
    }

    public getHighlightLineWidth() {
        return this.mHighlightLineWidth;
    }

    /**
     * Enables the highlight-line to be drawn in dashed mode, e.g. like this "- - - - - -"
     *
     * @param lineLength the length of the line pieces
     * @param spaceLength the length of space inbetween the line-pieces
     * @param phase offset, in degrees (normally, use 0)
     */
    public enableDashedHighlightLine(lineLength, spaceLength, phase) {
        this.mHighlightDashPathEffect = parseDashEffect(`${lineLength} ${spaceLength} ${phase}`);
    }

    /**
     * Disables the highlight-line to be drawn in dashed mode.
     */
    public disableDashedHighlightLine() {
        this.mHighlightDashPathEffect = null;
    }

    /**
     * Returns true if the dashed-line effect is enabled for highlight lines, false if not.
     * Default: disabled
     *
     * @return
     */
    public isDashedHighlightLineEnabled() {
        return this.mHighlightDashPathEffect == null ? false : true;
    }

    public getDashPathEffectHighlight() {
        return this.mHighlightDashPathEffect;
    }
}
