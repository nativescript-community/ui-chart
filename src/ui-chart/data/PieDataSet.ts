import { Color } from '@nativescript/core/color';
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
    sliceSpace = 0;

    /**
     * When enabled, slice spacing will be 0.0 when the smallest value is going to be
     * smaller than the slice spacing itself.
     */
    automaticallyDisableSliceSpacing;

    /**
     * indicates the selection distance of a pie slice
     */
    selectionShift = 18;

    xValuePosition = ValuePosition.INSIDE_SLICE;
    yValuePosition = ValuePosition.INSIDE_SLICE;
    usingSliceColorAsValueLineColor = false;
    /**
     * When valuePosition is OutsideSlice, indicates line color
     */
    valueLineColor = new Color(0xff000000);
    /**
     * When valuePosition is OutsideSlice, indicates line width
     */
    valueLineWidth = 1.0;
    /**
     * When valuePosition is OutsideSlice, indicates offset as percentage out of the slice size
     */
    valueLinePart1OffsetPercentage = 75;
    /**
     * When valuePosition is OutsideSlice, indicates length of first half of the line
     */
    valueLinePart1Length = 0.3;
    /**
     * When valuePosition is OutsideSlice, indicates length of second half of the line
     */
    valueLinePart2Length = 0.4;
    /**
     * When valuePosition is OutsideSlice, this allows variable line length
     */
    valueLineVariableLength = true;

    constructor(yVals, label, yProperty?) {
        super(yVals, label, null, yProperty);
        this.init();
    }

    protected calcMinMaxForEntry(e?: PieEntry, index?: number) {
        if (!e) return;

        this.calcMinMaxY(e, index);
    }
}
