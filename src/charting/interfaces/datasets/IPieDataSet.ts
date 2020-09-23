import { IDataSet } from './IDataSet';
import { PieEntry } from '../../data/PieEntry';
import { ValuePosition } from '../../data/PieDataSet';

export interface IPieDataSet extends IDataSet<PieEntry> {
    /**
     * Returns the space that is set to be between the piechart-slices of this
     * DataSet, in pixels.
     *
     * @return
     */
    getSliceSpace();

    /**
     * When enabled, slice spacing will be 0.0 when the smallest value is going to be
     *   smaller than the slice spacing itself.
     *
     * @return
     */
    isAutomaticallyDisableSliceSpacingEnabled();

    /**
     * Returns the distance a highlighted piechart slice is "shifted" away from
     * the chart-center in dp.
     *
     * @return
     */
    getSelectionShift();

    getXValuePosition(): ValuePosition;
    getYValuePosition(): ValuePosition;

    /**
     * When valuePosition is OutsideSlice, use slice colors as line color if true
     * */
    isUsingSliceColorAsValueLineColor();

    /**
     * When valuePosition is OutsideSlice, indicates line color
     * */
    getValueLineColor();

    /**
     *  When valuePosition is OutsideSlice, indicates line width
     *  */
    getValueLineWidth();

    /**
     * When valuePosition is OutsideSlice, indicates offset as percentage out of the slice size
     * */
    getValueLinePart1OffsetPercentage();

    /**
     * When valuePosition is OutsideSlice, indicates length of first half of the line
     * */
    getValueLinePart1Length();

    /**
     * When valuePosition is OutsideSlice, indicates length of second half of the line
     * */
    getValueLinePart2Length();

    /**
     * When valuePosition is OutsideSlice, this allows variable line length
     * */
    isValueLineVariableLength();
}
