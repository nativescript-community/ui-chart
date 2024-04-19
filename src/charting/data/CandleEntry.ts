import { Entry } from './Entry';

export interface CandleEntry extends Entry {
    /** shadow-high value */
    high: number;

    /** shadow-low value */
    low: number;

    /** close value */
    close: number;

    /** open value */
    open: number;

    /**
     * Constructor.
     *
     * @param x The value on the x-axis
     * @param shadowH The (shadow) high value
     * @param shadowL The (shadow) low value
     * @param open The open value
     * @param close The close value
     */
    // constructor(x, shadowH, shadowL, open, close) {
    //     this.x = x;
    //     this.y = (shadowH + shadowL) / 2;

    //     this.mShadowHigh = shadowH;
    //     this.mShadowLow = shadowL;
    //     this.mOpen = open;
    //     this.mClose = close;
    // }

    /**
     * Returns the overall range (difference) between shadow-high and
     * shadow-low.
     */
    // public getShadowRange() {
    //     return Math.abs(this.mShadowHigh - this.mShadowLow);
    // }

    /**
     * Returns the body size (difference between open and close).
     */
    // public getBodyRange() {
    //     return Math.abs(this.mOpen - this.mClose);
    // }

    /**
     * Returns the upper shadows highest value.
     */
    // public getHigh() {
    //     return this.mShadowHigh;
    // }

    // public setHigh(mShadowHigh) {
    //     this.mShadowHigh = mShadowHigh;
    // }

    /**
     * Returns the lower shadows lowest value.
     */
    // public getLow() {
    //     return this.mShadowLow;
    // }

    // public setLow(mShadowLow) {
    //     this.mShadowLow = mShadowLow;
    // }

    /**
     * Returns the bodys close value.
     */
    // public getClose() {
    //     return this.mClose;
    // }

    // public setClose(mClose) {
    //     this.mClose = mClose;
    // }

    /**
     * Returns the bodys open value.
     */
    // public getOpen() {
    //     return this.mOpen;
    // }

    // public setOpen(mOpen) {
    //     this.mOpen = mOpen;
    // }
}
