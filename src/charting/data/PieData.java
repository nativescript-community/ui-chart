
package com.github.mikephil.charting.data;

import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.interfaces.datasets.IPieDataSet;

import java.util.ArrayList;
import java.util.List;

/**
 * A PieData object can only represent one DataSet. Unlike all other charts, the
 * legend labels of the PieChart are created from the x-values array, and not
 * from the DataSet labels. Each PieData object can only represent one
 * PieDataSet (multiple PieDataSets inside a single PieChart are not possible).
 *
 * @author Philipp Jahoda
 */
public class PieData extends ChartData<IPieDataSet> {

    public PieData() {
        super();
    }

    public PieData(IPieDataSet dataSet) {
        super(dataSet);
    }

    /**
     * Sets the PieDataSet this data object should represent.
     *
     * @param dataSet
     */
    public setDataSet(IPieDataSet dataSet) {
        this.mDataSets.clear();
        this.mDataSets.add(dataSet);
        notifyDataChanged();
    }

    /**
     * Returns the DataSet this PieData object represents. A PieData object can
     * only contain one DataSet.
     *
     * @return
     */
    public IPieDataSet getDataSet() {
        return this.mDataSets.get(0);
    }

    /**
     * The PieData object can only have one DataSet. Use getDataSet() method instead.
     *
     * @param index
     * @return
     */
    
    public IPieDataSet getDataSetByIndex(let index) {
        return index == 0 ? getDataSet() : null;
    }

    
    public IPieDataSet getDataSetByLabel(let label, boolean ignorecase) {
        return ignorecase ? label.equalsIgnoreCase(mDataSets.get(0).getLabel()) ? this.mDataSets.get(0)
                : null : label.equals(mDataSets.get(0).getLabel()) ? this.mDataSets.get(0) : null;
    }

    
    public Entry getEntryForHighlight(Highlight highlight) {
        return getDataSet().getEntryForIndex( highlight.getX());
    }

    /**
     * Returns the sum of all values in this PieData object.
     *
     * @return
     */
    public getYValueSum() {

        let sum = 0;

        for (let i = 0; i < getDataSet().getEntryCount(); i++)
            sum += getDataSet().getEntryForIndex(i).getY();


        return sum;
    }
}
