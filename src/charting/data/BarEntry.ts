import { ImageSource } from '@nativescript/core/image-source';
import { Entry } from "./Entry";

/**
 * Entry class for the BarChart. (especially stacked bars)
 *
 * @author Philipp Jahoda
 */
export class BarEntry implements Entry {
    x: number;
    y: number;
    icon?: ImageSource;
    data?: any;

    /**
     * the values the stacked barchart holds
     */
    private mYVals:number[];

    /**
     * the ranges for the individual stack values - automatically calculated
     */
    private mRanges: [number, number][];

    /**
     * the sum of all negative values this entry (if stacked) contains
     */
    private mNegativeSum:number;

    /**
     * the sum of all positive values this entry (if stacked) contains
     */
    private mPositiveSum:number;

    /**
     * Constructor for normal bars (not stacked).
     *
     * @param x
     * @param y
     * @param icon - icon image
     * @param data - Spot for additional data this Entry represents.
     */
    constructor(x, y, icon?: ImageSource, data?)
    {
        this.x = x;
        this.y = y;
        this.icon = icon;
        this.data = data;
    }
    
    /**
     * Returns the stacked values this BarEntry represents, or null, if only a single value is represented (then, use
     * getY()).
     *
     * @return
     */
    public getYVals() {
        return this.mYVals;
    }

    /**
     * Set the array of values this BarEntry should represent.
     *
     * @param vals
     */
    public setVals(vals)
    {
        this.y = (BarEntry.calcSum(vals));
        this.mYVals = vals;
        this.calcPosNegSum();
        this.calcRanges();
    }

   
    /**
     * Returns the ranges of the individual stack-entries. Will return null if this entry is not stacked.
     *
     * @return
     */
    public getRanges() {
        return this.mRanges;
    }

    /**
     * Returns true if this BarEntry is stacked (has a values array), false if not.
     *
     * @return
     */
    public isStacked() {
        return this.mYVals != null && this.mYVals.length > 0;
    }

    /**
     * Use `getSumBelow(stackIndex)` instead.
     */
    
    public getBelowSum( stackIndex) {
        return this.getSumBelow(stackIndex);
    }

    public getSumBelow( stackIndex) {

        if (this.mYVals == null)
            return 0;

        let remainder = 0;
        let index = this.mYVals.length - 1;

        while (index > stackIndex && index >= 0) {
            remainder += this.mYVals[index];
            index--;
        }

        return remainder;
    }

    /**
     * Reuturns the sum of all positive values this entry (if stacked) contains.
     *
     * @return
     */
    public getPositiveSum() {
        return this.mPositiveSum;
    }

    /**
     * Returns the sum of all negative values this entry (if stacked) contains. (this is a positive number)
     *
     * @return
     */
    public getNegativeSum() {
        return this.mNegativeSum;
    }

    private calcPosNegSum() {
        if (this.mYVals == null) {
            this.mNegativeSum = 0;
            this.mPositiveSum = 0;
            return;
        }

        let sumNeg = 0;
        let sumPos = 0;

        for (let f of this.mYVals) {
            if (f <= 0)
                sumNeg += Math.abs(f);
            else
                sumPos += f;
        }

        this.mNegativeSum = sumNeg;
        this.mPositiveSum = sumPos;
    }

    /**
     * Calculates the sum across all values of the given stack.
     *
     * @param vals
     * @return
     */
     static calcSum(vals) {

        if (vals == null)
            return 0;

        let sum = 0;

        for (let f of vals)
            sum += f;

        return sum;
    }

    protected calcRanges() {
        const values = this.getYVals();

        if (values == null || values.length == 0)
            return;

        this.mRanges = [];

        let negRemain = -this.getNegativeSum();
        let posRemain = 0;

        for (let i = 0; i < this.mRanges.length; i++) {

            let value = values[i];

            if (value < 0) {
                this.mRanges[i] = [negRemain, negRemain - value];
                negRemain -= value;
            } else {
                this.mRanges[i] = [posRemain, posRemain + value];
                posRemain += value;
            }
        }
    }
}


