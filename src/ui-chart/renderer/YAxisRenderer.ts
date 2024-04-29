import { TypedArray } from '@nativescript-community/arraybuffers';
import { Align, Canvas, Paint, RectF } from '@nativescript-community/ui-canvas';
import { profile } from '@nativescript/core/profiling';
import { LimitLabelPosition } from '../components/LimitLine';
import { AxisDependency, YAxis, YAxisLabelPosition } from '../components/YAxis';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { AxisRenderer, CustomRendererGridLineFunction } from './AxisRenderer';

export class YAxisRenderer extends AxisRenderer {
    protected mYAxis: YAxis;

    protected mZeroLinePaint: Paint;

    protected mGetTransformedPositionsBuffer: TypedArray;

    constructor(viewPortHandler: ViewPortHandler, yAxis: YAxis, trans: Transformer) {
        super(viewPortHandler, trans, yAxis);
        this.mYAxis = yAxis;
    }

    get zeroLinePaint() {
        if (!this.mZeroLinePaint) {
            this.mZeroLinePaint = Utils.getTemplatePaint('gray-stroke');
        }
        return this.mZeroLinePaint;
    }
    /**
     * draws the y-axis labels to the screen
     */
    public renderAxisLabels(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.enabled || !axis.drawLabels) return;

        const positions = this.getTransformedPositions();
        const paint = this.axisLabelsPaint;

        paint.setFont(axis.typeface);
        paint.setColor(axis.textColor);

        const xoffset = axis.xOffset;
        const yoffset = Utils.calcTextHeight(paint, 'A') / 2.5 + axis.yOffset;
        const dependency = axis.axisDependency;
        const labelPosition = axis.position;

        let xPos = 0;
        let offsetLeft = 0;
        let rect: RectF;
        if (this.mAxis.ignoreOffsets) {
            rect = this.mViewPortHandler.chartRect;
        } else {
            rect = this.mViewPortHandler.contentRect;
            offsetLeft = this.mViewPortHandler.offsetLeft;
        }
        if (dependency === AxisDependency.LEFT) {
            if (labelPosition === YAxisLabelPosition.OUTSIDE_CHART) {
                paint.setTextAlign(Align.RIGHT);
                xPos = offsetLeft - xoffset;
            } else {
                paint.setTextAlign(Align.LEFT);
                xPos = offsetLeft + xoffset;
            }
        } else {
            if (labelPosition === YAxisLabelPosition.OUTSIDE_CHART) {
                paint.setTextAlign(Align.LEFT);
                xPos = rect.right + xoffset;
            } else {
                paint.setTextAlign(Align.RIGHT);
                xPos = rect.right - xoffset;
            }
        }

