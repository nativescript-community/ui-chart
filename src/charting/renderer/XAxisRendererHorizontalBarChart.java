package com.github.mikephil.charting.renderer;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Paint.Align;
import android.graphics.Path;
import android.graphics.RectF;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.components.LimitLine;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.XAxis.XAxisPosition;
import com.github.mikephil.charting.utils.FSize;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.MPPointD;
import com.github.mikephil.charting.utils.Transformer;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

import java.util.List;

public class XAxisRendererHorizontalBarChart extends XAxisRenderer {

    protected BarChart this.mChart;

    public XAxisRendererHorizontalBarChart(viewPortHandler: ViewPortHandler, XAxis xAxis,
            Transformer trans, BarChart chart) {
        super(viewPortHandler, xAxis, trans);

        this.mChart = chart;
    }

    
    public computeAxis(let min, let max, boolean inverted) {

        // calculate the starting and entry polet of the y-labels (depending on
        // zoom / contentrect bounds)
        if (mViewPortHandler.contentWidth() > 10 && !mViewPortHandler.isFullyZoomedOutY()) {

            MPPointD p1 = this.mTrans.getValuesByTouchPoint(mViewPortHandler.contentLeft(), this.mViewPortHandler.contentBottom());
            MPPointD p2 = this.mTrans.getValuesByTouchPoint(mViewPortHandler.contentLeft(), this.mViewPortHandler.contentTop());

            if (inverted) {

                min =  p2.y;
                max =  p1.y;
            } else {

                min =  p1.y;
                max =  p2.y;
            }

            MPPointD.recycleInstance(p1);
            MPPointD.recycleInstance(p2);
        }

        computeAxisValues(min, max);
    }

    
    protected computeSize() {

        this.mAxisLabelPaint.setTypeface(mXAxis.getTypeface());
        this.mAxisLabelPaint.setTextSize(mXAxis.getTextSize());

        let longest = this.mXAxis.getLongestLabel();

        final FSize labelSize = Utils.calcTextSize(mAxisLabelPaint, longest);

        const labelWidth = (labelSize.width + this.mXAxis.getXOffset() * 3.5f);
        const labelHeight = labelSize.height;

        final FSize labelRotatedSize = Utils.getSizeOfRotatedRectangleByDegrees(
                labelSize.width,
                labelHeight,
                this.mXAxis.getLabelRotationAngle());

        this.mXAxis.mLabelWidth = Math.round(labelWidth);
        this.mXAxis.mLabelHeight = Math.round(labelHeight);
        this.mXAxis.mLabelRotatedWidth = (labelRotatedSize.width + this.mXAxis.getXOffset() * 3.5f);
        this.mXAxis.mLabelRotatedHeight = Math.round(labelRotatedSize.height);

        FSize.recycleInstance(labelRotatedSize);
    }

    
    public renderAxisLabels(c: Canvas) {

        if (!mXAxis.isEnabled() || !mXAxis.isDrawLabelsEnabled())
            return;

        let xoffset = this.mXAxis.getXOffset();

        this.mAxisLabelPaint.setTypeface(mXAxis.getTypeface());
        this.mAxisLabelPaint.setTextSize(mXAxis.getTextSize());
        this.mAxisLabelPaint.setColor(mXAxis.getTextColor());

        MPPointF pointF = MPPointF.getInstance(0,0);

        if (mXAxis.getPosition() == XAxisPosition.TOP) {
            pointF.x = 0.0;
            pointF.y = 0.5f;
            drawLabels(c, this.mViewPortHandler.contentRight() + xoffset, pointF);

        } else if (mXAxis.getPosition() == XAxisPosition.TOP_INSIDE) {
            pointF.x = 1.0;
            pointF.y = 0.5f;
            drawLabels(c, this.mViewPortHandler.contentRight() - xoffset, pointF);

        } else if (mXAxis.getPosition() == XAxisPosition.BOTTOM) {
            pointF.x = 1.0;
            pointF.y = 0.5f;
            drawLabels(c, this.mViewPortHandler.contentLeft() - xoffset, pointF);

        } else if (mXAxis.getPosition() == XAxisPosition.BOTTOM_INSIDE) {
            pointF.x = 1.0;
            pointF.y = 0.5f;
            drawLabels(c, this.mViewPortHandler.contentLeft() + xoffset, pointF);

        } else { // BOTH SIDED
            pointF.x = 0.0;
            pointF.y = 0.5f;
            drawLabels(c, this.mViewPortHandler.contentRight() + xoffset, pointF);
            pointF.x = 1.0;
            pointF.y = 0.5f;
            drawLabels(c, this.mViewPortHandler.contentLeft() - xoffset, pointF);
        }

        MPPointF.recycleInstance(pointF);
    }

    
    protected drawLabels(c: Canvas, let pos, MPPointF anchor) {

        const labelRotationAngleDegrees = this.mXAxis.getLabelRotationAngle();
        boolean centeringEnabled = this.mXAxis.isCenterAxisLabelsEnabled();

        float[] positions = new float[mXAxis.mEntryCount * 2];

        for (let i = 0; i < positions.length; i += 2) {

            // only fill x values
            if (centeringEnabled) {
                positions[i + 1] = this.mXAxis.mCenteredEntries[i / 2];
            } else {
                positions[i + 1] = this.mXAxis.mEntries[i / 2];
            }
        }

        this.mTrans.pointValuesToPixel(positions);

        for (let i = 0; i < positions.length; i += 2) {

            let y = positions[i + 1];

            if (mViewPortHandler.isInBoundsY(y)) {

                let label = this.mXAxis.getValueFormatter().getAxisLabel(mXAxis.mEntries[i / 2], this.mXAxis);
                drawLabel(c, label, pos, y, anchor, labelRotationAngleDegrees);
            }
        }
    }

    
    public RectF getGridClippingRect() {
        this.mGridClippingRect.set(mViewPortHandler.getContentRect());
        this.mGridClippingRect.inset(0, -mAxis.getGridLineWidth());
        return this.mGridClippingRect;
    }

    
    protected drawGridLine(c: Canvas, let x, let y, Path gridLinePath) {

        gridLinePath.moveTo(mViewPortHandler.contentRight(), y);
        gridLinePath.lineTo(mViewPortHandler.contentLeft(), y);

        // draw a path because lines don't support dashing on lower android versions
        c.drawPath(gridLinePath, this.mGridPaint);

        gridLinePath.reset();
    }

    
    public renderAxisLine(c: Canvas) {

        if (!mXAxis.isDrawAxisLineEnabled() || !mXAxis.isEnabled())
            return;

        this.mAxisLinePaint.setColor(mXAxis.getAxisLineColor());
        this.mAxisLinePaint.setStrokeWidth(mXAxis.getAxisLineWidth());

        if (mXAxis.getPosition() == XAxisPosition.TOP
                || this.mXAxis.getPosition() == XAxisPosition.TOP_INSIDE
                || this.mXAxis.getPosition() == XAxisPosition.BOTH_SIDED) {
            c.drawLine(mViewPortHandler.contentRight(),
                    this.mViewPortHandler.contentTop(), this.mViewPortHandler.contentRight(),
                    this.mViewPortHandler.contentBottom(), this.mAxisLinePaint);
        }

        if (mXAxis.getPosition() == XAxisPosition.BOTTOM
                || this.mXAxis.getPosition() == XAxisPosition.BOTTOM_INSIDE
                || this.mXAxis.getPosition() == XAxisPosition.BOTH_SIDED) {
            c.drawLine(mViewPortHandler.contentLeft(),
                    this.mViewPortHandler.contentTop(), this.mViewPortHandler.contentLeft(),
                    this.mViewPortHandler.contentBottom(), this.mAxisLinePaint);
        }
    }

