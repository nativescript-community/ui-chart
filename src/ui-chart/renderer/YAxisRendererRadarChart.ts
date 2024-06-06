import { Canvas, Path } from '@nativescript-community/ui-canvas';
import { RadarChart } from '../charts/RadarChart';
import { YAxis } from '../components/YAxis';
import { MPPointF } from '../utils/MPPointF';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { YAxisRenderer } from './YAxisRenderer';

export class YAxisRendererRadarChart extends YAxisRenderer {
    private mChart: RadarChart;

    constructor(viewPortHandler: ViewPortHandler, yAxis: YAxis, chart: RadarChart) {
        super(viewPortHandler, yAxis, null);
        this.mChart = chart;
    }

    protected computeAxisValues(min: number, max: number) {
        const axis = this.mAxis;
        const yMin = min;
        const yMax = max;

        const labelCount = Math.max(axis.labelCount, 0);
        const range = Math.abs(yMax - yMin);

        if (labelCount === 0 || range <= 0 || !Number.isFinite(range)) {
            axis.mEntries = [];
            axis.mLabels = [];
            axis.mCenteredEntries = [];
            axis.mEntryCount = 0;
            return;
        }

        // Find out how much spacing (in y value space) between axis values
        const rawInterval = range / labelCount;
        let interval = Utils.roundToNextSignificant(rawInterval);

        // If granularity is enabled, then do not allow the interval to go below specified granularity.
        // This is used to avoid repeated values when rounding values for display.
        if (axis.granularity) interval = interval < axis.granularity ? axis.granularity : interval;

        // Normalize interval
        const intervalMagnitude = Utils.roundToNextSignificant(Math.pow(10, Math.log10(interval)));
        const intervalSigDigit = interval / intervalMagnitude;
        if (intervalSigDigit > 5) {
            // Use one order of magnitude higher, to avoid intervals like 0.9 or
            // 90
            interval = Math.floor(10 * intervalMagnitude);
        }

        const centeringEnabled = axis.centerAxisLabels;
        let n = centeringEnabled ? 1 : 0;

        const formatter = axis.valueFormatter;
        // force label count
        if (axis.forceLabelsEnabled) {
            const step = range / (labelCount - 1);
            axis.mEntryCount = Math.floor(labelCount);

            // if (this.mAxis.mEntries.length < labelCount) {
            //     // Ensure stops contains at least numStops elements.
            //     this.mAxis.mEntries = new Array(labelCount);
            //     this.mAxis.mLabels = new Array(labelCount);
            // }

            let v = min;

            for (let i = 0; i < axis.mEntryCount; i++) {
                axis.mEntries[i] = v;
                axis.mLabels[i] = formatter.getAxisLabel(v, axis);
                v += step;
            }
            n = axis.mEntryCount;

            // no forced count
        } else {
            let first = interval === 0.0 ? 0.0 : Math.ceil(yMin / interval) * interval;
            if (centeringEnabled) {
                first -= interval;
            }

            const last = interval === 0.0 ? 0.0 : Utils.nextUp(Math.floor(yMax / interval) * interval);

            let f;
            let i;

            if (interval !== 0.0) {
                for (f = first; f <= last; f += interval) {
                    ++n;
                }
            }

            n++;

            axis.mEntryCount = n;

            // if (this.mAxis.mEntries.length < n) {
            //     // Ensure stops contains at least numStops elements.
            //     this.mAxis.mEntries = new Array(n);
            //     this.mAxis.mLabels = new Array(n);
            // }

            for (f = first, i = 0; i < n; f += interval, ++i) {
                if (f === 0.0) {
                    // Fix for negative zero case (Where value === -0.0, and 0.0 === -0.0)
                    f = 0.0;
                }

                axis.mEntries[i] = f;
                axis.mLabels[i] = formatter.getAxisLabel(f, axis);
            }
        }

        // set decimals
        if (interval < 1) {
            this.mAxis.mDecimals = Math.ceil(-Math.log10(interval));
        } else {
            this.mAxis.mDecimals = 0;
        }

        if (centeringEnabled) {
            if (this.mAxis.mCenteredEntries.length < n) {
                this.mAxis.mCenteredEntries = new Array(n);
            }

            const offset = (this.mAxis.mEntries[1] - this.mAxis.mEntries[0]) / 2;

            for (let i = 0; i < n; i++) {
                this.mAxis.mCenteredEntries[i] = this.mAxis.mEntries[i] + offset;
            }
        }
        if (!this.mAxis.isAxisMinCustom()) {
            this.mAxis.axisMinimum = this.mAxis.mEntries[0];
            this.mAxis.resetAxisMinimum();
        }
        if (!this.mAxis.isAxisMaxCustom()) {
            this.mAxis.axisMaximum = this.mAxis.mEntries[n - 1];
            this.mAxis.resetAxisMaximum();
        }
        this.mAxis.axisRange = Math.abs(this.mAxis.axisMaximum - this.mAxis.axisMinimum);
    }

