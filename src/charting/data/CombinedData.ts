import { BarLineScatterCandleBubbleData } from './BarLineScatterCandleBubbleData';
import { BarLineScatterCandleBubbleDataSet } from './BarLineScatterCandleBubbleDataSet';
import { BubbleData } from './BubbleData';
import { CandleData } from './CandleData';
import { ScatterData } from './ScatterData';
import { BarData } from './BarData';
import { LineData } from './LineData';
import { Entry } from './Entry';
import { ChartData } from './ChartData';
import { Highlight } from '../highlight/Highlight';

/**
 * Data object that allows the combination of Line-, Bar-, Scatter-, Bubble- and
 * CandleData. Used in the CombinedChart class.
 *
 * @author Philipp Jahoda
 */
export class CombinedData extends BarLineScatterCandleBubbleData<Entry, BarLineScatterCandleBubbleDataSet<Entry>> {
    mLineData: LineData;
    mBarData: BarData;
    mScatterData: ScatterData;
    mCandleData: CandleData;
    mBubbleData: BubbleData;

    public setData(data: LineData | BarData | ScatterData | CandleData | BubbleData) {
        if (data instanceof LineData) {
            this.mLineData = data;
        } else if (data instanceof BarData) {
            this.mBarData = data;
        } else if (data instanceof ScatterData) {
            this.mScatterData = data;
        } else if (data instanceof CandleData) {
            this.mCandleData = data;
        } else if (data instanceof BubbleData) {
            this.mBubbleData = data;
        }
        this.notifyDataChanged();
    }

    public calcMinMax() {
        if (this.mDataSets == null) {
            this.mDataSets = [];
        }
        this.mDataSets = [];

        this.mYMax = -Infinity;
        this.mYMin = Infinity;
        this.mXMax = -Infinity;
        this.mXMin = Infinity;

        this.mLeftAxisMax = -Infinity;
        this.mLeftAxisMin = Infinity;
        this.mRightAxisMax = -Infinity;
        this.mRightAxisMin = Infinity;

        const allData = this.getAllData();
        // for (let index = 0; index < allData.length; index++) {
        //     const element = array[index];

        // }
        for (const data of allData) {
            data.calcMinMax();

            const sets = data.getDataSets();
            this.mDataSets.push(...sets);

            if (data.getYMax() > this.mYMax) this.mYMax = data.getYMax();

            if (data.getYMin() < this.mYMin) this.mYMin = data.getYMin();

            if (data.getXMax() > this.mXMax) this.mXMax = data.getXMax();

            if (data.getXMin() < this.mXMin) this.mXMin = data.getXMin();

            if (data.mLeftAxisMax > this.mLeftAxisMax) this.mLeftAxisMax = data.mLeftAxisMax;

            if (data.mLeftAxisMin < this.mLeftAxisMin) this.mLeftAxisMin = data.mLeftAxisMin;

            if (data.mRightAxisMax > this.mRightAxisMax) this.mRightAxisMax = data.mRightAxisMax;

            if (data.mRightAxisMin < this.mRightAxisMin) this.mRightAxisMin = data.mRightAxisMin;
        }
    }

    public getBubbleData() {
        return this.mBubbleData;
    }

    public getLineData() {
        return this.mLineData;
    }

    public getBarData() {
        return this.mBarData;
    }

    public getScatterData() {
        return this.mScatterData;
    }

    public getCandleData() {
        return this.mCandleData;
    }

    /**
     * Returns all data objects in row: line-bar-scatter-candle-bubble if not null.
     *
     * @return
     */
    public getAllData() {
        const data: ChartData<any, any>[] = [];
        if (this.mLineData != null) data.push(this.mLineData);
        if (this.mBarData != null) data.push(this.mBarData);
        if (this.mScatterData != null) data.push(this.mScatterData);
        if (this.mCandleData != null) data.push(this.mCandleData);
        if (this.mBubbleData != null) data.push(this.mBubbleData);

        return data;
    }

    public getDataByIndex(index) {
        return this.getAllData()[index];
    }

    public notifyDataChanged() {
        if (this.mLineData != null) this.mLineData.notifyDataChanged();
        if (this.mBarData != null) this.mBarData.notifyDataChanged();
        if (this.mCandleData != null) this.mCandleData.notifyDataChanged();
        if (this.mScatterData != null) this.mScatterData.notifyDataChanged();
        if (this.mBubbleData != null) this.mBubbleData.notifyDataChanged();

        this.calcMinMax(); // recalculate everything
    }

    /**
     * Get the Entry for a corresponding highlight object
     *
     * @param highlight
     * @return the entry that is highlighted
     */

    public getEntryForHighlight(highlight: Highlight) {
        if (highlight.dataIndex >= this.getAllData().length) return null;

        const data = this.getDataByIndex(highlight.dataIndex);

        if (highlight.dataSetIndex >= data.getDataSetCount()) return null;

        // The value of the highlighted entry could be NaN -
        //   if we are not interested in highlighting a specific value.

        const entries = data.getDataSetByIndex(highlight.dataSetIndex).getEntriesForXValue(highlight.x);
        for (const entry of entries) if (entry.getY() === highlight.y || isNaN(highlight.y)) return entry;

        return null;
    }

    /**
     * Get dataset for highlight
     *
     * @param highlight current highlight
     * @return dataset related to highlight
     */
    public getDataSetByHighlight(highlight: Highlight) {
        if (highlight.dataIndex >= this.getAllData().length) return null;

        const data = this.getDataByIndex(highlight.dataSetIndex);

        if (highlight.dataSetIndex >= data.getDataSetCount()) return null;

        return data.getDataSets()[highlight.dataSetIndex] as BarLineScatterCandleBubbleDataSet<any>;
    }

    public getDataIndex(data: ChartData<any, any>) {
        return this.getAllData().indexOf(data);
    }

    public removeDataSet(d: BarLineScatterCandleBubbleDataSet<any>) {
        const datas = this.getAllData();

        let success = false;

        for (const data of datas) {
            success = data.removeDataSet(d);

            if (success) {
                break;
            }
        }

        return success;
    }

    public removeDataSetAtIndex(index: number) {
        console.error('removeDataSet(let index) not supported for CombinedData');
        return false;
    }

    public removeEntry(e: Entry, dataSetIndex: number) {
        console.error('removeEntry(...) not supported for CombinedData');
        return false;
    }

    public removeEntryForXValue(xValue: number, dataSetIndex: number) {
        console.error('removeEntry(...) not supported for CombinedData');
        return false;
    }
}