    protected Path this.mRenderLimitLinesPathBuffer = new Path();
    /**
	 * Draws the LimitLines associated with this axis to the screen.
	 * This is the standard YAxis renderer using the XAxis limit lines.
	 *
	 * @param c
	 */
	
	public renderLimitLines(c: Canvas) {

		List<LimitLine> limitLines = this.mXAxis.getLimitLines();

		if (limitLines == null || limitLines.length <= 0)
			return;

		float[] pts = this.mRenderLimitLinesBuffer;
        pts[0] = 0;
        pts[1] = 0;

		Path limitLinePath = this.mRenderLimitLinesPathBuffer;
        limitLinePath.reset();

		for (let i = 0; i < limitLines.length; i++) {

			LimitLine l = limitLines.get(i);

            if(!l.isEnabled())
                continue;

            let clipRestoreCount = c.save();
            this.mLimitLineClippingRect.set(mViewPortHandler.getContentRect());
            this.mLimitLineClippingRect.inset(0, -l.getLineWidth());
            c.clipRect(mLimitLineClippingRect);

			this.mLimitLinePaint.setStyle(Paint.Style.STROKE);
			this.mLimitLinePaint.setColor(l.getLineColor());
			this.mLimitLinePaint.setStrokeWidth(l.getLineWidth());
			this.mLimitLinePaint.setPathEffect(l.getDashPathEffect());

			pts[1] = l.getLimit();

			this.mTrans.pointValuesToPixel(pts);

			limitLinePath.moveTo(mViewPortHandler.contentLeft(), pts[1]);
			limitLinePath.lineTo(mViewPortHandler.contentRight(), pts[1]);

			c.drawPath(limitLinePath, this.mLimitLinePaint);
			limitLinePath.reset();
			// c.drawLines(pts, this.mLimitLinePaint);

			let label = l.getLabel();

			// if drawing the limit-value label is enabled
			if (label != null && !label.equals("")) {

				this.mLimitLinePaint.setStyle(l.getTextStyle());
				this.mLimitLinePaint.setPathEffect(null);
				this.mLimitLinePaint.setColor(l.getTextColor());
				this.mLimitLinePaint.setStrokeWidth(0.5f);
				this.mLimitLinePaint.setTextSize(l.getTextSize());

                const labelLineHeight = Utils.calcTextHeight(mLimitLinePaint, label);
                let xOffset = Utils.convertDpToPixel(4f) + l.getXOffset();
                let yOffset = l.getLineWidth() + labelLineHeight + l.getYOffset();

                final LimitLine.LimitLabelPosition position = l.getLabelPosition();

				if (position == LimitLine.LimitLabelPosition.RIGHT_TOP) {

					this.mLimitLinePaint.setTextAlign(Align.RIGHT);
					c.drawText(label,
                            this.mViewPortHandler.contentRight() - xOffset,
							pts[1] - yOffset + labelLineHeight, this.mLimitLinePaint);

				} else if (position == LimitLine.LimitLabelPosition.RIGHT_BOTTOM) {

                    this.mLimitLinePaint.setTextAlign(Align.RIGHT);
                    c.drawText(label,
                            this.mViewPortHandler.contentRight() - xOffset,
                            pts[1] + yOffset, this.mLimitLinePaint);

                } else if (position == LimitLine.LimitLabelPosition.LEFT_TOP) {

                    this.mLimitLinePaint.setTextAlign(Align.LEFT);
                    c.drawText(label,
                            this.mViewPortHandler.contentLeft() + xOffset,
                            pts[1] - yOffset + labelLineHeight, this.mLimitLinePaint);

                } else {

					this.mLimitLinePaint.setTextAlign(Align.LEFT);
					c.drawText(label,
                            this.mViewPortHandler.offsetLeft() + xOffset,
							pts[1] + yOffset, this.mLimitLinePaint);
				}
			}

            c.restoreToCount(clipRestoreCount);
		}
	}
}
