import { ChartData } from './ChartData';
import { Entry } from './Entry';
import { PieEntry } from './PieEntry';
import { PieDataSet } from './PieDataSet';
import { Highlight } from '../highlight/Highlight';

/**
 * A PieData object can only represent one DataSet. Unlike all other charts, the
 * legend labels of the PieChart are created from the x-values array, and not
 * from the DataSet labels. Each PieData object can only represent one
 * PieDataSet (multiple PieDataSets inside a single PieChart are not possible).
 *

 */
export class PieData extends ChartData<PieEntry, PieDataSet> {
    /**
     * Sets the PieDataSet this data object should represent.
     *
     * @param dataSet
     */
    public setDataSet(dataSet: PieDataSet) {
        this.mDataSets.splice(0);
        this.mDataSets.push(dataSet);
        this.notifyDataChanged();
    }

    /**
     * Returns the DataSet this PieData object represents. A PieData object can
     * only contain one DataSet.
     *
     * @return
     */
    public getDataSet(): PieDataSet {
        return this.mDataSets[0];
    }

    /**
     * The PieData object can only have one DataSet. Use getDataSet() method instead.
     *
     * @param index
     * @return
     */

    public getDataSetByIndex(index): PieDataSet {
        return index === 0 ? this.getDataSet() : null;
    }

    public getDataSetByLabel(label: string, ignoreCase): PieDataSet {
        return ignoreCase ? (label?.toLowerCase() === this.mDataSets[0].getLabel()?.toLowerCase() ? this.mDataSets[0] : null) : label === this.mDataSets[0].getLabel() ? this.mDataSets[0] : null;
    }

    public getEntryForHighlight(highlight: Highlight): Entry {
        return this.getDataSet().getEntryForIndex(highlight.x);
    }

    /**
     * Returns the sum of all values in this PieData object.
     *
     * @return
     */
    public getYValueSum() {
        const yKey = this.getDataSet().yProperty;
        let sum = 0;

        for (let i = 0; i < this.getDataSet().getEntryCount(); i++) {
            sum += this.getDataSet().getEntryForIndex(i)[yKey];
        }

        return sum;
    }
}
