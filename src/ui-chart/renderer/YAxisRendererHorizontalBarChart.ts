import { Align, Canvas, RectF } from '@nativescript-community/ui-canvas';
import { LimitLabelPosition } from '../components/LimitLine';
import { AxisDependency, YAxisLabelPosition } from '../components/YAxis';
import { Utils } from '../utils/Utils';
import { YAxisRenderer } from './YAxisRenderer';

export class YAxisRendererHorizontalBarChart extends YAxisRenderer {
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
        const rect = axis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        if (rect.height() > 10 && !this.mViewPortHandler.isFullyZoomedOutX()) {
            const p1 = this.transformer.getValuesByTouchPoint(rect.left, rect.top);
            const p2 = this.transformer.getValuesByTouchPoint(rect.right, rect.top);

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
    public renderAxisLabels(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.enabled || !axis.drawLabels) {
            return;
        }

        const positions = this.getTransformedPositions();
        const paint = this.axisLabelsPaint;
        paint.setFont(axis.typeface);
        paint.setColor(axis.textColor);
        paint.setTextAlign(Align.CENTER);

        const baseYOffset = 2.5;
        const textHeight = Utils.calcTextHeight(paint, 'Q');

        const dependency = axis.axisDependency;
        const labelPosition = axis.position;

        let yPos = 0;

        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
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

        this.drawYLabels(c, yPos, positions, axis.yOffset);
    }

    public renderAxisLine(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.enabled || !axis.drawAxisLine) {
            return;
        }

