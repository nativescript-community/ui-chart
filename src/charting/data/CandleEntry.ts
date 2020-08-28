import { Entry } from './Entry';

export class CandleEntry extends Entry {
    /** shadow-high value */
    private mShadowHigh = 0;

    /** shadow-low value */
    private mShadowLow = 0;

    /** close value */
    private mClose = 0;

    /** open value */
    private mOpen = 0;

    /**
     * Constructor.
     *
     * @param x The value on the x-axis
     * @param shadowH The (shadow) high value
     * @param shadowL The (shadow) low value
     * @param open The open value
     * @param close The close value
     */
    constructor(x, shadowH, shadowL, open, close) {
        super(x, (shadowH + shadowL) / 2);
        this.mShadowHigh = shadowH;
        this.mShadowLow = shadowL;
        this.mOpen = open;
        this.mClose = close;
    }

    /**
     * Returns the overall range (difference) between shadow-high and
     * shadow-low.
     *
     * @return
     */
    public getShadowRange() {
        return Math.abs(this.mShadowHigh - this.mShadowLow);
    }

    /**
     * Returns the body size (difference between open and close).
     *
     * @return
     */
    public getBodyRange() {
        return Math.abs(this.mOpen - this.mClose);
    }

    /**
     * Returns the upper shadows highest value.
     *
     * @return
     */
    public getHigh() {
        return this.mShadowHigh;
    }

    public setHigh(mShadowHigh) {
        this.mShadowHigh = mShadowHigh;
    }

    /**
     * Returns the lower shadows lowest value.
     *
     * @return
     */
    public getLow() {
        return this.mShadowLow;
    }

    public setLow(mShadowLow) {
        this.mShadowLow = mShadowLow;
    }

    /**
     * Returns the bodys close value.
     *
     * @return
     */
    public getClose() {
        return this.mClose;
    }

    public setClose(mClose) {
        this.mClose = mClose;
    }

    /**
     * Returns the bodys open value.
     *
     * @return
     */
    public getOpen() {
        return this.mOpen;
    }

    public setOpen(mOpen) {
        this.mOpen = mOpen;
    }
}
