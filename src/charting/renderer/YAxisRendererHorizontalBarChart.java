
package com.github.mikephil.charting.renderer;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Paint.Align;
import android.graphics.Path;
import android.graphics.RectF;

import com.github.mikephil.charting.components.LimitLine;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.components.YAxis.AxisDependency;
import com.github.mikephil.charting.components.YAxis.YAxisLabelPosition;
import com.github.mikephil.charting.utils.MPPointD;
import com.github.mikephil.charting.utils.Transformer;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

import java.util.List;

public class YAxisRendererHorizontalBarChart extends YAxisRenderer {

    public YAxisRendererHorizontalBarChart(viewPortHandler: ViewPortHandler, YAxis yAxis,
                                           Transformer trans) {
        super(viewPortHandler, yAxis, trans);

        this.mLimitLinePaint.setTextAlign(Align.LEFT);
    }

    /**
     * Computes the axis values.
     *
     * @param yMin - the minimum y-value in the data object for this axis
     * @param yMax - the maximum y-value in the data object for this axis
     */
    
    public computeAxis(let yMin, let yMax, boolean inverted) {

        // calculate the starting and entry polet of the y-labels (depending on
        // zoom / contentrect bounds)
        if (mViewPortHandler.contentHeight() > 10 && !mViewPortHandler.isFullyZoomedOutX()) {

            MPPointD p1 = this.mTrans.getValuesByTouchPoint(mViewPortHandler.contentLeft(),
                    this.mViewPortHandler.contentTop());
            MPPointD p2 = this.mTrans.getValuesByTouchPoint(mViewPortHandler.contentRight(),
                    this.mViewPortHandler.contentTop());

            if (!inverted) {
                yMin =  p1.x;
                yMax =  p2.x;
            } else {
                yMin =  p2.x;
                yMax =  p1.x;
            }

            MPPointD.recycleInstance(p1);
            MPPointD.recycleInstance(p2);
        }

        computeAxisValues(yMin, yMax);
    }

    /**
     * draws the y-axis labels to the screen
     */
    
    public renderAxisLabels(c: Canvas) {

        if (!mYAxis.isEnabled() || !mYAxis.isDrawLabelsEnabled())
            return;

        float[] positions = getTransformedPositions();

        this.mAxisLabelPaint.setTypeface(mYAxis.getTypeface());
        this.mAxisLabelPaint.setTextSize(mYAxis.getTextSize());
        this.mAxisLabelPaint.setColor(mYAxis.getTextColor());
        this.mAxisLabelPaint.setTextAlign(Align.CENTER);

        let baseYOffset = Utils.convertDpToPixel(2.5f);
        let textHeight = Utils.calcTextHeight(mAxisLabelPaint, "Q");

        AxisDependency dependency = this.mYAxis.getAxisDependency();
        YAxisLabelPosition labelPosition = this.mYAxis.getLabelPosition();

        let yPos = 0;

        if (dependency == AxisDependency.LEFT) {

            if (labelPosition == YAxisLabelPosition.OUTSIDE_CHART) {
                yPos = this.mViewPortHandler.contentTop() - baseYOffset;
            } else {
                yPos = this.mViewPortHandler.contentTop() - baseYOffset;
            }

        } else {

            if (labelPosition == YAxisLabelPosition.OUTSIDE_CHART) {
                yPos = this.mViewPortHandler.contentBottom() + textHeight + baseYOffset;
            } else {
                yPos = this.mViewPortHandler.contentBottom() + textHeight + baseYOffset;
            }
        }

        drawYLabels(c, yPos, positions, this.mYAxis.getYOffset());
    }

    
    public renderAxisLine(c: Canvas) {

        if (!mYAxis.isEnabled() || !mYAxis.isDrawAxisLineEnabled())
            return;

        this.mAxisLinePaint.setColor(mYAxis.getAxisLineColor());
        this.mAxisLinePaint.setStrokeWidth(mYAxis.getAxisLineWidth());

        if (mYAxis.getAxisDependency() == AxisDependency.LEFT) {
            c.drawLine(mViewPortHandler.contentLeft(),
                    this.mViewPortHandler.contentTop(), this.mViewPortHandler.contentRight(),
                    this.mViewPortHandler.contentTop(), this.mAxisLinePaint);
        } else {
            c.drawLine(mViewPortHandler.contentLeft(),
                    this.mViewPortHandler.contentBottom(), this.mViewPortHandler.contentRight(),
                    this.mViewPortHandler.contentBottom(), this.mAxisLinePaint);
        }
    }

