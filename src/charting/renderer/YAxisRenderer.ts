import { AxisRenderer, CustomRendererGridLineFunction } from './AxisRenderer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { AxisDependency, YAxis, YAxisLabelPosition } from '../components/YAxis';
import { Transformer } from '../utils/Transformer';
import { Align, Canvas, Paint, Path, RectF, Style, TypedArray } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';
import { LimitLabelPosition } from '../components/LimitLine';
import { profile } from '@nativescript/core/profiling';

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
    @profile
    public renderAxisLabels(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.isEnabled() || !axis.isDrawLabelsEnabled()) return;

        const positions = this.getTransformedPositions();
        const paint = this.axisLabelsPaint;

        paint.setFont(axis.getFont());
        paint.setColor(axis.getTextColor());

        const xoffset = axis.getXOffset();
        const yoffset = Utils.calcTextHeight(paint, 'A') / 2.5 + axis.getYOffset();
        const dependency = axis.getAxisDependency();
        const labelPosition = axis.getLabelPosition();

        let xPos = 0;
        let offsetLeft = 0;
        let rect: RectF;
        if (this.mAxis.isIgnoringOffsets()) {
            rect = this.mViewPortHandler.getChartRect();
        } else {
            rect = this.mViewPortHandler.getContentRect();
            offsetLeft = this.mViewPortHandler.offsetLeft();
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
            this.drawMarkTicket(c, rect.left, positions, -xoffset / 2);
        } else {
            this.drawMarkTicket(c, rect.right, positions, +xoffset / 2);
        }
    }

    public renderAxisLine(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.isEnabled() || !axis.isDrawAxisLineEnabled() || axis.getAxisLineWidth() === 0 || axis.mEntryCount === 0) return;
        const paint = this.axisLinePaint;

        paint.setColor(axis.getAxisLineColor());
        paint.setStrokeWidth(axis.getAxisLineWidth());

        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        if (axis.getAxisDependency() === AxisDependency.LEFT) {
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
    @profile
    protected drawYLabels(c: Canvas, fixedPosition, positions, offset) {
        const mYAxis = this.mYAxis;
        const from = mYAxis.isDrawBottomYLabelEntryEnabled() ? 0 : 1;
        const to = mYAxis.isDrawTopYLabelEntryEnabled() ? mYAxis.mEntryCount : mYAxis.mEntryCount - 1;
        // draw
        const paint = this.axisLabelsPaint;
        for (let i = from; i < to; i++) {
            const text = mYAxis.getFormattedLabel(i);
            if (text) {
                c.drawText(text + '', fixedPosition, positions[i * 2 + 1] + offset, paint);
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

    protected drawMarkTicket(c: Canvas, fixedPosition, positions, ticklength) {
        const mYAxis = this.mYAxis;
        if (!mYAxis.isDrawMarkTicksEnabled()) return;

        const from = mYAxis.isDrawBottomYLabelEntryEnabled() ? 0 : 1;
        const to = mYAxis.isDrawTopYLabelEntryEnabled() ? mYAxis.mEntryCount : mYAxis.mEntryCount - 1;

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
            customRendererFunc(c, this, rect, x, y, axisValue, paint);
        } else {
            c.drawLine(rect.left, y, rect.right, y, paint);
        }
    }
    public renderGridLines(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.isEnabled()) return;

        if (axis.isDrawGridLinesEnabled()) {
            const clipRestoreCount = c.save();
            c.clipRect(this.getGridClippingRect());

            const positions = this.getTransformedPositions();
            const paint = this.gridPaint;

            paint.setColor(axis.getGridColor());
            paint.setStrokeWidth(axis.getGridLineWidth());
            paint.setPathEffect(axis.getGridDashPathEffect());

            const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
            const customRender = axis.getCustomRenderer();
            const customRenderFunction = customRender && customRender.drawGridLine;
            for (let i = 0; i < positions.length; i += 2) {
                this.drawGridLine(c, rect, positions[i], positions[i + 1], axis.mEntries[i / 2], paint, customRenderFunction);
            }

            c.restoreToCount(clipRestoreCount);
        }

        if (axis.isDrawZeroLineEnabled()) {
            this.drawZeroLine(c);
        }
    }

    public getGridClippingRect() {
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        const gridClippingRect = Utils.getTempRectF();
        gridClippingRect.set(rect);
        gridClippingRect.inset(0, -this.mAxis.getGridLineWidth());
        return gridClippingRect;
    }

    /**
     * Transforms the values contained in the axis entries to screen pixels and returns them in form of a let array
     * of x- and y-coordinates.
     *
     * @return
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
        this.mTrans.pointValuesToPixel(result);
        return Utils.nativeArrayToArray(result);
    }

    /**
     * Draws the zero line.
     */
    protected drawZeroLine(c: Canvas) {
        const axis = this.mYAxis;
        const clipRestoreCount = c.save();
        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        const zeroLineClippingRectl = Utils.getTempRectF();
        zeroLineClippingRectl.set(rect);
        zeroLineClippingRectl.inset(0, -axis.getZeroLineWidth());
        c.clipRect(zeroLineClippingRectl);

        // draw zero line
        const pos = this.mTrans.getPixelForValues(0, 0);
        const paint = this.zeroLinePaint;
        paint.setColor(axis.getZeroLineColor());
        paint.setStrokeWidth(axis.getZeroLineWidth());

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
        const limitLines = axis.getLimitLines();

        if (limitLines == null || limitLines.length <= 0) return;

        const pts = Utils.getTempArray(2);
        pts[0] = 0;
        pts[1] = 0;
        let offsetLeft = 0;
        let rect: RectF;
        if (axis.isIgnoringOffsets()) {
            rect = this.mViewPortHandler.getChartRect();
        } else {
            rect = this.mViewPortHandler.getContentRect();
            offsetLeft = this.mViewPortHandler.offsetLeft();
        }

        const customRender = axis.getCustomRenderer();
        const customRendererFunc = customRender && customRender.drawLimitLine;
        const clipToContent = axis.clipLimitLinesToContent;
        for (let i = 0; i < limitLines.length; i++) {
            const l = limitLines[i];

            if (!l.isEnabled()) continue;
            const lineWidth = l.getLineWidth();
            if (clipToContent) {
                c.save();
                const clipRect = Utils.getTempRectF();
                clipRect.set(rect);
                clipRect.inset(0, -lineWidth);
                c.clipRect(clipRect);
            }

            const paint = this.limitLinePaint;
            paint.setColor(l.getLineColor());
            paint.setStrokeWidth(lineWidth);
            paint.setPathEffect(l.getDashPathEffect());

            pts[1] = l.getLimit();
            this.mTrans.pointValuesToPixel(pts);

            if (lineWidth > 0) {
                if (customRendererFunc) {
                    customRendererFunc(c, this, l, rect, pts[1], paint);
                } else {
                    c.drawLine(rect.left, pts[1], rect.right, pts[1], paint);
                }
            }

            const label = l.getLabel();

            // if drawing the limit-value label is enabled
            if (label && label !== '') {
                paint.setStyle(l.getTextStyle());
                paint.setPathEffect(null);
                paint.setColor(l.getTextColor());
                paint.setFont(l.getFont());
                paint.setStrokeWidth(0.5);

                const labelLineHeight = Utils.calcTextHeight(paint, label);
                const xOffset = 4 + l.getXOffset();
                const yOffset = l.getLineWidth() + labelLineHeight + l.getYOffset();

                const position = l.getLabelPosition();
                switch (position) {
                    case LimitLabelPosition.RIGHT_TOP: {
                        paint.setTextAlign(Align.RIGHT);
                        c.drawText(label, rect.right - xOffset, pts[1] - yOffset + labelLineHeight, paint);
                        break;
                    }
                    case LimitLabelPosition.RIGHT_BOTTOM: {
                        paint.setTextAlign(Align.RIGHT);
                        c.drawText(label, rect.right - xOffset, pts[1] + yOffset, paint);
                        break;
                    }
                    case LimitLabelPosition.CENTER_TOP: {
                        paint.setTextAlign(Align.RIGHT);
                        c.drawText(label, rect.right, pts[1] - yOffset + labelLineHeight, paint);
                        break;
                    }
                    case LimitLabelPosition.CENTER_BOTTOM: {
                        paint.setTextAlign(Align.CENTER);
                        c.drawText(label, rect.right, pts[1] + yOffset, paint);
                        break;
                    }
                    case LimitLabelPosition.LEFT_TOP: {
                        paint.setTextAlign(Align.LEFT);
                        c.drawText(label, rect.left + xOffset, pts[1] - yOffset + labelLineHeight, paint);
                        break;
                    }
                    case LimitLabelPosition.LEFT_BOTTOM: {
                        paint.setTextAlign(Align.LEFT);
                        c.drawText(label, offsetLeft + xOffset, pts[1] + yOffset, paint);
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
