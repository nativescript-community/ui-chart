import { Renderer } from './Renderer';
import { AxisBase } from '../components/AxisBase';
import { Align, Canvas, Paint, Path, RectF, Style } from '@nativescript-community/ui-canvas';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { BaseCustomRenderer } from './DataRenderer';
import { LimitLine } from '../components/LimitLine';

export type CustomRendererGridLineFunction = (c: Canvas, renderer: AxisRenderer, rect: RectF, x, y, axisValue, paint: Paint) => void;
export type CustomRendererLimitLineFunction = (c: Canvas, renderer: AxisRenderer, limitLine: LimitLine, rect: RectF, x: number, paint: Paint) => void;
export interface CustomRenderer extends BaseCustomRenderer {
    drawGridLine?: CustomRendererGridLineFunction;
    drawLimitLine?: CustomRendererLimitLineFunction;
}

/**
 * Baseclass of all axis renderers.
 *
 * @author Philipp Jahoda
 */
export abstract class AxisRenderer extends Renderer {
    /** base axis this axis renderer works with */
    protected mAxis: AxisBase;

    /** transformer to transform values to screen pixels and return */
    protected mTrans: Transformer;

    /**
     * palet object for the grid lines
     */
    protected mGridPaint: Paint;

    /**
     * palet for the x-label values
     */
    protected mAxisLabelPaint: Paint;

    /**
     * palet for the line surrounding the chart
     */
    protected mAxisLinePaint: Paint;

    /**
     * palet used for the limit lines
     */
    protected mLimitLinePaint: Paint;

    constructor(viewPortHandler: ViewPortHandler, trans: Transformer, axis: AxisBase) {
        super(viewPortHandler);

        this.mTrans = trans;
        this.mAxis = axis;
    }

    /**
     * Returns the Paint object that is used for drawing the axis-line that goes
     * alongside the axis.
     *
     * @return
     */
    get axisLinePaint() {
        if (!this.mAxisLinePaint) {
            this.mAxisLinePaint = new Paint();
            this.mAxisLinePaint.setColor('black');
            this.mAxisLinePaint.setAntiAlias(true);
            this.mAxisLinePaint.setStrokeWidth(1);
            this.mAxisLinePaint.setStyle(Style.STROKE);
        }
        return this.mAxisLinePaint;
    }

    get limitLinePaint() {
        if (!this.mLimitLinePaint) {
            this.mLimitLinePaint = new Paint();
            this.mLimitLinePaint.setAntiAlias(true);
            this.mLimitLinePaint.setStyle(Style.STROKE);
        }
        return this.mLimitLinePaint;
    }

    /**
     * Returns the Paint object used for drawing the axis (labels).
     *
     * @return
     */
    get axisLabelsPaint() {
        if (!this.mAxisLabelPaint) {
            this.mAxisLabelPaint = this.createAxisLabelsPaint();
        }
        return this.mAxisLabelPaint;
    }

    protected createAxisLabelsPaint() {
        const paint = new Paint();
        paint.setColor('black');
        paint.setAntiAlias(true);
        paint.setTextAlign(Align.LEFT);
        return paint;
    }

    /**
     * Returns the Paint object that is used for drawing the grid-lines of the
     * axis.
     *
     * @return
     */
    public get gridPaint() {
        if (!this.mGridPaint) {
            this.mGridPaint = new Paint();
            this.mGridPaint.setColor('gray');
            this.mGridPaint.setStrokeWidth(1);
            this.mGridPaint.setAntiAlias(true);
            this.mGridPaint.setStyle(Style.STROKE);
            this.mGridPaint.setAlpha(90);
        }
        return this.mGridPaint;
    }

    /**
     * Returns the Transformer object used for transforming the axis values.
     *
     * @return
     */
    public getTransformer() {
        return this.mTrans;
    }

    /**
     * Computes the axis values.
     *
     * @param min - the minimum value in the data object for this axis
     * @param max - the maximum value in the data object for this axis
     */
    public computeAxis(min, max, inverted) {
        // calculate the starting and entry polet of the y-labels (depending on
        // zoom / contentrect bounds)
        if (this.mViewPortHandler != null && this.mViewPortHandler.contentWidth() > 10 && !this.mViewPortHandler.isFullyZoomedOutY()) {
            const rect = this.mAxis.isIgnoringOffsets() ? this.mViewPortHandler.getChartRect() : this.mViewPortHandler.getContentRect();
            const p1 = this.mTrans.getValuesByTouchPoint(rect.left, rect.top);
            const p2 = this.mTrans.getValuesByTouchPoint(rect.left, rect.bottom);

            if (!inverted) {
                min = p2.y;
                max = p1.y;
            } else {
                min = p1.y;
                max = p2.y;
            }
        }
        this.computeAxisValues(min, max);
    }

