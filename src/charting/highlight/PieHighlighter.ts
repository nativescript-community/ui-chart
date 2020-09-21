import { Highlight } from './Highlight';
import { PieRadarHighlighter } from './PieRadarHighlighter';
import { PieChart } from '../charts/PieChart';

export class PieHighlighter extends PieRadarHighlighter<PieChart>
{
    constructor(chart: PieChart)
    {
        super(chart);
    }
    
    protected getClosestHighlight(index, x: number, y: number): Highlight {
        const set = this.mChart.getData().getDataSet();
        const entry = set.getEntryForIndex(index);
        const yProperty = set.yProperty;

        return {
            entry: entry,
            x: index,
            y: entry[yProperty],
            xPx: x,
            yPx: y,
            dataSetIndex: 0,
            axis: set.getAxisDependency()
        };
    }
}
