import { Entry } from './Entry';
import { getEntryXValue } from './BaseEntry';
import { AxisDependency } from '../components/YAxis';
import { IValueFormatter } from '../formatter/IValueFormatter';
import { Highlight } from '../highlight/Highlight';
import { IDataSet } from '../interfaces/datasets/IDataSet';

export abstract class ChartData<U extends Entry, T extends IDataSet<U>> {
    /**
     * maximum y-value in the value array across all axes
     */
    mYMax = -Infinity;

    /**
     * the minimum y-value in the value array across all axes
     */
    mYMin = Infinity;

    /**
     * maximum x-value in the value array
     */
    mXMax = -Infinity;

    /**
     * minimum x-value in the value array
     */
    mXMin = Infinity;

    mLeftAxisMax = -Infinity;

    mLeftAxisMin = Infinity;

    mRightAxisMax = -Infinity;

    mRightAxisMin = Infinity;

    /**
     * array that holds all DataSets the ChartData object represents
     */
    protected mDataSets: T[];

    /**
     * Default constructor.
     */
    // public ChartData() {
    //     this.mDataSets = [];
    // }

    /**
     * Constructor taking single or multiple DataSet objects.
     *
     * @param dataSets
     */
    constructor(dataSets: T[]) {
        this.mDataSets = dataSets;
        this.notifyDataChanged();
    }

    // /**
    //  * Created because Arrays.asList(...) does not support modification.
    //  *
    //  * @param array
    //  * @return
    //  */
    // private List<T> arrayToList(T[] array) {

    //     List<T> list = new ArrayList<>();

    //     for (T set : array) {
    //         list.add(set);
    //     }

    //     return list;
    // }

    // /**
    //  * constructor for chart data
    //  *
    //  * @param sets the dataset array
    //  */
    // public ChartData(List<T> sets) {
    //     this.mDataSets = sets;
    //     notifyDataChanged();
    // }

    /**
     * Call this method to let the ChartData know that the underlying data has
     * changed. Calling this performs all necessary recalculations needed when
     * the contained data has changed.
     */
    public notifyDataChanged() {
        this.calcMinMax();
    }

    /**
     * Calc minimum and maximum y-values over all DataSets.
     * Tell DataSets to recalculate their min and max y-values, this is only needed for autoScaleMinMax.
     *
     * @param fromX the x-value to start the calculation from
     * @param toX   the x-value to which the calculation should be performed
     */
    public calcMinMaxYRange(fromX, toX) {
        for (const set of this.mDataSets) {
            set.calcMinMaxYRange(fromX, toX);
        }

        // apply the new data
        this.calcMinMax();
    }

    /**
     * Calc minimum and maximum values (both x and y) over all DataSets.
     */
    protected calcMinMax() {
        if (this.mDataSets == null) return;

        this.mYMax = -Infinity;
        this.mYMin = Infinity;
        this.mXMax = -Infinity;
        this.mXMin = Infinity;

        const visibleDatasets = this.getVisibleDataSets();

        for (const set of visibleDatasets) {
            if (set.isVisible()) {
                this.calcMinMaxForDataSet(set);
            }
        }

        this.mLeftAxisMax = -Infinity;
        this.mLeftAxisMin = Infinity;
        this.mRightAxisMax = -Infinity;
        this.mRightAxisMin = Infinity;

        // left axis
        const firstLeft = this.getFirstLeft(visibleDatasets);

        if (firstLeft != null) {
            this.mLeftAxisMax = firstLeft.getYMax();
            this.mLeftAxisMin = firstLeft.getYMin();

            for (const dataSet of visibleDatasets) {
                if (dataSet.getAxisDependency() === AxisDependency.LEFT) {
                    if (dataSet.getYMin() < this.mLeftAxisMin) this.mLeftAxisMin = dataSet.getYMin();

                    if (dataSet.getYMax() > this.mLeftAxisMax) this.mLeftAxisMax = dataSet.getYMax();
                }
            }
        }

        // right axis
        const firstRight = this.getFirstRight(visibleDatasets);

        if (firstRight != null) {
            this.mRightAxisMax = firstRight.getYMax();
            this.mRightAxisMin = firstRight.getYMin();

            for (const dataSet of visibleDatasets) {
                if (dataSet.getAxisDependency() === AxisDependency.RIGHT) {
                    if (dataSet.getYMin() < this.mRightAxisMin) this.mRightAxisMin = dataSet.getYMin();

                    if (dataSet.getYMax() > this.mRightAxisMax) this.mRightAxisMax = dataSet.getYMax();
                }
            }
        }
    }

