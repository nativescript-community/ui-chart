import { CandleEntry } from './CandleEntry';
import { ICandleDataSet } from '../interfaces/datasets/ICandleDataSet';
import { LineScatterCandleRadarDataSet } from './LineScatterCandleRadarDataSet';
import { Style } from '@nativescript-community/ui-canvas';
import { ColorTemplate } from '../utils/ColorTemplate';
import { Utils } from '../utils/Utils';
import { Color } from '@nativescript/core';

export class CandleDataSet extends LineScatterCandleRadarDataSet<CandleEntry> implements ICandleDataSet {
    /**
     * property to access the "high" value of an entry for this set
     *
     */
    highProperty: string = 'high';
    /**
     * property to access the "low" value of an entry for this set
     *
     */
    lowProperty: string = 'low';
    /**
     * property to access the "close" value of an entry for this set
     *
     */
    closeProperty: string = 'close';

    /**
     * property to access the "open" value of an entry for this set
     *
     */
    openProperty: string = 'open';

    /**
     * the width of the shadow of the candle
     */
    shadowWidth = 3;

    /**
     * should the candle bars show?
     * when false, only "ticks" will show
     * <p/>
     * - default: true
     */
    showCandleBar = true;

    /**
     * the space between the candle entries, default 0.1 (10%)
     */
    barSpace = 0.1;

    /**
     * use candle color for the shadow
     */
    shadowColorSameAsCandle = false;

    /**
     * palet style when open < close
     * increasing candlesticks are traditionally hollow
     */
    increasingPaintStyle = Style.STROKE;

    /**
     * palet style when open > close
     * descreasing candlesticks are traditionally filled
     */
    decreasingPaintStyle = Style.FILL;

    /**
     * color for open == close
     */
    neutralColor: Color | string = ColorTemplate.COLOR_SKIP;

    /**
     * color for open < close
     */
    increasingColor: Color | string = ColorTemplate.COLOR_SKIP;

    /**
     * color for open > close
     */
    decreasingColor: Color | string = ColorTemplate.COLOR_SKIP;

    /**
     * shadow line color, set -1 for backward compatibility and uses default
     * color
     */
    shadowColor: Color | string = ColorTemplate.COLOR_SKIP;

    constructor(yVals, label, xProperty?, yProperty?, highProperty?, lowProperty?, openProperty?, closeProperty?) {
        super(yVals, label, xProperty, yProperty);
        if (highProperty) {
            this.highProperty = highProperty;
        }
        if (lowProperty) {
            this.lowProperty = lowProperty;
        }
        if (openProperty) {
            this.openProperty = openProperty;
        }
        if (closeProperty) {
            this.closeProperty = closeProperty;
        }
        this.init();
    }

    protected calcMinMaxForEntry(e?: CandleEntry, index?: number) {
        if (!e) return;
        const high = e[this.highProperty];
        const low = e[this.lowProperty];

        if (low < this.mYMin) this.mYMin = low;

        if (high > this.mYMax) this.mYMax = high;

        this.calcMinMaxX(e, index);
    }

    protected calcMinMaxY(e: CandleEntry) {
        const high = e[this.highProperty];
        const low = e[this.lowProperty];
        if (high < this.mYMin) this.mYMin = high;

        if (high > this.mYMax) this.mYMax = high;

        if (low < this.mYMin) this.mYMin = low;

        if (low > this.mYMax) this.mYMax = low;
    }

    /** BELOW THIS COLOR HANDLING */
}
