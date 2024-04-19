import { Highlight } from '../highlight/Highlight';
import { ChartData } from './ChartData';
import { RadarDataSet } from './RadarDataSet';
import { RadarEntry } from './RadarEntry';

/**
 * Data container for the RadarChart.
 *

 */
export class RadarData extends ChartData<RadarEntry, RadarDataSet> {
    /**
     * Sets the labels that should be drawn around the RadarChart at the end of each web line.
     */
    labels: string[];

    constructor(dataSets: RadarDataSet[]) {
        super(dataSets);
    }

    public getEntryForHighlight(highlight: Highlight) {
        return this.getDataSetByIndex(highlight.dataSetIndex).getEntryForIndex(highlight.x);
    }
}
