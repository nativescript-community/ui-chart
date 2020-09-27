import { RadarChart } from '../charts/RadarChart';
import { RadarDataSet } from '../data/RadarDataSet';
import { RadarEntry } from '../data/RadarEntry';
import { MPPointF } from '../utils/MPPointF';
import { Utils } from '../utils/Utils';
import { PieRadarHighlighter } from './PieRadarHighlighter';

/**
 * Created by philipp on 12/06/16.
 */
export class RadarHighlighter extends PieRadarHighlighter<RadarEntry, RadarDataSet, RadarChart> {
    protected getClosestHighlight(index: number, x: number, y: number) {
        const highlights = this.getHighlightsAtIndex(index);

        const distanceToCenter = this.mChart.distanceToCenter(x, y) / this.mChart.getFactor();

        let closest = null;
        let distance = Infinity;

        for (let i = 0; i < highlights.length; i++) {
            const high = highlights[i];
            // const set = this.mChart.getData().getDataSetByIndex(high.dataSetIndex);
            // const yProperty = set.yProperty;
            const cdistance = Math.abs(high.y - distanceToCenter);
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
    protected getHighlightsAtIndex(index) {
        this.mHighlightBuffer = [];

        const phaseX = this.mChart.getAnimator().getPhaseX();
        const phaseY = this.mChart.getAnimator().getPhaseY();
        const sliceangle = this.mChart.getSliceAngle();
        const factor = this.mChart.getFactor();

        const pOut: MPPointF = { x: 0, y: 0 };
        for (let i = 0; i < this.mChart.getData().getDataSetCount(); i++) {
            const dataSet = this.mChart.getData().getDataSetByIndex(i);
            const yKey = dataSet.yProperty;

            const entry = dataSet.getEntryForIndex(index);

            const y = entry[yKey] - this.mChart.getYChartMin();

            Utils.getPosition(this.mChart.getCenterOffsets(), y * factor * phaseY, sliceangle * index * phaseX + this.mChart.getRotationAngle(), pOut);

            this.mHighlightBuffer.push({
                entry,
                x: index,
                y: entry[yKey],
                xPx: pOut.x,
                yPx: pOut.y,
                dataSetIndex: i,
                axis: dataSet.getAxisDependency(),
            });
        }

        return this.mHighlightBuffer;
    }
}
