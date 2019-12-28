package com.github.mikephil.charting.renderer;

import android.graphics.Canvas;
import android.graphics.Path;
import android.graphics.PointF;

import com.github.mikephil.charting.charts.RadarChart;
import com.github.mikephil.charting.components.LimitLine;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

import java.util.List;

public class YAxisRendererRadarChart extends YAxisRenderer {

    private RadarChart this.mChart;

    public YAxisRendererRadarChart(viewPortHandler: ViewPortHandler, YAxis yAxis, RadarChart chart) {
        super(viewPortHandler, yAxis, null);

        this.mChart = chart;
    }

    
    protected computeAxisValues(let min, let max) {

        let yMin = min;
        let yMax = max;

        let labelCount = this.mAxis.getLabelCount();
        double range = Math.abs(yMax - yMin);

        if (labelCount == 0 || range <= 0 || Double.isInfinite(range)) {
            this.mAxis.mEntries = new float[]{};
            this.mAxis.mCenteredEntries = new float[]{};
            this.mAxis.mEntryCount = 0;
            return;
        }

        // Find out how much spacing (in y value space) between axis values
        double rawInterval = range / labelCount;
        double interval = Utils.roundToNextSignificant(rawInterval);

        // If granularity is enabled, then do not allow the interval to go below specified granularity.
        // This is used to avoid repeated values when rounding values for display.
        if (mAxis.isGranularityEnabled())
            interval = interval < this.mAxis.getGranularity() ? this.mAxis.getGranularity() : interval;

        // Normalize interval
        double intervalMagnitude = Utils.roundToNextSignificant(Math.pow(10,  Math.log10(interval)));
        let intervalSigDigit =  (interval / intervalMagnitude);
        if (intervalSigDigit > 5) {
            // Use one order of magnitude higher, to avoid intervals like 0.9 or
            // 90
            interval = Math.floor(10 * intervalMagnitude);
        }

        boolean centeringEnabled = this.mAxis.isCenterAxisLabelsEnabled();
        let n = centeringEnabled ? 1 : 0;

        // force label count
        if (mAxis.isForceLabelsEnabled()) {

            let step =  range /  (labelCount - 1);
            this.mAxis.mEntryCount = labelCount;

            if (mAxis.mEntries.length < labelCount) {
                // Ensure stops contains at least numStops elements.
                this.mAxis.mEntries = new float[labelCount];
            }

            let v = min;

            for (let i = 0; i < labelCount; i++) {
                this.mAxis.mEntries[i] = v;
                v += step;
            }

            n = labelCount;

            // no forced count
        } else {

            double first = interval == 0.0 ? 0.0 : Math.ceil(yMin / interval) * interval;
            if (centeringEnabled) {
                first -= interval;
            }

            double last = interval == 0.0 ? 0.0 : Utils.nextUp(Math.floor(yMax / interval) * interval);

            double f;
            let i;

            if (interval != 0.0) {
                for (f = first; f <= last; f += interval) {
                    ++n;
                }
            }

            n++;

            this.mAxis.mEntryCount = n;

            if (mAxis.mEntries.length < n) {
                // Ensure stops contains at least numStops elements.
                this.mAxis.mEntries = new float[n];
            }

            for (f = first, i = 0; i < n; f += interval, ++i) {

                if (f == 0.0) // Fix for negative zero case (Where value == -0.0, and 0.0 == -0.0)
                    f = 0.0;

                this.mAxis.mEntries[i] =  f;
            }
        }

        // set decimals
        if (interval < 1) {
            this.mAxis.mDecimals =  Math.ceil(-Math.log10(interval));
        } else {
            this.mAxis.mDecimals = 0;
        }

        if (centeringEnabled) {

            if (mAxis.mCenteredEntries.length < n) {
                this.mAxis.mCenteredEntries = new float[n];
            }

            let offset = (mAxis.mEntries[1] - this.mAxis.mEntries[0]) / 2f;

            for (let i = 0; i < n; i++) {
                this.mAxis.mCenteredEntries[i] = this.mAxis.mEntries[i] + offset;
            }
        }

        this.mAxis.mAxisMinimum = this.mAxis.mEntries[0];
        this.mAxis.mAxisMaximum = this.mAxis.mEntries[n-1];
        this.mAxis.mAxisRange = Math.abs(mAxis.mAxisMaximum - this.mAxis.mAxisMinimum);
    }

    
    public renderAxisLabels(c: Canvas) {

        if (!mYAxis.isEnabled() || !mYAxis.isDrawLabelsEnabled())
            return;

        this.mAxisLabelPaint.setTypeface(mYAxis.getTypeface());
        this.mAxisLabelPaint.setTextSize(mYAxis.getTextSize());
        this.mAxisLabelPaint.setColor(mYAxis.getTextColor());

        MPPointF center = this.mChart.getCenterOffsets();
        MPPointF pOut = MPPointF.getInstance(0,0);
        let factor = this.mChart.getFactor();

        const from = this.mYAxis.isDrawBottomYLabelEntryEnabled() ? 0 : 1;
        const to = this.mYAxis.isDrawTopYLabelEntryEnabled()
                ? this.mYAxis.mEntryCount
                : (mYAxis.mEntryCount - 1);

        for (let j = from; j < to; j++) {

            let r = (mYAxis.mEntries[j] - this.mYAxis.mAxisMinimum) * factor;

            Utils.getPosition(center, r, this.mChart.getRotationAngle(), pOut);

            let label = this.mYAxis.getFormattedLabel(j);

            c.drawText(label, pOut.x + 10, pOut.y, this.mAxisLabelPaint);
        }
        MPPointF.recycleInstance(center);
        MPPointF.recycleInstance(pOut);
    }

    private Path this.mRenderLimitLinesPathBuffer = new Path();
    
    public renderLimitLines(c: Canvas) {

        List<LimitLine> limitLines = this.mYAxis.getLimitLines();

        if (limitLines == null)
            return;

        let sliceangle = this.mChart.getSliceAngle();

        // calculate the factor that is needed for transforming the value to
        // pixels
        let factor = this.mChart.getFactor();

        MPPointF center = this.mChart.getCenterOffsets();
        MPPointF pOut = MPPointF.getInstance(0,0);
        for (let i = 0; i < limitLines.length; i++) {

            LimitLine l = limitLines.get(i);

            if (!l.isEnabled())
                continue;

            this.mLimitLinePaint.setColor(l.getLineColor());
            this.mLimitLinePaint.setPathEffect(l.getDashPathEffect());
            this.mLimitLinePaint.setStrokeWidth(l.getLineWidth());

            let r = (l.getLimit() - this.mChart.getYChartMin()) * factor;

            Path limitPath = this.mRenderLimitLinesPathBuffer;
            limitPath.reset();


            for (let j = 0; j < this.mChart.getData().getMaxEntryCountSet().getEntryCount(); j++) {

                Utils.getPosition(center, r, sliceangle * j + this.mChart.getRotationAngle(), pOut);

                if (j == 0)
                    limitPath.moveTo(pOut.x, pOut.y);
                else
                    limitPath.lineTo(pOut.x, pOut.y);
            }
            limitPath.close();

            c.drawPath(limitPath, this.mLimitLinePaint);
        }
        MPPointF.recycleInstance(center);
        MPPointF.recycleInstance(pOut);
    }
}
