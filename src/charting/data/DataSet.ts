import { ObservableArray } from '@nativescript/core';
import { Entry } from './Entry';
import { BaseDataSet } from './BaseDataSet';
import { Utils } from '../utils/Utils';

/**
 * Determines how to round DataSet index values for
 * {@link DataSet#getEntryIndex(float, float, Rounding)} DataSet.getEntryIndex()}
 * when an exact x-index is not found.
 */
export enum Rounding {
    UP,
    DOWN,
    CLOSEST
}
/**
 * The DataSet class represents one group or type of entries (Entry) in the
 * Chart that belong together. It is designed to logically separate different
 * groups of values inside the Chart (e.g. the values for a specific line in the
 * LineChart, or the values of a specific group of bars in the BarChart).
 *

 */
export abstract class DataSet<T extends Entry> extends BaseDataSet<T> {
    /**
     * the entries that this DataSet represents / holds together
     */
    protected mValues: T[] | ObservableArray<T> = null;

    /**
     * maximum y-value in the value array
     */
    protected mYMax = -Infinity;

    /**
     * minimum y-value in the value array
     */
    protected mYMin = Infinity;

    /**
     * maximum x-value in the value array
     */
    protected mXMax = -Infinity;

    /**
     * minimum x-value in the value array
     */
    protected mXMin = Infinity;

    /**
     * Creates a new DataSet object with the given values (entries) it represents. Also, a
     * label that describes the DataSet can be specified. The label can also be
     * used to retrieve the DataSet from a ChartData object.
     *
     * @param values
     * @param label
     */
    constructor(values, label, xProperty?, yProperty?) {
        super(label, xProperty, yProperty);
        this.mValues = values;
        this.updateGetEntryForIndex();
    }

    toString() {
        return `${this.constructor.name}[${this.label}]`;
    }

    init() {
        if (this.mValues == null) this.mValues = [];
        this.updateGetEntryForIndex();
        if (this.mValues.length > 0) {
            for (let index = 0, e: T; index < this.mValues.length; index++) {
                e = this.getEntryForIndex(index);
                this.initEntryData(e);
                this.calcMinMaxForEntry(e, index);
            }
        }
    }
    mCanCalculateMinMax = true;
    batchEntryOperations(cb) {
        this.mCanCalculateMinMax = false;
        cb();
        this.mCanCalculateMinMax = true;
        this.calcMinMax();
    }

    calcMinMax() {
        if (!this.mCanCalculateMinMax) {
            return;
        }
        this.mYMax = -Infinity;
        this.mYMin = Infinity;
        this.mXMax = -Infinity;
        this.mXMin = Infinity;
        if (this.mValues == null || this.mValues.length === 0) return;

        for (let index = 0, e: T; index < this.mValues.length; index++) {
            e = this.getEntryForIndex(index);
            this.calcMinMaxForEntry(e, index);
        }
    }

    protected initEntryData(e: T) {}

    public calcMinMaxYRange(fromX, toX) {
        if (this.mValues == null || this.mValues.length === 0) return;
        this.mYMax = -Infinity;
        this.mYMin = Infinity;
        const indexFrom = this.getEntryIndexForXValue(fromX, NaN, Rounding.DOWN);
        const indexTo = this.getEntryIndexForXValue(toX, NaN, Rounding.UP);

        for (let i = indexFrom; i <= indexTo; i++) {
            // only recalculate y
            this.calcMinMaxY(this.getEntryForIndex(i));
        }
    }

    /**
     * Updates the min and max x and y value of this DataSet based on the given Entry.
     *
     * @param e
     */
    protected calcMinMaxForEntry(e?: T, index?: number) {
        if (!e) return;
        this.calcMinMaxX(e, index);

        this.calcMinMaxY(e, index);
    }

    protected calcMinMaxX(e?: T, index?: number) {
        if (!e) {
            if (this.mValues == null || this.mValues.length === 0) return;

            this.mYMax = -Infinity;
            this.mYMin = Infinity;
            this.mXMax = -Infinity;
            this.mXMin = Infinity;

            for (let index = 0, e: T; index < this.mValues.length; index++) {
                e = this.getEntryForIndex(index);
                this.calcMinMaxForEntry(e, index);
            }
        } else {
            const x = this.getEntryXValue(e, index);
            if (x < this.mXMin) this.mXMin = x;

            if (x > this.mXMax) this.mXMax = x;
        }
    }

