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
        this.barHighlighter = barChart.barData == null ? null : new BarHighlighter(barChart);
    }

    public getHighlightsAtXValue(xVal, x?, y?) {
        this.mHighlightBuffer = [];

        const dataObjects = this.mChart.combinedData.getAllData();

        for (let i = 0; i < dataObjects.length; i++) {
            const dataObject = dataObjects[i];

            // in case of BarData, let the BarHighlighter take over
            if (this.barHighlighter != null && dataObject instanceof BarData && x !== undefined) {
                const high = this.barHighlighter.getHighlight(x, y);

                if (high != null) {
                    high.dataIndex = i;
                    this.mHighlightBuffer.push(high);
                }
            } else {
                for (let j = 0, dataSetCount = dataObject.dataSetCount; j < dataSetCount; j++) {
                    const dataSet = dataObjects[i].getDataSetByIndex(j);

                    // don't include datasets that cannot be highlighted
                    if (!dataSet.highlightEnabled) continue;

                    const highs = this.buildHighlights(dataSet, j, xVal, Rounding.CLOSEST);
                    for (const high of highs) {
                        high.dataIndex = i;
                        this.mHighlightBuffer.push(high);
                    }
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
    //            if (high == null)
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
