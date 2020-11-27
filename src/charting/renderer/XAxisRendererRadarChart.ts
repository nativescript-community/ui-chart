import { Canvas } from '@nativescript-community/ui-canvas';
import { RadarChart } from '../charts/RadarChart';
import { XAxis } from '../components/XAxis';
import { MPPointF } from '../utils/MPPointF';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { XAxisRenderer } from './XAxisRenderer';

export class XAxisRendererRadarChart extends XAxisRenderer {
    private mChart: RadarChart;
    mForceLongestLabelComputation = true;

    constructor(viewPortHandler: ViewPortHandler, xAxis: XAxis, chart: RadarChart) {
        super(viewPortHandler, xAxis, null);

        this.mChart = chart;
    }

    public renderAxisLabels(c: Canvas) {
        const axis = this.mXAxis;
        const chart = this.mChart;
        if (!axis.isEnabled() || !axis.isDrawLabelsEnabled()) return;

        const labelRotationAngleDegrees = axis.getLabelRotationAngle();
        const drawLabelAnchor: MPPointF = { x: 0.5, y: 0.25 };

        this.mAxisLabelPaint.setFont(axis.getFont());
        this.mAxisLabelPaint.setTextAlign(axis.getLabelTextAlign());
        this.mAxisLabelPaint.setColor(axis.getTextColor());

        const sliceangle = chart.getSliceAngle();

        // calculate the factor that is needed for transforming the value to
        // pixels
        const factor = chart.getFactor();

        const center = chart.getCenterOffsets();
        const pOut: MPPointF = { x: 0, y: 0 };
        const labels = axis.mLabels;
        for (let i = 0; i < chart.getData().getMaxEntryCountSet().getEntryCount(); i++) {
            const label = labels[i];
            const angle = (sliceangle * i + chart.getRotationAngle()) % 360;

            Utils.getPosition(center, chart.getYRange() * factor + axis.mLabelRotatedWidth / 2, angle, pOut);

            this.drawLabel(c, label, pOut.x, pOut.y - axis.mLabelRotatedHeight / 2, drawLabelAnchor, labelRotationAngleDegrees);
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
