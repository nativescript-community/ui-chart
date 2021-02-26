import { AxisRenderer, CustomRendererGridLineFunction } from './AxisRenderer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { AxisDependency, YAxis, YAxisLabelPosition } from '../components/YAxis';
import { Transformer } from '../utils/Transformer';
import { Align, Canvas, Paint, Path, RectF, Style } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';
import { LimitLabelPosition } from '../components/LimitLine';
import { profile } from '@nativescript/core/profiling';

export class YAxisRenderer extends AxisRenderer {
    protected mYAxis: YAxis;

    protected mZeroLinePaint: Paint;

    protected mGridClippingRect = new RectF(0, 0, 0, 0);
    protected mGetTransformedPositionsBuffer = Utils.createArrayBuffer(2);

    protected mDrawZeroLinePath = new Path();
    protected mZeroLineClippingRect = new RectF(0, 0, 0, 0);

    protected mRenderLimitLines = new Path();
    protected mRenderLimitLinesBuffer;
    protected mLimitLineClippingRect = new RectF(0, 0, 0, 0);

    constructor(viewPortHandler: ViewPortHandler, yAxis: YAxis, trans: Transformer) {
        super(viewPortHandler, trans, yAxis);

        this.mYAxis = yAxis;

        if (this.mViewPortHandler != null) {
            this.mAxisLabelPaint.setColor('black');
            this.mAxisLabelPaint.setAntiAlias(true);

            this.mZeroLinePaint = new Paint();
            this.mZeroLinePaint.setAntiAlias(true);
            this.mZeroLinePaint.setColor('gray');
            this.mZeroLinePaint.setStrokeWidth(1);
            this.mZeroLinePaint.setStyle(Style.STROKE);
        }

        this.mRenderLimitLinesBuffer = Utils.createNativeArray(2);
    }

