import { Align, DashPathEffect, parseDashEffect } from '@nativescript-community/ui-canvas';
import { ComponentBase } from './ComponentBase';
import { LimitLine } from './LimitLine';
import { DefaultAxisValueFormatter } from '../formatter/DefaultAxisValueFormatter';
import { IAxisValueFormatter } from '../formatter/IAxisValueFormatter';
import { ValueFormatter } from '../formatter/ValueFormatter';
import { CustomRenderer } from '../renderer/AxisRenderer';

/**
 * Base-class of all axes (previously called labels).
 *
 * @author Philipp Jahoda
 */
export abstract class AxisBase extends ComponentBase {
    /**
     * custom formatter that is used instead of the auto-formatter if set
     */
    protected mAxisValueFormatter: IAxisValueFormatter;

    private mGridColor = 'gray';

    private mGridLineWidth = 1;

    private mAxisLineColor = 'gray';

    private mAxisLineWidth = 1;

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
    private mLabelCount: number = 6;

    /**
     * the labels text alignment
     */
    private mLabelTextAlign: Align = Align.LEFT;

    /**
     * the minimum erval between axis values
     */
    protected mGranularity: number = 1.0;

    /**
     * When true, axis labels are controlled by the `granularity` property.
     * When false, axis values could possibly be repeated.
     * This could happen if two adjacent axis values are rounded to same value.
     * If using granularity this could be aed by having fewer axis values visible.
     */
    protected mGranularityEnabled = false;

    protected mForcedIntervalEnabled = false;
    protected mForcedInterval = -1;

    /**
     * if true, the set number of y-labels will be forced
     */
    protected mForceLabels = false;

    /**
     * flag indicating if the grid lines for this axis should be drawn
     */
    protected mDrawGridLines = true;

    /**
     * flag that indicates if the line alongside the axis is drawn or not
     */
    protected mDrawAxisLine = true;

    /**
     * flag that indicates of the labels of this axis should be drawn or not
     */
    protected mDrawLabels = true;

    protected mCenterAxisLabels = false;

    public ensureLastLabel = false;

    public allowLastLabelAboveMax = false;

    /**
     * the path effect of the axis line that makes dashed lines possible
     */
    private mAxisLineDashPathEffect: DashPathEffect = null;

    /**
     * the path effect of the grid lines that makes dashed lines possible
     */
    private mGridDashPathEffect: DashPathEffect = null;

    /**
     * array of limit lines that can be set for the axis
     */
    protected mLimitLines: LimitLine[] = [];

    /**
     * flag indicating if the limit lines are drawn
     */
    protected mDrawLimitLines = true;
    /**
     * flag indicating the limit lines layer depth
     */
    protected mDrawLimitLineBehindData = false;
    /**
     * flag indicating the labels layer depth
     */
    protected mDrawLabelsBehindData = false;

    /**
     * flag indicating the grid lines layer depth
     */
    protected mDrawGridLinesBehindData = true;

    /**
     * flag indicating the mark ticks should be drawn
     */
    protected mDrawMarkTicks = false;

    /**
     * Extra spacing for `axisMinimum` to be added to automatically calculated `axisMinimum`
     */
    protected mSpaceMin = 0;

    /**
     * Extra spacing for `axisMaximum` to be added to automatically calculated `axisMaximum`
     */
    protected mSpaceMax = 0;

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
     * don't touch this direclty, use setter
     */
    public mAxisSuggestedMaximum = undefined;

    /**
     * don't touch this directly, use setter
     */
    public mAxisSuggestedMinimum = undefined;

    /**
     * the total range of values this axis covers
     */
    public mAxisRange = 0;
    /**
     * the total range of values this axis covers
     */
    public mIgnoreOffsets = false;

    protected mCustomRenderer: CustomRenderer;

    /**
     * default constructor
     */
    public AxisBase() {
        this.mTextSize = 10;
        this.mXOffset = 5;
        this.mYOffset = 5;
        this.mLimitLines = [];
    }

    /**
     * Set this to true to enable drawing the grid lines for this axis.
     *
     * @param enabled
     */
    public setDrawGridLines(enabled) {
        this.mDrawGridLines = enabled;
    }

    /**
     * Returns true if drawing grid lines is enabled for this axis.
     *
     * @return
     */
    public isDrawGridLinesEnabled() {
        return this.mDrawGridLines;
    }

    /**
     * Set this to true if the line alongside the axis should be drawn or not.
     *
     * @param enabled
     */
    public setDrawAxisLine(enabled) {
        this.mDrawAxisLine = enabled;
    }

