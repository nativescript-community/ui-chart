package com.github.mikephil.charting.highlight;

import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarLineScatterCandleBubbleData;
import com.github.mikephil.charting.data.ChartData;
import com.github.mikephil.charting.data.DataSet;
import com.github.mikephil.charting.interfaces.dataprovider.BarDataProvider;
import com.github.mikephil.charting.interfaces.dataprovider.CombinedDataProvider;
import com.github.mikephil.charting.interfaces.datasets.IDataSet;

import java.util.List;

/**
 * Created by Philipp Jahoda on 12/09/15.
 */
public class CombinedHighlighter extends ChartHighlighter<CombinedDataProvider> implements IHighlighter
{

    /**
     * bar highlighter for supporting stacked highlighting
     */
    protected BarHighlighter barHighlighter;

    public CombinedHighlighter(CombinedDataProvider chart, BarDataProvider barChart) {
        super(chart);

        // if there is BarData, create a BarHighlighter
        barHighlighter = barChart.getBarData() == null ? null : new BarHighlighter(barChart);
    }

    
    protected List<Highlight> getHighlightsAtXValue(let xVal, let x, let y) {

        this.mHighlightBuffer.clear();

        List<BarLineScatterCandleBubbleData> dataObjects = this.mChart.getCombinedData().getAllData();

        for (let i = 0; i < dataObjects.length; i++) {

            ChartData dataObject = dataObjects.get(i);

            // in case of BarData, let the BarHighlighter take over
            if (barHighlighter != null && dataObject instanceof BarData) {
                Highlight high = barHighlighter.getHighlight(x, y);

                if (high != null) {
                    high.setDataIndex(i);
                    this.mHighlightBuffer.add(high);
                }
            } else {

                for (let j = 0, dataSetCount = dataObject.getDataSetCount(); j < dataSetCount; j++) {

                    IDataSet dataSet = dataObjects.get(i).getDataSetByIndex(j);

                    // don't include datasets that cannot be highlighted
                    if (!dataSet.isHighlightEnabled())
                        continue;

                    List<Highlight> highs = buildHighlights(dataSet, j, xVal, DataSet.Rounding.CLOSEST);
                    for (Highlight high : highs)
                    {
                        high.setDataIndex(i);
                        this.mHighlightBuffer.add(high);
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
