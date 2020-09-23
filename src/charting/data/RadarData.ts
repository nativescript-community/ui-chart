import { Highlight } from '../highlight/Highlight';
import { ChartData } from './ChartData';
import { RadarDataSet } from './RadarDataSet';
import { RadarEntry } from './RadarEntry';

/**
 * Data container for the RadarChart.
 *
 * @author Philipp Jahoda
 */
export class RadarData extends ChartData<RadarEntry, RadarDataSet> {
    private mLabels: string[];

    constructor(dataSets: RadarDataSet[]) {
        super(dataSets);
    }

    /**
     * Sets the labels that should be drawn around the RadarChart at the end of each web line.
     *
     * @param labels
     */
    public setLabels(labels: string[]) {
        this.mLabels = labels;
    }

    public getLabels() {
        return this.mLabels;
    }

    public getEntryForHighlight(highlight: Highlight) {
        return this.getDataSetByIndex(highlight.dataSetIndex).getEntryForIndex(highlight.y);
    }
}