    public renderAxisLabels(c: Canvas) {
        if (!this.mYAxis.enabled || !this.mYAxis.drawLabels) return;

        const paint = this.axisLabelsPaint;
        paint.setFont(this.mYAxis.typeface);
        paint.setColor(this.mYAxis.textColor);

        const center = this.mChart.centerOffsets;
        const pOut: MPPointF = { x: 0, y: 0 };
        const factor = this.mChart.factor;

        const from = this.mYAxis.drawBottomYLabelEntry ? 0 : 1;
        const to = this.mYAxis.drawTopYLabelEntry ? this.mYAxis.mEntryCount : this.mYAxis.mEntryCount - 1;

        for (let j = from; j < to; j++) {
            const r = (this.mYAxis.mEntries[j] - this.mYAxis.axisMinimum) * factor;

            Utils.getPosition(center, r, this.mChart.rotationAngle, pOut);

            const label = this.mYAxis.getFormattedLabel(j);
            if (label) {
                c.drawText(label + '', pOut.x + 10, pOut.y, paint);
            }
        }
        // MPPointF.recycleInstance(center);
        // MPPointF.recycleInstance(pOut);
    }

    private mRenderLimitLinesPathBuffer: Path;
    protected get renderLimitLinesPathBuffer() {
        if (!this.mRenderLimitLinesPathBuffer) {
            this.mRenderLimitLinesPathBuffer = new Path();
        }
        return this.mRenderLimitLinesPathBuffer;
    }

    public renderLimitLines(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.enabled) {
            return;
        }
        const limitLines = axis.limitLines;

        if (!limitLines) return;

        const sliceangle = this.mChart.sliceAngle;

        // calculate the factor that is needed for transforming the value to
        // pixels
        const factor = this.mChart.factor;

        const center = this.mChart.centerOffsets;
        const pOut: MPPointF = { x: 0, y: 0 };
        for (let i = 0; i < limitLines.length; i++) {
            const l = limitLines[i];

            if (!l.enabled) continue;

            const paint = this.limitLinePaint;
            paint.setColor(l.lineColor);
            paint.setPathEffect(l.dashPathEffect);
            paint.setStrokeWidth(l.lineWidth);

            const r = (l.limit - this.mChart.yChartMin) * factor;

            const limitPath = this.renderLimitLinesPathBuffer;
            limitPath.reset();

            for (let j = 0; j < this.mChart.data.maxEntryCountSet.entryCount; j++) {
                Utils.getPosition(center, r, sliceangle * j + this.mChart.rotationAngle, pOut);

                if (j === 0) limitPath.moveTo(pOut.x, pOut.y);
                else limitPath.lineTo(pOut.x, pOut.y);
            }
            limitPath.close();

            c.drawPath(limitPath, paint);
        }
        // MPPointF.recycleInstance(center);
        // MPPointF.recycleInstance(pOut);
    }
}
