import { IDataSet } from './IDataSet';
import { PieEntry } from '../../data/PieEntry';
import { ValuePosition } from '../../data/PieDataSet';

export interface IPieDataSet extends IDataSet<PieEntry> {
    /**
     * the space in pixels between the chart-slices, default 0
     */
    sliceSpace: number;

    /**
     * When enabled, slice spacing will be 0.0 when the smallest value is going to be
     * smaller than the slice spacing itself.
     */
    automaticallyDisableSliceSpacing: boolean;

    /**
     * indicates the selection distance of a pie slice
     */
    selectionShift: number;

    xValuePosition: ValuePosition;
    yValuePosition: ValuePosition;
    usingSliceColorAsValueLineColor: boolean;
    /**
     * When valuePosition is OutsideSlice, indicates line color
     */
    valueLineColor: Color | string;
    /**
     * When valuePosition is OutsideSlice, indicates line width
     */
    valueLineWidth: number;
    /**
     * When valuePosition is OutsideSlice, indicates offset as percentage out of the slice size
     */
    valueLinePart1OffsetPercentage: number;
    /**
     * When valuePosition is OutsideSlice, indicates length of first half of the line
     */
    valueLinePart1Length: number;
    /**
     * When valuePosition is OutsideSlice, indicates length of second half of the line
     */
    valueLinePart2Length: number;
    /**
     * When valuePosition is OutsideSlice, this allows variable line length
     */
    valueLineVariableLength: boolean;
}
