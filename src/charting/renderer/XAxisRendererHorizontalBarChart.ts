import { XAxisRenderer } from './XAxisRenderer';
import { BarChart } from '../charts/BarChart';
import { XAxis, XAxisPosition } from '../components/XAxis';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Transformer } from '../utils/Transformer';
import { Align, Canvas, Path, RectF, Style } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';
import { MPPointF } from '../utils/MPPointF';
import { LimitLabelPosition, LimitLine } from '../components/LimitLine';
import { profile } from '@nativescript/core';

export class XAxisRendererHorizontalBarChart extends XAxisRenderer {
    protected mChart: BarChart;

    protected mRenderLimitLinesPathBuffer: Path = new Path();

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
        const longest = this.mXAxis.getLongestLabel();

        this.mAxisLabelPaint.setTypeface(this.mXAxis.getTypeface());
        this.mAxisLabelPaint.setTextSize(this.mXAxis.getTextSize());

        const labelSize = Utils.calcTextSize(this.mAxisLabelPaint, longest);

        const labelWidth = labelSize.width + this.mXAxis.getXOffset() * 3.5;
        const labelHeight = labelSize.height;

        const labelRotatedSize = Utils.getSizeOfRotatedRectangleByDegrees(labelSize.width, labelHeight, this.mXAxis.getLabelRotationAngle());

