import { Canvas } from '@nativescript-community/ui-canvas';
import { RadarChart } from '../charts/RadarChart';
import { XAxis } from '../components/XAxis';
import { MPPointF } from '../utils/MPPointF';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { XAxisRenderer } from './XAxisRenderer';

export class XAxisRendererRadarChart extends XAxisRenderer {
    private mChart: RadarChart;

    constructor(viewPortHandler: ViewPortHandler, xAxis: XAxis, chart: RadarChart) {
        super(viewPortHandler, xAxis, null);

        this.mChart = chart;
    }

    public renderAxisLabels(c: Canvas) {
        if (!this.mXAxis.isEnabled() || !this.mXAxis.isDrawLabelsEnabled()) return;

        const labelRotationAngleDegrees = this.mXAxis.getLabelRotationAngle();
        const drawLabelAnchor: MPPointF = { x: 0.5, y: 0.25 };

        this.mAxisLabelPaint.setTypeface(this.mXAxis.getTypeface());
        this.mAxisLabelPaint.setTextSize(this.mXAxis.getTextSize());
        this.mAxisLabelPaint.setColor(this.mXAxis.getTextColor());

        const sliceangle = this.mChart.getSliceAngle();

        // calculate the factor that is needed for transforming the value to
        // pixels
        const factor = this.mChart.getFactor();

        const center = this.mChart.getCenterOffsets();
        const pOut: MPPointF = { x: 0, y: 0 };
        for (let i = 0; i < this.mChart.getData().getMaxEntryCountSet().getEntryCount(); i++) {
            const label = this.mXAxis.getValueFormatter().getAxisLabel(i, this.mXAxis);

            const angle = (sliceangle * i + this.mChart.getRotationAngle()) % 360;

            Utils.getPosition(center, this.mChart.getYRange() * factor + this.mXAxis.mLabelRotatedWidth / 2, angle, pOut);

            this.drawLabel(c, label, pOut.x, pOut.y - this.mXAxis.mLabelRotatedHeight / 2, drawLabelAnchor, labelRotationAngleDegrees);
        }

        // MPPointF.recycleInstance(center);
        // MPPointF.recycleInstance(pOut);
        // MPPointF.recycleInstance(drawLabelAnchor);
    }

    /**
     * XAxis LimitLines on RadarChart not yet supported.
     *
     * @param c
     */

    public renderLimitLines(c: Canvas) {
        // this space intentionally left blank
    }
}
