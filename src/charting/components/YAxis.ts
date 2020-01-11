import { AxisBase } from "./AxisBase";
import { Color } from "@nativescript/core/color/color";
import { Paint } from "nativescript-canvas";
import { Utils } from '../utils/Utils';

    /**
     * Enum that specifies the axis a DataSet should be plotted against, either LEFT or RIGHT.
     *
     * @author Philipp Jahoda
     */
    export  enum AxisDependency {
        LEFT, RIGHT
    }
    /**
     * enum for the position of the y-labels relative to the chart
     */
    export enum YAxisLabelPosition {
        OUTSIDE_CHART, INSIDE_CHART
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
 * @author Philipp Jahoda
 */
export class YAxis extends AxisBase {

    /**
     * indicates if the bottom y-label entry is drawn or not
     */
    private  mDrawBottomYLabelEntry = true;

    /**
     * indicates if the top y-label entry is drawn or not
     */
    private  mDrawTopYLabelEntry = true;

    /**
     * flag that indicates if the axis is inverted or not
     */
    protected  mInverted = false;

    /**
     * flag that indicates if the zero-line should be drawn regardless of other grid lines
     */
    protected  mDrawZeroLine = false;

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
    protected mZeroLineColor = new Color('gray');

    /**
     * Width of the zero line in pixels
     */
    protected mZeroLineWidth = 1;

    /**
     * axis space from the largest value to the top in percent of the total axis range
     */
    protected mSpacePercentTop = 10;

    /**
     * axis space from the smallest value to the bottom in percent of the total axis range
     */
    protected mSpacePercentBottom = 10;

    /**
     * the position of the y-labels relative to the chart
     */
    private mPosition = YAxisLabelPosition.OUTSIDE_CHART;



    /**
     * the side this axis object represents
     */
    private mAxisDependency: AxisDependency;

    /**
     * the minimum width that the axis should take (in dp).
     * <p/>
     * default: 0.0
     */
    protected mMinWidth = 0;

    /**
     * the maximum width that the axis can take (in dp).
     * use Inifinity for disabling the maximum
     * default: Number.POSITIVE_INFINITY (no maximum specified)
     */
    protected mMaxWidth = Number.POSITIVE_INFINITY;



    constructor( position = AxisDependency.LEFT) {
        super();
        this.mAxisDependency = position;
        this.mYOffset = 0;
    }

    public  getAxisDependency() {
        return this.mAxisDependency;
    }

    /**
     * @return the minimum width that the axis should take (in dp).
     */
    public  getMinWidth() {
        return this.mMinWidth;
    }

    /**
     * Sets the minimum width that the axis should take (in dp).
     *
     * @param minWidth
     */
    public setMinWidth( minWidth) {
        this.mMinWidth = minWidth;
    }

    /**
     * @return the maximum width that the axis can take (in dp).
     */
    public  getMaxWidth() {
        return this.mMaxWidth;
    }

    /**
     * Sets the maximum width that the axis can take (in dp).
     *
     * @param maxWidth
     */
    public setMaxWidth( maxWidth) {
        this.mMaxWidth = maxWidth;
    }

    /**
     * returns the position of the y-labels
     */
    public  getLabelPosition() {
        return this.mPosition;
    }

    /**
     * sets the position of the y-labels
     *
     * @param pos
     */
    public setPosition( pos) {
        this.mPosition = pos;
    }

    /**
     * returns true if drawing the top y-axis label entry is enabled
     *
     * @return
     */
    public  isDrawTopYLabelEntryEnabled() {
        return this.mDrawTopYLabelEntry;
    }

    /**
     * returns true if drawing the bottom y-axis label entry is enabled
     *
     * @return
     */
    public  isDrawBottomYLabelEntryEnabled() {
        return this.mDrawBottomYLabelEntry;
    }

    /**
     * set this to true to enable drawing the top y-label entry. Disabling this can be helpful
     * when the top y-label and
     * left x-label interfere with each other. default: true
     *
     * @param enabled
     */
    public setDrawTopYLabelEntry( enabled) {
        this.mDrawTopYLabelEntry = enabled;
    }

    /**
     * If this is set to true, the y-axis is inverted which means that low values are on top of
     * the chart, high values
     * on bottom.
     *
     * @param enabled
     */
    public setInverted( enabled) {
        this.mInverted = enabled;
    }

    /**
     * If this returns true, the y-axis is inverted.
     *
     * @return
     */
    public isInverted() {
        return this.mInverted;
    }

    /**
     * This method is deprecated.
     * Use setAxisMinimum(...) / setAxisMaximum(...) instead.
     *
     * @param startAtZero
     */
    
    public setStartAtZero( startAtZero) {
        if (startAtZero)
        this.setAxisMinimum(0);
        else
        this.resetAxisMinimum();
    }

    /**
     * Sets the top axis space in percent of the full range. Default 10
     *
     * @param percent
     */
    public setSpaceTop(percent) {
        this.mSpacePercentTop = percent;
    }

    /**
     * Returns the top axis space in percent of the full range. Default 10
     *
     * @return
     */
    public getSpaceTop() {
        return this.mSpacePercentTop;
    }

    /**
     * Sets the bottom axis space in percent of the full range. Default 10
     *
     * @param percent
     */
    public setSpaceBottom(percent) {
        this.mSpacePercentBottom = percent;
    }

    /**
     * Returns the bottom axis space in percent of the full range. Default 10
     *
     * @return
     */
    public getSpaceBottom() {
        return this.mSpacePercentBottom;
    }

    public isDrawZeroLineEnabled() {
        return this.mDrawZeroLine;
    }

    /**
     * Set this to true to draw the zero-line regardless of weather other
     * grid-lines are enabled or not. Default: false
     *
     * @param this.mDrawZeroLine
     */
    public setDrawZeroLine( drawZeroLine) {
        this.mDrawZeroLine = drawZeroLine;
    }

    public getZeroLineColor() {
        return this.mZeroLineColor;
    }

    /**
     * Sets the color of the zero line
     *
     * @param color
     */
    public setZeroLineColor(color) {
        this.mZeroLineColor = color;
    }

    public getZeroLineWidth() {
        return this.mZeroLineWidth;
    }

    /**
     * Sets the width of the zero line in dp
     *
     * @param width
     */
    public setZeroLineWidth(width) {
        this.mZeroLineWidth = width;
    }

    /**
     * This is for normal (not horizontal) charts horizontal spacing.
     *
     * @param p
     * @return
     */
    public getRequiredWidthSpace(p:Paint) {

        p.setTextSize(this.mTextSize);

        const label = this.getLongestLabel();
        let width =  Utils.calcTextWidth(p, label) + this.getXOffset() * 2;
        let minWidth = this.getMinWidth();
        let maxWidth = this.getMaxWidth();

        if (minWidth > 0)
            minWidth = minWidth;

        if (maxWidth > 0 && maxWidth != Number.POSITIVE_INFINITY)
            maxWidth = maxWidth;

        width = Math.max(minWidth, Math.min(width, maxWidth > 0.0 ? maxWidth : width));

        return width;
    }

    /**
     * This is for HorizontalBarChart vertical spacing.
     *
     * @param p
     * @return
     */
    public getRequiredHeightSpace(p:Paint) {

        p.setTextSize(this.mTextSize);

        const label = this.getLongestLabel();
        return  Utils.calcTextHeight(p, label) + this.getYOffset() * 2;
    }

    /**
     * Returns true if this axis needs horizontal offset, false if no offset is needed.
     *
     * @return
     */
    public needsOffset() {
        if (this.isEnabled() && this.isDrawLabelsEnabled() && this.getLabelPosition() == YAxisLabelPosition
                .OUTSIDE_CHART)
            return true;
        else
            return false;
    }

    /**
     * Returns true if autoscale restriction for axis min value is enabled
     */
    
    public isUseAutoScaleMinRestriction( ) {
        return this.mUseAutoScaleRestrictionMin;
    }

    /**
     * Sets autoscale restriction for axis min value as enabled/disabled
     */
    
    public setUseAutoScaleMinRestriction(  isEnabled ) {
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
    
    public setUseAutoScaleMaxRestriction(  isEnabled ) {
        this.mUseAutoScaleRestrictionMax = isEnabled;
    }


    
    public calculate(dataMin,  dataMax) {

        let min = dataMin;
        let max = dataMax;

        let range = Math.abs(max - min);

        // in case all values are equal
        if (range == 0) {
            max = max + 1;
            min = min - 1;
        }

        // recalculate
        range = Math.abs(max - min);

        // calc extra spacing
        this.mAxisMinimum = this.mCustomAxisMin ? this.mAxisMinimum : min - (range / 100) * this.getSpaceBottom();
        this.mAxisMaximum = this.mCustomAxisMax ? this.mAxisMaximum : max + (range / 100) * this.getSpaceTop();

        this.mAxisRange = Math.abs(this.mAxisMinimum - this.mAxisMaximum);
    }
}
