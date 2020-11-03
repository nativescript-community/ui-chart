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
        const yMin = min;
        const yMax = max;

        const labelCount = this.mAxis.getLabelCount();
        const range = Math.abs(yMax - yMin);

        if (labelCount === 0 || range <= 0 || !Number.isFinite(range)) {
            this.mAxis.mEntries = [];
            this.mAxis.mCenteredEntries = [];
            this.mAxis.mEntryCount = 0;
            return;
        }

        // Find out how much spacing (in y value space) between axis values
        const rawInterval = range / labelCount;
        let interval = Utils.roundToNextSignificant(rawInterval);

        // If granularity is enabled, then do not allow the interval to go below specified granularity.
        // This is used to avoid repeated values when rounding values for display.
        if (this.mAxis.isGranularityEnabled()) interval = interval < this.mAxis.getGranularity() ? this.mAxis.getGranularity() : interval;

        // Normalize interval
        const intervalMagnitude = Utils.roundToNextSignificant(Math.pow(10, Math.log10(interval)));
        const intervalSigDigit = interval / intervalMagnitude;
        if (intervalSigDigit > 5) {
            // Use one order of magnitude higher, to avoid intervals like 0.9 or
            // 90
            interval = Math.floor(10 * intervalMagnitude);
        }

        const centeringEnabled = this.mAxis.isCenterAxisLabelsEnabled();
        let n = centeringEnabled ? 1 : 0;

        // force label count
        if (this.mAxis.isForceLabelsEnabled()) {
            const step = range / (labelCount - 1);
            this.mAxis.mEntryCount = labelCount;

            if (this.mAxis.mEntries.length < labelCount) {
                // Ensure stops contains at least numStops elements.
                this.mAxis.mEntries = new Array(labelCount);
            }

            let v = min;

            for (let i = 0; i < labelCount; i++) {
                this.mAxis.mEntries[i] = v;
                v += step;
            }

            n = labelCount;

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

            this.mAxis.mEntryCount = n;

            if (this.mAxis.mEntries.length < n) {
                // Ensure stops contains at least numStops elements.
                this.mAxis.mEntries = new Array(n);
            }

            for (f = first, i = 0; i < n; f += interval, ++i) {
                if (f === 0.0) {
                    // Fix for negative zero case (Where value == -0.0, and 0.0 == -0.0)
                    f = 0.0;
                }

                this.mAxis.mEntries[i] = f;
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

        this.mAxis.mAxisMinimum = this.mAxis.mEntries[0];
        this.mAxis.mAxisMaximum = this.mAxis.mEntries[n - 1];
        this.mAxis.mAxisRange = Math.abs(this.mAxis.mAxisMaximum - this.mAxis.mAxisMinimum);
    }

    public renderAxisLabels(c: Canvas) {
        if (!this.mYAxis.isEnabled() || !this.mYAxis.isDrawLabelsEnabled()) return;

        this.mAxisLabelPaint.setFont(this.mYAxis.getFont());
        this.mAxisLabelPaint.setColor(this.mYAxis.getTextColor());

        const center = this.mChart.getCenterOffsets();
        const pOut: MPPointF = { x: 0, y: 0 };
        const factor = this.mChart.getFactor();

        const from = this.mYAxis.isDrawBottomYLabelEntryEnabled() ? 0 : 1;
        const to = this.mYAxis.isDrawTopYLabelEntryEnabled() ? this.mYAxis.mEntryCount : this.mYAxis.mEntryCount - 1;

        for (let j = from; j < to; j++) {
            const r = (this.mYAxis.mEntries[j] - this.mYAxis.mAxisMinimum) * factor;

            Utils.getPosition(center, r, this.mChart.getRotationAngle(), pOut);

            const label = this.mYAxis.getFormattedLabel(j);

            c.drawText(label, pOut.x + 10, pOut.y, this.mAxisLabelPaint);
        }
        // MPPointF.recycleInstance(center);
        // MPPointF.recycleInstance(pOut);
    }

    private mRenderLimitLinesPathBuffer = new Path();

    public renderLimitLines(c: Canvas) {
        const limitLines = this.mYAxis.getLimitLines();

        if (limitLines == null) return;

        const sliceangle = this.mChart.getSliceAngle();

        // calculate the factor that is needed for transforming the value to
        // pixels
        const factor = this.mChart.getFactor();

        const center = this.mChart.getCenterOffsets();
        const pOut: MPPointF = { x: 0, y: 0 };
        for (let i = 0; i < limitLines.length; i++) {
            const l = limitLines[i];

            if (!l.isEnabled()) continue;

            this.mLimitLinePaint.setColor(l.getLineColor());
            this.mLimitLinePaint.setPathEffect(l.getDashPathEffect());
            this.mLimitLinePaint.setStrokeWidth(l.getLineWidth());

            const r = (l.getLimit() - this.mChart.getYChartMin()) * factor;

            const limitPath = this.mRenderLimitLinesPathBuffer;
            limitPath.reset();

            for (let j = 0; j < this.mChart.getData().getMaxEntryCountSet().getEntryCount(); j++) {
                Utils.getPosition(center, r, sliceangle * j + this.mChart.getRotationAngle(), pOut);

                if (j === 0) limitPath.moveTo(pOut.x, pOut.y);
                else limitPath.lineTo(pOut.x, pOut.y);
            }
            limitPath.close();

            c.drawPath(limitPath, this.mLimitLinePaint);
        }
        // MPPointF.recycleInstance(center);
        // MPPointF.recycleInstance(pOut);
    }
}