    /**
     * Returns true if the line alongside the axis should be drawn.
     *
     * @return
     */
    public isDrawAxisLineEnabled() {
        return this.mDrawAxisLine;
    }
    /**
     * Set this to true to draw axis ignoring viewport offsets
     *
     * @param enabled
     */
    public setIgnoreOffsets(enabled) {
        this.mIgnoreOffsets = enabled;
    }

    /**
     * Returns true if we draw axis ignoring viewport offsets
     *
     * @return
     */
    public isIgnoringOffsets() {
        return this.mIgnoreOffsets;
    }

    /**
     * Centers the axis labels instead of drawing them at their original position.
     * This is useful especially for grouped BarChart.
     *
     * @param enabled
     */
    public setCenterAxisLabels(enabled) {
        this.mCenterAxisLabels = enabled;
    }

    public isCenterAxisLabelsEnabled() {
        return this.mCenterAxisLabels && this.mEntryCount > 0;
    }

    /**
     * Sets the color of the grid lines for this axis (the horizontal lines
     * coming from each label).
     *
     * @param color
     */
    public setGridColor(color) {
        this.mGridColor = color;
    }

    /**
     * Returns the color of the grid lines for this axis (the horizontal lines
     * coming from each label).
     *
     * @return
     */
    public getGridColor() {
        return this.mGridColor;
    }

    /**
     * Sets the width of the border surrounding the chart in dp.
     *
     * @param width
     */
    public setAxisLineWidth(width) {
        this.mAxisLineWidth = width;
    }

    /**
     * Returns the width of the axis line (line alongside the axis).
     *
     * @return
     */
    public getAxisLineWidth() {
        return this.mAxisLineWidth;
    }

    /**
     * Sets the width of the grid lines that are drawn away from each axis
     * label.
     *
     * @param width
     */
    public setGridLineWidth(width) {
        this.mGridLineWidth = width;
    }

    /**
     * Returns the width of the grid lines that are drawn away from each axis
     * label.
     *
     * @return
     */
    public getGridLineWidth() {
        return this.mGridLineWidth;
    }

    /**
     * Sets the color of the border surrounding the chart.
     *
     * @param color
     */
    public setAxisLineColor(color) {
        this.mAxisLineColor = color;
    }

    /**
     * Returns the color of the axis line (line alongside the axis).
     *
     * @return
     */
    public getAxisLineColor() {
        return this.mAxisLineColor;
    }

    /**
     * Set this to true to enable drawing the labels of this axis (this will not
     * affect drawing the grid lines or axis lines).
     *
     * @param enabled
     */
    public setDrawLabels(enabled) {
        this.mDrawLabels = enabled;
    }

    /**
     * Returns true if drawing the labels is enabled for this axis.
     *
     * @return
     */
    public isDrawLabelsEnabled() {
        return this.mDrawLabels;
    }

    v;
    public setLabelCount(count, force?: boolean) {
        if (count > 25) count = 25;
        if (count < 2) count = 2;

        this.mLabelCount = count;
        this.mForceLabels = !!force;
    }

    /**
     * Returns true if focing the y-label count is enabled. Default: false
     *
     * @return
     */
    public isForceLabelsEnabled() {
        return this.mForceLabels;
    }

    /**
     * Returns the number of label entries the y-axis should have
     *
     * @return
     */
    public getLabelCount() {
        return this.mLabelCount;
    }

    /**
     * @return true if granularity is enabled
     */
    public isForceIntervalEnabled() {
        return this.mForcedIntervalEnabled;
    }
    /**
     * Set a forced interval.
     *
     * @param interval
     */
    public setForcedInterval(interval) {
        this.mForcedInterval = interval;
        // set this to true if it was disabled, as it makes no sense to call this method with forcedInterval disabled
        this.mForcedIntervalEnabled = true;
    }
    /**
     * @return the force interval
     */
    public getForcedInterval() {
        return this.mForcedInterval;
    }

    /**
     * @return true if granularity is enabled
     */
    public isGranularityEnabled() {
        return this.mGranularityEnabled;
    }

    /**
     * Enabled/disable granularity control on axis value ervals. If enabled, the axis
     * erval is not allowed to go below a certain granularity. Default: false
     *
     * @param enabled
     */
    public setGranularityEnabled(enabled) {
        this.mGranularityEnabled = enabled;
    }

    /**
     * @return the minimum erval between axis values
     */
    public getGranularity() {
        return this.mGranularity;
    }

    /**
     * Set a minimum erval for the axis when zooming in. The axis is not allowed to go below
     * that limit. This can be used to a label duplicating when zooming in.
     *
     * @param granularity
     */
    public setGranularity(granularity) {
        this.mGranularity = granularity;
        // set this to true if it was disabled, as it makes no sense to call this method with granularity disabled
        this.mGranularityEnabled = true;
    }

