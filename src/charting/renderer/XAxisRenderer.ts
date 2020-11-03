import { AxisRenderer } from './AxisRenderer';
import { XAxis, XAxisPosition } from '../components/XAxis';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Transformer } from '../utils/Transformer';
import { Align, Canvas, Path, RectF, Style } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';
import { MPPointF } from '../utils/MPPointF';
import { LimitLabelPosition, LimitLine } from '../components/LimitLine';
import { profile } from '@nativescript/core';

export class XAxisRenderer extends AxisRenderer {
    protected mXAxis: XAxis;
    protected mForceLongestLabelComputation = true;

    constructor(viewPortHandler: ViewPortHandler, xAxis: XAxis, trans: Transformer) {
        super(viewPortHandler, trans, xAxis);

        this.mXAxis = xAxis;

        this.mAxisLabelPaint.setColor('black');
        this.mAxisLabelPaint.setAntiAlias(true);
        this.mAxisLabelPaint.setTextAlign(Align.CENTER);
    }

    protected setupGridPaint() {
        this.mGridPaint.setColor(this.mXAxis.getGridColor());
        this.mGridPaint.setStrokeWidth(this.mXAxis.getGridLineWidth());
        this.mGridPaint.setPathEffect(this.mXAxis.getGridDashPathEffect());
    }

    public computeAxis(min, max, inverted) {
        // calculate the starting and entry polet of the y-labels (depending on
        // zoom / contentrect bounds)
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        if (rect.width() > 10 && !this.mViewPortHandler.isFullyZoomedOutX()) {
            const p1 = this.mTrans.getValuesByTouchPoint(rect.left, rect.top);
            const p2 = this.mTrans.getValuesByTouchPoint(rect.right, rect.top);

            if (inverted) {
                min = p2.x;
                max = p1.x;
            } else {
                min = p1.x;
                max = p2.x;
            }
        }

        this.computeAxisValues(min, max);
    }

    protected computeAxisValues(min, max) {
        super.computeAxisValues(min, max);

        this.computeSize();
    }
    protected computeSize() {
        const axis = this.mXAxis;
        this.mAxisLabelPaint.setFont(axis.getFont());
        const rotation = axis.getLabelRotationAngle();
        if (this.mForceLongestLabelComputation || rotation % 360 !== 0) {
            const longest = axis.getLongestLabel();
            const labelSize = Utils.calcTextSize(this.mAxisLabelPaint, longest);
            const labelWidth = labelSize.width;
            const labelHeight = Utils.calcTextHeight(this.mAxisLabelPaint, 'Q') + 2;
            const labelRotatedSize = Utils.getSizeOfRotatedRectangleByDegrees(labelWidth, labelHeight, axis.getLabelRotationAngle());

            axis.mLabelWidth = Math.round(labelWidth);
            axis.mLabelHeight = Math.round(labelHeight);
            axis.mLabelRotatedWidth = Math.round(labelRotatedSize.width);
            axis.mLabelRotatedHeight = Math.round(labelRotatedSize.height);
        } else {
            axis.mLabelWidth = 1;
            axis.mLabelHeight = 1;
            axis.mLabelRotatedWidth = 1;
            axis.mLabelRotatedHeight = 1;
        }
    }

