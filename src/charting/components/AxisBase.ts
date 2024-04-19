import { Align, DashPathEffect, parseDashEffect } from '@nativescript-community/ui-canvas';
import { DefaultAxisValueFormatter } from '../formatter/DefaultAxisValueFormatter';
import { IAxisValueFormatter } from '../formatter/IAxisValueFormatter';
import { CustomRenderer } from '../renderer/AxisRenderer';
import { ComponentBase } from './ComponentBase';
import { LimitLine } from './LimitLine';

/**
 * Base-class of all axes (previously called labels).
 *

 */
export abstract class AxisBase extends ComponentBase {
    /**
     * custom formatter that is used instead of the auto-formatter if set
     */
    protected mAxisValueFormatter: IAxisValueFormatter;

    /**
     * the color of the grid lines for this axis (the horizontal lines
     * coming from each label).
     */
    gridColor = 'gray';

    /**
     * the width of the grid lines that are drawn away from each axis
     * label.
     */
    gridLineWidth = 1;

    /**
     * the color of the border surrounding the chart.
     */
    axisLineColor = 'gray';

    /**
     * the width of the border surrounding the chart in dp.
     */
    axisLineWidth = 1;

    /**
     * the actual array of entries
     */
    public mEntries: number[] = [];
    public mLabels: string[] = [];

    /**
     * axis label entries only used for centered labels
     */
    public mCenteredEntries: number[] = [];

    /**
     * the number of entries the legend contains
     */
    public mEntryCount: number;

    /**
     * the number of decimal digits to use
     */
    public mDecimals: number;

    /**
     * the number of label entries the axis should have, default 6
     */
    labelCount: number = 6;

    /**
     * the labels text alignment of the axis labels.
     */
    labelTextAlign: Align = Align.LEFT;

    /**
     * the minimum interval between axis values
     * When set, axis labels are controlled by the `granularity` property.
     * When not set, axis values could possibly be repeated.
     * This could happen if two adjacent axis values are rounded to same value.
     * If using granularity this could be aed by having fewer axis values visible.
     */
    granularity: number;

    forcedInterval: number;

    /**
     * if true, the set number of y-labels will be forced
     */
    forceLabelsEnabled = false;

    /**
     * flag indicating if the grid lines for this axis should be drawn
     */
    drawGridLines = true;

    /**
     * flag that indicates if the line alongside the axis is drawn or not
     */
    drawAxisLine = true;

    /**
     * flag that indicates of the labels of this axis should be drawn or not
     */
    drawLabels = true;

    /**
     * Centers the axis labels instead of drawing them at their original position.
     * This is useful especially for grouped BarChart.
     */
    centerAxisLabels = false;

    ensureLastLabel = false;

    allowLastLabelAboveMax = false;

    /**
     * the path effect of the axis line that makes dashed lines possible
     */
    axisLineDashPathEffect: DashPathEffect = null;

    /**
     * the path effect of the grid lines that makes dashed lines possible
     */
    gridDashPathEffect: DashPathEffect = null;

    /**
     * array of limit lines that can be set for the axis
     */
    protected mLimitLines: LimitLine[] = [];

    /**
     * flag indicating if the limit lines are drawn
     */
    drawLimitLines = true;

    /**
     * When enabled the LimitLines are drawn behind the actual data,
     * otherwise on top. Default: false
     *
     * @param enabled
     */
    drawLimitLinesBehindData = false;

    /**
     * When enabled the limitlines will be clipped to contentRect,
     * otherwise they can bleed outside the content rect.
     */
    clipLimitLinesToContent = true;

    /**
     * When enabled the labels are drawn behind the actual data,
     * otherwise on top. Default: false
     */
    drawLabelsBehindData = false;

    /**
     * When enabled the grid lines are draw on top of the actual data,
     * otherwise behind. Default: true
     */
    drawGridLinesBehindData = true;

    /**
     * flag indicating the mark ticks should be drawn
     */
    drawMarkTicks = false;

    /**
     * Extra spacing for `axisMinimum` to be added to automatically calculated `axisMinimum`
     */
    spaceMin = 0;

    /**
     * Extra spacing for `axisMaximum` to be added to automatically calculated `axisMaximum`
     */
    spaceMax = 0;

    /**
     * flag indicating that the axis-min value has been customized
     */
    protected mCustomAxisMin = false;

    /**
     * flag indicating that the axis-max value has been customized
     */
    protected mCustomAxisMax = false;

    /**
     * don't touch this direclty, use setter
     */
    public mAxisMaximum = 0;

    /**
     * don't touch this directly, use setter
     */
    public mAxisMinimum = 0;

    /**
     * Set a suggested maximum value for this axis. If set, this will be used
     * as maximum is no value is greater than it.
     */
    public axisSuggestedMaximum: number;

    /**
     * Set a suggested minimum value for this axis. If set, this will be used
     * as minimum is no value is greater than it.
     */
    public axisSuggestedMinimum: number;

    /**
     * the total range of values this axis covers
     */
    public mAxisRange = 0;
    /**
     * the total range of values this axis covers
     */
    ignoreOffsets = false;

    /**
     * custom line renderer
     */
    customRenderer: CustomRenderer;

    /**
     * default constructor
     */
    public AxisBase() {
        this.textSize = 10;
        this.xOffset = 5;
        this.yOffset = 5;
        this.mLimitLines = [];
    }

    /**
     * Adds a new LimitLine to this axis.
     *
     * @param l
     */
    public addLimitLine(l: LimitLine) {
        this.mLimitLines.push(l);
    }

