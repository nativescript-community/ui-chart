import { ChartHighlighter } from './ChartHighlighter';
import { BarHighlighter } from './BarHighlighter';
import { IHighlighter } from './IHighlighter';
import { CombinedDataProvider } from '../interfaces/dataprovider/CombinedDataProvider';
import { BarDataProvider } from '../interfaces/dataprovider/BarDataProvider';
import { BarData } from '../data/BarData';
import { Rounding } from '../data/DataSet';
/**
 * Created by Philipp Jahoda on 12/09/15.
 */
export class CombinedHighlighter extends ChartHighlighter<CombinedDataProvider> implements IHighlighter {
    /**
     * bar highlighter for supporting stacked highlighting
     */
    protected barHighlighter: BarHighlighter;

    constructor(chart: CombinedDataProvider, barChart: BarDataProvider) {
        super(chart);

        // if there is BarData, create a BarHighlighter
        this.barHighlighter = !barChart.barData ? null : new BarHighlighter(barChart);
    }

    protected getChartData() {
        return this.mChart.combinedData;
    }

    public getHighlightsAtXValue(xVal, x?, y?) {
        this.mHighlightBuffer = [];
        const data = this.getChartData();

        if (!data) return this.mHighlightBuffer;

        const dataObjects = data.datas;
        const datasArray = data.datasArray;
        const keys = Object.keys(dataObjects);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const dataObject = dataObjects[key];
            if (!dataObject) {
                continue;
            }

            // in case of BarData, let the BarHighlighter take over
            if (this.barHighlighter && dataObject instanceof BarData && x !== undefined) {
                const high = this.barHighlighter.getHighlight(x, y);

                if (high) {
                    this.mHighlightBuffer.push(
                        ...this.barHighlighter.getHighlight(x, y).map((h) => {
                            h.dataIndex = datasArray.indexOf(dataObject);
                            h.dataType = key;
                            return h;
                        })
                    );
                }
            } else {
                for (let j = 0, dataSetCount = dataObject.dataSetCount; j < dataSetCount; j++) {
                    const dataSet = dataObject.getDataSetByIndex(j);

                    // don't include datasets that cannot be highlighted
                    if (!dataSet.highlightEnabled) continue;

                    this.mHighlightBuffer.push(
                        ...this.buildHighlights(dataSet, j, x, y, xVal, Rounding.CLOSEST).map((h) => {
                            h.dataIndex = datasArray.indexOf(dataObject);
                            h.dataType = key;
                            return h;
                        })
                    );
                }
            }
        }

        return this.mHighlightBuffer;
    }

    //    protected Highlight getClosest(let x, let y, Highlight... highs) {
    //
    //        Highlight closest = null;
    //        let minDistance = Infinity;
    //
    //        for (Highlight high : highs) {
    //
    //            if (high === null)
    //                continue;
    //
    //            let tempDistance = getDistance(x, y, high.getXPx(), high.getYPx());
    //
    //            if (tempDistance < minDistance) {
    //                minDistance = tempDistance;
    //                closest = high;
    //            }
    //        }
    //
    //        return closest;
    //    }
}