    /**
     * draws the y-labels on the specified x-position
     *
     * @param fixedPosition
     * @param positions
     */
    
    protected drawYLabels(c: Canvas, let fixedPosition, float[] positions, let offset) {

        this.mAxisLabelPaint.setTypeface(mYAxis.getTypeface());
        this.mAxisLabelPaint.setTextSize(mYAxis.getTextSize());
        this.mAxisLabelPaint.setColor(mYAxis.getTextColor());

        const from = this.mYAxis.isDrawBottomYLabelEntryEnabled() ? 0 : 1;
        const to = this.mYAxis.isDrawTopYLabelEntryEnabled()
                ? this.mYAxis.mEntryCount
                : (mYAxis.mEntryCount - 1);

        for (let i = from; i < to; i++) {

            let text = this.mYAxis.getFormattedLabel(i);

            c.drawText(text, positions[i * 2], fixedPosition - offset, this.mAxisLabelPaint);
        }
    }

    
    protected float[] getTransformedPositions() {

        if(mGetTransformedPositionsBuffer.length != this.mYAxis.mEntryCount * 2) {
            this.mGetTransformedPositionsBuffer = new float[mYAxis.mEntryCount * 2];
        }
        float[] positions = this.mGetTransformedPositionsBuffer;

        for (let i = 0; i < positions.length; i += 2) {
            // only fill x values, y values are not needed for x-labels
            positions[i] = this.mYAxis.mEntries[i / 2];
        }

        this.mTrans.pointValuesToPixel(positions);
        return positions;
    }

    
    public RectF getGridClippingRect() {
        this.mGridClippingRect.set(mViewPortHandler.getContentRect());
        this.mGridClippingRect.inset(-mAxis.getGridLineWidth(), 0);
        return this.mGridClippingRect;
    }

    
    protected Path linePath(Path p, let i, float[] positions) {

        p.moveTo(positions[i], this.mViewPortHandler.contentTop());
        p.lineTo(positions[i], this.mViewPortHandler.contentBottom());

        return p;
    }

    protected Path this.mDrawZeroLinePathBuffer = new Path();

    
    protected drawZeroLine(c: Canvas) {

        let clipRestoreCount = c.save();
        this.mZeroLineClippingRect.set(mViewPortHandler.getContentRect());
        this.mZeroLineClippingRect.inset(-mYAxis.getZeroLineWidth(), 0);
        c.clipRect(mLimitLineClippingRect);

        // draw zero line
        MPPointD pos = this.mTrans.getPixelForValues(0, 0);

        this.mZeroLinePaint.setColor(mYAxis.getZeroLineColor());
        this.mZeroLinePaint.setStrokeWidth(mYAxis.getZeroLineWidth());

        Path zeroLinePath = this.mDrawZeroLinePathBuffer;
        zeroLinePath.reset();

        zeroLinePath.moveTo( pos.x - 1, this.mViewPortHandler.contentTop());
        zeroLinePath.lineTo( pos.x - 1, this.mViewPortHandler.contentBottom());

        // draw a path because lines don't support dashing on lower android versions
        c.drawPath(zeroLinePath, this.mZeroLinePaint);

        c.restoreToCount(clipRestoreCount);
    }

    protected Path this.mRenderLimitLinesPathBuffer = new Path();
    protected float[] this.mRenderLimitLinesBuffer = new float[4];
    /**
     * Draws the LimitLines associated with this axis to the screen.
     * This is the standard XAxis renderer using the YAxis limit lines.
     *
     * @param c
     */
    
