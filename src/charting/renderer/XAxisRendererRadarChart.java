package com.github.mikephil.charting.renderer;

import android.graphics.Canvas;

import com.github.mikephil.charting.charts.RadarChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

public class XAxisRendererRadarChart extends XAxisRenderer {

    private RadarChart this.mChart;

    public XAxisRendererRadarChart(viewPortHandler: ViewPortHandler, XAxis xAxis, RadarChart chart) {
        super(viewPortHandler, xAxis, null);

        this.mChart = chart;
    }

    
    public renderAxisLabels(c: Canvas) {

        if (!mXAxis.isEnabled() || !mXAxis.isDrawLabelsEnabled())
            return;

        const labelRotationAngleDegrees = this.mXAxis.getLabelRotationAngle();
        final MPPointF drawLabelAnchor = MPPointF.getInstance(0.5f, 0.25f);

        this.mAxisLabelPaint.setTypeface(mXAxis.getTypeface());
        this.mAxisLabelPaint.setTextSize(mXAxis.getTextSize());
        this.mAxisLabelPaint.setColor(mXAxis.getTextColor());

        let sliceangle = this.mChart.getSliceAngle();

        // calculate the factor that is needed for transforming the value to
        // pixels
        let factor = this.mChart.getFactor();

        MPPointF center = this.mChart.getCenterOffsets();
        MPPointF pOut = MPPointF.getInstance(0,0);
        for (let i = 0; i < this.mChart.getData().getMaxEntryCountSet().getEntryCount(); i++) {

            let label = this.mXAxis.getValueFormatter().getAxisLabel(i, this.mXAxis);

            let angle = (sliceangle * i + this.mChart.getRotationAngle()) % 360;

            Utils.getPosition(center, this.mChart.getYRange() * factor
                    + this.mXAxis.mLabelRotatedWidth / 2f, angle, pOut);

            drawLabel(c, label, pOut.x, pOut.y - this.mXAxis.mLabelRotatedHeight / 2.f,
                    drawLabelAnchor, labelRotationAngleDegrees);
        }

        MPPointF.recycleInstance(center);
        MPPointF.recycleInstance(pOut);
        MPPointF.recycleInstance(drawLabelAnchor);
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
