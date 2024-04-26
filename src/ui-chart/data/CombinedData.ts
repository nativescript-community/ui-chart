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
        this.mDataSets = [];

        this.mYMax = -Infinity;
        this.mYMin = Infinity;
        this.mXMax = -Infinity;
        this.mXMin = Infinity;

        this.mLeftAxisMax = -Infinity;
        this.mLeftAxisMin = Infinity;
        this.mRightAxisMax = -Infinity;
        this.mRightAxisMin = Infinity;

        const allData = this.datasArray;
        for (let index = 0; index < allData.length; index++) {
            const data = allData[index];
            this.mDataSets.push(...data.dataSets);
            data.calcMinMax();
            this.mXMin = Math.min(this.mXMin, data.xMin);
            this.mXMax = Math.max(this.mXMax, data.xMax);
            this.mYMin = Math.min(this.mYMin, data.yMin);
            this.mYMax = Math.max(this.mYMax, data.yMax);

            this.mLeftAxisMin = Math.min(this.mLeftAxisMin, data.mLeftAxisMin);
            this.mLeftAxisMax = Math.max(this.mLeftAxisMax, data.mLeftAxisMax);
            this.mRightAxisMin = Math.min(this.mRightAxisMin, data.mRightAxisMin);
            this.mRightAxisMax = Math.max(this.mRightAxisMax, data.mRightAxisMax);
        }
    }

    public datasOrder = ['lineData', 'barData', 'scatterData', 'candleData', 'bubbleData'];

    /**
     * Returns all data objects in row: line-bar-scatter-candle-bubble if not null.
     */
    public get datasArray() {
        return [this.lineData, this.barData, this.scatterData, this.candleData, this.bubbleData].filter((d) => !!d) as ChartData<any, any>[];
    }

    /**
     * Returns all data as object.
     */
    public get datas() {
        return { lineData: this.lineData, barData: this.barData, scatterData: this.scatterData, candleData: this.candleData, bubbleData: this.bubbleData };
    }
    // get dataSetCount() {
    //     return this.datasArray.reduce((acc, data) => acc + data.dataSetCount, 0);
    // }
    // get dataSets() {
    //     return this.datasArray.reduce((acc, data) =>  acc.concat(data.dataSets), []);
    // }
    getDataByIndex(index) {
        return this.datasArray[index];
    }

    public notifyDataChanged() {
        this.datasArray.forEach((d) => d.notifyDataChanged());
        this.calcMinMax(); // recalculate everything
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
        const datasArray = this.datasArray;
        if (highlight.dataIndex >= datasArray.length) return null;

        const data = datasArray[highlight.dataIndex];

        if (highlight.dataSetIndex >= data.dataSetCount) return null;

        // The value of the highlighted entry could be NaN -
        //   if we are not interested in highlighting a specific value.
        const dataSet = data.getDataSetByIndex(highlight.dataSetIndex) as DataSet<any>;
        const entries = dataSet.getEntriesForXValue(highlight.x);
        const yProperty = dataSet.yProperty;
        if (isNaN(highlight.y)) {
            return entries[0];
        }
        return entries.find((e) => e[yProperty] === highlight.y);
    }

    /**
     * Get dataset for highlight
     *
     * @param highlight current highlight
     * @return dataset related to highlight
     */
    public getDataSetByHighlight(highlight: Highlight) {
        if (highlight.dataIndex >= this.datasArray.length) return null;

        const data = this.getDataByIndex(highlight.dataIndex);

        if (highlight.dataSetIndex >= data.dataSetCount) return null;

        return data.dataSets[highlight.dataSetIndex] as BarLineScatterCandleBubbleDataSet<any>;
    }

    public getDataIndex(data: ChartData<any, any>) {
        return this.datasArray.indexOf(data);
    }

    public removeDataSet(d: BarLineScatterCandleBubbleDataSet<any>) {
        const datas = this.datasArray;

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
