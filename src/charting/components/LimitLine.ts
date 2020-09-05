import { ComponentBase } from './ComponentBase';
import { DashPathEffect, Paint, Style, parseDashEffect } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';

/** enum that indicates the position of the LimitLine label */
export enum LimitLabelPosition {
    LEFT_TOP,
    LEFT_BOTTOM,
    RIGHT_TOP,
    RIGHT_BOTTOM
}
/**
 * The limit line is an additional feature for all Line-, Bar- and
 * ScatterCharts. It allows the displaying of an additional line in the chart
 * that marks a certain maximum / limit on the specified axis (x- or y-axis).
 *
 * @author Philipp Jahoda
 */
export class LimitLine extends ComponentBase {
    /** limit / maximum (the y-value or xIndex) */
    private mLimit = 0;

    /** the width of the limit line */
    private mLineWidth = 2;

    /** the color of the limit line */
    private mLineColor = '#ED5B5B';

    /** the style of the label text */
    private mTextStyle = Style.FILL_AND_STROKE;

    /** label string that is drawn next to the limit line */
    private mLabel = '';

    /** the path effect of this LimitLine that makes dashed lines possible */
    private mDashPathEffect: DashPathEffect = null;

    /** indicates the position of the LimitLine label */
    private mLabelPosition: LimitLabelPosition = LimitLabelPosition.RIGHT_TOP;

    /**
     * Constructor with limit and label.
     *
     * @param limit - the position (the value) on the y-axis (y-value) or x-axis
     *            (xIndex) where this line should appear
     * @param label - provide "" if no label is required
     */
    constructor(limit, label?) {
        super();
        this.mLimit = limit;
        this.mLabel = label;
    }

    /**
     * Returns the limit that is set for this line.
     *
     * @return
     */
    public getLimit() {
        return this.mLimit;
    }

    /**
     * set the line width of the chart (min = 0.2f, max = 12f); default 2f NOTE:
     * thinner line == better performance, thicker line == worse performance
     *
     * @param width
     */
    public setLineWidth(width) {
        // if (width < 0.2) width = 0.2;
        // if (width > 12.0) width = 12.0;
        this.mLineWidth = (width);
    }

    /**
     * returns the width of limit line
     *
     * @return
     */
    public getLineWidth() {
        return this.mLineWidth;
    }

    /**
     * Sets the linecolor for this LimitLine. Make sure to use
     * getResources().getColor(...)
     *
     * @param color
     */
    public setLineColor(color) {
        this.mLineColor = color;
    }

    /**
     * Returns the color that is used for this LimitLine
     *
     * @return
     */
    public getLineColor() {
        return this.mLineColor;
    }

    /**
     * Enables the line to be drawn in dashed mode, e.g. like this "- - - - - -"
     *
     * @param lineLength the length of the line pieces
     * @param spaceLength the length of space inbetween the pieces
     * @param phase offset, in degrees (normally, use 0)
     */
    public enableDashedLine(lineLength, spaceLength, phase) {
        this.mDashPathEffect = parseDashEffect(`${lineLength} ${spaceLength} ${phase}`);
    }

    /**
     * Disables the line to be drawn in dashed mode.
     */
    public disableDashedLine() {
        this.mDashPathEffect = null;
    }

    /**
     * Returns true if the dashed-line effect is enabled, false if not. Default:
     * disabled
     *
     * @return
     */
    public isDashedLineEnabled() {
        return this.mDashPathEffect == null ? false : true;
    }

    /**
     * returns the DashPathEffect that is set for this LimitLine
     *
     * @return
     */
    public getDashPathEffect() {
        return this.mDashPathEffect;
    }

    /**
     * Sets the color of the value-text that is drawn next to the LimitLine.
     * Default: Paint.Style.FILL_AND_STROKE
     *
     * @param style
     */
    public setTextStyle(style) {
        this.mTextStyle = style;
    }

    /**
     * Returns the color of the value-text that is drawn next to the LimitLine.
     *
     * @return
     */
    public getTextStyle() {
        return this.mTextStyle;
    }

    /**
     * Sets the position of the LimitLine value label (either on the right or on
     * the left edge of the chart). Not supported for RadarChart.
     *
     * @param pos
     */
    public setLabelPosition(pos) {
        this.mLabelPosition = pos;
    }

    /**
     * Returns the position of the LimitLine label (value).
     *
     * @return
     */
    public getLabelPosition() {
        return this.mLabelPosition;
    }

    /**
     * Sets the label that is drawn next to the limit line. Provide "" if no
     * label is required.
     *
     * @param label
     */
    public setLabel(label) {
        this.mLabel = label;
    }

    /**
     * Returns the label that is drawn next to the limit line.
     *
     * @return
     */
    public getLabel() {
        return this.mLabel;
    }
}
