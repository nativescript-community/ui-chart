import { YAxisRenderer } from './YAxisRenderer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { AxisDependency, YAxis, YAxisLabelPosition } from '../components/YAxis';
import { Transformer } from '../utils/Transformer';
import { Align, Canvas, Path, RectF, Style } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';
import { LimitLabelPosition } from '../components/LimitLine';
import { profile } from '@nativescript/core';

export class YAxisRendererHorizontalBarChart extends YAxisRenderer {
    protected mDrawZeroLinePathBuffer: Path = new Path();

    constructor(viewPortHandler: ViewPortHandler, yAxis: YAxis, trans: Transformer) {
        super(viewPortHandler, yAxis, trans);

        this.mLimitLinePaint.setTextAlign(Align.LEFT);

        this.mRenderLimitLinesBuffer = Utils.createNativeArray(4);
    }

    /**
     * Computes the axis values.
     *
     * @param yMin - the minimum y-value in the data object for this axis
     * @param yMax - the maximum y-value in the data object for this axis
     */
    public computeAxis(yMin, yMax, inverted) {
        const axis = this.mYAxis;
        // calculate the starting and entry polet of the y-labels (depending on
        // zoom / contentrect bounds)
        const rect = axis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        if (rect.height() > 10 && !this.mViewPortHandler.isFullyZoomedOutX()) {
            const p1 = this.mTrans.getValuesByTouchPoint(rect.left, rect.top);
            const p2 = this.mTrans.getValuesByTouchPoint(rect.right, rect.top);

            if (!inverted) {
                yMin = p1.x;
                yMax = p2.x;
            } else {
                yMin = p2.x;
                yMax = p1.x;
            }
        }

        this.computeAxisValues(yMin, yMax);
    }

    /**
     * draws the y-axis labels to the screen
     */
    @profile
    public renderAxisLabels(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.isEnabled() || !axis.isDrawLabelsEnabled()) {
            return;
        }

        const positions = this.getTransformedPositions();

        this.mAxisLabelPaint.setFont(axis.getFont());
        this.mAxisLabelPaint.setColor(axis.getTextColor());
        this.mAxisLabelPaint.setTextAlign(Align.CENTER);

        const baseYOffset = 2.5;
        const textHeight = Utils.calcTextHeight(this.mAxisLabelPaint, 'Q');

        const dependency = axis.getAxisDependency();
        const labelPosition = axis.getLabelPosition();

        let yPos = 0;

        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        if (dependency === AxisDependency.LEFT) {
            if (labelPosition === YAxisLabelPosition.OUTSIDE_CHART) {
                yPos = rect.top - baseYOffset;
            } else {
                yPos = rect.top - baseYOffset;
            }
        } else {
            if (labelPosition === YAxisLabelPosition.OUTSIDE_CHART) {
                yPos = rect.bottom + textHeight + baseYOffset;
            } else {
                yPos = rect.bottom + textHeight + baseYOffset;
            }
        }