        this.drawYLabels(c, xPos, positions, yoffset);
        if (dependency === AxisDependency.LEFT) {
            this.drawMarkTick(c, rect.left, positions, -xoffset / 2);
        } else {
            this.drawMarkTick(c, rect.right, positions, +xoffset / 2);
        }
    }

    public renderAxisLine(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.enabled || !axis.drawAxisLine || axis.axisLineWidth === 0 || axis.mEntryCount === 0) return;
        const paint = this.axisLinePaint;

        paint.setColor(axis.axisLineColor);
        paint.setStrokeWidth(axis.axisLineWidth);

        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        if (axis.axisDependency === AxisDependency.LEFT) {
            c.drawLine(rect.left, rect.top, rect.left, rect.bottom, paint);
        } else {
            c.drawLine(rect.right, rect.top, rect.right, rect.bottom, paint);
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
        const customRender = axis.customRenderer;
        const customRenderFunction = customRender && customRender.drawLabel;
        const from = axis.drawBottomYLabelEntry ? 0 : 1;
        const to = axis.drawTopYLabelEntry ? axis.mEntryCount : axis.mEntryCount - 1;
        // draw
        const paint = this.axisLabelsPaint;
        const x = fixedPosition;
        for (let i = from; i < to; i++) {
            const text = axis.getFormattedLabel(i);
            if (text) {
                const y = positions[i * 2 + 1] + offset;
                if (customRenderFunction) {
                    customRenderFunction(c, axis, text, x, y, paint);
                } else {
                    // Utils.drawXAxisValue(c, text, x, y, paint, anchor, angleDegrees);
                    c.drawText(text, x, y, paint);
                }
            }
        }
    }

    /**
     * Draw mark tickets
     * @param c
     * @param fixedPosition
     * @param positions
     * @param length
     */
    protected drawMarkTick(c: Canvas, fixedPosition, positions, ticklength) {
        const mYAxis = this.mYAxis;
        if (!mYAxis.drawMarkTicks) return;

        const from = mYAxis.drawBottomYLabelEntry ? 0 : 1;
        const to = mYAxis.drawTopYLabelEntry ? mYAxis.mEntryCount : mYAxis.mEntryCount - 1;

        // draw
        const paint = this.axisLinePaint;
        for (let i = from; i < to; i++) {
            c.drawLine(fixedPosition, positions[i * 2 + 1], fixedPosition + ticklength, positions[i * 2 + 1], paint);
        }
    }

    // protected mRenderGridLinesPath = new Path();
    /**
     * Draws the grid line at the specified position using the provided path.
     *
     * @param c
     * @param rect
     * @param x
     * @param y
     * @param axisValue
     */
    protected drawGridLine(c: Canvas, rect: RectF, x, y, axisValue, paint: Paint, customRendererFunc: CustomRendererGridLineFunction) {
        if (customRendererFunc) {
            customRendererFunc(c, this.mAxis, rect, x, y, axisValue, paint);
        } else {
            c.drawLine(rect.left, y, rect.right, y, paint);
        }
    }
    public renderGridLines(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.enabled || !axis.drawGridLinesBehindData) return;

        if (axis.drawGridLines) {
            const clipRestoreCount = c.save();
            c.clipRect(this.getGridClippingRect());

            const positions = this.getTransformedPositions();
            const paint = this.gridPaint;

            paint.setColor(axis.gridColor);
            paint.setStrokeWidth(axis.gridLineWidth);
            paint.setPathEffect(axis.gridDashPathEffect);

            const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
            const customRender = axis.customRenderer;
            const customRenderFunction = customRender && customRender.drawGridLine;
            for (let i = 0; i < positions.length; i += 2) {
                this.drawGridLine(c, rect, positions[i], positions[i + 1], axis.mEntries[i / 2], paint, customRenderFunction);
            }

            c.restoreToCount(clipRestoreCount);
        }

        if (axis.drawZeroLine) {
            this.drawZeroLine(c);
        }
    }

    public getGridClippingRect() {
        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        const gridClippingRect = Utils.getTempRectF();
        gridClippingRect.set(rect);
        gridClippingRect.inset(0, -this.mAxis.gridLineWidth);
        return gridClippingRect;
    }

    /**
     * Transforms the values contained in the axis entries to screen pixels and returns them in form of a let array
     * of x- and y-coordinates.
     */
    protected getTransformedPositions() {
        const axis = this.mYAxis;
        const length = axis.mEntryCount * 2;
        if (!this.mGetTransformedPositionsBuffer || this.mGetTransformedPositionsBuffer.length !== length) {
            this.mGetTransformedPositionsBuffer = Utils.createArrayBuffer(length);
        }
        const positions = this.mGetTransformedPositionsBuffer;
        for (let i = 0; i < length; i += 2) {
            // only fill y values, x values are not needed for y-labels
            positions[i] = 0;
            positions[i + 1] = axis.mEntries[i / 2];
        }
        const result = Utils.pointsFromBuffer(positions);
        this.transformer.pointValuesToPixel(result);
        return Utils.nativeArrayToArray(result);
    }

    /**
     * Draws the zero line.
     */
    protected drawZeroLine(c: Canvas) {
        const axis = this.mYAxis;
        const clipRestoreCount = c.save();
        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        const zeroLineClippingRectl = Utils.getTempRectF();
        zeroLineClippingRectl.set(rect);
        zeroLineClippingRectl.inset(0, -axis.zeroLineWidth);
        c.clipRect(zeroLineClippingRectl);

        // draw zero line
        const pos = this.transformer.getPixelForValues(0, 0);
        const paint = this.zeroLinePaint;
        paint.setColor(axis.zeroLineColor);
        paint.setStrokeWidth(axis.zeroLineWidth);

        const zeroLinePath = Utils.getTempPath();
        zeroLinePath.reset();

        zeroLinePath.moveTo(rect.left, pos.y);
        zeroLinePath.lineTo(rect.right, pos.y);

        // draw a path because lines don't support dashing on lower android versions
        c.drawPath(zeroLinePath, paint);

        c.restoreToCount(clipRestoreCount);
    }

    /**
     * Draws the LimitLines associated with this axis to the screen.
     *
     * @param c
     */
    public renderLimitLines(c: Canvas) {
        const axis = this.mYAxis;

        if (!axis.drawLimitLines || !axis.enabled) {
            return;
        }
        const limitLines = axis.limitLines;

        if (!limitLines || limitLines.length <= 0) return;

        const pts = Utils.getTempArray(2);
        pts[0] = 0;
        pts[1] = 0;
        let offsetLeft = 0;
        let rect: RectF;
        if (axis.ignoreOffsets) {
            rect = this.mViewPortHandler.chartRect;
        } else {
            rect = this.mViewPortHandler.contentRect;
            offsetLeft = this.mViewPortHandler.offsetLeft;
        }

        const customRender = axis.customRenderer;
        const customRendererFunc = customRender && customRender.drawLimitLine;
        const clipToContent = axis.clipLimitLinesToContent;
        for (let i = 0; i < limitLines.length; i++) {
            const l = limitLines[i];

            if (!l.enabled) continue;
            const lineWidth = l.lineWidth;
            if (clipToContent) {
                c.save();
                const clipRect = Utils.getTempRectF();
                clipRect.set(rect);
                clipRect.inset(0, -lineWidth);
                c.clipRect(clipRect);
            }

            const paint = this.limitLinePaint;
            paint.setColor(l.lineColor);
            paint.setStrokeWidth(lineWidth);
            paint.setPathEffect(l.dashPathEffect);

            pts[1] = l.limit;
            this.transformer.pointValuesToPixel(pts);

            if (lineWidth > 0) {
                if (customRendererFunc) {
                    customRendererFunc(c, axis, l, rect, pts[1], paint);
                } else {
                    c.drawLine(rect.left, pts[1], rect.right, pts[1], paint);
                }
            }

            const label = l.label;

            // if drawing the limit-value label is enabled
            if (label && label !== '') {
                paint.setStyle(l.textStyle);
                paint.setPathEffect(null);
                paint.setColor(l.textColor);
                paint.setFont(l.typeface);
                paint.setStrokeWidth(0.5);

                let size = Utils.calcTextSize(paint, label);
                const xOffset = l.xOffset;
                const yOffset = l.lineWidth + size.height + l.yOffset;

                const position = l.labelPosition;
                const needsSize = l.ensureVisible;

                if (needsSize) {
                    size = Utils.calcTextSize(paint, label);
                }
                switch (position) {
                    case LimitLabelPosition.RIGHT_TOP: {
                        paint.setTextAlign(Align.RIGHT);
                        const x = rect.right - xOffset;
                        let y = pts[1] - yOffset + size.height;
                        if (l.ensureVisible && y < size.height) {
                            y -= size.height;
                        }
                        c.drawText(label, x, y, paint);
                        break;
                    }
                    case LimitLabelPosition.RIGHT_BOTTOM: {
                        paint.setTextAlign(Align.RIGHT);
                        const x = rect.right - xOffset;
                        let y = pts[1] - yOffset;

                        if (l.ensureVisible && y > rect.bottom - size.height) {
                            y += size.height;
                        }
                        c.drawText(label, x, y, paint);
                        break;
                    }
                    case LimitLabelPosition.CENTER_TOP: {
                        const x = rect.right - xOffset;
                        let y = pts[1] - yOffset + size.height;

                        if (l.ensureVisible && y < size.height) {
                            y -= size.height;
                        }
                        c.drawText(label, x, y, paint);
                        c.drawText(label, rect.right, pts[1] - yOffset + size.height, paint);
                        break;
                    }
                    case LimitLabelPosition.CENTER_BOTTOM: {
                        paint.setTextAlign(Align.CENTER);
                        const x = rect.right - xOffset;
                        let y = pts[1] - yOffset;

                        if (l.ensureVisible && y > rect.bottom - size.height) {
                            y += size.height;
                        }
                        c.drawText(label, x, y, paint);
                        c.drawText(label, rect.right, pts[1] + yOffset, paint);
                        break;
                    }
                    case LimitLabelPosition.LEFT_TOP: {
                        const x = offsetLeft + xOffset;
                        let y = pts[1] - yOffset + size.height;
                        if (l.ensureVisible && x > rect.right - size.width) {
                            paint.setTextAlign(Align.RIGHT);
                        }
                        if (l.ensureVisible && y < size.height) {
                            y -= size.height;
                        }
                        c.drawText(label, x, y, paint);
                        break;
                    }
                    case LimitLabelPosition.LEFT_BOTTOM: {
                        paint.setTextAlign(Align.LEFT);
                        const x = offsetLeft + xOffset;
                        let y = pts[1] + yOffset;
                        if (l.ensureVisible && x > rect.right - size.width) {
                            paint.setTextAlign(Align.RIGHT);
                        }
                        if (l.ensureVisible && y > rect.bottom - size.height) {
                            y += size.height;
                        }
                        c.drawText(label, x, y, paint);
                        c.drawText(label, x, y, paint);
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