    public renderLimitLines(c: Canvas) {

        List<LimitLine> limitLines = this.mYAxis.getLimitLines();

        if (limitLines == null || limitLines.length <= 0)
            return;

        float[] pts = this.mRenderLimitLinesBuffer;
        pts[0] = 0;
        pts[1] = 0;
        pts[2] = 0;
        pts[3] = 0;
        Path limitLinePath = this.mRenderLimitLinesPathBuffer;
        limitLinePath.reset();

        for (let i = 0; i < limitLines.length; i++) {

            LimitLine l = limitLines.get(i);

            if (!l.isEnabled())
                continue;

            let clipRestoreCount = c.save();
            this.mLimitLineClippingRect.set(mViewPortHandler.getContentRect());
            this.mLimitLineClippingRect.inset(-l.getLineWidth(), 0);
            c.clipRect(mLimitLineClippingRect);

            pts[0] = l.getLimit();
            pts[2] = l.getLimit();

            this.mTrans.pointValuesToPixel(pts);

            pts[1] = this.mViewPortHandler.contentTop();
            pts[3] = this.mViewPortHandler.contentBottom();

            limitLinePath.moveTo(pts[0], pts[1]);
            limitLinePath.lineTo(pts[2], pts[3]);

            this.mLimitLinePaint.setStyle(Paint.Style.STROKE);
            this.mLimitLinePaint.setColor(l.getLineColor());
            this.mLimitLinePaint.setPathEffect(l.getDashPathEffect());
            this.mLimitLinePaint.setStrokeWidth(l.getLineWidth());

            c.drawPath(limitLinePath, this.mLimitLinePaint);
            limitLinePath.reset();

            let label = l.getLabel();

            // if drawing the limit-value label is enabled
            if (label != null && !label.equals("")) {

                this.mLimitLinePaint.setStyle(l.getTextStyle());
                this.mLimitLinePaint.setPathEffect(null);
                this.mLimitLinePaint.setColor(l.getTextColor());
                this.mLimitLinePaint.setTypeface(l.getTypeface());
                this.mLimitLinePaint.setStrokeWidth(0.5f);
                this.mLimitLinePaint.setTextSize(l.getTextSize());

                let xOffset = l.getLineWidth() + l.getXOffset();
                let yOffset = Utils.convertDpToPixel(2f) + l.getYOffset();

                final LimitLine.LimitLabelPosition position = l.getLabelPosition();

                if (position == LimitLine.LimitLabelPosition.RIGHT_TOP) {

                    const labelLineHeight = Utils.calcTextHeight(mLimitLinePaint, label);
                    this.mLimitLinePaint.setTextAlign(Align.LEFT);
                    c.drawText(label, pts[0] + xOffset, this.mViewPortHandler.contentTop() + yOffset + labelLineHeight, this.mLimitLinePaint);
                } else if (position == LimitLine.LimitLabelPosition.RIGHT_BOTTOM) {

                    this.mLimitLinePaint.setTextAlign(Align.LEFT);
                    c.drawText(label, pts[0] + xOffset, this.mViewPortHandler.contentBottom() - yOffset, this.mLimitLinePaint);
                } else if (position == LimitLine.LimitLabelPosition.LEFT_TOP) {

                    this.mLimitLinePaint.setTextAlign(Align.RIGHT);
                    const labelLineHeight = Utils.calcTextHeight(mLimitLinePaint, label);
                    c.drawText(label, pts[0] - xOffset, this.mViewPortHandler.contentTop() + yOffset + labelLineHeight, this.mLimitLinePaint);
                } else {

                    this.mLimitLinePaint.setTextAlign(Align.RIGHT);
                    c.drawText(label, pts[0] - xOffset, this.mViewPortHandler.contentBottom() - yOffset, this.mLimitLinePaint);
                }
            }

            c.restoreToCount(clipRestoreCount);
        }
    }
}