        this.mXAxis.mLabelWidth = Math.round(labelWidth);
        this.mXAxis.mLabelHeight = Math.round(labelHeight);
        this.mXAxis.mLabelRotatedWidth = labelRotatedSize.width + this.mXAxis.getXOffset() * 3.5;
        this.mXAxis.mLabelRotatedHeight = Math.round(labelRotatedSize.height);
    }

    @profile
    public renderAxisLabels(c: Canvas) {
        if (!this.mXAxis.isEnabled() || !this.mXAxis.isDrawLabelsEnabled()) {
            return;
        }

        const xOffset = this.mXAxis.getXOffset();

        this.mAxisLabelPaint.setTypeface(this.mXAxis.getTypeface());
        this.mAxisLabelPaint.setTextSize(this.mXAxis.getTextSize());
        this.mAxisLabelPaint.setTextAlign(this.mXAxis.getLabelTextAlign());
        this.mAxisLabelPaint.setColor(this.mXAxis.getTextColor());

        const pointF = { x: 0, y: 0 };

        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        if (this.mXAxis.getPosition() === XAxisPosition.TOP) {
            pointF.x = 0.0;
            pointF.y = 0.5;
            this.drawLabels(c, rect.right + xOffset, pointF);
        } else if (this.mXAxis.getPosition() === XAxisPosition.TOP_INSIDE) {
            pointF.x = 1.0;
            pointF.y = 0.5;
            this.drawLabels(c, rect.right - xOffset, pointF);
        } else if (this.mXAxis.getPosition() === XAxisPosition.BOTTOM) {
            pointF.x = 1.0;
            pointF.y = 0.5;
            this.drawLabels(c, rect.left - xOffset, pointF);
        } else if (this.mXAxis.getPosition() === XAxisPosition.BOTTOM_INSIDE) {
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
        const labelRotationAngleDegrees = this.mXAxis.getLabelRotationAngle();
        const centeringEnabled = this.mXAxis.isCenterAxisLabelsEnabled();

        const positions = Utils.createNativeArray(this.mXAxis.mEntryCount * 2);

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
            const y = positions[i + 1];
            if (this.mViewPortHandler.isInBoundsY(y)) {
                const label = this.mXAxis.getValueFormatter().getAxisLabel(this.mXAxis.mEntries[i / 2], this.mXAxis);
                this.drawLabel(c, label, pos, y, anchor, labelRotationAngleDegrees);
            }
        }
    }

    public getGridClippingRect(): RectF {
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        this.mGridClippingRect.set(rect);
        this.mGridClippingRect.inset(0, -this.mAxis.getGridLineWidth());
        return this.mGridClippingRect;
    }

    protected drawGridLine(c: Canvas, x: number, y: number, gridLinePath: Path) {
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        gridLinePath.moveTo(rect.right, y);
        gridLinePath.lineTo(rect.left, y);

        // draw a path because lines don't support dashing on lower android versions
        c.drawPath(gridLinePath, this.mGridPaint);

        gridLinePath.reset();
    }

    public renderAxisLine(c: Canvas) {
        if (!this.mXAxis.isDrawAxisLineEnabled() || !this.mXAxis.isEnabled()) {
            return;
        }

        this.mAxisLinePaint.setColor(this.mXAxis.getAxisLineColor());
        this.mAxisLinePaint.setStrokeWidth(this.mXAxis.getAxisLineWidth());
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();

        if (this.mXAxis.getPosition() === XAxisPosition.TOP || this.mXAxis.getPosition() === XAxisPosition.TOP_INSIDE || this.mXAxis.getPosition() === XAxisPosition.BOTH_SIDED) {
            c.drawLine(rect.right, rect.top, rect.right, rect.bottom, this.mAxisLinePaint);
        }

        if (this.mXAxis.getPosition() === XAxisPosition.BOTTOM || this.mXAxis.getPosition() === XAxisPosition.BOTTOM_INSIDE || this.mXAxis.getPosition() === XAxisPosition.BOTH_SIDED) {
            c.drawLine(rect.left, rect.top, rect.left, rect.bottom, this.mAxisLinePaint);
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

        const pts = this.mRenderLimitLinesBuffer;
        pts[0] = 0;
        pts[1] = 0;

        const limitLinePath = this.mRenderLimitLinesPathBuffer;
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

            this.mLimitLinePaint.setStyle(Style.STROKE);
            this.mLimitLinePaint.setColor(l.getLineColor());
            this.mLimitLinePaint.setStrokeWidth(l.getLineWidth());
            this.mLimitLinePaint.setPathEffect(l.getDashPathEffect());

            pts[1] = l.getLimit();

            this.mTrans.pointValuesToPixel(pts);

            limitLinePath.moveTo(rect.left, pts[1]);
            limitLinePath.lineTo(rect.right, pts[1]);

            c.drawPath(limitLinePath, this.mLimitLinePaint);
            limitLinePath.reset();

            const label = l.getLabel();

            // if drawing the limit-value label is enabled
            if (label != null && label !== '') {
                this.mLimitLinePaint.setStyle(l.getTextStyle());
                this.mLimitLinePaint.setPathEffect(null);
                this.mLimitLinePaint.setColor(l.getTextColor());
                this.mLimitLinePaint.setStrokeWidth(0.5);
                this.mLimitLinePaint.setTextSize(l.getTextSize());

                const labelLineHeight = Utils.calcTextHeight(this.mLimitLinePaint, label);
                const xOffset = 4 + l.getXOffset();
                const yOffset = l.getLineWidth() + labelLineHeight + l.getYOffset();

                const position = l.getLabelPosition();

                if (position === LimitLabelPosition.RIGHT_TOP) {
                    this.mLimitLinePaint.setTextAlign(Align.RIGHT);
                    c.drawText(label, rect.right - xOffset, pts[1] - yOffset + labelLineHeight, this.mLimitLinePaint);
                } else if (position === LimitLabelPosition.RIGHT_BOTTOM) {
                    this.mLimitLinePaint.setTextAlign(Align.RIGHT);
                    c.drawText(label, rect.right - xOffset, pts[1] + yOffset, this.mLimitLinePaint);
                } else if (position === LimitLabelPosition.LEFT_TOP) {
                    this.mLimitLinePaint.setTextAlign(Align.LEFT);
                    c.drawText(label, rect.left + xOffset, pts[1] - yOffset + labelLineHeight, this.mLimitLinePaint);
                } else {
                    this.mLimitLinePaint.setTextAlign(Align.LEFT);
                    c.drawText(label, offsetLeft + xOffset, pts[1] + yOffset, this.mLimitLinePaint);
                }
            }

            c.restoreToCount(clipRestoreCount);
        }
    }
}
