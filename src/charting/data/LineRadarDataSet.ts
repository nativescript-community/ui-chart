import { Entry } from './Entry';
import { ILineRadarDataSet } from '../interfaces/datasets/ILineRadarDataSet';
import { LineScatterCandleRadarDataSet } from './LineScatterCandleRadarDataSet';
import { Color } from '@nativescript/core/color';
import { Utils } from '../utils/Utils';
import { ImageSource } from '@nativescript/core';

/**
 * Base dataset for line and radar DataSets.
 *
 * @author Philipp Jahoda
 */
export abstract class LineRadarDataSet<T extends Entry> extends LineScatterCandleRadarDataSet<T> implements ILineRadarDataSet<T> {
    /**
     * the color that is used for filling the line surface
     */
    private mFillColor: string | Color = '#8CEAFF'; // rgb(140,234,255)

    /**
     * the drawable to be used for filling the line surface
     */
    protected mFillDrawable: ImageSource;

    /**
     * transparency used for filling line surface
     */
    private mFillAlpha = 85;

    /**
     * the width of the drawn data lines
     */
    private mLineWidth = 1.5;

    /**
     * if true, the data will also be drawn filled
     */
    private mDrawFilled = false;

    public getFillColor() {
        return this.mFillColor;
    }

    /**
     * Sets the color that is used for filling the area below the line.
     * Resets an eventually set "fillDrawable".
     *
     * @param color
     */
    public setFillColor(color: string | Color) {
        this.mFillColor = color;
        this.mFillDrawable = null;
    }

    public getFillDrawable() {
        return this.mFillDrawable;
    }

    /**
     * Sets the drawable to be used to fill the area below the line.
     *
     * @param drawable
     */
    public setFillDrawable(drawable: ImageSource) {
        this.mFillDrawable = drawable;
    }

    public getFillAlpha() {
        return this.mFillAlpha;
    }

    /**
     * sets the alpha value (transparency) that is used for filling the line
     * surface (0-255), default: 85
     *
     * @param alpha
     */
    public setFillAlpha(alpha) {
        this.mFillAlpha = alpha;
    }

    /**
     * set the line width of the chart (min = 0.2f, max = 10); default 1 NOTE:
     * thinner line == better performance, thicker line == worse performance
     *
     * @param width
     */
    public setLineWidth(width) {
        this.mLineWidth = width;
    }

    public getLineWidth() {
        return this.mLineWidth;
    }

    public setDrawFilled(filled) {
        this.mDrawFilled = filled;
    }

    public isDrawFilledEnabled() {
        return this.mDrawFilled;
    }
}
