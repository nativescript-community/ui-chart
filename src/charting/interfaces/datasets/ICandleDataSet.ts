import { ILineScatterCandleRadarDataSet } from './ILineScatterCandleRadarDataSet';
import { CandleEntry } from 'nativescript-chart/charting/data/CandleEntry';

export interface ICandleDataSet extends ILineScatterCandleRadarDataSet<CandleEntry> {
    /**
     * Returns the space that is left out on the left and right side of each
     * candle.
     *
     * @return
     */
    getBarSpace();

    /**
     * Returns whether the candle bars should show?
     * When false, only "ticks" will show
     *
     * - default: true
     *
     * @return
     */
    getShowCandleBar();

    /**
     * Returns the width of the candle-shadow-line in pixels.
     *
     * @return
     */
    getShadowWidth();

    /**
     * Returns shadow color for all entries
     *
     * @return
     */
    getShadowColor();

    /**
     * Returns the neutral color (for open == close)
     *
     * @return
     */
    getNeutralColor();

    /**
     * Returns the increasing color (for open < close).
     *
     * @return
     */
    getIncreasingColor();

    /**
     * Returns the decreasing color (for open > close).
     *
     * @return
     */
    getDecreasingColor();

    /**
     * Returns palet style when open < close
     *
     * @return
     */
    getIncreasingPaintStyle();

    /**
     * Returns palet style when open > close
     *
     * @return
     */
    getDecreasingPaintStyle();

    /**
     * Is the shadow color same as the candle color?
     *
     * @return
     */
    getShadowColorSameAsCandle();
}