    @profile
    public renderAxisLabels(c: Canvas) {
        const axis = this.mXAxis;
        if (!axis.isEnabled() || !axis.isDrawLabelsEnabled()) return;

        const yoffset = axis.getYOffset();
        const paint = this.mAxisLabelPaint;
        paint.setFont(axis.getFont());
        paint.setTextAlign(axis.getLabelTextAlign());
        paint.setColor(axis.getTextColor());
        // const align = this.mAxisLabelPaint.getTextAlign();
        // this.mAxisLabelPaint.setTextAlign(Align.CENTER);

        // TODO: fix this the right way.
        // for now Utils.drawXAxisValue needs the font ascent
        // but it is not calculated all the time (in the lightest of cases)
        // we call this next line to ensure it is
        const labelLineHeight = Utils.getLineHeight(paint);
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        const pointF = { x: 0, y: 0 };
        if (axis.getPosition() === XAxisPosition.TOP) {
            pointF.x = 0.5;
            pointF.y = 1.0;
            this.drawLabels(c, rect.top - yoffset, pointF);
            this.drawMarkTicket(c, rect.top, -yoffset / 2);
        } else if (axis.getPosition() === XAxisPosition.TOP_INSIDE) {
            pointF.x = 0.5;
            pointF.y = 1.0;
            this.drawLabels(c, rect.top + yoffset + axis.mLabelRotatedHeight, pointF);
            this.drawMarkTicket(c, rect.top, -yoffset / 2);
        } else if (axis.getPosition() === XAxisPosition.BOTTOM) {
            pointF.x = 0.5;
            pointF.y = 0.0;
            this.drawLabels(c, rect.bottom + yoffset, pointF);
            this.drawMarkTicket(c, rect.bottom, +yoffset / 2);
        } else if (axis.getPosition() === XAxisPosition.BOTTOM_INSIDE) {
            pointF.x = 0.5;
            pointF.y = 0.0;
            this.drawLabels(c, rect.bottom - yoffset - axis.mLabelRotatedHeight, pointF);
            this.drawMarkTicket(c, rect.bottom, +yoffset / 2);
        } else {
            // BOTH SIDED
            pointF.x = 0.5;
            pointF.y = 1.0;
            this.drawLabels(c, rect.top - yoffset, pointF);
            this.drawMarkTicket(c, rect.top, -yoffset / 2);
            pointF.x = 0.5;
            pointF.y = 0.0;
            this.drawLabels(c, rect.bottom + yoffset, pointF);
            this.drawMarkTicket(c, rect.bottom, +yoffset / 2);
        }
        // this.mAxisLabelPaint.setTextAlign(align);
        // MPPointF.recycleInstance(pointF);
    }

    public renderAxisLine(c: Canvas) {
        const axis = this.mXAxis;
        if (!axis.isDrawAxisLineEnabled() || !axis.isEnabled() || axis.getAxisLineWidth() === 0 || axis.mEntryCount === 0) return;

        this.mAxisLinePaint.setColor(axis.getAxisLineColor());
        this.mAxisLinePaint.setStrokeWidth(axis.getAxisLineWidth());
        this.mAxisLinePaint.setPathEffect(axis.getAxisLineDashPathEffect());
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();

        if (axis.getPosition() === XAxisPosition.TOP || axis.getPosition() === XAxisPosition.TOP_INSIDE || axis.getPosition() === XAxisPosition.BOTH_SIDED) {
            c.drawLine(rect.left, rect.top, rect.right, rect.top, this.mAxisLinePaint);
        }

        if (axis.getPosition() === XAxisPosition.BOTTOM || axis.getPosition() === XAxisPosition.BOTTOM_INSIDE || axis.getPosition() === XAxisPosition.BOTH_SIDED) {
            c.drawLine(rect.left, rect.bottom, rect.right, rect.bottom, this.mAxisLinePaint);
        }
    }

    /**
     * draws the x-labels on the specified y-position
     *
     * @param pos
     */
    @profile
    protected drawLabels(c: Canvas, pos, anchor: MPPointF) {
        const axis = this.mXAxis;
        const labelRotationAngleDegrees = axis.getLabelRotationAngle();
        const centeringEnabled = axis.isCenterAxisLabelsEnabled();
        const length = axis.mEntryCount * 2;
        const positions = Utils.createNativeArray(length);

        for (let i = 0; i < length; i += 2) {
            // only fill x values
            if (centeringEnabled) {
                positions[i] = axis.mCenteredEntries[i / 2];
            } else {
                positions[i] = axis.mEntries[i / 2];
            }
            if (i + 1 < length) {
                positions[i + 1] = 0;
            }
        }
        this.mTrans.pointValuesToPixel(positions);
        const chartWidth = this.mViewPortHandler.getChartWidth();
        let offsetRight = 0;
        if (this.mAxis.isIgnoringOffsets()) {
        } else {
            offsetRight = this.mViewPortHandler.offsetRight();
        }
        for (let i = 0; i < positions.length; i += 2) {
            let x = positions[i];

            if (this.mViewPortHandler.isInBoundsX(x)) {
                const label = axis.getValueFormatter().getAxisLabel(axis.mEntries[i / 2], axis);
                if (axis.isAvoidFirstLastClippingEnabled()) {
                    // avoid clipping of the last
                    if (i / 2 === axis.mEntryCount - 1 && axis.mEntryCount > 1) {
                        const width = Utils.calcTextWidth(this.mAxisLabelPaint, label);

                        if (width > offsetRight * 2 && x + width > chartWidth) {
                            x -= width / 2;
                        }

                        // avoid clipping of the first
                    } else if (i === 0) {
                        const width = Utils.calcTextWidth(this.mAxisLabelPaint, label);
                        x += width / 2;
                    }
                }
                this.drawLabel(c, label, x, pos, anchor, labelRotationAngleDegrees);
            }
        }
    }

