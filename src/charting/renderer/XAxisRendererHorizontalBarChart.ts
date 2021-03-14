import { XAxisRenderer } from './XAxisRenderer';
import { BarChart } from '../charts/BarChart';
import { XAxis, XAxisPosition } from '../components/XAxis';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Transformer } from '../utils/Transformer';
import { Align, Canvas, Paint, Path, RectF, Style } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';
import { MPPointF } from '../utils/MPPointF';
import { LimitLabelPosition, LimitLine } from '../components/LimitLine';
import { profile } from '@nativescript/core';
import { CustomRendererGridLineFunction } from './AxisRenderer';

export class XAxisRendererHorizontalBarChart extends XAxisRenderer {
    protected mChart: BarChart;
    mForceLongestLabelComputation = true;
    protected mRenderLimitLinesPathBuffer: Path;
    protected get renderLimitLinesPathBuffer() {
        if (!this.mRenderLimitLinesPathBuffer) {
            this.mRenderLimitLinesPathBuffer = new Path();
        }
        return this.mRenderLimitLinesPathBuffer;
    }

    constructor(viewPortHandler: ViewPortHandler, xAxis: XAxis, trans: Transformer, chart: BarChart) {
        super(viewPortHandler, xAxis, trans);
        this.mChart = chart;
    }

    public computeAxis(min, max, inverted) {
        // calculate the starting and entry polet of the y-labels (depending on
        // zoom / contentrect bounds)
        if (this.mViewPortHandler.contentWidth() > 10 && !this.mViewPortHandler.isFullyZoomedOutY()) {
            const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
            const p1 = this.mTrans.getValuesByTouchPoint(rect.left, rect.bottom);
            const p2 = this.mTrans.getValuesByTouchPoint(rect.left, rect.top);

            if (inverted) {
                min = p2.y;
                max = p1.y;
            } else {
                min = p1.y;
                max = p2.y;
            }
        }

        this.computeAxisValues(min, max);
    }

    protected computeSize() {
        const axis = this.mXAxis;
        const longest = axis.getLongestLabel();
        const paint = this.axisLabelsPaint;
        paint.setFont(axis.getFont());

        const labelSize = Utils.calcTextSize(paint, longest);

        const labelWidth = labelSize.width + axis.getXOffset() * 3.5;
        const labelHeight = labelSize.height;

        const labelRotatedSize = Utils.getSizeOfRotatedRectangleByDegrees(labelSize.width, labelHeight, axis.getLabelRotationAngle());

        axis.mLabelWidth = Math.round(labelWidth);
        axis.mLabelHeight = Math.round(labelHeight);
        axis.mLabelRotatedWidth = labelRotatedSize.width + axis.getXOffset() * 3.5;
        axis.mLabelRotatedHeight = Math.round(labelRotatedSize.height);
    }

    @profile
    public renderAxisLabels(c: Canvas) {
        const axis = this.mXAxis;
        if (!axis.isEnabled() || !axis.isDrawLabelsEnabled()) {
            return;
        }

        const xOffset = axis.getXOffset();

        const paint = this.axisLabelsPaint;
        paint.setFont(axis.getFont());
        paint.setTextAlign(axis.getLabelTextAlign());
        paint.setColor(axis.getTextColor());

        const pointF = { x: 0, y: 0 };

        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        if (axis.getPosition() === XAxisPosition.TOP) {
            pointF.x = 0.0;
            pointF.y = 0.5;
            this.drawLabels(c, rect.right + xOffset, pointF);
        } else if (axis.getPosition() === XAxisPosition.TOP_INSIDE) {
            pointF.x = 1.0;
            pointF.y = 0.5;
            this.drawLabels(c, rect.right - xOffset, pointF);
        } else if (axis.getPosition() === XAxisPosition.BOTTOM) {
            pointF.x = 1.0;
            pointF.y = 0.5;
            this.drawLabels(c, rect.left - xOffset, pointF);
        } else if (axis.getPosition() === XAxisPosition.BOTTOM_INSIDE) {
            pointF.x = 1.0;
            pointF.y = 0.5;
            this.drawLabels(c, rect.left + xOffset, pointF);
        } else {
            // BOTH SIDED
            pointF.x = 0.0;
            pointF.y = 0.5;
            this.drawLabels(c, rect.right + xOffset, pointF);
            pointF.x = 1.0;
            pointF.y = 0.5;
            this.drawLabels(c, rect.left - xOffset, pointF);
        }
    }

    /**
     * Draws the x-labels on the specified y-position.
     *
     * @param pos
     */
    @profile
    protected drawLabels(c: Canvas, pos, anchor: MPPointF) {
        const axis = this.mXAxis;
        const labelRotationAngleDegrees = axis.getLabelRotationAngle();
        const centeringEnabled = axis.isCenterAxisLabelsEnabled();

        const positions = Utils.createNativeArray(axis.mEntryCount * 2);

        for (let i = 0; i < positions.length; i += 2) {
            // only fill x values
            if (centeringEnabled) {
                positions[i + 1] = axis.mCenteredEntries[i / 2];
            } else {
                positions[i + 1] = axis.mEntries[i / 2];
            }
        }

        this.mTrans.pointValuesToPixel(positions);
        const labels = axis.mLabels;
        const paint = this.axisLabelsPaint;
        for (let i = 0; i < positions.length; i += 2) {
            const y = positions[i + 1];
            const label = labels[i / 2];
            if (!label) {
                continue;
            }
            if (this.mViewPortHandler.isInBoundsY(y)) {
                this.drawLabel(c, label, pos, y, anchor, labelRotationAngleDegrees, paint);
            }
        }
    }