    /** ONLY GETTERS AND SETTERS BELOW THIS */

    /**
     * returns the number of LineDataSets this object contains
     *
     * @return
     */
    public getDataSetCount() {
        if (this.mDataSets == null) return 0;
        return this.mDataSets.length;
    }

    /**
     * Returns the minimum y-value for the specified axis.
     *
     * @param axis
     * @return
     */
    public getYMin(axis?) {
        if (axis === undefined) {
            return this.mYMin;
        }
        if (axis === AxisDependency.LEFT) {
            if (!Number.isFinite(this.mLeftAxisMin)) {
                if (!Number.isFinite(this.mRightAxisMin)) {
                    return 0;
                }
                return this.mRightAxisMin;
            } else return this.mLeftAxisMin;
        } else {
            if (!Number.isFinite(this.mRightAxisMin)) {
                if (!Number.isFinite(this.mLeftAxisMin)) {
                    return 0;
                }
                return this.mLeftAxisMin;
            } else return this.mRightAxisMin;
        }
    }

    /**
     * Returns the maximum y-value for the specified axis.
     *
     * @param axis
     * @return
     */
    public getYMax(axis?: AxisDependency) {
        if (axis === undefined) {
            return this.mYMax;
        }
        if (axis === AxisDependency.LEFT) {
            if (!Number.isFinite(this.mLeftAxisMax)) {
                if (!Number.isFinite(this.mRightAxisMax)) {
                    return 0;
                }
                return this.mRightAxisMax;
            } else return this.mLeftAxisMax;
        } else {
            if (!Number.isFinite(this.mRightAxisMax)) {
                if (!Number.isFinite(this.mLeftAxisMax)) {
                    return 0;
                }
                return this.mLeftAxisMax;
            } else return this.mRightAxisMax;
        }
    }

    /**
     * Returns the minimum x-value this data object contains.
     *
     * @return
     */
    public getXMin() {
        return this.mXMin;
    }

    /**
     * Returns the maximum x-value this data object contains.
     *
     * @return
     */
    public getXMax() {
        return this.mXMax;
    }

    /**
     * Returns all DataSet objects this ChartData object holds.
     *
     * @return
     */
    public getDataSets() {
        return this.mDataSets;
    }
    public getVisibleDataSets() {
        return this.mDataSets.filter((s) => s.isVisible());
    }

    /**
     * Retrieve the index of a DataSet with a specific label from the ChartData.
     * Search can be case sensitive or not. IMPORTANT: This method does
     * calculations at runtime, do not over-use in performance critical
     * situations.
     *
     * @param dataSets   the DataSet array to search
     * @param label
     * @param ignorecase if true, the search is not case-sensitive
     * @return
     */
    protected getDataSetIndexByLabel(dataSets, label, ignorecase) {
        if (ignorecase) {
            for (let i = 0; i < dataSets.length; i++) if (label.equalsIgnoreCase(dataSets[i].getLabel())) return i;
        } else {
            for (let i = 0; i < dataSets.length; i++) if (label.equals(dataSets[i].getLabel())) return i;
        }

        return -1;
    }

    /**
     * Returns the labels of all DataSets as a string array.
     *
     * @return
     */
    public getDataSetLabels() {
        const types = [];

        for (let i = 0; i < this.mDataSets.length; i++) {
            types[i] = this.mDataSets[i].getLabel();
        }

        return types;
    }

    /**
     * Get the Entry for a corresponding highlight object
     *
     * @param highlight
     * @return the entry that is highlighted
     */
    public getEntryForHighlight(highlight: Highlight) {
        if (highlight.entry) {
            return highlight.entry;
        }
        if (highlight.dataSetIndex >= this.mDataSets.length) return null;
        else {
            return this.mDataSets[highlight.dataSetIndex].getEntryForXValue(highlight.x, highlight.y);
        }
    }

