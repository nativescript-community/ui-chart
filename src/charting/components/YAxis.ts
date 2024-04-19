import { Paint } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';
import { AxisBase } from './AxisBase';

/**
 * Enum that specifies the axis a DataSet should be plotted against, either LEFT or RIGHT.
 *

 */
export enum AxisDependency {
    LEFT,
    RIGHT
}
/**
 * enum for the position of the y-labels relative to the chart
 */
export enum YAxisLabelPosition {
    OUTSIDE_CHART,
    INSIDE_CHART
}
/**
 * Class representing the y-axis labels settings and its entries. Only use the setter methods to
 * modify it. Do not
 * access public variables directly. Be aware that not all features the YLabels class provides
 * are suitable for the
 * RadarChart. Customizations that affect the value range of the axis need to be applied before
 * setting data for the
 * chart.
 *

 */
export class YAxis extends AxisBase {
    /**
     * indicates if the bottom y-label entry is drawn or not
     */
    drawBottomYLabelEntry = true;

    /**
     * indicates if the top y-label entry is drawn or not
     */
    drawTopYLabelEntry = true;

    /**
     * flag that indicates if the axis is inverted or not
     */
    inverted = false;

    /**
     * flag that indicates if the zero-line should be drawn regardless of other grid lines
     */
    drawZeroLine = false;

    /**
     * flag indicating that auto scale min restriction should be used
     */
    private mUseAutoScaleRestrictionMin = false;

    /**
     * flag indicating that auto scale max restriction should be used
     */
    private mUseAutoScaleRestrictionMax = false;

    /**
     * Color of the zero line
     */
    zeroLineColor = 'gray';

    /**
     * Width of the zero line in pixels
     */
    zeroLineWidth = 1;

    /**
     * axis space from the largest value to the top in percent of the total axis range
     */
    spaceTop = 10;

    /**
     * axis space from the smallest value to the bottom in percent of the total axis range
     */
    spaceBottom = 10;

    /**
     * the position of the y-labels relative to the chart
     */
    position = YAxisLabelPosition.OUTSIDE_CHART;

    /**
     * the side this axis object represents
     */
    axisDependency: AxisDependency;

    /**
     * the minimum width that the axis should take (in dp).
     * <p/>
     * default: 0.0
     */
    minWidth = 0;

    /**
     * the maximum width that the axis can take (in dp).
     * use Inifinity for disabling the maximum
     * default: Number.POSITIVE_INFINITY (no maximum specified)
     */
    maxWidth = Number.POSITIVE_INFINITY;

    constructor(position = AxisDependency.LEFT) {
        super();
        this.axisDependency = position;
        this.yOffset = 0;
        this.allowLastLabelAboveMax = true;
    }

    /**
     * This method is deprecated.
     * Use setAxisMinimum(...) / setAxisMaximum(...) instead.
     *
     * @param startAtZero
     */
    public setStartAtZero(startAtZero) {
        if (startAtZero) this.axisMinimum = 0;
        else this.resetAxisMinimum();
    }

    /**
     * This is for normal (not horizontal) charts horizontal spacing.
     *
     * @param p
     * @return
     */
    public getRequiredWidthSpace(p: Paint) {
        p.setTypeface(this.typeface);
        p.textSize = this.textSize;

        const label = this.longestLabel;
        let width = Utils.calcTextWidth(p, label) + this.xOffset * 2;
        let minWidth = this.minWidth;
        let maxWidth = this.maxWidth;

        if (minWidth > 0) minWidth = minWidth;

        if (maxWidth > 0 && maxWidth !== Number.POSITIVE_INFINITY) maxWidth = maxWidth;

        width = Math.max(minWidth, Math.min(width, maxWidth > 0.0 ? maxWidth : width));

        return width;
    }

    /**
     * This is for HorizontalBarChart vertical spacing.
     *
     * @param p
     * @return
     */
    public getRequiredHeightSpace(p: Paint) {
        const label = this.longestLabel;
        return Utils.calcTextHeight(p, label) + this.yOffset * 2;
    }

    /**
     * Returns true if this axis needs horizontal offset, false if no offset is needed.
     */
    public get needsOffset() {
        return this.enabled && this.drawLabels && this.position === YAxisLabelPosition.OUTSIDE_CHART;
    }

    /**
     * Returns true if autoscale restriction for axis min value is enabled
     */
    public isUseAutoScaleMinRestriction() {
        return this.mUseAutoScaleRestrictionMin;
    }

    /**
     * Sets autoscale restriction for axis min value as enabled/disabled
     */
    public setUseAutoScaleMinRestriction(isEnabled) {
        this.mUseAutoScaleRestrictionMin = isEnabled;
    }

    /**
     * Returns true if autoscale restriction for axis max value is enabled
     */
    public isUseAutoScaleMaxRestriction() {
        return this.mUseAutoScaleRestrictionMax;
    }

    /**
     * Sets autoscale restriction for axis max value as enabled/disabled
     */
    public setUseAutoScaleMaxRestriction(isEnabled) {
        this.mUseAutoScaleRestrictionMax = isEnabled;
    }

    public calculate(dataMin, dataMax) {
        let min = this.mCustomAxisMin ? this.mAxisMinimum : dataMin - this.spaceMin;
        let max = this.mCustomAxisMax ? this.mAxisMaximum : dataMax + this.spaceMax;
        if (this.axisSuggestedMinimum !== undefined) {
            min = Math.min(min, this.axisSuggestedMinimum);
        }
        if (this.axisSuggestedMaximum !== undefined) {
            max = Math.max(max, this.axisSuggestedMaximum);
        }
        // temporary range (before calculations)
        let range = Math.abs(max - min);

        // in case all values are equal
        if (range === 0) {
            max = max + 1;
            min = min - 1;
        }
        if (!Number.isFinite(min)) {
            min = 0;
        }
        if (!Number.isFinite(max)) {
            max = 0;
        }
        // recalculate
        range = Math.abs(max - min);

        this.mAxisMinimum = min;
        this.mAxisMaximum = max;

        // calc extra spacing only for range.
        // using it for mAxisMinimum and mAxisMaximum would make the axis use decaled "values"
        let delta = 0;
        if (!this.mCustomAxisMin) {
            delta += (range / 100) * this.spaceBottom;
        }
        if (!this.mCustomAxisMax) {
            delta += (range / 100) * this.spaceTop;
        }
        this.mAxisRange = range + delta;
    }
}
