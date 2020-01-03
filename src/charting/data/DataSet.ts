import { Entry } from './Entry';
import { BaseDataSet } from './BaseDataSet';

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
 * @author Philipp Jahoda
 */
export abstract class DataSet<T extends Entry> extends BaseDataSet<T> {
    /**
     * the entries that this DataSet represents / holds together
     */
    protected mValues: T[] = null;

    /**
     * maximum y-value in the value array
     */
    protected mYMax = -Number.MAX_VALUE;

    /**
     * minimum y-value in the value array
     */
    protected mYMin = Number.MAX_VALUE;

    /**
     * maximum x-value in the value array
     */
    protected mXMax = -Number.MAX_VALUE;

    /**
     * minimum x-value in the value array
     */
    protected mXMin = Number.MAX_VALUE;

    

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

        if (this.mValues == null) this.mValues = [];

        this.calcMinMax();
    }

    calcMinMax() {
        if (this.mValues == null || this.mValues.length === 0) return;

        this.mYMax = -Number.MAX_VALUE;
        this.mYMin = Number.MAX_VALUE;
        this.mXMax = -Number.MAX_VALUE;
        this.mXMin = Number.MAX_VALUE;

        for (let e of this.mValues) {
            this.calcMinMaxForEntry(e);
        }
    }

    public calcMinMaxYRange(fromX, toX) {
        if (this.mValues == null || this.mValues.length === 0) return;

        this.mYMax = -Number.MAX_VALUE;
        this.mYMin = Number.MAX_VALUE;

        let indexFrom = this.getEntryIndexForXValue(fromX, NaN, Rounding.DOWN);
        let indexTo = this.getEntryIndexForXValue(toX, NaN, Rounding.UP);

        for (let i = indexFrom; i <= indexTo; i++) {
            // only recalculate y
            this.calcMinMaxY(this.mValues[i]);
        }
    }

    /**
     * Updates the min and max x and y value of this DataSet based on the given Entry.
     *
     * @param e
     */
    protected calcMinMaxForEntry(e?: T) {
        if (e == null) return;

        this.calcMinMaxX(e);

        this.calcMinMaxY(e);
    }

    protected calcMinMaxX(e?: T) {
        if (!e) {
            if (this.mValues == null || this.mValues.length === 0) return;

            this.mYMax = -Number.MAX_VALUE;
            this.mYMin = Number.MAX_VALUE;
            this.mXMax = -Number.MAX_VALUE;
            this.mXMin = Number.MAX_VALUE;

            for (let e of this.mValues) {
                this.calcMinMaxForEntry(e);
            }
        } else {
            if (e[this.xProperty] < this.mXMin) this.mXMin = e[this.xProperty];

            if (e[this.xProperty] > this.mXMax) this.mXMax = e[this.xProperty];
        }
    }

    protected calcMinMaxY(e: T) {
        if (e[this.yProperty] < this.mYMin) this.mYMin = e[this.yProperty];

        if (e[this.yProperty] > this.mYMax) this.mYMax = e[this.yProperty];
    }

    public getEntryCount() {
        return this.mValues.length;
    }

    /**
     * Returns the array of entries that this DataSet represents.
     *
     * @return
     */
    public getValues() {
        return this.mValues;
    }

    /**
     * Sets the array of entries that this DataSet represents, and calls notifyDataSetChanged()
     *
     * @return
     */
    public setValues(values) {
        this.mValues = values;
        this.notifyDataSetChanged();
    }

    public getYMin() {
        return this.mYMin;
    }

    public getYMax() {
        return this.mYMax;
    }

    public getXMin() {
        return this.mXMin;
    }

    public getXMax() {
        return this.mXMax;
    }

    public addEntryOrdered(e: T) {
        if (e == null) return;

        if (this.mValues == null) {
            this.mValues = [];
        }

        this.calcMinMaxForEntry(e);

        if (this.mValues.length > 0 && this.mValues[this.mValues.length - 1][this.xProperty] > e[this.xProperty]) {
            const closestIndex = this.getEntryIndexForXValue(e[this.xProperty], e[this.yProperty], Rounding.UP);
            this.mValues.splice(closestIndex, 0, e);
        } else {
            this.mValues.push(e);
        }
    }

    public clear() {
        this.mValues = [];
        this.notifyDataSetChanged();
    }

    public addEntry(e: T) {
        if (e == null) return false;

        let values = this.getValues();
        if (values == null) {
            values = [];
        }

        this.calcMinMaxForEntry(e);

        // add the entry
        values.push(e);
        return true;
    }

    public removeEntry(e: T) {
        if (e == null) return false;

        if (this.mValues == null) return false;

        // remove the entry
        const index = this.mValues.indexOf(e);

        if (index >= 0) {
            this.mValues.splice(index, 1);
            this.calcMinMax();
        }

        return index >= 0;
    }

    public getEntryIndex(e: T) {
        return this.mValues.indexOf(e);
    }

    public getEntryForXValue(xValue, closestToY, rounding = Rounding.CLOSEST): T {
        let index = this.getEntryIndexForXValue(xValue, closestToY, rounding);
        if (index > -1) return this.mValues[index];
        return null;
    }

    public getEntryForIndex(index) {
        return this.mValues[index];
    }

    public getEntryIndexForXValue(xValue, closestToY, rounding) {
        if (this.mValues == null || this.mValues.length === 0) return -1;

        let low = 0;
        let high = this.mValues.length - 1;
        let closest = high;

        while (low < high) {
            let m = Math.floor((low + high) / 2);
            const d1 = this.mValues[m][this.xProperty] - xValue,
                d2 = this.mValues[m + 1][this.xProperty] - xValue,
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

        if (closest != -1) {
            const closestXValue = this.mValues[closest][this.xProperty];
            if (rounding == Rounding.UP) {
                // If rounding up, and found x-value is lower than specified x, and we can go upper...
                if (closestXValue < xValue && closest < this.mValues.length - 1) {
                    ++closest;
                }
            } else if (rounding == Rounding.DOWN) {
                // If rounding down, and found x-value is upper than specified x, and we can go lower...
                if (closestXValue > xValue && closest > 0) {
                    --closest;
                }
            }

            // Search by closest to y-value
            if (!isNaN(closestToY)) {
                while (closest > 0 && this.mValues[closest - 1][this.xProperty] == closestXValue) closest -= 1;

                let closestYValue = this.mValues[closest][this.yProperty];
                let closestYIndex = closest;

                while (true) {
                    closest += 1;
                    if (closest >= this.mValues.length) break;

                    const value = this.mValues[closest];

                    if (value[this.xProperty] != closestXValue) break;

                    if (Math.abs(value[this.yProperty] - closestToY) < Math.abs(closestYValue - closestToY)) {
                        closestYValue = closestToY;
                        closestYIndex = closest;
                    }
                }

                closest = closestYIndex;
            }
        }

        return closest;
    }

    public getEntriesForXValue(xValue) {
        const entries = [];

        let low = 0;
        let high = this.mValues.length - 1;

        while (low <= high) {
            let m = Math.floor((high + low) / 2);
            let entry = this.mValues[m];
            // if we have a match
            if (xValue === entry[this.xProperty]) {
                while (m > 0 && this.mValues[m - 1][this.xProperty] === xValue) m--;

                high = this.mValues.length;

                // loop over all "equal" entries
                for (; m < high; m++) {
                    entry = this.mValues[m];
                    if (entry[this.xProperty] === xValue) {
                        entries.push(entry);
                    } else {
                        break;
                    }
                }

                break;
            } else {
                if (xValue > entry[this.xProperty]) low = m + 1;
                else high = m - 1;
            }
        }

        return entries;
    }
}