    /**
     * Get the Entry for a corresponding highlight object
     *
     * @param highlight
     * @return the entry that is highlighted
     */
    public getEntryAndIndexForHighlight(highlight: Highlight) {
        if (highlight.entry) {
            return { entry: highlight.entry, index: highlight.entryIndex };
        }
        if (highlight.dataSetIndex >= this.mDataSets.length) return null;
        else {
            return this.mDataSets[highlight.dataSetIndex].getEntryAndIndexForXValue(highlight.x, highlight.y);
        }
    }

    /**
     * Returns the DataSet object with the given label. Search can be case
     * sensitive or not. IMPORTANT: This method does calculations at runtime.
     * Use with care in performance critical situations.
     *
     * @param label
     * @param ignorecase
     * @return
     */
    public getDataSetByLabel(label, ignorecase) {
        const index = this.getDataSetIndexByLabel(this.mDataSets, label, ignorecase);

        if (index < 0 || index >= this.mDataSets.length) return null;
        else return this.mDataSets[index];
    }

    public getDataSetByIndex(index: number) {
        if (this.mDataSets == null || index < 0 || index >= this.mDataSets.length) return null;

        return this.mDataSets[index];
    }

    /**
     * Adds a DataSet dynamically.
     *
     * @param d
     */
    public addDataSet(d: T) {
        if (d == null) return;
        if (d.isVisible()) {
            this.calcMinMaxForDataSet(d);
        }

        this.mDataSets.push(d);
    }

    /**
     * Removes the given DataSet from this data object. Also recalculates all
     * minimum and maximum values. Returns true if a DataSet was removed, false
     * if no DataSet could be removed.
     *
     * @param d
     */
    public removeDataSet(d: T) {
        if (d == null) return false;

        const index = this.mDataSets.indexOf(d);

        // if a DataSet was removed
        if (index >= 0) {
            this.mDataSets.splice(index, 1);
            this.calcMinMax();
        }

        return index >= 0;
    }

    /**
     * Removes the DataSet at the given index in the DataSet array from the data
     * object. Also recalculates all minimum and maximum values. Returns true if
     * a DataSet was removed, false if no DataSet could be removed.
     *
     * @param index
     */
    public removeDataSetAtIndex(index) {
        if (index >= this.mDataSets.length || index < 0) return false;

        this.mDataSets.splice(index, 1);
        this.calcMinMax();
        return true;
    }

    /**
     * Adds an Entry to the DataSet at the specified index.
     * Entries are added to the end of the list.
     *
     * @param e
     * @param dataSetIndex
     */
    public addEntry(e, dataSetIndex) {
        if (this.mDataSets.length > dataSetIndex && dataSetIndex >= 0) {
            const set = this.mDataSets[dataSetIndex];
            // add the entry to the dataset
            const length = set.getEntryCount();
            if (!set.addEntry(e)) return;

            if (set.isVisible()) {
                this.calcMinMaxForEntry(set, e, length, set.getAxisDependency());
            }
        } else {
            console.error('addEntry', 'Cannot add Entry because dataSetIndex too high or too low.');
        }
    }

    /**
     * Adjusts the current minimum and maximum values based on the provided Entry object.
     *
     * @param e
     * @param axis
     */
    protected calcMinMaxForEntry(set: IDataSet<Entry>, e: Entry, entryIndex: number, axis: AxisDependency) {
        const xKey = set.xProperty;
        const yKey = set.yProperty;
        const xValue = getEntryXValue(e, xKey, entryIndex);
        const yValue = e[yKey];
        if (this.mYMax < yValue) this.mYMax = yValue;
        if (this.mYMin > yValue) this.mYMin = yValue;

        if (this.mXMax < xValue) this.mXMax = xValue;
        if (this.mXMin > xValue) this.mXMin = xValue;

        if (axis === AxisDependency.LEFT) {
            if (this.mLeftAxisMax < yValue) this.mLeftAxisMax = yValue;
            if (this.mLeftAxisMin > yValue) this.mLeftAxisMin = yValue;
        } else {
            if (this.mRightAxisMax < yValue) this.mRightAxisMax = yValue;
            if (this.mRightAxisMin > yValue) this.mRightAxisMin = yValue;
        }
    }

