import { AxisRenderer } from './AxisRenderer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { AxisDependency, YAxis, YAxisLabelPosition } from '../components/YAxis';
import { Transformer } from '../utils/Transformer';
import { Align, Canvas, Paint, Path, RectF, Style } from 'nativescript-canvas';
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
            this.mAxisLabelPaint.setTextSize(10);

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
        if (!this.mYAxis.isEnabled() || !this.mYAxis.isDrawLabelsEnabled()) return;

        const positions = this.getTransformedPositions();

        this.mAxisLabelPaint.setTypeface(this.mYAxis.getTypeface());
        this.mAxisLabelPaint.setTextSize(this.mYAxis.getTextSize());
        this.mAxisLabelPaint.setColor(this.mYAxis.getTextColor());

        const xoffset = this.mYAxis.getXOffset();
        const yoffset = Utils.calcTextHeight(this.mAxisLabelPaint, 'A') / 2.5 + this.mYAxis.getYOffset();
        const dependency = this.mYAxis.getAxisDependency();
        const labelPosition = this.mYAxis.getLabelPosition();

        let xPos = 0;

        if (dependency === AxisDependency.LEFT) {
            if (labelPosition === YAxisLabelPosition.OUTSIDE_CHART) {
                this.mAxisLabelPaint.setTextAlign(Align.RIGHT);
                xPos = this.mViewPortHandler.offsetLeft() - xoffset;
            } else {
                this.mAxisLabelPaint.setTextAlign(Align.LEFT);
                xPos = this.mViewPortHandler.offsetLeft() + xoffset;
            }
        } else {
            if (labelPosition === YAxisLabelPosition.OUTSIDE_CHART) {
                this.mAxisLabelPaint.setTextAlign(Align.LEFT);
                xPos = this.mViewPortHandler.contentRight() + xoffset;
            } else {
                this.mAxisLabelPaint.setTextAlign(Align.RIGHT);
                xPos = this.mViewPortHandler.contentRight() - xoffset;
            }
        }

        this.drawYLabels(c, xPos, positions, yoffset);
        if (dependency === AxisDependency.LEFT) {
            this.drawMarkTicket(c, this.mViewPortHandler.contentLeft(), positions, -xoffset / 2);
        } else {
            this.drawMarkTicket(c, this.mViewPortHandler.contentRight(), positions, +xoffset / 2);
        }
    }

    public renderAxisLine(c: Canvas) {
        if (!this.mYAxis.isEnabled() || !this.mYAxis.isDrawAxisLineEnabled() || this.mYAxis.getAxisLineWidth() === 0) return;

        this.mAxisLinePaint.setColor(this.mYAxis.getAxisLineColor());
        this.mAxisLinePaint.setStrokeWidth(this.mYAxis.getAxisLineWidth());

        if (this.mYAxis.getAxisDependency() === AxisDependency.LEFT) {
            c.drawLine(this.mViewPortHandler.contentLeft(), this.mViewPortHandler.contentTop(), this.mViewPortHandler.contentLeft(), this.mViewPortHandler.contentBottom(), this.mAxisLinePaint);
        } else {
            c.drawLine(this.mViewPortHandler.contentRight(), this.mViewPortHandler.contentTop(), this.mViewPortHandler.contentRight(), this.mViewPortHandler.contentBottom(), this.mAxisLinePaint);
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

    public renderGridLines(c: Canvas) {
        if (!this.mYAxis.isEnabled()) return;

        if (this.mYAxis.isDrawGridLinesEnabled()) {
            const clipRestoreCount = c.save();
            c.clipRect(this.getGridClippingRect());

            const positions = this.getTransformedPositions();

            this.mGridPaint.setColor(this.mYAxis.getGridColor());
            this.mGridPaint.setStrokeWidth(this.mYAxis.getGridLineWidth());
            this.mGridPaint.setPathEffect(this.mYAxis.getGridDashPathEffect());

            // const gridLinePath = this.mRenderGridLinesPath;
            // gridLinePath.reset();

            // draw the grid
            for (let i = 0; i < positions.length; i += 2) {
                // draw a path because lines don't support dashing on lower android versions
                c.drawLine(this.mViewPortHandler.offsetLeft(), positions[i + 1], this.mViewPortHandler.contentRight(), positions[i + 1], this.mGridPaint);
                // c.drawPath(this.linePath(gridLinePath, i, positions), this.mGridPaint);
                // gridLinePath.reset();
            }

            c.restoreToCount(clipRestoreCount);
        }

        if (this.mYAxis.isDrawZeroLineEnabled()) {
            this.drawZeroLine(c);
        }
    }

    public getGridClippingRect() {
        this.mGridClippingRect.set(this.mViewPortHandler.getContentRect());
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
    //     p.setLines([this.mViewPortHandler.offsetLeft(), positions[i + 1], this.mViewPortHandler.contentRight(), positions[i + 1]]);
    //     // p.moveTo(this.mViewPortHandler.offsetLeft(), positions[i + 1]);
    //     // p.lineTo(this.mViewPortHandler.contentRight(), positions[i + 1]);

    //     return p;
    // }

    /**
     * Transforms the values contained in the axis entries to screen pixels and returns them in form of a let array
     * of x- and y-coordinates.
     *
     * @return
     */
    protected getTransformedPositions() {
        const length = this.mYAxis.mEntryCount * 2;
        if (this.mGetTransformedPositionsBuffer.length !== length) {
            this.mGetTransformedPositionsBuffer = Utils.createArrayBuffer(length);
        }
        const positions = this.mGetTransformedPositionsBuffer;
        for (let i = 0; i < length; i += 2) {
            // only fill y values, x values are not needed for y-labels
            positions[i] = 0;
            positions[i + 1] = this.mYAxis.mEntries[i / 2];
        }
        const result = Utils.pointsFromBuffer(positions);
        this.mTrans.pointValuesToPixel(result);
        return Utils.nativeArrayToArray(result);
    }

    /**
     * Draws the zero line.
     */
    protected drawZeroLine(c: Canvas) {
        const clipRestoreCount = c.save();
        this.mZeroLineClippingRect.set(this.mViewPortHandler.getContentRect());
        this.mZeroLineClippingRect.inset(0, -this.mYAxis.getZeroLineWidth());
        c.clipRect(this.mZeroLineClippingRect);

        // draw zero line
        const pos = this.mTrans.getPixelForValues(0, 0);

        this.mZeroLinePaint.setColor(this.mYAxis.getZeroLineColor());
        this.mZeroLinePaint.setStrokeWidth(this.mYAxis.getZeroLineWidth());

        const zeroLinePath = this.mDrawZeroLinePath;
        zeroLinePath.reset();

        zeroLinePath.moveTo(this.mViewPortHandler.contentLeft(), pos.y);
        zeroLinePath.lineTo(this.mViewPortHandler.contentRight(), pos.y);

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

        for (let i = 0; i < limitLines.length; i++) {
            const l = limitLines[i];

            if (!l.isEnabled()) continue;
            const lineWidth = l.getLineWidth();
            const clipRestoreCount = c.save();
            this.mLimitLineClippingRect.set(this.mViewPortHandler.getContentRect());
            this.mLimitLineClippingRect.inset(0, -lineWidth);
            c.clipRect(this.mLimitLineClippingRect);

            this.mLimitLinePaint.setStyle(Style.STROKE);
            this.mLimitLinePaint.setColor(l.getLineColor());
            this.mLimitLinePaint.setStrokeWidth(lineWidth);
            this.mLimitLinePaint.setPathEffect(l.getDashPathEffect());

            pts[1] = l.getLimit();
            this.mTrans.pointValuesToPixel(pts);

            if (lineWidth > 0) {
                limitLinePath.moveTo(this.mViewPortHandler.contentLeft(), pts[1]);
                limitLinePath.lineTo(this.mViewPortHandler.contentRight(), pts[1]);
                c.drawPath(limitLinePath, this.mLimitLinePaint);
                limitLinePath.reset();
            }
            // c.drawLines(pts, this.mLimitLinePaint);

            const label = l.getLabel();

            // if drawing the limit-value label is enabled
            if (label != null && label !== '') {
                this.mLimitLinePaint.setStyle(l.getTextStyle());
                this.mLimitLinePaint.setPathEffect(null);
                this.mLimitLinePaint.setColor(l.getTextColor());
                this.mLimitLinePaint.setTypeface(l.getTypeface());
                this.mLimitLinePaint.setStrokeWidth(0.5);
                this.mLimitLinePaint.setTextSize(l.getTextSize());

                const labelLineHeight = Utils.calcTextHeight(this.mLimitLinePaint, label);
                const xOffset = 4 + l.getXOffset();
                const yOffset = l.getLineWidth() + labelLineHeight + l.getYOffset();

                const position = l.getLabelPosition();

                if (position === LimitLabelPosition.RIGHT_TOP) {
                    this.mLimitLinePaint.setTextAlign(Align.RIGHT);
                    c.drawText(label, this.mViewPortHandler.contentRight() - xOffset, pts[1] - yOffset + labelLineHeight, this.mLimitLinePaint);
                } else if (position === LimitLabelPosition.RIGHT_BOTTOM) {
                    this.mLimitLinePaint.setTextAlign(Align.RIGHT);
                    c.drawText(label, this.mViewPortHandler.contentRight() - xOffset, pts[1] + yOffset, this.mLimitLinePaint);
                } else if (position === LimitLabelPosition.LEFT_TOP) {
                    this.mLimitLinePaint.setTextAlign(Align.LEFT);
                    c.drawText(label, this.mViewPortHandler.contentLeft() + xOffset, pts[1] - yOffset + labelLineHeight, this.mLimitLinePaint);
                } else {
                    this.mLimitLinePaint.setTextAlign(Align.LEFT);
                    c.drawText(label, this.mViewPortHandler.offsetLeft() + xOffset, pts[1] + yOffset, this.mLimitLinePaint);
                }
            }

            c.restoreToCount(clipRestoreCount);
        }
    }
}
