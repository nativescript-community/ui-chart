import { Align, Canvas, Paint, RectF } from '@nativescript-community/ui-canvas';
import { TypedArray } from '@nativescript-community/arraybuffers';
import { profile } from '@nativescript/core';
import { LimitLabelPosition, LimitLine } from '../components/LimitLine';
import { XAxis, XAxisPosition } from '../components/XAxis';
import { MPPointF } from '../utils/MPPointF';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { AxisRenderer, CustomRendererGridLineFunction, CustomRendererLabelFunction, CustomRendererLimitLineFunction } from './AxisRenderer';

export class XAxisRenderer extends AxisRenderer {
    protected xAxis: XAxis;
    protected mForceLongestLabelComputation = true;
    protected mLabelsPositionsBuffer: TypedArray;
    protected mRenderGridLinesBuffer: TypedArray;

    constructor(viewPortHandler: ViewPortHandler, xAxis: XAxis, trans: Transformer) {
        super(viewPortHandler, trans, xAxis);
        this.xAxis = xAxis;
    }

    protected createAxisLabelsPaint() {
        const paint = super.createAxisLabelsPaint();
        paint.setTextAlign(Align.CENTER);
        return paint;
    }

    public getCurrentMinMax(min?, max?, inverted?) {
        if (min === undefined || max === undefined || inverted === undefined) {
            const axis = this.mAxis;
            if (min === undefined) {
                min = axis.mAxisMinimum;
            }
            if (max === undefined) {
                max = axis.mAxisMaximum;
            }
            if (inverted === undefined) {
                inverted = axis['isInverted'] ? axis['isInverted']() : false;
            }
        }
        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        if (rect.width() > 10 && !this.mViewPortHandler.isFullyZoomedOutX()) {
            const p1 = this.transformer.getValuesByTouchPoint(rect.left, rect.top);
            const p2 = this.transformer.getValuesByTouchPoint(rect.right, rect.top);

            if (inverted) {
                min = p2.x;
                max = p1.x;
            } else {
                min = p1.x;
                max = p2.x;
            }
        }
        return { min, max };
    }