    /**
     * Removes the specified LimitLine from the axis.
     *
     * @param l
     */
    public removeLimitLine(l: LimitLine) {
        const index = this.mLimitLines.indexOf(l);
        if (index >= 0) {
            this.mLimitLines.splice(index, 1);
        }
    }

    /**
     * Removes all LimitLines from the axis.
     */
    public removeAllLimitLines() {
        this.mLimitLines = [];
    }

    /**
     * Returns the LimitLines of this axis.
     */
    public get limitLines() {
        return this.mLimitLines;
    }

    /**
     * Returns the longest formatted label (in terms of characters), this axis
     * contains.
     */
    public get longestLabel() {
        let longest = '';
        const labels = this.mLabels;
        for (let i = 0; i < this.mEntries.length; i++) {
            const text = labels[i];

            if (text && longest.length < text.length) {
                longest = text;
            }
        }

        return longest;
    }

    public getFormattedLabel(index) {
        // let label = this.mLabels[index];
        // if (!label) {
        //     label = this.mLabels[index] = this.valueFormatter.getAxisLabel()
        // }
        return this.mLabels[index];
    }

    /**
     * Sets the formatter to be used for formatting the axis labels. If no formatter is set, the
     * chart will
     * automatically determine a reasonable formatting (concerning decimals) for all the values
     * that are drawn inside
     * the chart. Use chart.defaultValueFormatter to use the formatter calculated by the chart.
     *
     * @param f
     */
    public set valueFormatter(f: IAxisValueFormatter) {
        if (f == null) this.mAxisValueFormatter = new DefaultAxisValueFormatter(this.mDecimals);
        else this.mAxisValueFormatter = f;
    }

    /**
     * Returns the formatter used for formatting the axis labels.
     */
    public get valueFormatter() {
        if (this.mAxisValueFormatter == null || (this.mAxisValueFormatter instanceof DefaultAxisValueFormatter && this.mAxisValueFormatter.decimalDigits !== this.mDecimals)) {
            this.mAxisValueFormatter = new DefaultAxisValueFormatter(this.mDecimals);
        }

        return this.mAxisValueFormatter;
    }

    /**
     * Enables the grid line to be drawn in dashed mode, e.g. like this
     * "- - - - - -". THIS ONLY WORKS IF HARDWARE-ACCELERATION IS TURNED OFF.
     * Keep in mind that hardware acceleration boosts performance.
     *
     * @param lineLength  the length of the line pieces
     * @param spaceLength the length of space in between the pieces
     * @param phase       offset, in degrees (normally, use 0)
     */
    public enableGridDashedLine(lineLength, spaceLength, phase) {
        this.gridDashPathEffect = new DashPathEffect([lineLength, spaceLength], phase);
    }

    /**
     * Enables the axis line to be drawn in dashed mode, e.g. like this
     * "- - - - - -". THIS ONLY WORKS IF HARDWARE-ACCELERATION IS TURNED OFF.
     * Keep in mind that hardware acceleration boosts performance.
     *
     * @param lineLength  the length of the line pieces
     * @param spaceLength the length of space in between the pieces
     * @param phase       offset, in degrees (normally, use 0)
     */
    public enableAxisLineDashedLine(lineLength, spaceLength, phase) {
        this.axisLineDashPathEffect = parseDashEffect(`${lineLength} ${spaceLength} ${phase}`);
    }

    /**
     * ###### BELOW CODE RELATED TO CUSTOM AXIS VALUES ######
     */

    /**
     * By calling this method, any custom maximum value that has been previously set is reseted,
     * and the calculation is
     * done automatically.
     */
    public resetAxisMaximum() {
        this.mCustomAxisMax = false;
    }

    /**
     * Returns true if the axis max value has been customized (and is not calculated automatically)
     */
    public isAxisMaxCustom() {
        return this.mCustomAxisMax;
    }

    /**
     * By calling this method, any custom minimum value that has been previously set is reseted,
     * and the calculation is
     * done automatically.
     */
    public resetAxisMinimum() {
        this.mCustomAxisMin = false;
    }

    /**
     * Returns true if the axis min value has been customized (and is not calculated automatically)
     */
    public isAxisMinCustom() {
        return this.mCustomAxisMin;
    }

    /**
     * Set a custom minimum value for this axis. If set, this value will not be calculated
     * automatically depending on
     * the provided data. Use resetAxisMinValue() to undo this. Do not forget to call
     * setStartAtZero(false) if you use
     * this method. Otherwise, the axis-minimum value will still be forced to 0.
     *
     * @param min
     */
    public set axisMinimum(min) {
        this.mCustomAxisMin = true;
        this.mAxisMinimum = min;
        this.mAxisRange = Math.abs(this.mAxisMaximum - min);
    }

    public get axisMinimum() {
        return this.mAxisMinimum;
    }

    public get axisMaximum() {
        return this.mAxisMaximum;
    }

    /**
     * Set a custom maximum value for this axis. If set, this value will not be calculated
     * automatically depending on
     * the provided data. Use resetAxisMaxValue() to undo this.
     *
     * @param max
     */
    public set axisMaximum(max) {
        this.mCustomAxisMax = true;
        this.mAxisMaximum = max;
        this.mAxisRange = Math.abs(max - this.mAxisMinimum);
    }

    /**
     * Calculates the minimum / maximum  and range values of the axis with the given
     * minimum and maximum values from the chart data.
     *
     * @param dataMin the min value according to chart data
     * @param dataMax the max value according to chart data
     */
    public calculate(dataMin, dataMax) {
        // if custom, use value as is, else use data value
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
        // actual range
        this.mAxisRange = range;
    }
}
