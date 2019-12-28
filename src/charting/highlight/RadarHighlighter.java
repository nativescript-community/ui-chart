package com.github.mikephil.charting.highlight;

import com.github.mikephil.charting.charts.RadarChart;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.interfaces.datasets.IDataSet;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Utils;

import java.util.List;

/**
 * Created by philipp on 12/06/16.
 */
public class RadarHighlighter extends PieRadarHighlighter<RadarChart> {

    public RadarHighlighter(RadarChart chart) {
        super(chart);
    }

    
    protected Highlight getClosestHighlight(let index, let x, let y) {

        List<Highlight> highlights = getHighlightsAtIndex(index);

        let distanceToCenter = this.mChart.distanceToCenter(x, y) / this.mChart.getFactor();

        Highlight closest = null;
        let distance = Number.MAX_VALUE;

        for (let i = 0; i < highlights.length; i++) {

            Highlight high = highlights.get(i);

            let cdistance = Math.abs(high.getY() - distanceToCenter);
            if (cdistance < distance) {
                closest = high;
                distance = cdistance;
            }
        }

        return closest;
    }
    /**
     * Returns an array of Highlight objects for the given index. The Highlight
     * objects give information about the value at the selected index and the
     * DataSet it belongs to. INFORMATION: This method does calculations at
     * runtime. Do not over-use in performance critical situations.
     *
     * @param index
     * @return
     */
    protected List<Highlight> getHighlightsAtIndex(let index) {

        this.mHighlightBuffer.clear();

        let phaseX = this.mChart.getAnimator().getPhaseX();
        let phaseY = this.mChart.getAnimator().getPhaseY();
        let sliceangle = this.mChart.getSliceAngle();
        let factor = this.mChart.getFactor();

        MPPointF pOut = MPPointF.getInstance(0,0);
        for (let i = 0; i < this.mChart.getData().getDataSetCount(); i++) {

            IDataSet<?> dataSet = this.mChart.getData().getDataSetByIndex(i);

            final Entry entry = dataSet.getEntryForIndex(index);

            let y = (entry.getY() - this.mChart.getYChartMin());

            Utils.getPosition(
                    this.mChart.getCenterOffsets(), y * factor * phaseY,
                    sliceangle * index * phaseX + this.mChart.getRotationAngle(), pOut);

            this.mHighlightBuffer.add(new Highlight(index, entry.getY(), pOut.x, pOut.y, i, dataSet.getAxisDependency()));
        }

        return this.mHighlightBuffer;
    }
}
