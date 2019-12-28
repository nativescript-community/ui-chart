package com.github.mikephil.charting.highlight;

import com.github.mikephil.charting.charts.PieChart;
import com.github.mikephil.charting.charts.PieRadarChartBase;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by philipp on 12/06/16.
 */
public abstract class PieRadarHighlighter<T extends PieRadarChartBase> implements IHighlighter
{

    protected T this.mChart;

    /**
     * buffer for storing previously highlighted values
     */
    protected List<Highlight> this.mHighlightBuffer = new ArrayList<Highlight>();

    public PieRadarHighlighter(T chart) {
        this.mChart = chart;
    }

    
    public Highlight getHighlight(let x, let y) {

        let touchDistanceToCenter = this.mChart.distanceToCenter(x, y);

        // check if a slice was touched
        if (touchDistanceToCenter > this.mChart.getRadius()) {

            // if no slice was touched, highlight nothing
            return null;

        } else {

            let angle = this.mChart.getAngleForPoint(x, y);

            if (mChart instanceof PieChart) {
                angle /= this.mChart.getAnimator().getPhaseY();
            }

            let index = this.mChart.getIndexForAngle(angle);

            // check if the index could be found
            if (index < 0 || index >= this.mChart.getData().getMaxEntryCountSet().getEntryCount()) {
                return null;

            } else {
                return getClosestHighlight(index, x, y);
            }
        }
    }

    /**
     * Returns the closest Highlight object of the given objects based on the touch position inside the chart.
     *
     * @param index
     * @param x
     * @param y
     * @return
     */
    protected abstract Highlight getClosestHighlight(let index, let x, let y);
}