    protected drawLabel(c: Canvas, formattedLabel, x, y, anchor: MPPointF, angleDegrees) {
        Utils.drawXAxisValue(c, formattedLabel, x, y, this.mAxisLabelPaint, anchor, angleDegrees);
    }

    /**
     * Draw the mark tickets on the specified y-position
     * @param c
     * @param pos
     * @param length
     */
    protected drawMarkTicket(c: Canvas, pos, ticklength) {
        if (!this.mXAxis.isDrawMarkTicksEnabled()) return;

        const length = this.mAxis.mEntryCount * 2;
        if (this.mRenderGridLinesBuffer.length !== length) {
            this.mRenderGridLinesBuffer = Utils.createNativeArray(length);
        }
        const positions = this.mRenderGridLinesBuffer;
        for (let i = 0; i < length; i += 2) {
            positions[i] = this.mXAxis.mEntries[i / 2];
            if (i + 1 < length) {
                positions[i + 1] = 0;
            }
        }
        this.mTrans.pointValuesToPixel(positions);

        for (let i = 0; i < length; i += 2) {
            const x = positions[i];
            c.drawLine(x, pos, x, pos + ticklength, this.mAxisLinePaint);
        }
    }

    protected mRenderGridLinesPath = new Path();
    protected mRenderGridLinesBuffer = [];

    public renderGridLines(c: Canvas) {
        const axis = this.mXAxis;
        if (!axis.isDrawGridLinesEnabled() || !axis.isEnabled()) return;

        const clipRestoreCount = c.save();
        c.clipRect(this.getGridClippingRect());

        const length = this.mAxis.mEntryCount * 2;
        if (this.mRenderGridLinesBuffer.length !== length) {
            this.mRenderGridLinesBuffer = Utils.createNativeArray(length);
        }
        const positions = this.mRenderGridLinesBuffer;

        for (let i = 0; i < length; i += 2) {
            positions[i] = axis.mEntries[i / 2];
            positions[i + 1] = axis.mEntries[i / 2];
        }

        this.mTrans.pointValuesToPixel(positions);

        this.setupGridPaint();

        const gridLinePath = this.mRenderGridLinesPath;
        gridLinePath.reset();

        for (let i = 0; i < positions.length; i += 2) {
            this.drawGridLine(c, positions[i], positions[i + 1], gridLinePath);
        }

        c.restoreToCount(clipRestoreCount);
    }

    protected mGridClippingRect = new RectF(0, 0, 0, 0);

    public getGridClippingRect() {
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        this.mGridClippingRect.set(rect);
        this.mGridClippingRect.inset(-this.mAxis.getGridLineWidth(), 0);
        return this.mGridClippingRect;
    }

    /**
     * Draws the grid line at the specified position using the provided path.
     *
     * @param c
     * @param x
     * @param y
     * @param gridLinePath
     */
    protected drawGridLine(c: Canvas, x, y, gridLinePath: Path) {
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        gridLinePath.moveTo(x, rect.bottom);
        gridLinePath.lineTo(x, rect.top);

        // draw a path because lines don't support dashing on lower android versions
        c.drawPath(gridLinePath, this.mGridPaint);

        gridLinePath.reset();
    }

    protected mRenderLimitLinesBuffer = Utils.createNativeArray(2);
    protected mLimitLineClippingRect = new RectF(0, 0, 0, 0);

    /**
     * Draws the LimitLines associated with this axis to the screen.
     *
     * @param c
     */