        const paint = this.axisLinePaint;
        paint.setColor(axis.axisLineColor);
        paint.setStrokeWidth(axis.axisLineWidth);

        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        if (axis.axisDependency === AxisDependency.LEFT) {
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
    protected drawYLabels(c: Canvas, fixedPosition, positions, offset) {
        const axis = this.mYAxis;
        const paint = this.axisLabelsPaint;
        paint.setFont(axis.typeface);
        paint.setColor(axis.textColor);

        const from = axis.drawBottomYLabelEntry ? 0 : 1;
        const to = axis.drawTopYLabelEntry ? axis.mEntryCount : axis.mEntryCount - 1;

        for (let i = from; i < to; i++) {
            const text = axis.getFormattedLabel(i);
            if (text) {
                c.drawText(text + '', positions[i * 2], fixedPosition - offset, paint);
            }
        }
    }

    protected getTransformedPositions() {
        const axis = this.mYAxis;
        const length = axis.mEntryCount * 2;
        if (!this.mGetTransformedPositionsBuffer || this.mGetTransformedPositionsBuffer.length !== length) {
            this.mGetTransformedPositionsBuffer = Utils.createArrayBuffer(length);
        }

        const positions = this.mGetTransformedPositionsBuffer;
        for (let i = 0; i < length; i += 2) {
            // only fill x values, y values are not needed for x-labels
            positions[i] = axis.mEntries[i / 2];
        }

        const result = Utils.pointsFromBuffer(positions);
        this.transformer.pointValuesToPixel(result);
        return Utils.nativeArrayToArray(result);
    }

    public getGridClippingRect(): RectF {
        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        const temRect = Utils.getTempRectF();
        temRect.set(rect);
        temRect.inset(-this.mAxis.gridLineWidth, 0);
        return temRect;
    }

    protected drawZeroLine(c: Canvas) {
        const axis = this.mYAxis;
        const customRender = axis.customRenderer;
        const customRendererFunc = customRender && customRender.drawZeroLine;
        const clipRestoreCount = c.save();
        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        const zeroLineClippingRect = Utils.getTempRectF();
        zeroLineClippingRect.set(rect);
        zeroLineClippingRect.inset(-axis.zeroLineWidth, 0);
        c.clipRect(zeroLineClippingRect);

        // draw zero line
        const pos = this.transformer.getPixelForValues(0, 0);
        const paint = this.zeroLinePaint;

        paint.setColor(axis.zeroLineColor);
        paint.setStrokeWidth(axis.zeroLineWidth);

        const zeroLinePath = Utils.getTempPath();
        zeroLinePath.reset();

        zeroLinePath.moveTo(pos.x - 1, rect.top);
        zeroLinePath.lineTo(pos.x - 1, rect.bottom);

        // draw a path because lines don't support dashing on lower android versions
        if (customRendererFunc) {
            customRendererFunc(c, axis, pos, zeroLinePath, paint);
        } else {
            // draw a path because lines don't support dashing on lower android versions
            c.drawPath(zeroLinePath, paint);
        }

        c.restoreToCount(clipRestoreCount);
    }

    /**
     * Draws the LimitLines associated with this axis to the screen.
     * This is the standard XAxis renderer using the YAxis limit lines.
     *
     * @param c
     */
    public renderLimitLines(c: Canvas) {
        const axis = this.mYAxis;
        const limitLines = axis.limitLines;

        if (!limitLines || limitLines.length <= 0) {
            return;
        }

        const pts = Utils.getTempArray(2);
        pts[0] = 0;
        pts[1] = 0;
        // const limitLinePath = this.renderLimitLinesPath;
        // limitLinePath.reset();

        const customRender = axis.customRenderer;
        const customRendererFunc = customRender && customRender.drawLimitLine;
        const rect = axis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        const clipToContent = axis.clipLimitLinesToContent;
        for (let i = 0; i < limitLines.length; i++) {
            const l = limitLines[i];

            if (!l.enabled) {
                continue;
            }

            const lineWidth = l.lineWidth;
            if (clipToContent) {
                c.save();
                const clipRect = Utils.getTempRectF();
                clipRect.set(rect);
                clipRect.inset(0, -lineWidth);
                c.clipRect(clipRect);
            }

            pts[0] = l.limit;

            this.transformer.pointValuesToPixel(pts);

            const paint = this.limitLinePaint;
            paint.setColor(l.lineColor);
            paint.setPathEffect(l.dashPathEffect);
            paint.setStrokeWidth(l.lineWidth);

            if (lineWidth > 0) {
                if (customRendererFunc) {
                    customRendererFunc(c, axis, l, rect, pts[0], paint);
                } else {
                    c.drawLine(pts[0], rect.bottom, pts[0], rect.top, paint);
                }
            }

            const label = l.label;

            // if drawing the limit-value label is enabled
            if (label?.length) {
                paint.setStyle(l.textStyle);
                paint.setPathEffect(null);
                paint.setColor(l.textColor);
                paint.setFont(l.typeface);
                paint.setStrokeWidth(0.5);
                paint.setFont(l.typeface);

                const xOffset = l.lineWidth + l.xOffset;
                const yOffset = 2 + l.yOffset;

                const position = l.labelPosition;

                switch (position) {
                    case LimitLabelPosition.RIGHT_TOP: {
                        const labelLineHeight = Utils.calcTextHeight(paint, label);
                        paint.setTextAlign(Align.LEFT);
                        c.drawText(label, pts[0] + xOffset, rect.top + yOffset + labelLineHeight, paint);
                        break;
                    }
                    case LimitLabelPosition.RIGHT_BOTTOM: {
                        paint.setTextAlign(Align.LEFT);
                        c.drawText(label, pts[0] + xOffset, rect.bottom - yOffset, paint);
                        break;
                    }
                    case LimitLabelPosition.CENTER_TOP: {
                        const labelLineHeight = Utils.calcTextHeight(paint, label);
                        paint.setTextAlign(Align.CENTER);
                        c.drawText(label, pts[0], rect.top + yOffset + labelLineHeight, paint);
                        break;
                    }
                    case LimitLabelPosition.CENTER_BOTTOM: {
                        paint.setTextAlign(Align.CENTER);
                        c.drawText(label, pts[0], rect.bottom - yOffset, paint);
                        break;
                    }
                    case LimitLabelPosition.LEFT_TOP: {
                        paint.setTextAlign(Align.RIGHT);
                        const labelLineHeight = Utils.calcTextHeight(paint, label);
                        c.drawText(label, pts[0] - xOffset, rect.top + yOffset + labelLineHeight, paint);
                        break;
                    }
                    default: {
                        paint.setTextAlign(Align.RIGHT);
                        c.drawText(label, pts[0] - xOffset, rect.bottom - yOffset, paint);
                        break;
                    }
                }
            }

            if (clipToContent) {
                c.restore();
            }
        }
    }
}