    protected calcMinMaxY(e: T, index?: number) {
        const y = e[this.yProperty] || 0;
        if (y < this.mYMin) this.mYMin = y;

        if (y > this.mYMax) this.mYMax = y;
    }

    protected getInternalValues() {
        return this.mValues;
    }

    public get entryCount() {
        return this.getInternalValues().length;
    }

    /**
     * Returns the array of entries that this DataSet represents.
     */
    public get values() {
        return this.mValues;
    }

    /**
     * Sets the array of entries that this DataSet represents, and calls notifyDataSetChanged()
     */
    public set values(values) {
        this.mValues = values;
        this.updateGetEntryForIndex();
        this.notifyDataSetChanged();
    }

    public get yMin() {
        return this.mYMin;
    }

    public get yMax() {
        return this.mYMax;
    }

    public get xMin() {
        return this.mXMin;
    }

    public get xMax() {
        return this.mXMax;
    }

    public addEntryOrdered(e: T) {
        if (!e) return;

        if (this.mValues == null) {
            this.mValues = [];
        }

        let addedIndex = this.mValues.length;
        if (this.mValues.length > 0 && this.xProperty && this.getEntryForIndex(this.mValues.length - 1) > e[this.xProperty]) {
            addedIndex = this.getEntryIndexForXValue(e[this.xProperty], e[this.yProperty], Rounding.UP);
            this.mValues.splice(addedIndex, 0, e);
        } else {
            this.mValues.push(e);
        }
        this.calcMinMaxForEntry(e, addedIndex);
    }

    public clear() {
        this.mValues = [];
        this.notifyDataSetChanged();
        this.updateGetEntryForIndex();
    }

    public addEntry(e: T) {
        if (!e) return false;

        let values = this.mValues;
        if (values == null) {
            values = this.mValues = [];
        }
        const length = values.length;
        this.calcMinMaxForEntry(e, length);

        // add the entry
        values.push(e);
        return true;
    }

    public removeEntry(e: T) {
        if (!e) return false;

        if (this.mValues == null) return false;

        // remove the entry
        const index = this.mValues.indexOf(e);

        if (index >= 0) {
            this.mValues.splice(index, 1);
            this.calcMinMax();
        }

        return index >= 0;
    }

    public removeEntryAtIndex(index: number) {
        if (this.mValues == null) return false;
        if (index >= 0 && index < this.mValues.length) {
            this.mValues.splice(index, 1);
            this.calcMinMax();
        }

        return index >= 0;
    }

    public getEntryIndex(e: T) {
        return this.getInternalValues().indexOf(e);
    }

    public getEntryForXValue(xValue, closestToY, rounding = Rounding.CLOSEST): T {
        const index = this.getEntryIndexForXValue(xValue, closestToY, rounding);
        if (index > -1) return this.getEntryForIndex(index);
        return null;
    }
    public getEntryAndIndexForXValue(xValue, closestToY, rounding = Rounding.CLOSEST): { entry: T; index: number } {
        const index = this.getEntryIndexForXValue(xValue, closestToY, rounding);
        if (index > -1) return { entry: this.getEntryForIndex(index), index };
        return null;
    }

    protected updateGetEntryForIndex() {
        const internalValues = this.getInternalValues();
        if (internalValues instanceof ObservableArray) {
            this.getEntryForIndex = function (index) {
                return internalValues.getItem(index);
            };
        } else {
            this.getEntryForIndex = function (index) {
                return internalValues[index];
            };
        }
    }

    public getEntryForIndex(index) {
        const internalValues = this.getInternalValues();
        return internalValues instanceof ObservableArray ? internalValues.getItem(index) : internalValues[index];
    }