    protected computeAxisValues(min, max) {
        super.computeAxisValues(min, max);

        this.computeSize();
    }
    protected computeSize() {
        const axis = this.xAxis;
        const rotation = axis.labelRotationAngle;
        if (this.mForceLongestLabelComputation || rotation % 360 !== 0) {
            const paint = this.axisLabelsPaint;
            paint.setFont(axis.typeface);
            const longest = axis.longestLabel;
            const labelSize = Utils.calcTextSize(paint, longest);
            const labelWidth = labelSize.width;
            const labelHeight = Utils.calcTextHeight(paint, 'Q') + 2;
            const labelRotatedSize = Utils.getSizeOfRotatedRectangleByDegrees(labelWidth, labelHeight, axis.labelRotationAngle);

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

    public renderAxisLabels(c: Canvas) {
        const axis = this.xAxis;
        if (!axis.enabled || !axis.drawLabels) return;

        const yoffset = axis.yOffset;
        const paint = this.axisLabelsPaint;
        // we cant remove that line right now of the ascent wont be computed...
        // TODO: refactor this
        const labelLineHeight = Utils.getLineHeight(paint);
        paint.setFont(axis.typeface);
        paint.setTextAlign(axis.labelTextAlign);
        paint.setColor(axis.textColor);
        // const align = this.mAxisLabelPaint.getTextAlign();
        // this.mAxisLabelPaint.setTextAlign(Align.CENTER);

        // TODO: fix this the right way.
        // for now Utils.drawXAxisValue needs the font ascent
        // but it is not calculated all the time (in the lightest of cases)
        // we call this next line to ensure it is
        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        const pointF = { x: 0, y: 0 };
        if (axis.position === XAxisPosition.TOP) {
            pointF.x = 0.5;
            pointF.y = 1.0;
            this.drawLabels(c, rect.top - yoffset, pointF);
            this.drawMarkTick(c, rect.top, -yoffset / 2);
        } else if (axis.position === XAxisPosition.TOP_INSIDE) {
            pointF.x = 0.5;
            pointF.y = 1.0;
            this.drawLabels(c, rect.top + yoffset + axis.mLabelRotatedHeight, pointF);
            this.drawMarkTick(c, rect.top, -yoffset / 2);
        } else if (axis.position === XAxisPosition.BOTTOM) {
            pointF.x = 0.5;
            pointF.y = 0.0;
            this.drawLabels(c, rect.bottom + yoffset, pointF);
            this.drawMarkTick(c, rect.bottom, +yoffset / 2);
        } else if (axis.position === XAxisPosition.BOTTOM_INSIDE) {
            pointF.x = 0.5;
            pointF.y = 0.0;
            this.drawLabels(c, rect.bottom - yoffset - axis.mLabelRotatedHeight, pointF);
            this.drawMarkTick(c, rect.bottom, +yoffset / 2);
        } else {
            // BOTH SIDED
            pointF.x = 0.5;
            pointF.y = 1.0;
            this.drawLabels(c, rect.top - yoffset, pointF);
            this.drawMarkTick(c, rect.top, -yoffset / 2);
            pointF.x = 0.5;
            pointF.y = 0.0;
            this.drawLabels(c, rect.bottom + yoffset, pointF);
            this.drawMarkTick(c, rect.bottom, +yoffset / 2);
        }
    }

    public renderAxisLine(c: Canvas) {
        const axis = this.xAxis;
        if (!axis.drawAxisLine || !axis.enabled || axis.axisLineWidth === 0 || axis.mEntryCount === 0) return;
        const paint = this.axisLinePaint;
        paint.setColor(axis.axisLineColor);
        paint.setStrokeWidth(axis.axisLineWidth);
        paint.setPathEffect(axis.axisLineDashPathEffect);
        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;

        if (axis.position === XAxisPosition.TOP || axis.position === XAxisPosition.TOP_INSIDE || axis.position === XAxisPosition.BOTH_SIDED) {
            c.drawLine(rect.left, rect.top, rect.right, rect.top, paint);
        }

        if (axis.position === XAxisPosition.BOTTOM || axis.position === XAxisPosition.BOTTOM_INSIDE || axis.position === XAxisPosition.BOTH_SIDED) {
            c.drawLine(rect.left, rect.bottom, rect.right, rect.bottom, paint);
        }
    }

    /**
     * draws the x-labels on the specified y-position
     *
     * @param pos
     */
    protected drawLabels(c: Canvas, pos, anchor: MPPointF) {
        const axis = this.xAxis;
        const labelRotationAngleDegrees = axis.labelRotationAngle;
        const centeringEnabled = axis.centerAxisLabels;
        const entryCount = axis.mEntryCount;
        if (entryCount === 0) {
            return;
        }

        const customRender = axis.customRenderer;
        const customRenderFunction = customRender && customRender.drawLabel;
        const length = entryCount * 2;
        if (!this.mLabelsPositionsBuffer || this.mLabelsPositionsBuffer.length !== length) {
            this.mLabelsPositionsBuffer = Utils.createArrayBuffer(length);
        }
        const positionsBuffer = this.mLabelsPositionsBuffer;
        for (let i = 0; i < length; i += 2) {
            // only fill x values
            if (centeringEnabled) {
                positionsBuffer[i] = axis.mCenteredEntries[i / 2];
            } else {
                positionsBuffer[i] = axis.mEntries[i / 2];
            }
            if (i + 1 < length) {
                positionsBuffer[i + 1] = 0;
            }
        }
        const positions = Utils.pointsFromBuffer(positionsBuffer);
        this.transformer.pointValuesToPixel(positions);
        const chartWidth = this.mViewPortHandler.chartWidth;
        let offsetRight = 0;
        let offsetLeft = 0;
        if (this.mAxis.ignoreOffsets) {
        } else {
            offsetRight = this.mViewPortHandler.offsetRight;
            offsetLeft = this.mViewPortHandler.offsetLeft;
        }
        const labels = axis.mLabels;
        const paint = this.axisLabelsPaint;

        for (let i = 0; i < length; i += 2) {
            let x = positions[i];

            if (this.mViewPortHandler.isInBoundsX(x)) {
                const label = labels[i / 2];
                if (!label) {
                    continue;
                }
                if (axis.avoidFirstLastClipping || axis.ensureVisible) {
                    // avoid clipping of the last
                    if (i / 2 === entryCount - 1 && entryCount > 1) {
                        const width = Utils.calcTextWidth(paint, label);
                        if (paint.getTextAlign() === Align.CENTER && width / 2 > offsetRight && x + width / 2 > chartWidth) {
                            x += chartWidth - x - width / 2;
                        } else if (paint.getTextAlign() === Align.LEFT && width > offsetRight && x + width > chartWidth) {
                            x += chartWidth - x - width;
                        }
                        // avoid clipping of the first
                    } else if (i === 0) {
                        const width = Utils.calcTextWidth(paint, label);
                        if (paint.getTextAlign() === Align.CENTER && width / 2 > offsetLeft && x < width / 2) {
                            x += x - width / 2;
                        } else if (paint.getTextAlign() === Align.RIGHT && width > offsetLeft && x < width) {
                            x += x - width;
                        }
                    }
                }
                this.drawLabel(c, label, x, pos, anchor, labelRotationAngleDegrees, paint, customRenderFunction);
            }
        }
    }

    protected drawLabel(c: Canvas, formattedLabel, x, y, anchor: MPPointF, angleDegrees, paint, customRenderFunction?: CustomRendererLabelFunction) {
        if (customRenderFunction) {
            customRenderFunction(c, this, formattedLabel, x, y, paint, anchor, angleDegrees);
        } else {
            Utils.drawXAxisValue(c, formattedLabel, x, y, paint, anchor, angleDegrees);
        }
    }

    /**
     * Draw the mark tickets on the specified y-position
     * @param c
     * @param pos
     * @param length
     */
    protected drawMarkTick(c: Canvas, pos, ticklength) {
        const axis = this.xAxis;
        if (!axis.drawMarkTicks) return;

        const customRender = axis.customRenderer;
        const customRenderFunction = customRender && customRender.drawMarkTick;
        const length = this.mAxis.mEntryCount * 2;
        if (!this.mRenderGridLinesBuffer || this.mRenderGridLinesBuffer.length !== length) {
            this.mRenderGridLinesBuffer = Utils.createArrayBuffer(length);
        }
        const positionsBuffer = this.mRenderGridLinesBuffer;
        for (let i = 0; i < length; i += 2) {
            positionsBuffer[i] = axis.mEntries[i / 2];
            if (i + 1 < length) {
                positionsBuffer[i + 1] = 0;
            }
        }
        const points = Utils.pointsFromBuffer(positionsBuffer);
        this.transformer.pointValuesToPixel(points);

        const paint = this.axisLinePaint;
        for (let i = 0; i < length; i += 2) {
            const x = points[i];
            if (customRenderFunction) {
                customRenderFunction(c, this, x, pos, x, pos + ticklength, paint);
            } else {
                c.drawLine(x, pos, x, pos + ticklength, paint);
            }
        }
    }

    public renderGridLines(c: Canvas) {
        const axis = this.xAxis;
        if (!axis.drawGridLines || !axis.enabled) return;

        const clipRestoreCount = c.save();
        c.clipRect(this.getGridClippingRect());

        const length = this.mAxis.mEntryCount * 2;
        if (!this.mRenderGridLinesBuffer || this.mRenderGridLinesBuffer.length !== length) {
            this.mRenderGridLinesBuffer = Utils.createArrayBuffer(length);
        }
        const positionsBuffer = this.mRenderGridLinesBuffer;

        for (let i = 0; i < length; i += 2) {
            positionsBuffer[i] = axis.mEntries[i / 2];
            positionsBuffer[i + 1] = axis.mEntries[i / 2];
        }

        const positions = Utils.pointsFromBuffer(positionsBuffer);
        this.transformer.pointValuesToPixel(positions);

        const paint = this.gridPaint;
        paint.setColor(this.xAxis.gridColor);
        paint.setStrokeWidth(this.xAxis.gridLineWidth);
        paint.setPathEffect(this.xAxis.gridDashPathEffect);

        // const gridLinePath = this.mRenderGridLinesPath;
        // gridLinePath.reset();

        const customRender = axis.customRenderer;
        const customRenderFunction = customRender && customRender.drawGridLine;
        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        for (let i = 0; i < positions.length; i += 2) {
            this.drawGridLine(c, rect, positions[i], positions[i + 1], axis.mEntries[i / 2], paint, customRenderFunction);
        }

        c.restoreToCount(clipRestoreCount);
    }

    public getGridClippingRect() {
        const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;

        const gridClippingRect = Utils.getTempRectF();
        gridClippingRect.set(rect);
        gridClippingRect.inset(-this.mAxis.gridLineWidth, 0);
        return gridClippingRect;
    }

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
            customRendererFunc(c, this, rect, x, y, axisValue, paint);
        } else {
            c.drawLine(x, rect.bottom, x, rect.top, paint);
        }
    }

