import { Highlight } from './Highlight';
import { PieRadarHighlighter } from './PieRadarHighlighter';
import { PieChart } from '../charts/PieChart';
import { PieEntry } from '../data/PieEntry';
import { PieDataSet } from '../data/PieDataSet';

export class PieHighlighter extends PieRadarHighlighter<PieEntry, PieDataSet, PieChart> {
    constructor(chart: PieChart) {
        super(chart);
    }

    protected getClosestHighlight(index, x: number, y: number): Highlight {
        const set = this.mChart.data.getDataSet();
        const entry = set.getEntryForIndex(index);
        const yProperty = set.yProperty;

        return {
            entry,
            x: index,
            y: entry[yProperty],
            xPx: x,
            yPx: y,
            dataSetIndex: 0,
            axis: set.axisDependency
        };
    }
}