    /**
     * Adjusts the minimum and maximum values based on the given DataSet.
     *
     * @param d
     */
    protected calcMinMaxForDataSet(d: T) {
        if (this.mYMax < d.getYMax()) this.mYMax = d.getYMax();
        if (this.mYMin > d.getYMin()) this.mYMin = d.getYMin();

        if (this.mXMax < d.getXMax()) this.mXMax = d.getXMax();
        if (this.mXMin > d.getXMin()) this.mXMin = d.getXMin();

        if (d.getAxisDependency() === AxisDependency.LEFT) {
            if (this.mLeftAxisMax < d.getYMax()) this.mLeftAxisMax = d.getYMax();
            if (this.mLeftAxisMin > d.getYMin()) this.mLeftAxisMin = d.getYMin();
        } else {
            if (this.mRightAxisMax < d.getYMax()) this.mRightAxisMax = d.getYMax();
            if (this.mRightAxisMin > d.getYMin()) this.mRightAxisMin = d.getYMin();
        }
    }

    /**
     * Removes the given Entry object from the DataSet at the specified index.
     *
     * @param e
     * @param dataSetIndex
     */
    public removeEntry(e, dataSetIndex) {
        // entry null, outofbounds
        if (e == null || dataSetIndex >= this.mDataSets.length) return false;

        const set = this.mDataSets[dataSetIndex];

        if (set != null) {
            // remove the entry from the dataset
            const removed = set.removeEntry(e);

            if (removed) {
                this.calcMinMax();
            }

            return removed;
        } else return false;
    }

    /**
     * Removes the Entry object closest to the given DataSet at the
     * specified index. Returns true if an Entry was removed, false if no Entry
     * was found that meets the specified requirements.
     *
     * @param xValue
     * @param dataSetIndex
     * @return
     */
    public removeEntryForXValue(xValue, dataSetIndex) {
        if (dataSetIndex >= this.mDataSets.length) return false;

        const dataSet = this.mDataSets[dataSetIndex];
        const e = dataSet.getEntryForXValue(xValue, NaN);

        if (e == null) return false;

        return this.removeEntry(e, dataSetIndex);
    }

    /**
     * Returns the DataSet that contains the provided Entry, or null, if no
     * DataSet contains this Entry.
     *
     * @param e
     * @return
     */
    public getDataSetForEntry(e: Entry) {
        // WARNING: wont work if index is used as xKey(xKey not set)
        if (e == null) return null;

        for (let i = 0; i < this.mDataSets.length; i++) {
            const set = this.mDataSets[i];

            const xKey = set.xProperty;
            const yKey = set.yProperty;
            // for (let j = 0; j < set.getEntryCount(); j++) {
            if (e === set.getEntryForXValue(e[xKey], e[yKey])) return set;
            // }
        }

        return null;
    }
    /**
     * Returns the DataSet that contains the provided Entry and the entry index, or null, if no
     * DataSet contains this Entry.
     *
     * @param e
     * @return
     */
    public getDataSetAndIndexForEntry(e: Entry) {
        // WARNING: wont work if index is used as xKey(xKey not set)
        if (e == null) return null;

        for (let i = 0; i < this.mDataSets.length; i++) {
            const set = this.mDataSets[i];

            const xKey = set.xProperty;
            const yKey = set.yProperty;
            const r = set.getEntryAndIndexForXValue(e[xKey], e[yKey]);
            // for (let j = 0; j < set.getEntryCount(); j++) {
            if (e === r.entry) return { set, index: r.index };
            // }
        }

        return null;
    }

    /**
     * Returns all colors used across all DataSet objects this object
     * represents.
     *
     * @return
     */
    public getColors() {
        if (this.mDataSets == null) return null;

        let clrcnt = 0;

        for (let i = 0; i < this.mDataSets.length; i++) {
            clrcnt += this.mDataSets[i].getColors().length;
        }

        const colors = [];
        let cnt = 0;

        for (let i = 0; i < this.mDataSets.length; i++) {
            const clrs = this.mDataSets[i].getColors();

            for (const clr of clrs) {
                colors[cnt] = clr;
                cnt++;
            }
        }

        return colors;
    }

