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
        const axis = this.xAxis;
        const chart = this.mChart;
        if (!axis.enabled || !axis.drawLabels) return;

        const labelRotationAngleDegrees = axis.labelRotationAngle;
        const drawLabelAnchor: MPPointF = { x: 0.5, y: 0.25 };
        const paint = this.axisLabelsPaint;

        paint.setFont(axis.typeface);
        paint.setTextAlign(axis.labelTextAlign);
        paint.setColor(axis.textColor);

        const sliceangle = chart.sliceAngle;

        // calculate the factor that is needed for transforming the value to
        // pixels
        const factor = chart.factor;

        const center = chart.centerOffsets;
        const pOut: MPPointF = { x: 0, y: 0 };
        const labels = axis.mLabels;
        for (let i = 0; i < chart.data.maxEntryCountSet.entryCount; i++) {
            const label = labels[i];
            if (!label) {
                continue;
            }
            const angle = (sliceangle * i + chart.rotationAngle) % 360;

            Utils.getPosition(center, chart.yRange * factor + axis.mLabelRotatedWidth / 2, angle, pOut);

            this.drawLabel(c, label, pOut.x, pOut.y - axis.mLabelRotatedHeight / 2, drawLabelAnchor, labelRotationAngleDegrees, paint);
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
