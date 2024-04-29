import { Align, Canvas, Paint, Path, RectF } from '@nativescript-community/ui-canvas';
import { profile } from '@nativescript/core';
import { AxisBase } from '../components/AxisBase';
import { LimitLine } from '../components/LimitLine';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { BaseCustomRenderer } from './DataRenderer';
import { Renderer } from './Renderer';
import { MPPointF } from '../utils/MPPointF';

export type CustomRendererZeroLineFunction = (c: Canvas, axis: AxisBase, zeroPos: MPPointF, path: Path, paint: Paint) => void;
export type CustomRendererGridLineFunction = (c: Canvas, axis: AxisBase, rect: RectF, x, y, axisValue, paint: Paint) => void;
export type CustomRendererLimitLineFunction = (c: Canvas, axis: AxisBase, limitLine: LimitLine, rect: RectF, x: number, paint: Paint) => void;
export type CustomRendererLabelFunction = (c: Canvas, axis: AxisBase, text: string, x: number, y: number, paint: Paint, anchor?: MPPointF, angleDegrees?: number) => void;
export type CustomRendererTickFunction = (c: Canvas, renderer: AxisRenderer, startX: number, startY: number, stopX: number, stopY: number, paint: Paint) => void;
export interface CustomRenderer extends BaseCustomRenderer {
    drawLabel?: CustomRendererLabelFunction;
    drawGridLine?: CustomRendererGridLineFunction;
    drawZeroLine?: CustomRendererZeroLineFunction;
    drawLimitLine?: CustomRendererLimitLineFunction;
    drawMarkTick?: CustomRendererTickFunction;
}

/**
 * Baseclass of all axis renderers.
 *

 */
export abstract class AxisRenderer extends Renderer {
    /** base axis this axis renderer works with */
    protected mAxis: AxisBase;

    /** transformer to transform values to screen pixels and return */
    readonly transformer: Transformer;

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