        this.drawYLabels(c, yPos, positions, axis.getYOffset());
    }

    public renderAxisLine(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.isEnabled() || !axis.isDrawAxisLineEnabled()) {
            return;
        }

        this.mAxisLinePaint.setColor(axis.getAxisLineColor());
        this.mAxisLinePaint.setStrokeWidth(axis.getAxisLineWidth());

        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        if (axis.getAxisDependency() === AxisDependency.LEFT) {
            c.drawLine(rect.left, rect.top, rect.right, rect.top, this.mAxisLinePaint);
        } else {
            c.drawLine(rect.left, rect.bottom, rect.right, rect.bottom, this.mAxisLinePaint);
        }
    }

    /**
     * draws the y-labels on the specified x-position
     *
     * @param fixedPosition
     * @param positions
     */
    @profile
    protected drawYLabels(c: Canvas, fixedPosition, positions, offset) {
        const axis = this.mYAxis;
        this.mAxisLabelPaint.setFont(axis.getFont());
        this.mAxisLabelPaint.setColor(axis.getTextColor());

        const from = axis.isDrawBottomYLabelEntryEnabled() ? 0 : 1;
        const to = axis.isDrawTopYLabelEntryEnabled() ? axis.mEntryCount : axis.mEntryCount - 1;

        for (let i = from; i < to; i++) {
            const text = axis.getFormattedLabel(i);

            c.drawText(text, positions[i * 2], fixedPosition - offset, this.mAxisLabelPaint);
        }
    }

    protected getTransformedPositions() {
        const axis = this.mYAxis;
        const length = axis.mEntryCount * 2;
        if (this.mGetTransformedPositionsBuffer.length !== length) {
            this.mGetTransformedPositionsBuffer = Utils.createArrayBuffer(length);
        }

        const positions = this.mGetTransformedPositionsBuffer;
        for (let i = 0; i < length; i += 2) {
            // only fill x values, y values are not needed for x-labels
            positions[i] = axis.mEntries[i / 2];
        }

        const result = Utils.pointsFromBuffer(positions);
        this.mTrans.pointValuesToPixel(result);
        return Utils.nativeArrayToArray(result);
    }

    public getGridClippingRect(): RectF {
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        this.mGridClippingRect.set(rect);
        this.mGridClippingRect.inset(-this.mAxis.getGridLineWidth(), 0);
        return this.mGridClippingRect;
    }

    // protected linePath(p: Path, i, positions): Path {
    //     p.moveTo(positions[i], rect.top);
    //     p.lineTo(positions[i], rect.bottom);

    //     return p;
    // }

    protected drawZeroLine(c: Canvas) {
        const axis = this.mYAxis;
        const clipRestoreCount = c.save();
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        this.mZeroLineClippingRect.set(rect);
        this.mZeroLineClippingRect.inset(-axis.getZeroLineWidth(), 0);
        c.clipRect(this.mLimitLineClippingRect);

        // draw zero line
        const pos = this.mTrans.getPixelForValues(0, 0);

        this.mZeroLinePaint.setColor(axis.getZeroLineColor());
        this.mZeroLinePaint.setStrokeWidth(axis.getZeroLineWidth());

        const zeroLinePath = this.mDrawZeroLinePathBuffer;
        zeroLinePath.reset();

        zeroLinePath.moveTo(pos.x - 1, rect.top);
        zeroLinePath.lineTo(pos.x - 1, rect.bottom);

        // draw a path because lines don't support dashing on lower android versions
        c.drawPath(zeroLinePath, this.mZeroLinePaint);

        c.restoreToCount(clipRestoreCount);
    }

    /**
     * Draws the LimitLines associated with this axis to the screen.
     * This is the standard XAxis renderer using the YAxis limit lines.
     *
     * @param c
     */

    public renderLimitLines(c: Canvas) {
        const limitLines = this.mYAxis.getLimitLines();

        if (limitLines == null || limitLines.length <= 0) {
            return;
        }

        const pts = this.mRenderLimitLinesBuffer;
        pts[0] = 0;
        pts[1] = 0;
        pts[2] = 0;
        pts[3] = 0;
        const limitLinePath = this.mRenderLimitLines;
        limitLinePath.reset();

        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        for (let i = 0; i < limitLines.length; i++) {
            const l = limitLines[i];

            if (!l.isEnabled()) {
                continue;
            }

            const clipRestoreCount = c.save();
            this.mLimitLineClippingRect.set(rect);
            this.mLimitLineClippingRect.inset(-l.getLineWidth(), 0);
            c.clipRect(this.mLimitLineClippingRect);

            pts[0] = l.getLimit();
            pts[2] = l.getLimit();

            this.mTrans.pointValuesToPixel(pts);

            pts[1] = rect.top;
            pts[3] = rect.bottom;

            limitLinePath.moveTo(pts[0], pts[1]);
            limitLinePath.lineTo(pts[2], pts[3]);

            this.mLimitLinePaint.setStyle(Style.STROKE);
            this.mLimitLinePaint.setColor(l.getLineColor());
            this.mLimitLinePaint.setPathEffect(l.getDashPathEffect());
            this.mLimitLinePaint.setStrokeWidth(l.getLineWidth());

            c.drawPath(limitLinePath, this.mLimitLinePaint);
            limitLinePath.reset();

            const label = l.getLabel();

            // if drawing the limit-value label is enabled
            if (label != null && label !== '') {
                this.mLimitLinePaint.setStyle(l.getTextStyle());
                this.mLimitLinePaint.setPathEffect(null);
                this.mLimitLinePaint.setColor(l.getTextColor());
                this.mLimitLinePaint.setFont(l.getFont());
                this.mLimitLinePaint.setStrokeWidth(0.5);
                this.mLimitLinePaint.setFont(l.getFont());

                const xOffset = l.getLineWidth() + l.getXOffset();
                const yOffset = 2 + l.getYOffset();

                const position = l.getLabelPosition();

                if (position === LimitLabelPosition.RIGHT_TOP) {
                    const labelLineHeight = Utils.calcTextHeight(this.mLimitLinePaint, label);
                    this.mLimitLinePaint.setTextAlign(Align.LEFT);
                    c.drawText(label, pts[0] + xOffset, rect.top + yOffset + labelLineHeight, this.mLimitLinePaint);
                } else if (position === LimitLabelPosition.RIGHT_BOTTOM) {
                    this.mLimitLinePaint.setTextAlign(Align.LEFT);
                    c.drawText(label, pts[0] + xOffset, rect.bottom - yOffset, this.mLimitLinePaint);
                } else if (position === LimitLabelPosition.LEFT_TOP) {
                    this.mLimitLinePaint.setTextAlign(Align.RIGHT);
                    const labelLineHeight = Utils.calcTextHeight(this.mLimitLinePaint, label);
                    c.drawText(label, pts[0] - xOffset, rect.top + yOffset + labelLineHeight, this.mLimitLinePaint);
                } else {
                    this.mLimitLinePaint.setTextAlign(Align.RIGHT);
                    c.drawText(label, pts[0] - xOffset, rect.bottom - yOffset, this.mLimitLinePaint);
                }
            }

            c.restoreToCount(clipRestoreCount);
        }
    }
}
