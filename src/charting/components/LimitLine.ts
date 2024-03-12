import { ComponentBase } from './ComponentBase';
import { DashPathEffect, Paint, Style, parseDashEffect } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';
import { Color } from '@nativescript/core';

/** enum that indicates the position of the LimitLine label */
export enum LimitLabelPosition {
    LEFT_TOP,
    LEFT_BOTTOM,
    CENTER_TOP,
    CENTER_BOTTOM,
    RIGHT_TOP,
    RIGHT_BOTTOM
}
/**
 * The limit line is an additional feature for all Line-, Bar- and
 * ScatterCharts. It allows the displaying of an additional line in the chart
 * that marks a certain maximum / limit on the specified axis (x- or y-axis).
 *

 */
export class LimitLine extends ComponentBase {
    /** limit / maximum (the y-value or xIndex) */
    limit = 0;

    /** the width of the limit line
     * thinner line == better performance, thicker line == worse performance
     */
    lineWidth = 2;

    /** the color of the limit line */
    lineColor: Color | string = '#ED5B5B';

    /** the style of the label text */
    textStyle = Style.FILL;

    /** label string that is drawn next to the limit line */
    label = '';

    /** the path effect of this LimitLine that makes dashed lines possible */
    dashPathEffect: DashPathEffect = null;

    /** position of the LimitLine value label (either on the right or on
     * the left edge of the chart). Not supported for RadarChart.
     */
    labelPosition: LimitLabelPosition = LimitLabelPosition.RIGHT_TOP;

    /**
     * Constructor with limit and label.
     *
     * @param limit - the position (the value) on the y-axis (y-value) or x-axis
     *            (xIndex) where this line should appear
     * @param label - provide "" if no label is required
     */
    constructor(limit, label?) {
        super();
        this.limit = limit;
        this.label = label;
    }

    /**
     * Enables the line to be drawn in dashed mode, e.g. like this "- - - - - -"
     *
     * @param lineLength the length of the line pieces
     * @param spaceLength the length of space inbetween the pieces
     * @param phase offset, in degrees (normally, use 0)
     */
    public enableDashedLine(lineLength, spaceLength, phase) {
        this.dashPathEffect = new DashPathEffect([lineLength, spaceLength], phase);
    }
}
