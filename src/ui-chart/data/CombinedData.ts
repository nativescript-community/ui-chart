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
import { DataSet } from './DataSet';

/**
 * Data object that allows the combination of Line-, Bar-, Scatter-, Bubble- and
 * CandleData. Used in the CombinedChart class.
 *

 */
export class CombinedData extends BarLineScatterCandleBubbleData<Entry, BarLineScatterCandleBubbleDataSet<Entry>> {
    lineData: LineData;
    barData: BarData;
    scatterData: ScatterData;
    candleData: CandleData;
    bubbleData: BubbleData;

    public set data(data: LineData | BarData | ScatterData | CandleData | BubbleData) {
        if (data instanceof LineData) {
            this.lineData = data;
        } else if (data instanceof BarData) {
            this.barData = data;
        } else if (data instanceof ScatterData) {
            this.scatterData = data;
        } else if (data instanceof CandleData) {
            this.candleData = data;
        } else if (data instanceof BubbleData) {
            this.bubbleData = data;
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

            const sets = data.dataSets;
            this.mDataSets.push(...sets);

            if (data.yMax > this.mYMax) this.mYMax = data.yMax;

            if (data.yMin < this.mYMin) this.mYMin = data.yMin;

            if (data.xMax > this.mXMax) this.mXMax = data.xMax;

            if (data.xMin < this.mXMin) this.mXMin = data.xMin;

            if (data.mLeftAxisMax > this.mLeftAxisMax) this.mLeftAxisMax = data.mLeftAxisMax;

            if (data.mLeftAxisMin < this.mLeftAxisMin) this.mLeftAxisMin = data.mLeftAxisMin;

            if (data.mRightAxisMax > this.mRightAxisMax) this.mRightAxisMax = data.mRightAxisMax;

            if (data.mRightAxisMin < this.mRightAxisMin) this.mRightAxisMin = data.mRightAxisMin;
        }
    }

    /**
     * Returns all data objects in row: line-bar-scatter-candle-bubble if not null.
     */
    public getAllData() {
        return [this.lineData, this.barData, this.scatterData, this.candleData, this.bubbleData].filter((d) => !!d) as ChartData<any, any>[];
    }

    public getDataByIndex(index) {
        return this.getAllData()[index];
    }

    public notifyDataChanged() {
        if (this.lineData) this.lineData.notifyDataChanged();
        if (this.barData) this.barData.notifyDataChanged();
        if (this.candleData) this.candleData.notifyDataChanged();
        if (this.scatterData) this.scatterData.notifyDataChanged();
        if (this.bubbleData) this.bubbleData.notifyDataChanged();

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

        if (highlight.dataSetIndex >= data.dataSetCount) return null;

        // The value of the highlighted entry could be NaN -
        //   if we are not interested in highlighting a specific value.
        const dataSet = data.getDataSetByIndex(highlight.dataSetIndex) as DataSet<any>;
        const entries = dataSet.getEntriesForXValue(highlight.x);
        for (const entry of entries) if (entry[dataSet.yProperty] === highlight.y || isNaN(highlight.y)) return entry;

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

        const data = this.getDataByIndex(highlight.dataIndex);

        if (highlight.dataSetIndex >= data.dataSetCount) return null;

        return data.dataSets[highlight.dataSetIndex] as BarLineScatterCandleBubbleDataSet<any>;
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