    /**
     * draws the y-axis labels to the screen
     */
    @profile
    public renderAxisLabels(c: Canvas) {
        const axis = this.mYAxis;
        if (!axis.isEnabled() || !axis.isDrawLabelsEnabled()) return;

        const positions = this.getTransformedPositions();

        this.mAxisLabelPaint.setFont(axis.getFont());
        this.mAxisLabelPaint.setColor(axis.getTextColor());

        const xoffset = axis.getXOffset();
        const yoffset = Utils.calcTextHeight(this.mAxisLabelPaint, 'A') / 2.5 + axis.getYOffset();
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
                this.mAxisLabelPaint.setTextAlign(Align.RIGHT);
                xPos = offsetLeft - xoffset;
            } else {
                this.mAxisLabelPaint.setTextAlign(Align.LEFT);
                xPos = offsetLeft + xoffset;
            }
        } else {
            if (labelPosition === YAxisLabelPosition.OUTSIDE_CHART) {
                this.mAxisLabelPaint.setTextAlign(Align.LEFT);
                xPos = rect.right + xoffset;
            } else {
                this.mAxisLabelPaint.setTextAlign(Align.RIGHT);
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

        this.mAxisLinePaint.setColor(axis.getAxisLineColor());
        this.mAxisLinePaint.setStrokeWidth(axis.getAxisLineWidth());

        const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
        if (axis.getAxisDependency() === AxisDependency.LEFT) {
            c.drawLine(rect.left, rect.top, rect.left, rect.bottom, this.mAxisLinePaint);
        } else {
            c.drawLine(rect.right, rect.top, rect.right, rect.bottom, this.mAxisLinePaint);
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
        for (let i = from; i < to; i++) {
            const text = mYAxis.getFormattedLabel(i);

            c.drawText(text, fixedPosition, positions[i * 2 + 1] + offset, this.mAxisLabelPaint);
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
        for (let i = from; i < to; i++) {
            c.drawLine(fixedPosition, positions[i * 2 + 1], fixedPosition + ticklength, positions[i * 2 + 1], this.mAxisLinePaint);
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

            this.mGridPaint.setColor(axis.getGridColor());
            this.mGridPaint.setStrokeWidth(axis.getGridLineWidth());
            this.mGridPaint.setPathEffect(axis.getGridDashPathEffect());

            const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
            const paint = this.mGridPaint;
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
        this.mGridClippingRect.set(rect);
        this.mGridClippingRect.inset(0, -this.mAxis.getGridLineWidth());
        return this.mGridClippingRect;
    }

    /**
     * Calculates the path for a grid line.
     *
     * @param p
     * @param i
     * @param positions
     * @return
     */
    // protected linePath(p: Path, i, positions) {
    //     p.setLines([this.mViewPortHandler.offsetLeft(), positions[i + 1], rect.right, positions[i + 1]]);
    //     // p.moveTo(this.mViewPortHandler.offsetLeft(), positions[i + 1]);
    //     // p.lineTo(rect.right, positions[i + 1]);

    //     return p;
    // }

    /**
     * Transforms the values contained in the axis entries to screen pixels and returns them in form of a let array
     * of x- and y-coordinates.
     *
     * @return
     */
    protected getTransformedPositions() {
        const axis = this.mYAxis;
        const length = axis.mEntryCount * 2;
        if (this.mGetTransformedPositionsBuffer.length !== length) {
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
        this.mZeroLineClippingRect.set(rect);
        this.mZeroLineClippingRect.inset(0, -axis.getZeroLineWidth());
        c.clipRect(this.mZeroLineClippingRect);

        // draw zero line
        const pos = this.mTrans.getPixelForValues(0, 0);

        this.mZeroLinePaint.setColor(axis.getZeroLineColor());
        this.mZeroLinePaint.setStrokeWidth(axis.getZeroLineWidth());

        const zeroLinePath = this.mDrawZeroLinePath;
        zeroLinePath.reset();

        zeroLinePath.moveTo(rect.left, pos.y);
        zeroLinePath.lineTo(rect.right, pos.y);

        // draw a path because lines don't support dashing on lower android versions
        c.drawPath(zeroLinePath, this.mZeroLinePaint);

        c.restoreToCount(clipRestoreCount);
    }

    /**
     * Draws the LimitLines associated with this axis to the screen.
     *
     * @param c
     */
    public renderLimitLines(c: Canvas) {
        const limitLines = this.mYAxis.getLimitLines();

        if (limitLines == null || limitLines.length <= 0) return;

        const pts = this.mRenderLimitLinesBuffer;
        pts[0] = 0;
        pts[1] = 0;
        const limitLinePath = this.mRenderLimitLines;
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

            if (!l.isEnabled()) continue;
            const lineWidth = l.getLineWidth();
            const clipRestoreCount = c.save();
            this.mLimitLineClippingRect.set(rect);
            this.mLimitLineClippingRect.inset(0, -lineWidth);
            c.clipRect(this.mLimitLineClippingRect);

            this.mLimitLinePaint.setStyle(Style.STROKE);
            this.mLimitLinePaint.setColor(l.getLineColor());
            this.mLimitLinePaint.setStrokeWidth(lineWidth);
            this.mLimitLinePaint.setPathEffect(l.getDashPathEffect());

            pts[1] = l.getLimit();
            this.mTrans.pointValuesToPixel(pts);

            if (lineWidth > 0) {
                limitLinePath.moveTo(rect.left, pts[1]);
                limitLinePath.lineTo(rect.right, pts[1]);
                c.drawPath(limitLinePath, this.mLimitLinePaint);
                limitLinePath.reset();
            }
            // c.drawLines(pts, this.mLimitLinePaint);

            const label = l.getLabel();

            // if drawing the limit-value label is enabled
            if (label && label !== '') {
                this.mLimitLinePaint.setStyle(l.getTextStyle());
                this.mLimitLinePaint.setPathEffect(null);
                this.mLimitLinePaint.setColor(l.getTextColor());
                this.mLimitLinePaint.setFont(l.getFont());
                this.mLimitLinePaint.setStrokeWidth(0.5);

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