    /**
     * Sets up the axis values. Computes the desired number of labels between the two given extremes.
     *
     * @return
     */
    protected computeAxisValues(min, max) {
        const axis = this.mAxis;
        const yMin = min;
        const yMax = max;

        const labelCount = axis.getLabelCount();
        const range = Math.abs(yMax - yMin);

        if (labelCount === 0 || range <= 0 || !Number.isFinite(range)) {
            axis.mEntries = [];
            axis.mLabels = [];
            axis.mCenteredEntries = [];
            axis.mEntryCount = 0;
            return;
        }

        // Find out how much spacing (in y value space) between axis values
        const rawInterval = range / labelCount;
        let interval = axis.isForceIntervalEnabled() ? axis.getForcedInterval() : Utils.roundToNextSignificant(rawInterval);

        // If granularity is enabled, then do not allow the interval to go below specified granularity.
        // This is used to avoid repeated values when rounding values for display.
        if (axis.isGranularityEnabled()) {
            interval = interval < axis.getGranularity() ? axis.getGranularity() : interval;
        }

        // Normalize interval
        const intervalMagnitude = Utils.roundToNextSignificant(Math.pow(10, Math.log10(interval)));
        const intervalSigDigit = interval / intervalMagnitude;
        if (intervalSigDigit > 5) {
            // Use one order of magnitude higher, to avoid intervals like 0.9 or
            // 90
            interval = Math.floor(10 * intervalMagnitude);
        }

        let n = axis.isCenterAxisLabelsEnabled() ? 1 : 0;

        const formatter = axis.getValueFormatter();
        // force label count
        if (axis.isForceLabelsEnabled()) {
            interval = range / (labelCount - 1);
            axis.mEntryCount = labelCount;

            if (axis.mEntries.length < labelCount) {
                // Ensure stops contains at least numStops elements.
                axis.mEntries = [];
                axis.mLabels = [];
            }

            let v = min;

            for (let i = 0; i < labelCount; i++) {
                axis.mEntries[i] = v;
                axis.mLabels[i] = formatter.getAxisLabel(v, axis);
                v += interval;
            }
            n = labelCount;

            // no forced count
        } else {
            // if we use  Math.ceil(yMin / interval) * interval and the min value is 20
            // then we will see 0 as axis first when it should be 20
            // let first = interval === 0 ? 0 : Math.ceil(yMin / interval) * interval;
            let first = interval === 0 ? 0 : Math.ceil(yMin / interval) * interval;
            if (axis.isCenterAxisLabelsEnabled()) {
                first -= interval;
            }
            // use Math.floor(yMax / interval) + 1 instead of
            // Math.floor(yMax / interval) to make sure the axis is showed "above" the higghest value
            let last = interval === 0 ? 0 : Utils.nextUp(Math.floor(yMax / interval) * interval);
            if (axis.ensureLastLabel && last < max) {
                last = Math.min(max, last + interval);
            }
            let f;
            let i;

            if (interval !== 0) {
                for (f = first; f <= last; f += interval) {
                    ++n;
                }
            }
            if (axis.ensureLastLabel && (n - 1) * interval < last) {
                n++;
            }

            axis.mEntryCount = n;

            if (axis.mEntries.length < n) {
                // Ensure stops contains at least numStops elements.
                axis.mEntries = [];
                axis.mLabels = [];
            }

            for (f = first, i = 0; i <= n; f += interval, ++i) {
                if (f === 0.0) {
                    // Fix for negative zero case (Where value == -0.0, and 0.0 == -0.0)
                    f = 0.0;
                } else if (!axis.allowLastLabelAboveMax && f > max) {
                    f = max;
                }

                axis.mEntries[i] = f;
                axis.mLabels[i] = formatter.getAxisLabel(f, axis);
            }
        }

        // set decimals
        if (interval < 1) {
            axis.mDecimals = Math.ceil(-Math.log10(interval));
        } else {
            axis.mDecimals = 0;
        }

        if (axis.isCenterAxisLabelsEnabled()) {
            if (axis.mCenteredEntries.length < n) {
                axis.mCenteredEntries = [];
            }

            const offset = interval / 2;

            for (let i = 0; i < n; i++) {
                axis.mCenteredEntries[i] = axis.mEntries[i] + offset;
            }
        }
    }

    /**
     * Draws the axis labels to the screen.
     *
     * @param c
     */
    public abstract renderAxisLabels(c: Canvas);

    /**
     * Draws the grid lines belonging to the axis.
     *
     * @param c
     */
    public abstract renderGridLines(c: Canvas);

    /**
     * Draws the line that goes alongside the axis.
     *
     * @param c
     */
    public abstract renderAxisLine(c: Canvas);

    /**
     * Draws the LimitLines associated with this axis to the screen.
     *
     * @param c
     */
    public abstract renderLimitLines(c: Canvas);
}