        this.transformer = trans;
        this.mAxis = axis;
    }

    /**
     * Returns the Paint object that is used for drawing the axis-line that goes
     * alongside the axis.
     */
    get axisLinePaint() {
        if (!this.mAxisLinePaint) {
            this.mAxisLinePaint = Utils.getTemplatePaint('black-stroke');
        }
        return this.mAxisLinePaint;
    }

    get limitLinePaint() {
        if (!this.mLimitLinePaint) {
            this.mLimitLinePaint = Utils.getTemplatePaint('black-stroke');
        }
        return this.mLimitLinePaint;
    }

    /**
     * Returns the Paint object used for drawing the axis (labels).
     */
    get axisLabelsPaint() {
        if (!this.mAxisLabelPaint) {
            this.mAxisLabelPaint = this.createAxisLabelsPaint();
        }
        return this.mAxisLabelPaint;
    }

    protected createAxisLabelsPaint() {
        const paint = Utils.getTemplatePaint('black-fill');
        paint.setTextAlign(Align.LEFT);
        return paint;
    }

    /**
     * Returns the Paint object that is used for drawing the grid-lines of the
     * axis.
     */
    public get gridPaint() {
        if (!this.mGridPaint) {
            this.mGridPaint = Utils.getTemplatePaint('grid');
        }
        return this.mGridPaint;
    }

    public getCurrentMinMax(min?, max?, inverted?) {
        if (min === undefined || max === undefined || inverted === undefined) {
            const axis = this.mAxis;
            if (min === undefined) {
                min = axis.axisMinimum;
            }
            if (max === undefined) {
                max = axis.axisMaximum;
            }
            if (inverted === undefined) {
                inverted = axis['isInverted'] ? axis['isInverted']() : false;
            }
        }
        const viewPortHandler = this.mViewPortHandler;
        if (viewPortHandler?.contentRect.width() > 10 && !viewPortHandler.isFullyZoomedOutY()) {
            const rect = this.mAxis.ignoreOffsets ? viewPortHandler.chartRect : viewPortHandler.contentRect;
            const p1 = this.transformer.getValuesByTouchPoint(rect.left, rect.top);
            const p2 = this.transformer.getValuesByTouchPoint(rect.left, rect.bottom);

            if (!inverted) {
                min = p2.y;
                max = p1.y;
            } else {
                min = p1.y;
                max = p2.y;
            }
        }
        return { min, max };
    }

    /**
     * Computes the axis values.
     *
     * @param min - the minimum value in the data object for this axis
     * @param max - the maximum value in the data object for this axis
     */
    public computeAxis(min, max, inverted) {
        const axis = this.mAxis;
        if (!axis.enabled) {
            return;
        }
        // calculate the starting and entry polet of the y-labels (depending on
        // zoom / contentrect bounds)

        const result = this.getCurrentMinMax(min, max, inverted);
        this.computeAxisValues(result.min, result.max);
    }

    /**
     * Sets up the axis values. Computes the desired number of labels between the two given extremes.
     */
    protected computeAxisValues(min, max) {
        const axis = this.mAxis;
        const yMin = min;
        const yMax = max;

        const labelCount = axis.labelCount;
        const range = Math.abs(yMax - yMin);

        if (labelCount === 0 || range <= 0 || !Number.isFinite(range)) {
            axis.mEntries = [];
            axis.mLabels = [];
            axis.mCenteredEntries = [];
            axis.mEntryCount = 0;
            return;
        }

        // Find out how much spacing (in y value space) between axis values
        const rawInterval = range / (labelCount - 1);
        let interval = axis.forcedInterval > 0 ? axis.forcedInterval : axis.ensureLastLabel ? rawInterval : Utils.roundToNextSignificant(rawInterval);
        // If granularity is enabled, then do not allow the interval to go below specified granularity.
        // This is used to avoid repeated values when rounding values for display.
        if (axis.granularity && interval < axis.granularity) {
            interval = axis.granularity;
        }

        // Normalize interval
        const intervalMagnitude = Utils.roundToNextSignificant(Math.pow(10, Math.log10(interval)));
        const intervalSigDigit = interval / intervalMagnitude;
        if (intervalSigDigit > 5) {
            // Use one order of magnitude higher, to avoid intervals like 0.9 or
            // 90
            interval = Math.floor(10 * intervalMagnitude);
        }

        let n = axis.centerAxisLabels ? 1 : 0;

        const formatter = axis.valueFormatter;
        // force label count
        if (axis.forceLabelsEnabled) {
            interval = range / (labelCount - 1);
            axis.mEntryCount = Math.floor(labelCount);

            if (axis.mEntries.length < axis.mEntryCount) {
                // Ensure stops contains at least numStops elements.
                axis.mEntries = [];
                axis.mLabels = [];
            }

            let v = min;

            for (let i = 0; i < axis.mEntryCount; i++) {
                if (axis.ensureLastLabel && i === axis.mEntryCount - 1) {
                    v = max;
                }
                axis.mEntries[i] = v;
                axis.mLabels[i] = formatter.getAxisLabel(v, axis);
                v += interval;
            }
            n = axis.mEntryCount;

            // no forced count
        } else {
            // if we use  Math.ceil(yMin / interval) * interval and the min value is 20
            // then we will see 0 as axis first when it should be 20
            // let first = interval === 0 ? 0 : Math.ceil(yMin / interval) * interval;
            let first = interval === 0 ? 0 : Math.ceil(yMin / interval) * interval;
            if (axis.centerAxisLabels) {
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
            // if (axis.ensureLastLabel && (n - 1) * interval < last) {
            //     n++;
            // }

            axis.mEntryCount = n;

            if (axis.mEntries.length < n) {
                // Ensure stops contains at least numStops elements.
                axis.mEntries = [];
                axis.mLabels = [];
            }

            for (f = first, i = 0; i <= n; f += interval, ++i) {
                if (f === 0.0) {
                    // Fix for negative zero case (Where value === -0.0, and 0.0 === -0.0)
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

        if (axis.centerAxisLabels) {
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