    /**
     * Adds a new LimitLine to this axis.
     *
     * @param l
     */
    public addLimitLine(l: LimitLine) {
        this.mLimitLines.push(l);

        if (this.mLimitLines.length > 6) {
            console.error('MPAndroiChart', 'Warning! You have more than 6 LimitLines on your axis, do you really want ' + 'that?');
        }
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
     *
     * @return
     */
    public getLimitLines() {
        return this.mLimitLines;
    }

    /**
     * If this is set to true, the labels are drawn behind the actual data,
     * otherwise on top. Default: false
     *
     * @param enabled
     */
    public setDrawLabelsBehindData(enabled) {
        this.mDrawLabelsBehindData = enabled;
    }

    public isDrawLabelsBehindDataEnabled() {
        return this.mDrawLabelsBehindData;
    }
    /**
     * If this is set to true, the LimitLines are drawn behind the actual data,
     * otherwise on top. Default: false
     *
     * @param enabled
     */
    public setDrawLimitLinesBehindData(enabled) {
        this.mDrawLimitLineBehindData = enabled;
    }

    public isDrawLimitLinesBehindDataEnabled() {
        return this.mDrawLimitLineBehindData;
    }
    /**
     * If this is set to false, the LimitLines are not drawn
     * otherwise on top. Default: false
     *
     * @param enabled
     */
    public setDrawLimitLines(enabled) {
        this.mDrawLimitLines = enabled;
    }

    public isDrawLimitLinesEnabled() {
        return this.mDrawLimitLines;
    }

    /**
     * If this is set to false, the grid lines are draw on top of the actual data,
     * otherwise behind. Default: true
     *
     * @param enabled
     */
    public setDrawGridLinesBehindData(enabled) {
        this.mDrawGridLinesBehindData = enabled;
    }

    public isDrawGridLinesBehindDataEnabled() {
        return this.mDrawGridLinesBehindData;
    }

    public setDrawMarkTicks(enabled) {
        this.mDrawMarkTicks = enabled;
    }

    public isDrawMarkTicksEnabled() {
        return this.mDrawMarkTicks;
    }

    /**
     * Returns the longest formatted label (in terms of characters), this axis
     * contains.
     *
     * @return
     */
    public getLongestLabel() {
        let longest = '';
        const labels = this.mLabels;
        for (let i = 0; i < this.mEntries.length; i++) {
            const text = labels[i];

            if (text != null && longest.length < text.length) {
                longest = text;
            }
        }

        return longest;
    }

    public getFormattedLabel(index) {
        if (index < 0 || index >= this.mEntries.length) return '';
        else return this.mLabels[index];
    }

    /**
     * Sets the formatter to be used for formatting the axis labels. If no formatter is set, the
     * chart will
     * automatically determine a reasonable formatting (concerning decimals) for all the values
     * that are drawn inside
     * the chart. Use chart.getDefaultValueFormatter() to use the formatter calculated by the chart.
     *
     * @param f
     */
    public setValueFormatter(f: IAxisValueFormatter) {
        if (f == null) this.mAxisValueFormatter = new DefaultAxisValueFormatter(this.mDecimals);
        else this.mAxisValueFormatter = f;
    }

    /**
     * Returns the formatter used for formatting the axis labels.
     *
     * @return
     */
    public getValueFormatter() {
        if (this.mAxisValueFormatter == null || (this.mAxisValueFormatter instanceof DefaultAxisValueFormatter && this.mAxisValueFormatter.getDecimalDigits() !== this.mDecimals)) {
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
        this.mGridDashPathEffect = new DashPathEffect([lineLength, spaceLength], phase);
    }
    /**
     * Enables the grid line to be drawn in dashed mode, e.g. like this
     * "- - - - - -". THIS ONLY WORKS IF HARDWARE-ACCELERATION IS TURNED OFF.
     * Keep in mind that hardware acceleration boosts performance.
     *
     * @param effect the DashPathEffect
     */
    public setGridDashedLine(effect: DashPathEffect) {
        this.mGridDashPathEffect = effect;
    }

    /**
     * Disables the grid line to be drawn in dashed mode.
     */
    public disableGridDashedLine() {
        this.mGridDashPathEffect = null;
    }

    /**
     * Returns true if the grid dashed-line effect is enabled, false if not.
     *
     * @return
     */
    public isGridDashedLineEnabled() {
        return this.mGridDashPathEffect == null ? false : true;
    }

    /**
     * returns the DashPathEffect that is set for grid line
     *
     * @return
     */
    public getGridDashPathEffect() {
        return this.mGridDashPathEffect;
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
        this.mAxisLineDashPathEffect = parseDashEffect(`${lineLength} ${spaceLength} ${phase}`);
    }

    /**
     * Enables the axis line to be drawn in dashed mode, e.g. like this
     * "- - - - - -". THIS ONLY WORKS IF HARDWARE-ACCELERATION IS TURNED OFF.
     * Keep in mind that hardware acceleration boosts performance.
     *
     * @param effect the DashPathEffect
     */
    public setAxisLineDashedLine(effect) {
        this.mAxisLineDashPathEffect = effect;
    }

    /**
     * Disables the axis line to be drawn in dashed mode.
     */
    public disableAxisLineDashedLine() {
        this.mAxisLineDashPathEffect = null;
    }

    /**
     * Returns true if the axis dashed-line effect is enabled, false if not.
     *
     * @return
     */
    public isAxisLineDashedLineEnabled() {
        return this.mAxisLineDashPathEffect == null ? false : true;
    }

    /**
     * returns the DashPathEffect that is set for axis line
     *
     * @return
     */
    public getAxisLineDashPathEffect() {
        return this.mAxisLineDashPathEffect;
    }

    /**
     * ###### BELOW CODE RELATED TO CUSTOM AXIS VALUES ######
     */

    public getAxisMaximum() {
        return this.mAxisMaximum;
    }

    public getAxisMinimum() {
        return this.mAxisMinimum;
    }

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
     *
     * @return
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
     *
     * @return
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
    public setAxisMinimum(min) {
        this.mCustomAxisMin = true;
        this.mAxisMinimum = min;
        this.mAxisRange = Math.abs(this.mAxisMaximum - min);
    }

    /**
     * Set a suggested minimum value for this axis. If set, this will be used
     * as minimum is no value is smaller than it.
     *
     * @param min
     */
    public setSuggestedAxisMinimum(min) {
        this.mAxisSuggestedMinimum = min;
    }

    /**
     * Set a suggested maximum value for this axis. If set, this will be used
     * as maximum is no value is greater than it.
     *
     * @param min
     */
    public setSuggestedAxisMaximum(max) {
        this.mAxisSuggestedMaximum = max;
    }

    /**
     * Use setAxisMinimum(...) instead.
     *
     * @param min
     */

    public setAxisMinValue(min) {
        this.setAxisMinimum(min);
    }

    /**
     * Set a custom maximum value for this axis. If set, this value will not be calculated
     * automatically depending on
     * the provided data. Use resetAxisMaxValue() to undo this.
     *
     * @param max
     */
    public setAxisMaximum(max) {
        this.mCustomAxisMax = true;
        this.mAxisMaximum = max;
        this.mAxisRange = Math.abs(max - this.mAxisMinimum);
    }

    /**
     * Use setAxisMaximum(...) instead.
     *
     * @param max
     */

    public setAxisMaxValue(max) {
        this.setAxisMaximum(max);
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
        let min = this.mCustomAxisMin ? this.mAxisMinimum : dataMin - this.mSpaceMin;
        let max = this.mCustomAxisMax ? this.mAxisMaximum : dataMax + this.mSpaceMax;
        if (this.mAxisSuggestedMinimum !== undefined) {
            min = Math.min(min, this.mAxisSuggestedMinimum);
        }
        if (this.mAxisSuggestedMaximum !== undefined) {
            max = Math.max(max, this.mAxisSuggestedMaximum);
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

    /**
     * Gets extra spacing for `axisMinimum` to be added to automatically calculated `axisMinimum`
     */
    public getSpaceMin() {
        return this.mSpaceMin;
    }

    /**
     * Sets extra spacing for `axisMinimum` to be added to automatically calculated `axisMinimum`
     */
    public setSpaceMin(spaceMin) {
        this.mSpaceMin = spaceMin;
    }

    /**
     * Gets extra spacing for `axisMaximum` to be added to automatically calculated `axisMaximum`
     */
    public getSpaceMax() {
        return this.mSpaceMax;
    }

    /**
     * Sets extra spacing for `axisMaximum` to be added to automatically calculated `axisMaximum`
     */
    public setSpaceMax(spaceMax) {
        this.mSpaceMax = spaceMax;
    }

    /**
     * Returns the text alignment of the axis labels.
     *
     * @return
     */
    public getLabelTextAlign() {
        return this.mLabelTextAlign;
    }
    /**
     * Returns the text alignment of the description.
     *
     * @return
     */
    public setLabelTextAlign(value: Align) {
        this.mLabelTextAlign = value;
    }

    /**
     * set a custom line renderer
     */
    public setCustomRenderer(renderer: CustomRenderer) {
        this.mCustomRenderer = renderer;
    }
    /**
     * get the custom line renderer
     */
    public getCustomRenderer() {
        return this.mCustomRenderer;
    }
}