    /**
     * Draws the LimitLines associated with this axis to the screen.
     *
     * @param c
     */
    public renderLimitLines(c: Canvas) {
        const axis = this.xAxis;
        if (!axis.drawLimitLines || !axis.enabled) {
            return;
        }
        const limitLines = axis.limitLines;

        if (limitLines == null || limitLines.length <= 0) return;

        const position = Utils.getTempArray(2);
        position[0] = 0;
        position[1] = 0;

        const rect = axis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;
        const clipToContent = axis.clipLimitLinesToContent;
        const customRender = axis.customRenderer;
        const customRenderFunction = customRender && customRender.drawLimitLine;
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

            position[0] = l.limit;
            position[1] = 0;

            this.transformer.pointValuesToPixel(position);

            if (lineWidth > 0) {
                this.renderLimitLineLine(c, l, rect, position[0], customRenderFunction);
            }
            this.renderLimitLineLabel(c, l, position, l.yOffset);

            if (clipToContent) {
                c.restore();
            }
        }
    }

    public renderLimitLineLine(c: Canvas, limitLine: LimitLine, rect: RectF, x: number, customRendererFunc?: CustomRendererLimitLineFunction) {
        const paint = this.limitLinePaint;
        paint.setColor(limitLine.lineColor);
        paint.setStrokeWidth(limitLine.lineWidth);
        paint.setPathEffect(limitLine.dashPathEffect);
        if (customRendererFunc) {
            customRendererFunc(c, this, limitLine, rect, x, paint);
        } else {
            c.drawLine(x, rect.bottom, x, rect.top, paint);
        }
    }

    public renderLimitLineLabel(c: Canvas, limitLine: LimitLine, position, yOffset) {
        const label = limitLine.label;
        // if drawing the limit-value label is enabled
        if (label && label !== '') {
            const rect = this.mAxis.ignoreOffsets ? this.mViewPortHandler.chartRect : this.mViewPortHandler.contentRect;

            const paint = this.limitLinePaint;
            paint.setFont(limitLine.typeface);
            paint.setStyle(limitLine.textStyle);
            paint.setPathEffect(null);
            paint.setColor(limitLine.textColor);
            paint.setStrokeWidth(0.5);

            const xOffset = limitLine.lineWidth + limitLine.xOffset;

            const labelPosition = limitLine.labelPosition;
            const needsSize =
                limitLine.ensureVisible || labelPosition === LimitLabelPosition.CENTER_TOP || labelPosition === LimitLabelPosition.RIGHT_TOP || labelPosition === LimitLabelPosition.LEFT_TOP;
            let size: { width: number; height: number };

            if (needsSize) {
                size = Utils.calcTextSize(paint, label);
            }

            switch (labelPosition) {
                case LimitLabelPosition.CENTER_TOP: {
                    paint.setTextAlign(Align.CENTER);
                    let x = position[0];
                    if (limitLine.ensureVisible) {
                        x = Math.max(size.width / 2, Math.min(rect.right - size.width / 2, x));
                    }
                    c.drawText(label, x, rect.top + yOffset + size.height, paint);
                    break;
                }
                case LimitLabelPosition.CENTER_BOTTOM: {
                    paint.setTextAlign(Align.CENTER);
                    let x = position[0];
                    if (limitLine.ensureVisible) {
                        x = Math.max(size.width / 2, Math.min(rect.right - size.width / 2, x));
                    }
                    c.drawText(label, x, rect.bottom - yOffset, paint);
                    break;
                }
                case LimitLabelPosition.RIGHT_TOP: {
                    paint.setTextAlign(Align.LEFT);
                    let x = position[0] + xOffset;
                    if (limitLine.ensureVisible && x > rect.right - size.width) {
                        x = position[0] - xOffset;
                        paint.setTextAlign(Align.RIGHT);
                    }
                    c.drawText(label, x, rect.top + yOffset + size.height, paint);
                    break;
                }
                case LimitLabelPosition.RIGHT_BOTTOM: {
                    paint.setTextAlign(Align.LEFT);
                    let x = position[0] + xOffset;
                    if (limitLine.ensureVisible && x > rect.right - size.width) {
                        x = position[0] - xOffset;
                        paint.setTextAlign(Align.RIGHT);
                    }
                    c.drawText(label, x, rect.bottom - yOffset, paint);
                    break;
                }
                case LimitLabelPosition.LEFT_TOP: {
                    paint.setTextAlign(Align.RIGHT);
                    let x = position[0] - xOffset;

                    if (limitLine.ensureVisible && x < size.width) {
                        x = position[0] + xOffset;
                        paint.setTextAlign(Align.LEFT);
                    }
                    c.drawText(label, x, rect.top + yOffset + size.height, paint);
                    break;
                }
                case LimitLabelPosition.LEFT_BOTTOM: {
                    paint.setTextAlign(Align.RIGHT);
                    let x = position[0] - xOffset;

                    if (limitLine.ensureVisible && x < size.width) {
                        x = position[0] + xOffset;
                        paint.setTextAlign(Align.LEFT);
                    }
                    c.drawText(label, x, rect.bottom - yOffset, paint);
                    break;
                }
            }
        }
    }
}
