import { Mode } from 'src/charting/data/LineDataSet';
import { IFillFormatter } from 'src/charting/formatter/IFillFormatter';
import { Entry } from '../../data/Entry';
import { ILineRadarDataSet } from './ILineRadarDataSet';

/**
 * Created by Philpp Jahoda on 21/10/15.
 */
export interface ILineDataSet extends ILineRadarDataSet<Entry> {
    /**
     * Returns the drawing mode for this line dataset
     */
    mode: Mode;

    /**
     * Returns the intensity of the cubic lines (the effect intensity).
     * Max = 1 = very cubic, Min = 0.05f = low cubic effect, Default: 0.2f
     */
    cubicIntensity: number;

    useColorsForFill: boolean;
    useColorsForFill: boolean;

    circleColors: string[] | Color[];
    /**
     * Returns the size of the drawn circles.
     */
    circleRadius: number;

    /**
     * Defines whether the circle are drawn in high res (better rendering but slower drawing)
     */
    circleHighRes: boolean;

    /**
     * Returns the hole radius of the drawn circles.
     */
    circleHoleRadius: number;

    /**
     * Returns true if drawing circles for this DataSet is enabled, false if not
     */
    drawCirclesEnabled: boolean;

    /**
     * Returns the color of the inner circle (the circle-hole).
     */
    circleHoleColor: string | Color;

    /**
     * Returns true if drawing the circle-holes is enabled, false if not.
     */
    drawCircleHoleEnabled: boolean;

    /**
     * Returns the DashPathEffect that is used for drawing the lines.
     */
    dashPathEffect: DashPathEffect;

    /**
     * Returns the IFillFormatter that is set for this DataSet.
     */
    fillFormatter: IFillFormatter;

    applyFiltering(scaleX: number);
    maxFilterNumber: number;
}
