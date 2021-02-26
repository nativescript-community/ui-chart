import { Highlight } from './Highlight';
import { IHighlighter } from './IHighlighter';
import { PieChart } from '../charts/PieChart';
import { PieRadarChartBase } from '../charts/PieRadarChartBase';
import { Entry } from '../data/Entry';
import { DataSet } from '../data/DataSet';
import { ChartData } from '../data/ChartData';

export abstract class PieRadarHighlighter<E extends Entry, D extends DataSet<E>, T extends PieRadarChartBase<E, DataSet<E>, ChartData<E, D>>> implements IHighlighter {
    protected mChart: T;

    /**
     * buffer for storing previously highlighted values
     */
    protected mHighlightBuffer: Highlight[] = [];

    constructor(chart: T) {
        this.mChart = chart;
    }
    getHighlightsAtXValue(xVal, x?, y?): Highlight[] {
        // not implemented
        return null;
    }

    public getHighlight(x: number, y: number): Highlight {
        const touchDistanceToCenter = this.mChart.distanceToCenter(x, y);

        // Check if a slice was touched
        if (touchDistanceToCenter > this.mChart.getRadius()) {
            // if no slice was touched, highlight nothing
            return null;
        }

        let angle = this.mChart.getAngleForPoint(x, y);

        if (this.mChart instanceof PieChart) {
            angle /= this.mChart.getAnimator().getPhaseY();
        }

        const index = this.mChart.getIndexForAngle(angle);

        // check if the index could be found
        if (index < 0 || index >= this.mChart.getData().getMaxEntryCountSet().getEntryCount()) {
            return null;
        }
        return this.getClosestHighlight(index, x, y);
    }

    /**
     * Returns the closest Highlight object of the given objects based on the touch position inside the chart.
     *
     * @param index
     * @param x
     * @param y
     * @return
     */
    protected abstract getClosestHighlight(index, x: number, y: number): Highlight;
}
