import { DataSet } from './DataSet';
import { PieEntry } from './PieEntry';
import { IPieDataSet } from '../interfaces/datasets/IPieDataSet';
import { Utils } from '../utils/Utils';

export enum ValuePosition {
    INSIDE_SLICE,
    OUTSIDE_SLICE
}
export class PieDataSet extends DataSet<PieEntry> implements IPieDataSet {
    /**
     * the space in pixels between the chart-slices, default 0
     */
    private mSliceSpace = 0;
    private mAutomaticallyDisableSliceSpacing;

    /**
     * indicates the selection distance of a pie slice
     */
    private mShift = 18;

    private mXValuePosition = ValuePosition.INSIDE_SLICE;
    private mYValuePosition = ValuePosition.INSIDE_SLICE;
    private mUsingSliceColorAsValueLineColor = false;
    private mValueLineColor = 0xff000000;
    private mValueLineWidth = 1.0;
    private mValueLinePart1OffsetPercentage = 75;
    private mValueLinePart1Length = 0.3;
    private mValueLinePart2Length = 0.4;
    private mValueLineVariableLength = true;

    protected calcMinMaxForEntry(e: PieEntry) {
        if (e == null) return;

        this.calcMinMaxY(e);
    }

    /**
     * Sets the space that is left out between the piechart-slices in dp.
     * Default: 0 --> no space, maximum 20
     *
     * @param spaceDp
     */
    public setSliceSpace(spaceDp) {
        if (spaceDp > 20) spaceDp = 20;
        if (spaceDp < 0) spaceDp = 0;

        this.mSliceSpace = Utils.convertDpToPixel(spaceDp);
    }

    public getSliceSpace() {
        return this.mSliceSpace;
    }

    /**
     * When enabled, slice spacing will be 0.0 when the smallest value is going to be
     * smaller than the slice spacing itself.
     *
     * @param autoDisable
     */
    public setAutomaticallyDisableSliceSpacing(autoDisable) {
        this.mAutomaticallyDisableSliceSpacing = autoDisable;
    }

    /**
     * When enabled, slice spacing will be 0.0 when the smallest value is going to be
     * smaller than the slice spacing itself.
     *
     * @return
     */

    public isAutomaticallyDisableSliceSpacingEnabled() {
        return this.mAutomaticallyDisableSliceSpacing;
    }

    /**
     * sets the distance the highlighted piechart-slice of this DataSet is
     * "shifted" away from the center of the chart, default 12f
     *
     * @param shift
     */
    public setSelectionShift(shift) {
        this.mShift = Utils.convertDpToPixel(shift);
    }

    public getSelectionShift() {
        return this.mShift;
    }

    public getXValuePosition() {
        return this.mXValuePosition;
    }

    public setXValuePosition(xValuePosition) {
        this.mXValuePosition = xValuePosition;
    }

    public getYValuePosition() {
        return this.mYValuePosition;
    }

    public setYValuePosition(yValuePosition) {
        this.mYValuePosition = yValuePosition;
    }

    /**
     * When valuePosition is OutsideSlice, use slice colors as line color if true
     */

    public isUsingSliceColorAsValueLineColor() {
        return this.mUsingSliceColorAsValueLineColor;
    }

    public setUsingSliceColorAsValueLineColor(usingSliceColorAsValueLineColor) {
        this.mUsingSliceColorAsValueLineColor = usingSliceColorAsValueLineColor;
    }

    /**
     * When valuePosition is OutsideSlice, indicates line color
     */

    public getValueLineColor() {
        return this.mValueLineColor;
    }

    public setValueLineColor(valueLineColor) {
        this.mValueLineColor = valueLineColor;
    }

    /**
     * When valuePosition is OutsideSlice, indicates line width
     */

    public getValueLineWidth() {
        return this.mValueLineWidth;
    }

    public setValueLineWidth(valueLineWidth) {
        this.mValueLineWidth = valueLineWidth;
    }

    /**
     * When valuePosition is OutsideSlice, indicates offset as percentage out of the slice size
     */

    public getValueLinePart1OffsetPercentage() {
        return this.mValueLinePart1OffsetPercentage;
    }

    public setValueLinePart1OffsetPercentage(valueLinePart1OffsetPercentage) {
        this.mValueLinePart1OffsetPercentage = valueLinePart1OffsetPercentage;
    }

    /**
     * When valuePosition is OutsideSlice, indicates length of first half of the line
     */

    public getValueLinePart1Length() {
        return this.mValueLinePart1Length;
    }

    public setValueLinePart1Length(valueLinePart1Length) {
        this.mValueLinePart1Length = valueLinePart1Length;
    }

    /**
     * When valuePosition is OutsideSlice, indicates length of second half of the line
     */

    public getValueLinePart2Length() {
        return this.mValueLinePart2Length;
    }

    public setValueLinePart2Length(valueLinePart2Length) {
        this.mValueLinePart2Length = valueLinePart2Length;
    }

    /**
     * When valuePosition is OutsideSlice, this allows variable line length
     */

    public isValueLineVariableLength() {
        return this.mValueLineVariableLength;
    }

    public setValueLineVariableLength(valueLineVariableLength) {
        this.mValueLineVariableLength = valueLineVariableLength;
    }
}
