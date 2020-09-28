import { Entry } from '../../data/Entry';
import { ILineRadarDataSet } from './ILineRadarDataSet';

/**
 * Created by Philpp Jahoda on 21/10/15.
 */
export interface ILineDataSet extends ILineRadarDataSet<Entry> {
    /**
     * Returns the drawing mode for this line dataset
     *
     * @return
     */
    getMode();

    /**
     * Returns the intensity of the cubic lines (the effect intensity).
     * Max = 1 = very cubic, Min = 0.05f = low cubic effect, Default: 0.2f
     *
     * @return
     */
    getCubicIntensity();

    isDrawCubicEnabled();

    isDrawSteppedEnabled();


    getUseColorsForFill(): boolean;
    setUseColorsForFill(value: boolean);

    /**
     * Returns the size of the drawn circles.
     */
    getCircleRadius();

    /**
     * Returns the hole radius of the drawn circles.
     */
    getCircleHoleRadius();

    /**
     * Returns the color at the given index of the DataSet's circle-color array.
     * Performs a IndexOutOfBounds check by modulus.
     *
     * @param index
     * @return
     */
    getCircleColor(index);

    /**
     * Returns the number of colors in this DataSet's circle-color array.
     *
     * @return
     */
    getCircleColorCount();

    /**
     * Returns true if drawing circles for this DataSet is enabled, false if not
     *
     * @return
     */
    isDrawCirclesEnabled();

    /**
     * Returns the color of the inner circle (the circle-hole).
     *
     * @return
     */
    getCircleHoleColor();

    /**
     * Returns true if drawing the circle-holes is enabled, false if not.
     *
     * @return
     */
    isDrawCircleHoleEnabled();

    /**
     * Returns the DashPathEffect that is used for drawing the lines.
     *
     * @return
     */
    getDashPathEffect();

    /**
     * Returns true if the dashed-line effect is enabled, false if not.
     * If the DashPathEffect object is null, also return false here.
     *
     * @return
     */
    isDashedLineEnabled();

    /**
     * Returns the IFillFormatter that is set for this DataSet.
     *
     * @return
     */
    getFillFormatter();

    applyFiltering(scaleX: number);
    setMaxFilterNumber(value: number);
}