    public renderLimitLines(c: Canvas) {
        const limitLines = this.mXAxis.getLimitLines();

        if (limitLines == null || limitLines.length <= 0) return;

        const position = this.mRenderLimitLinesBuffer;
        position[0] = 0;
        position[1] = 0;

        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        for (let i = 0; i < limitLines.length; i++) {
            const l = limitLines[i];

            if (!l.isEnabled()) continue;
            const lineWidth = l.getLineWidth();

            const clipRestoreCount = c.save();
            this.mLimitLineClippingRect.set(rect);
            this.mLimitLineClippingRect.inset(-lineWidth, 0);
            c.clipRect(this.mLimitLineClippingRect);

            position[0] = l.getLimit();
            position[1] = 0;

            this.mTrans.pointValuesToPixel(position);

            if (lineWidth > 0) {
                this.renderLimitLineLine(c, l, position);
            }
            this.renderLimitLineLabel(c, l, position, 2 + l.getYOffset());

            c.restoreToCount(clipRestoreCount);
        }
    }

    private mLimitLineSegmentsBuffer = [];
    private mLimitLinePath = new Path();

    public renderLimitLineLine(c: Canvas, limitLine: LimitLine, position) {
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        this.mLimitLineSegmentsBuffer[0] = position[0];
        this.mLimitLineSegmentsBuffer[1] = rect.top;
        this.mLimitLineSegmentsBuffer[2] = position[0];
        this.mLimitLineSegmentsBuffer[3] = rect.bottom;

        this.mLimitLinePath.reset();
        this.mLimitLinePath.moveTo(this.mLimitLineSegmentsBuffer[0], this.mLimitLineSegmentsBuffer[1]);
        this.mLimitLinePath.lineTo(this.mLimitLineSegmentsBuffer[2], this.mLimitLineSegmentsBuffer[3]);

        this.mLimitLinePaint.setStyle(Style.STROKE);
        this.mLimitLinePaint.setColor(limitLine.getLineColor());
        this.mLimitLinePaint.setStrokeWidth(limitLine.getLineWidth());
        this.mLimitLinePaint.setPathEffect(limitLine.getDashPathEffect());

        c.drawPath(this.mLimitLinePath, this.mLimitLinePaint);
    }

    public renderLimitLineLabel(c: Canvas, limitLine: LimitLine, position, yOffset) {
        const label = limitLine.getLabel();
        // if drawing the limit-value label is enabled
        if (label != null && label !== '') {
            const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();

            this.mLimitLinePaint.setFont(limitLine.getFont());
            this.mLimitLinePaint.setStyle(limitLine.getTextStyle());
            this.mLimitLinePaint.setPathEffect(null);
            this.mLimitLinePaint.setColor(limitLine.getTextColor());
            this.mLimitLinePaint.setStrokeWidth(0.5);

            const xOffset = limitLine.getLineWidth() + limitLine.getXOffset();

            const labelPosition = limitLine.getLabelPosition();

            if (labelPosition === LimitLabelPosition.RIGHT_TOP) {
                const labelLineHeight = Utils.calcTextHeight(this.mLimitLinePaint, label);
                this.mLimitLinePaint.setTextAlign(Align.LEFT);
                c.drawText(label, position[0] + xOffset, rect.top + yOffset + labelLineHeight, this.mLimitLinePaint);
            } else if (labelPosition === LimitLabelPosition.RIGHT_BOTTOM) {
                this.mLimitLinePaint.setTextAlign(Align.LEFT);
                c.drawText(label, position[0] + xOffset, rect.bottom - yOffset, this.mLimitLinePaint);
            } else if (labelPosition === LimitLabelPosition.LEFT_TOP) {
                this.mLimitLinePaint.setTextAlign(Align.RIGHT);
                const labelLineHeight = Utils.calcTextHeight(this.mLimitLinePaint, label);
                c.drawText(label, position[0] - xOffset, rect.top + yOffset + labelLineHeight, this.mLimitLinePaint);
            } else {
                this.mLimitLinePaint.setTextAlign(Align.RIGHT);
                c.drawText(label, position[0] - xOffset, rect.bottom - yOffset, this.mLimitLinePaint);
            }
        }
    }
}
