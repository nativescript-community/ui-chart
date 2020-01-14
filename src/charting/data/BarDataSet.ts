import { BarLineScatterCandleBubbleDataSet } from './BarLineScatterCandleBubbleDataSet';
import { BarEntry } from './BarEntry';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';
import { Color } from '@nativescript/core/color/color';

export class BarDataSet extends BarLineScatterCandleBubbleDataSet<BarEntry> implements IBarDataSet {
    /**
     * the maximum number of bars that are stacked upon each other, this value
     * is calculated from the Entries that are added to the DataSet
     */
    private mStackSize = 1;

    /**
     * the color used for drawing the bar shadows
     */
    private mBarShadowColor = '#D7D7D7';

    private mBarBorderWidth = 0.0;

    private mBarBorderColor = 'black';

    /**
     * the alpha value used to draw the highlight indicator bar
     */
    private mHighLightAlpha = 120;

    /**
     * the overall entry count, including counting each stack-value individually
     */
    private mEntryCountStacks = 0;

    /**
     * array of labels used to describe the different values of the stacked bars
     */
    private mStackLabels = ['Stack'];

    constructor(yVals, label) {
        super(yVals, label);

        this.mHighLightColor = 'black';

        this.calcStackSize(yVals);
        this.calcEntryCountIncludingStacks(yVals);
    }

    /**
     * Calculates the total number of entries this DataSet represents, including
     * stacks. All values belonging to a stack are calculated separately.
     */
    private calcEntryCountIncludingStacks(yVals) {
        this.mEntryCountStacks = 0;

        for (let i = 0; i < yVals.length; i++) {
            const vals = yVals.get(i).getYVals();

            if (vals == null) this.mEntryCountStacks++;
            else this.mEntryCountStacks += vals.length;
        }
    }

    /**
     * calculates the maximum stacksize that occurs in the Entries array of this
     * DataSet
     */
    private calcStackSize(yVals) {
        for (let i = 0; i < yVals.length; i++) {
            const vals = yVals.get(i).getYVals();

            if (vals != null && vals.length > this.mStackSize) this.mStackSize = vals.length;
        }
    }

    protected calcMinMaxForEntry(e: BarEntry) {
        const yProperty = this.yProperty;
        if (e != null && !isNaN(e[yProperty])) {
            if (e.getYVals() == null) {
                if (e[yProperty] < this.mYMin) this.mYMin = e[yProperty];

                if (e[yProperty] > this.mYMax) this.mYMax = e[yProperty];
            } else {
                if (-e.getNegativeSum() < this.mYMin) this.mYMin = -e.getNegativeSum();

                if (e.getPositiveSum() > this.mYMax) this.mYMax = e.getPositiveSum();
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
    public setBarShadowColor(color) {
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
    public setBarBorderColor(color) {
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