    /**
     * Returns the index of the provided DataSet in the DataSet array of this data object, or -1 if it does not exist.
     *
     * @param dataSet
     * @return
     */
    public getIndexOfDataSet(dataSet) {
        return this.mDataSets.indexOf(dataSet);
    }

    /**
     * Returns the first DataSet from the datasets-array that has it's dependency on the left axis.
     * Returns null if no DataSet with left dependency could be found.
     *
     * @return
     */
    protected getFirstLeft(sets) {
        for (const dataSet of sets) {
            if (dataSet.getAxisDependency() === AxisDependency.LEFT) return dataSet;
        }
        return null;
    }

    /**
     * Returns the first DataSet from the datasets-array that has it's dependency on the right axis.
     * Returns null if no DataSet with right dependency could be found.
     *
     * @return
     */
    public getFirstRight(sets) {
        for (const dataSet of sets) {
            if (dataSet.getAxisDependency() === AxisDependency.RIGHT) return dataSet;
        }
        return null;
    }

    /**
     * Sets a custom IValueFormatter for all DataSets this data object contains.
     *
     * @param f
     */
    public setValueFormatter(f: IValueFormatter) {
        if (f == null) return;
        else {
            for (const set of this.mDataSets) {
                set.setValueFormatter(f);
            }
        }
    }

    /**
     * Sets the color of the value-text (color in which the value-labels are
     * drawn) for all DataSets this data object contains.
     *
     * @param color
     */
    public setValueTextColor(color) {
        for (const set of this.mDataSets) {
            set.setValueTextColor(color);
        }
    }

    /**
     * Sets the same list of value-colors for all DataSets this
     * data object contains.
     *
     * @param colors
     */
    public setValueTextColors(colors) {
        for (const set of this.mDataSets) {
            set.setValueTextColors(colors);
        }
    }

    /**
     * Sets the Typeface for all value-labels for all DataSets this data object
     * contains.
     *
     * @param tf
     */
    public setValueTypeface(tf) {
        for (const set of this.mDataSets) {
            set.setValueTypeface(tf);
        }
    }

    /**
     * Sets the size (in dp) of the value-text for all DataSets this data object
     * contains.
     *
     * @param size
     */
    public setValueTextSize(size) {
        for (const set of this.mDataSets) {
            set.setValueTextSize(size);
        }
    }

    /**
     * Enables / disables drawing values (value-text) for all DataSets this data
     * object contains.
     *
     * @param enabled
     */
    public setDrawValues(enabled) {
        for (const set of this.mDataSets) {
            set.setDrawValues(enabled);
        }
    }

    /**
     * Enables / disables highlighting values for all DataSets this data object
     * contains. If set to true, this means that values can
     * be highlighted programmatically or by touch gesture.
     */
    public setHighlightEnabled(enabled) {
        for (const set of this.mDataSets) {
            set.setHighlightEnabled(enabled);
        }
    }

    /**
     * Returns true if highlighting of all underlying values is enabled, false
     * if not.
     *
     * @return
     */
    public isHighlightEnabled() {
        for (const set of this.mDataSets) {
            if (!set.isHighlightEnabled()) return false;
        }
        return true;
    }

    /**
     * Clears this data object from all DataSets and removes all Entries. Don't
     * forget to invalidate the chart after this.
     */
    public clearValues() {
        if (this.mDataSets != null) {
            this.mDataSets = [];
        }
        this.notifyDataChanged();
    }

    /**
     * Checks if this data object contains the specified DataSet. Returns true
     * if so, false if not.
     *
     * @param dataSet
     * @return
     */
    public contains(dataSet) {
        return this.mDataSets.indexOf(dataSet) >= 0;
    }

    /**
     * Returns the total entry count across all DataSet objects this data object contains.
     *
     * @return
     */
    public getEntryCount() {
        let count = 0;

        for (const set of this.mDataSets) {
            count += set.getEntryCount();
        }

        return count;
    }

    /**
     * Returns the DataSet object with the maximum number of entries or null if there are no DataSets.
     *
     * @return
     */
    public getMaxEntryCountSet() {
        if (this.mDataSets == null || this.mDataSets.length === 0) return null;

        let max = this.mDataSets[0];

        for (const set of this.mDataSets) {
            if (set.getEntryCount() > max.getEntryCount()) max = set;
        }

        return max;
    }
}