    public getEntryIndexForXValue(xValue, closestToY, rounding) {
        const values = this.getInternalValues();
        if (values == null || values.length === 0) return -1;

        let low = 0;
        let high = values.length - 1;
        let closest = high;
        const yKey = this.yProperty;
        let m: number, e: T, e1: T;
        while (low < high) {
            m = Math.floor((low + high) / 2);
            e = Utils.getArrayItem(values, m);
            e1 = Utils.getArrayItem(values, m + 1);
            const d1 = this.getEntryXValue(e, m) - xValue,
                d2 = this.getEntryXValue(e1, m + 1) - xValue,
                ad1 = Math.abs(d1),
                ad2 = Math.abs(d2);

            if (ad2 < ad1) {
                // [m + 1] is closer to xValue
                // Search in an higher place
                low = m + 1;
            } else if (ad1 < ad2) {
                // [m] is closer to xValue
                // Search in a lower place
                high = m;
            } else {
                // We have multiple sequential x-value with same distance

                if (d1 >= 0.0) {
                    // Search in a lower place
                    high = m;
                } else if (d1 < 0.0) {
                    // Search in an higher place
                    low = m + 1;
                }
            }

            closest = high;
        }

        if (closest !== -1) {
            let e = Utils.getArrayItem(values, closest);
            const closestXValue = this.getEntryXValue(e, closest);
            if (rounding === Rounding.UP) {
                // If rounding up, and found x-value is lower than specified x, and we can go upper...
                if (closestXValue < xValue && closest < values.length - 1) {
                    ++closest;
                }
            } else if (rounding === Rounding.DOWN) {
                // If rounding down, and found x-value is upper than specified x, and we can go lower...
                if (closestXValue > xValue && closest > 0) {
                    --closest;
                }
            }

            // Search by closest to y-value
            if (closest >= 1 && !isNaN(closestToY)) {
                e = Utils.getArrayItem(values, closest - 1);
                if (e) {
                    xValue = this.getEntryXValue(e, closest - 1);
                    while (closest > 0 && xValue === closestXValue) closest -= 1;

                    let closestYValue = Utils.getArrayItem(values, closest)[yKey];
                    let closestYIndex = closest;

                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        closest += 1;
                        if (closest >= values.length) break;

                        e = Utils.getArrayItem(values, closest);
                        if (!e) break;
                        xValue = this.getEntryXValue(e, closest);

                        if (xValue !== closestXValue) break;

                        if (Math.abs(e[yKey] - closestToY) < Math.abs(closestYValue - closestToY)) {
                            closestYValue = closestToY;
                            closestYIndex = closest;
                        }
                    }

                    closest = closestYIndex;
                }
            }
        }

        return closest;
    }

    public getEntriesForXValue(xValue) {
        const entries = [];

        const values = this.getInternalValues();
        let low = 0;
        let high = values.length - 1;

        const xKey = this.xProperty;
        let m: number, e: T, e1: T, mXValue;
        while (low <= high) {
            m = Math.floor((high + low) / 2);
            e = Utils.getArrayItem(values, m);
            mXValue = this.getEntryXValue(e, m);
            // if we have a match
            if (xValue === mXValue) {
                while (m > 0 && this.getEntryXValue(Utils.getArrayItem(values, m - 1), m - 1) === xValue) m--;

                high = values.length;

                // loop over all "equal" entries
                for (; m < high; m++) {
                    e = Utils.getArrayItem(values, m);
                    mXValue = this.getEntryXValue(e, m);
                    if (mXValue === xValue) {
                        entries.push(e);
                    } else {
                        break;
                    }
                }

                break;
            } else {
                if (xValue > mXValue) low = m + 1;
                else high = m - 1;
            }
        }

        return entries;
    }
    public getEntriesAndIndexesForXValue(xValue) {
        const entries = [];

        const values = this.getInternalValues();
        let low = 0;
        let high = values.length - 1;

        let entry: T, mXValue;
        while (low <= high) {
            let m = Math.floor((high + low) / 2);
            entry = Utils.getArrayItem(values, m);
            mXValue = this.getEntryXValue(entry, m);
            // if we have a match
            if (xValue === mXValue) {
                while (m > 0 && this.getEntryXValue(Utils.getArrayItem(values, m - 1), m - 1) === xValue) m--;

                high = values.length;

                // loop over all "equal" entries
                for (; m < high; m++) {
                    entry = Utils.getArrayItem(values, m);
                    mXValue = this.getEntryXValue(entry, m);
                    if (mXValue === xValue) {
                        entries.push({ entry, index: m });
                    } else {
                        break;
                    }
                }

                break;
            } else {
                if (xValue > mXValue) low = m + 1;
                else high = m - 1;
            }
        }

        return entries;
    }
}
