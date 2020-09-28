import { Color } from '@nativescript/core/color';
import { BarLineScatterCandleBubbleDataSet } from './BarLineScatterCandleBubbleDataSet';
import { BarEntry } from './BarEntry';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';
import { Utils } from '../utils/Utils';

export class BarDataSet extends BarLineScatterCandleBubbleDataSet<BarEntry> implements IBarDataSet {
    /**
     * the maximum number of bars that are stacked upon each other, this value
     * is calculated from the Entries that are added to the DataSet
     */
    private mStackSize: number;

    /**
     * the color used for drawing the bar shadows
     */
    private mBarShadowColor: string | Color = '#D7D7D7';

    private mBarBorderWidth = 0.0;

    private mBarBorderColor: string | Color = 'black';

    /**
     * the alpha value used to draw the highlight indicator bar
     */
    private mHighLightAlpha = 120;

    /**
     * the overall entry count, including counting each stack-value individually
     */
    private mEntryCountStacks: number;

    /**
     * array of labels used to describe the different values of the stacked bars
     */
    private mStackLabels = ['Stack'];

    constructor(values, label, xProperty?, yProperty?) {
        super(values, label, xProperty, yProperty);

        this.mHighLightColor = 'black';
    }

    private calcEntryRanges(e: BarEntry) {
        const values = e.yVals;

        if (values == null || values.length === 0) return;

        e.ranges = [];

        let negRemain = -e.negativeSum;
        let posRemain = 0;

        for (let i = 0; i < values.length; i++) {
            const value = values[i];

            if (value < 0) {
                e.ranges.push([negRemain, negRemain - value]);
                negRemain -= value;
            } else {
                e.ranges.push([posRemain, posRemain + value]);
                posRemain += value;
            }
        }
    }

    protected initEntryData(e: BarEntry) {
        super.initEntryData(e);

        const vals = e.yVals;

        // Defaults
        this.mStackSize = 1;
        this.mEntryCountStacks = 0;

        const sums = Utils.calcPosNegSum(vals);
        e.positiveSum = sums.pos;
        e.negativeSum = sums.neg;

        if (!vals || vals.length === 0) {
            this.mEntryCountStacks++;
        } else {
            // Get stack-based y value
            e[this.yProperty] = Utils.calcSum(vals);
            e.isStacked = true;

            // Get ranges
            this.calcEntryRanges(e);

            this.mEntryCountStacks += vals.length;

            // Always use highest stack size
            if (vals.length > this.mStackSize) {
                this.mStackSize = vals.length;
            }
        }
    }

    protected calcMinMaxForEntry(e?: BarEntry, index?: number) {
        if (!e) return;
        const yProperty = this.yProperty;
        if (e != null && !isNaN(e[yProperty])) {
            if (e.yVals == null) {
                if (e[yProperty] < this.mYMin) this.mYMin = e[yProperty];

                if (e[yProperty] > this.mYMax) this.mYMax = e[yProperty];
            } else {
                if (-e.negativeSum < this.mYMin) this.mYMin = -e.negativeSum;

                if (e.positiveSum > this.mYMax) this.mYMax = e.positiveSum;
            }

            this.calcMinMaxX(e);
        }
    }

    public getStackSize() {
        return this.mStackSize;
    }

    public isStacked() {
        return this.mStackSize > 1 ? true : false;
    }

    /**
     * returns the overall entry count, including counting each stack-value
     * individually
     *
     * @return
     */
    public getEntryCountStacks() {
        return this.mEntryCountStacks;
    }

    /**
     * Sets the color used for drawing the bar-shadows. The bar shadows is a
     * surface behind the bar that indicates the maximum value. Don't for get to
     * use getResources().getColor(...) to set this. Or new Color(255, ...).
     *
     * @param color
     */
    public setBarShadowColor(color: string | Color) {
        this.mBarShadowColor = color;
    }

    public getBarShadowColor() {
        return this.mBarShadowColor;
    }

    /**
     * Sets the width used for drawing borders around the bars.
     * If borderWidth == 0, no border will be drawn.
     *
     * @return
     */
    public setBarBorderWidth(width) {
        this.mBarBorderWidth = width;
    }

    /**
     * Returns the width used for drawing borders around the bars.
     * If borderWidth == 0, no border will be drawn.
     *
     * @return
     */

    public getBarBorderWidth() {
        return this.mBarBorderWidth;
    }

    /**
     * Sets the color drawing borders around the bars.
     *
     * @return
     */
    public setBarBorderColor(color: string | Color) {
        this.mBarBorderColor = color;
    }

    /**
     * Returns the color drawing borders around the bars.
     *
     * @return
     */

    public getBarBorderColor() {
        return this.mBarBorderColor;
    }

    /**
     * Set the alpha value (transparency) that is used for drawing the highlight
     * indicator bar. min = 0 (fully transparent), max = 255 (fully opaque)
     *
     * @param alpha
     */
    public setHighLightAlpha(alpha) {
        this.mHighLightAlpha = alpha;
    }

    public getHighLightAlpha() {
        return this.mHighLightAlpha;
    }

    /**
     * Sets labels for different values of bar-stacks, in case there are one.
     *
     * @param labels
     */
    public setStackLabels(labels) {
        this.mStackLabels = labels;
    }

    public getStackLabels() {
        return this.mStackLabels;
    }
}
