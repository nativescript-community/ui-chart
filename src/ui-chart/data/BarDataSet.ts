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
    barShadowColor: string | Color = '#D7D7D7';

    /**
     * Sets the width used for drawing borders around the bars.
     * If borderWidth === 0, no border will be drawn.
     */
    barBorderWidth = 0.0;

    /**
     * Sets the color drawing borders around the bars.
     */
    barBorderColor: string | Color = 'black';

    /**
     * the alpha value used to draw the highlight indicator bar
     */
    highLightAlpha = 120;

    /**
     * the overall entry count, including counting each stack-value individually
     */
    private mEntryCountStacks: number;

    /**
     * array of labels used to describe the different values of the stacked bars
     */
    stackLabels = ['Stack'];

    constructor(values, label, xProperty?, yProperty?) {
        super(values, label, xProperty, yProperty);
        this.highlightColor = 'black';
        this.init();
    }

    private calcEntryRanges(e: BarEntry) {
        const values = e.yVals;

        if (!values || values.length === 0) return;

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
        const yVal = e?.[yProperty];
        if (e && !isNaN(yVal)) {
            if (!e.yVals) {
                if (yVal < this.mYMin) this.mYMin = yVal;
                if (yVal > this.mYMax) this.mYMax = yVal;
            } else {
                if (-e.negativeSum < this.mYMin) this.mYMin = -e.negativeSum;

                if (e.positiveSum > this.mYMax) this.mYMax = e.positiveSum;
            }

            this.calcMinMaxX(e);
        }
    }

    public get stackSize() {
        return this.mStackSize;
    }

    public get stacked() {
        return this.mStackSize > 1;
    }

    /**
     * returns the overall entry count, including counting each stack-value
     * individually
     */
    public get entryCountStacks() {
        return this.mEntryCountStacks;
    }
}