    public getGridClippingRect(): RectF {
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        this.mGridClippingRect.set(rect);
        this.mGridClippingRect.inset(0, -this.mAxis.getGridLineWidth());
        return this.mGridClippingRect;
    }
    protected drawGridLine(c: Canvas, rect: RectF, x, y, axisValue, paint: Paint, customRendererFunc: CustomRendererGridLineFunction) {
        if (customRendererFunc) {
            customRendererFunc(c, this, rect, x, y, axisValue, paint);
        } else {
            c.drawLine(rect.right, y, rect.left, y, paint);
        }
    }

    public renderAxisLine(c: Canvas) {
        const axis = this.mXAxis;
        if (!axis.isDrawAxisLineEnabled() || !axis.isEnabled()) {
            return;
        }
        const paint = this.axisLinePaint;

        paint.setColor(axis.getAxisLineColor());
        paint.setStrokeWidth(axis.getAxisLineWidth());
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();

        if (axis.getPosition() === XAxisPosition.TOP || axis.getPosition() === XAxisPosition.TOP_INSIDE || axis.getPosition() === XAxisPosition.BOTH_SIDED) {
            c.drawLine(rect.right, rect.top, rect.right, rect.bottom, paint);
        }

        if (axis.getPosition() === XAxisPosition.BOTTOM || axis.getPosition() === XAxisPosition.BOTTOM_INSIDE || axis.getPosition() === XAxisPosition.BOTH_SIDED) {
            c.drawLine(rect.left, rect.top, rect.left, rect.bottom, paint);
        }
    }

    /**
     * Draws the LimitLines associated with this axis to the screen.
     * This is the standard YAxis renderer using the XAxis limit lines.
     *
     * @param c
     */

    public renderLimitLines(c: Canvas) {
        const limitLines = this.mXAxis.getLimitLines();

        if (limitLines == null || limitLines.length <= 0) return;

        const pts = this.renderLimitLinesBuffer;
        pts[0] = 0;
        pts[1] = 0;

        const limitLinePath = this.renderLimitLinesPathBuffer;
        limitLinePath.reset();
        let offsetLeft = 0;
        let rect: RectF;
        if (this.mAxis.isIgnoringOffsets()) {
            rect = this.mViewPortHandler.getChartRect();
        } else {
            rect = this.mViewPortHandler.getContentRect();
            offsetLeft = this.mViewPortHandler.offsetLeft();
        }
        for (let i = 0; i < limitLines.length; i++) {
            const l = limitLines[i];

            if (!l.isEnabled()) {
                continue;
            }

            const clipRestoreCount = c.save();
            this.mLimitLineClippingRect.set(rect);
            this.mLimitLineClippingRect.inset(0, -l.getLineWidth());
            c.clipRect(this.mLimitLineClippingRect);

            const paint = this.limitLinePaint;
            paint.setStyle(Style.STROKE);
            paint.setColor(l.getLineColor());
            paint.setStrokeWidth(l.getLineWidth());
            paint.setPathEffect(l.getDashPathEffect());

            pts[1] = l.getLimit();

            this.mTrans.pointValuesToPixel(pts);

            limitLinePath.moveTo(rect.left, pts[1]);
            limitLinePath.lineTo(rect.right, pts[1]);

            c.drawPath(limitLinePath, paint);
            limitLinePath.reset();

            const label = l.getLabel();

            // if drawing the limit-value label is enabled
            if (label != null && label !== '') {
                paint.setStyle(l.getTextStyle());
                paint.setPathEffect(null);
                paint.setColor(l.getTextColor());
                paint.setStrokeWidth(0.5);
                paint.setFont(l.getFont());

                const labelLineHeight = Utils.calcTextHeight(paint, label);
                const xOffset = 4 + l.getXOffset();
                const yOffset = l.getLineWidth() + labelLineHeight + l.getYOffset();

                const position = l.getLabelPosition();

                if (position === LimitLabelPosition.RIGHT_TOP) {
                    paint.setTextAlign(Align.RIGHT);
                    c.drawText(label, rect.right - xOffset, pts[1] - yOffset + labelLineHeight, paint);
                } else if (position === LimitLabelPosition.RIGHT_BOTTOM) {
                    paint.setTextAlign(Align.RIGHT);
                    c.drawText(label, rect.right - xOffset, pts[1] + yOffset, paint);
                } else if (position === LimitLabelPosition.LEFT_TOP) {
                    paint.setTextAlign(Align.LEFT);
                    c.drawText(label, rect.left + xOffset, pts[1] - yOffset + labelLineHeight, paint);
                } else {
                    paint.setTextAlign(Align.LEFT);
                    c.drawText(label, offsetLeft + xOffset, pts[1] + yOffset, paint);
                }
            }

            c.restoreToCount(clipRestoreCount);
        }
    }
}
