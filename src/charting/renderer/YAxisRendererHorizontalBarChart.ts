import { YAxisRenderer } from './YAxisRenderer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { AxisDependency, YAxis, YAxisLabelPosition } from '../components/YAxis';
import { Transformer } from '../utils/Transformer';
import { Align, Canvas, Path, RectF, Style } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';
import { LimitLabelPosition } from '../components/LimitLine';
import { profile } from '@nativescript/core';

export class YAxisRendererHorizontalBarChart extends YAxisRenderer {
    protected mDrawZeroLinePathBuffer: Path;
    protected get drawZeroLinePathBuffer() {
        if (!this.mDrawZeroLinePathBuffer) {
            this.mDrawZeroLinePathBuffer = new Path();
        }
        return this.mDrawZeroLinePathBuffer;
    }
    protected get renderLimitLinesBuffer() {
        if (!this.mRenderLimitLinesBuffer) {
            this.mRenderLimitLinesBuffer = Utils.createNativeArray(4);
        }
        return this.mRenderLimitLinesBuffer;
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
        const paint = this.axisLabelsPaint;
        paint.setFont(axis.getFont());
        paint.setColor(axis.getTextColor());
        paint.setTextAlign(Align.CENTER);

        const baseYOffset = 2.5;
        const textHeight = Utils.calcTextHeight(paint, 'Q');

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

        const paint = this.axisLinePaint;
        paint.setColor(axis.getAxisLineColor());
        paint.setStrokeWidth(axis.getAxisLineWidth());

        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        if (axis.getAxisDependency() === AxisDependency.LEFT) {
            c.drawLine(rect.left, rect.top, rect.right, rect.top, paint);
        } else {
            c.drawLine(rect.left, rect.bottom, rect.right, rect.bottom, paint);
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
        const paint = this.axisLabelsPaint;
        paint.setFont(axis.getFont());
        paint.setColor(axis.getTextColor());

        const from = axis.isDrawBottomYLabelEntryEnabled() ? 0 : 1;
        const to = axis.isDrawTopYLabelEntryEnabled() ? axis.mEntryCount : axis.mEntryCount - 1;

        for (let i = from; i < to; i++) {
            const text = axis.getFormattedLabel(i);

            c.drawText(text, positions[i * 2], fixedPosition - offset, paint);
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
        const paint = this.zeroLinePaint;

        paint.setColor(axis.getZeroLineColor());
        paint.setStrokeWidth(axis.getZeroLineWidth());

        const zeroLinePath = this.drawZeroLinePathBuffer;
        zeroLinePath.reset();

        zeroLinePath.moveTo(pos.x - 1, rect.top);
        zeroLinePath.lineTo(pos.x - 1, rect.bottom);

        // draw a path because lines don't support dashing on lower android versions
        c.drawPath(zeroLinePath, paint);

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

        const pts = this.renderLimitLinesBuffer;
        pts[0] = 0;
        pts[1] = 0;
        pts[2] = 0;
        pts[3] = 0;
        const limitLinePath = this.renderLimitLinesPath;
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

            const paint = this.limitLinePaint;
            // paint.setTextAlign(Align.LEFT);
            paint.setStyle(Style.STROKE);
            paint.setColor(l.getLineColor());
            paint.setPathEffect(l.getDashPathEffect());
            paint.setStrokeWidth(l.getLineWidth());

            c.drawPath(limitLinePath, paint);
            limitLinePath.reset();

            const label = l.getLabel();

            // if drawing the limit-value label is enabled
            if (label != null && label !== '') {
                paint.setStyle(l.getTextStyle());
                paint.setPathEffect(null);
                paint.setColor(l.getTextColor());
                paint.setFont(l.getFont());
                paint.setStrokeWidth(0.5);
                paint.setFont(l.getFont());

                const xOffset = l.getLineWidth() + l.getXOffset();
                const yOffset = 2 + l.getYOffset();

                const position = l.getLabelPosition();

                if (position === LimitLabelPosition.RIGHT_TOP) {
                    const labelLineHeight = Utils.calcTextHeight(paint, label);
                    paint.setTextAlign(Align.LEFT);
                    c.drawText(label, pts[0] + xOffset, rect.top + yOffset + labelLineHeight, paint);
                } else if (position === LimitLabelPosition.RIGHT_BOTTOM) {
                    paint.setTextAlign(Align.LEFT);
                    c.drawText(label, pts[0] + xOffset, rect.bottom - yOffset, paint);
                } else if (position === LimitLabelPosition.LEFT_TOP) {
                    paint.setTextAlign(Align.RIGHT);
                    const labelLineHeight = Utils.calcTextHeight(paint, label);
                    c.drawText(label, pts[0] - xOffset, rect.top + yOffset + labelLineHeight, paint);
                } else {
                    paint.setTextAlign(Align.RIGHT);
                    c.drawText(label, pts[0] - xOffset, rect.bottom - yOffset, paint);
                }
            }

            c.restoreToCount(clipRestoreCount);
        }
    }
}
