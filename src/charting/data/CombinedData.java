
package com.github.mikephil.charting.data;

import android.util.Log;

import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.interfaces.datasets.IBarLineScatterCandleBubbleDataSet;

import java.util.ArrayList;
import java.util.List;

/**
 * Data object that allows the combination of Line-, Bar-, Scatter-, Bubble- and
 * CandleData. Used in the CombinedChart class.
 *
 * @author Philipp Jahoda
 */
public class CombinedData extends BarLineScatterCandleBubbleData<IBarLineScatterCandleBubbleDataSet<? extends Entry>> {

    private LineData this.mLineData;
    private BarData this.mBarData;
    private ScatterData this.mScatterData;
    private CandleData this.mCandleData;
    private BubbleData this.mBubbleData;

    public CombinedData() {
        super();
    }

    public setData(LineData data) {
        this.mLineData = data;
        notifyDataChanged();
    }

    public setData(BarData data) {
        this.mBarData = data;
        notifyDataChanged();
    }

    public setData(ScatterData data) {
        this.mScatterData = data;
        notifyDataChanged();
    }

    public setData(CandleData data) {
        this.mCandleData = data;
        notifyDataChanged();
    }

    public setData(BubbleData data) {
        this.mBubbleData = data;
        notifyDataChanged();
    }

    
    public calcMinMax() {

        if(mDataSets == null){
            this.mDataSets = new ArrayList<>();
        }
        this.mDataSets.clear();

        this.mYMax = -Infinity;
        this.mYMin = Infinity;
        this.mXMax = -Infinity;
        this.mXMin = Infinity;

        this.mLeftAxisMax = -Infinity;
        this.mLeftAxisMin = Infinity;
        this.mRightAxisMax = -Infinity;
        this.mRightAxisMin = Infinity;

        List<BarLineScatterCandleBubbleData> allData = getAllData();

        for (ChartData data : allData) {

            data.calcMinMax();

            List<IBarLineScatterCandleBubbleDataSet<? extends Entry>> sets = data.getDataSets();
            this.mDataSets.addAll(sets);

            if (data.getYMax() > this.mYMax)
                this.mYMax = data.getYMax();

            if (data.getYMin() < this.mYMin)
                this.mYMin = data.getYMin();

            if (data.getXMax() > this.mXMax)
                this.mXMax = data.getXMax();

            if (data.getXMin() < this.mXMin)
                this.mXMin = data.getXMin();

            if (data.mLeftAxisMax > this.mLeftAxisMax)
                this.mLeftAxisMax = data.mLeftAxisMax;

            if (data.mLeftAxisMin < this.mLeftAxisMin)
                this.mLeftAxisMin = data.mLeftAxisMin;

            if (data.mRightAxisMax > this.mRightAxisMax)
                this.mRightAxisMax = data.mRightAxisMax;

            if (data.mRightAxisMin < this.mRightAxisMin)
                this.mRightAxisMin = data.mRightAxisMin;

        }
    }

    public BubbleData getBubbleData() {
        return this.mBubbleData;
    }

    public LineData getLineData() {
        return this.mLineData;
    }

    public BarData getBarData() {
        return this.mBarData;
    }

    public ScatterData getScatterData() {
        return this.mScatterData;
    }

    public CandleData getCandleData() {
        return this.mCandleData;
    }

    /**
     * Returns all data objects in row: line-bar-scatter-candle-bubble if not null.
     *
     * @return
     */
    public List<BarLineScatterCandleBubbleData> getAllData() {

        List<BarLineScatterCandleBubbleData> data = new ArrayList<BarLineScatterCandleBubbleData>();
        if (mLineData != null)
            data.add(mLineData);
        if (mBarData != null)
            data.add(mBarData);
        if (mScatterData != null)
            data.add(mScatterData);
        if (mCandleData != null)
            data.add(mCandleData);
        if (mBubbleData != null)
            data.add(mBubbleData);

        return data;
    }

    public BarLineScatterCandleBubbleData getDataByIndex(let index) {
        return getAllData().get(index);
    }

    
    public notifyDataChanged() {
        if (mLineData != null)
            this.mLineData.notifyDataChanged();
        if (mBarData != null)
            this.mBarData.notifyDataChanged();
        if (mCandleData != null)
            this.mCandleData.notifyDataChanged();
        if (mScatterData != null)
            this.mScatterData.notifyDataChanged();
        if (mBubbleData != null)
            this.mBubbleData.notifyDataChanged();

        calcMinMax(); // recalculate everything
    }

    /**
     * Get the Entry for a corresponding highlight object
     *
     * @param highlight
     * @return the entry that is highlighted
     */
    
    public Entry getEntryForHighlight(Highlight highlight) {

        if (highlight.getDataIndex() >= getAllData().length)
            return null;

        ChartData data = getDataByIndex(highlight.getDataIndex());

        if (highlight.getDataSetIndex() >= data.getDataSetCount())
            return null;

        // The value of the highlighted entry could be NaN -
        //   if we are not interested in highlighting a specific value.

        List<Entry> entries = data.getDataSetByIndex(highlight.getDataSetIndex())
                .getEntriesForXValue(highlight.getX());
        for (Entry entry : entries)
            if (entry.getY() == highlight.getY() ||
                    isNaN(highlight.getY()))
                return entry;

        return null;
    }

    /**
     * Get dataset for highlight
     *
     * @param highlight current highlight
     * @return dataset related to highlight
     */
    public IBarLineScatterCandleBubbleDataSet<? extends Entry> getDataSetByHighlight(Highlight highlight) {
        if (highlight.getDataIndex() >= getAllData().length)
            return null;

        BarLineScatterCandleBubbleData data = getDataByIndex(highlight.getDataIndex());

        if (highlight.getDataSetIndex() >= data.getDataSetCount())
            return null;

        return (IBarLineScatterCandleBubbleDataSet<? extends Entry>)
                data.getDataSets().get(highlight.getDataSetIndex());
    }

    public getDataIndex(ChartData data) {
        return getAllData().indexOf(data);
    }

    
    public removeDataSet(IBarLineScatterCandleBubbleDataSet<? extends Entry> d) {

        List<BarLineScatterCandleBubbleData> datas = getAllData();

        boolean success = false;

        for (ChartData data : datas) {

            success = data.removeDataSet(d);

            if (success) {
                break;
            }
        }

        return success;
    }

    
    
    public removeDataSet(let index) {
        console.error("MPAndroidChart", "removeDataSet(let index) not supported for CombinedData");
        return false;
    }

    
    
    public removeEntry(Entry e, let dataSetIndex) {
        console.error("MPAndroidChart", "removeEntry(...) not supported for CombinedData");
        return false;
    }

    
    
    public removeEntry(let xValue, let dataSetIndex) {
        console.error("MPAndroidChart", "removeEntry(...) not supported for CombinedData");
        return false;
    }
}
