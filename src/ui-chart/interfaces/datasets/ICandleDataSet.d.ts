import { ILineScatterCandleRadarDataSet } from './ILineScatterCandleRadarDataSet';
import { CandleEntry } from '../../data/CandleEntry';
import { Style } from '@nativescript-community/ui-canvas';

export interface ICandleDataSet extends ILineScatterCandleRadarDataSet<CandleEntry> {
    /**
     * property to access the "high" value of an entry for this set
     *
     */
    highProperty: string;
    /**
     * property to access the "low" value of an entry for this set
     *
     */
    lowProperty: string;
    /**
     * property to access the "close" value of an entry for this set
     *
     */
    closeProperty: string;

    /**
     * property to access the "open" value of an entry for this set
     *
     */
    openProperty: string;

    /**
     * the width of the shadow of the candle
     */
    shadowWidth: number;

    /**
     * should the candle bars show?
     * when false, only "ticks" will show
     * <p/>
     * - default: true
     */
    showCandleBar: boolean;
    /**
     * the space between the candle entries, default 0.1 (10%)
     */
    barSpace: number;

    /**
     * use candle color for the shadow
     */
    shadowColorSameAsCandle: boolean;

    /**
     * palet style when open < close
     * increasing candlesticks are traditionally hollow
     */
    increasingPaintStyle: Style;
    /**
     * palet style when open > close
     * descreasing candlesticks are traditionally filled
     */
    decreasingPaintStyle: Style;

    /**
     * color for open == close
     */
    neutralColor: Color | string;

    /**
     * color for open < close
     */
    increasingColor: Color | string;

    /**
     * color for open > close
     */
    decreasingColor: Color | string;

    /**
     * shadow line color, set -1 for backward compatibility and uses default
     * color
     */
    shadowColor: Color | string;
}
