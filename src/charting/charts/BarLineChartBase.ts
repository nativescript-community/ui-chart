import { Canvas, Matrix, Paint } from '@nativescript-community/ui-canvas';
import { EventData, Observable, Trace, profile } from '@nativescript/core';
import { getEventOrGestureName } from '@nativescript/core/ui/core/bindable';
import { GestureTypes } from '@nativescript/core/ui/gestures';
import { LegendHorizontalAlignment, LegendOrientation, LegendVerticalAlignment } from '../components/Legend';
import { XAxisPosition } from '../components/XAxis';
import { AxisDependency, YAxis } from '../components/YAxis';
import { BarLineScatterCandleBubbleData } from '../data/BarLineScatterCandleBubbleData';
import { Entry } from '../data/Entry';
import { ChartHighlighter } from '../highlight/ChartHighlighter';
import { BarLineScatterCandleBubbleDataProvider } from '../interfaces/dataprovider/BarLineScatterCandleBubbleDataProvider';
import { IBarLineScatterCandleBubbleDataSet } from '../interfaces/datasets/IBarLineScatterCandleBubbleDataSet';
import { AnimatedMoveViewJob } from '../jobs/AnimatedMoveViewJob';
import { AnimatedZoomJob } from '../jobs/AnimatedZoomJob';
import { MoveViewJob } from '../jobs/MoveViewJob';
import { ZoomJob } from '../jobs/ZoomJob';
import { BarLineChartTouchListener } from '../listener/BarLineChartTouchListener';
import { XAxisRenderer } from '../renderer/XAxisRenderer';
import { YAxisRenderer } from '../renderer/YAxisRenderer';
import { Transformer } from '../utils/Transformer';
import { CLog, CLogTypes, Utils } from '../utils/Utils';
import { Chart } from './Chart';

const LOG_TAG = 'BarLineChartBase';

export abstract class BarLineChartBase<U extends Entry, D extends IBarLineScatterCandleBubbleDataSet<U>, T extends BarLineScatterCandleBubbleData<U, D>>
    extends Chart<U, D, T>
    implements BarLineScatterCandleBubbleDataProvider
{
    chartTouchListener: BarLineChartTouchListener;

    /**
     * the maximum number of entries to which values will be drawn
     * (entry numbers greater than this value will cause value-labels to disappear)
     */
    maxVisibleValueCount = 100;

    /**
     * flag that indicates if auto scaling on the y axis is enabled
     */
    autoScaleMinMaxEnabled: boolean = true;

    /**
     * flag that indicates if pinch-zoom is enabled. if true, both x and y axis
     * can be scaled with 2 fingers, if false, x and y axis can be scaled
     * separately
     */
    pinchZoomEnabled: boolean;

    /**
     * flag that indicates if double tap zoom is enabled or not
     */
    protected mDoubleTapToZoomEnabled: boolean;

    /**
     * flag that indicates if highlighting per dragging over a fully zoomed out
     * chart is enabled
     */
    protected mHighlightPerDragEnabled: boolean;

    /**
     * flag that indicates zoomed pan gesture should only work with 2 pointers
     */
    zoomedPanWith2Pointers: boolean = false;

    /**
     * if true, dragging is enabled for the chart
     */
    dragXEnabled: boolean;
    dragYEnabled: boolean;

    private mScaleXEnabled: boolean;
    private mScaleYEnabled: boolean;

    /**
     * palet object for the (by default) lightgrey background of the grid
     */
    protected mGridBackgroundPaint: Paint;

    protected mBorderPaint: Paint;

    /**
     * flag indicating if the grid background should be drawn or not
     */
    drawGridBackgroundEnabled: boolean;

    drawBorders: boolean;

    clipValuesToContent = true;

    clipDataToContent = true;

    drawHighlight = true;

    /**
     * Sets the minimum offset (padding) around the chart, defaults to 15
     */
    minOffset = 15;

    /**
     * flag indicating if the chart should stay at the same position after a rotation. Default is false.
     */
    keepPositionOnRotation: boolean;

    /**
     * the listener for user drawing on the chart
     */
    // protected OnDrawListener this.mDrawListener;

    /**
     * the object representing the labels on the left y-axis
     */
    mAxisLeft: YAxis;

    /**
     * the object representing the labels on the right y-axis
     */
    mAxisRight: YAxis;

    protected axisRendererLeft: YAxisRenderer;
    protected axisRendererRight: YAxisRenderer;
    protected xAxisRenderer: XAxisRenderer;

    protected leftAxisTransformer: Transformer;
    protected rightAxisTransformer: Transformer;

    // /** the approximator object used for data filtering */
    // private Approximator this.mApproximator;

    protected init() {
        super.init();

        this.mAxisLeft = new YAxis(AxisDependency.LEFT, new WeakRef(this));

        this.leftAxisTransformer = new Transformer(this.viewPortHandler);

        this.axisRendererLeft = new YAxisRenderer(this.viewPortHandler, this.mAxisLeft, this.leftAxisTransformer);

        this.xAxisRenderer = new XAxisRenderer(this.viewPortHandler, this.xAxis, this.leftAxisTransformer);

        this.highlighter = new ChartHighlighter(this);
    }

    get gridBackgroundPaint() {
        if (!this.mGridBackgroundPaint) {
            this.mGridBackgroundPaint = Utils.getTemplatePaint('black-fill');
            this.mGridBackgroundPaint.setColor('#F0F0F0'); // light
        }
        return this.mGridBackgroundPaint;
    }
    get borderPaint() {
        if (!this.mBorderPaint) {
            this.mBorderPaint = Utils.getTemplatePaint('black-stroke');
        }
        return this.mBorderPaint;
    }

    getOrCreateBarTouchListener() {
        if (!this.chartTouchListener) {
            this.chartTouchListener = new BarLineChartTouchListener(this, this.viewPortHandler.getMatrixTouch(), 3);
            if (!!this.nativeViewProtected) {
                this.chartTouchListener.init();
            }
        }
        return this.chartTouchListener;
    }

    // for performance tracking
    private totalTime = 0;
    private drawCycles = 0;

    @profile
    public onDraw(canvas: Canvas) {
        const startTime = Date.now();
        super.onDraw(canvas);
        const noComputeAutoScaleOnNextDraw = this.noComputeAutoScaleOnNextDraw;
        const noComputeAxisOnNextDraw = this.noComputeAxisOnNextDraw;
        this.noComputeAxisOnNextDraw = false;
        this.noComputeAutoScaleOnNextDraw = false;
        if (this.mData === null) return;

        // execute all drawing commands
        this.drawGridBackground(canvas);
        const xAxis = this.xAxis;
        const axisLeft = this.axisLeft;
        const axisRight = this.axisRight;

        // the order is important:
        // * computeAxis needs axis.mAxisMinimum set in autoScale
        // * calculateOffsets needs computeAxis because it needs axis longestLabel
        if (!noComputeAutoScaleOnNextDraw && this.autoScaleMinMaxEnabled) {
            this.autoScale();
        }

        if (!noComputeAxisOnNextDraw) {
            this.axisRendererLeft.computeAxis(axisLeft.mAxisMinimum, axisLeft.mAxisMaximum, axisLeft.inverted);
            this.axisRendererRight.computeAxis(axisRight.mAxisMinimum, axisRight.mAxisMaximum, axisRight.inverted);
            this.xAxisRenderer.computeAxis(this.xAxis.mAxisMinimum, this.xAxis.mAxisMaximum, false);
        }

        if (!this.offsetsCalculated) {
            this.calculateOffsets(false);
            this.offsetsCalculated = true;
        }

        if (xAxis.drawGridLinesBehindData) this.xAxisRenderer.renderGridLines(canvas);
        if (axisLeft.drawGridLinesBehindData) this.axisRendererLeft.renderGridLines(canvas);
        if (axisRight.drawGridLinesBehindData) this.axisRendererRight.renderGridLines(canvas);

        if (xAxis.drawLimitLinesBehindData) this.xAxisRenderer.renderLimitLines(canvas);
        if (axisLeft.drawLimitLinesBehindData) this.axisRendererLeft.renderLimitLines(canvas);
        if (axisRight.drawLimitLinesBehindData) this.axisRendererRight.renderLimitLines(canvas);

        this.xAxisRenderer.renderAxisLine(canvas);
        this.axisRendererLeft.renderAxisLine(canvas);
        this.axisRendererRight.renderAxisLine(canvas);

        if (xAxis.drawLabelsBehindData) this.xAxisRenderer.renderAxisLabels(canvas);
        if (axisLeft.drawLabelsBehindData) this.axisRendererLeft.renderAxisLabels(canvas);
        if (axisRight.drawLabelsBehindData) this.axisRendererRight.renderAxisLabels(canvas);

        // make sure the data cannot be drawn outside the content-rect
        if (this.clipDataToContent) {
            canvas.save();
            canvas.clipRect(this.viewPortHandler.contentRect);
            this.renderer.drawData(canvas);
        } else {
            this.renderer.drawData(canvas);
        }

        if (!xAxis.drawGridLinesBehindData) this.xAxisRenderer.renderGridLines(canvas);
        if (!axisLeft.drawGridLinesBehindData) this.axisRendererLeft.renderGridLines(canvas);
        if (!axisRight.drawGridLinesBehindData) this.axisRendererRight.renderGridLines(canvas);

        if (!this.clipHighlightToContent && this.clipDataToContent) {
            // restore before drawing highlight
            canvas.restore();
        }
        if (this.hasValuesToHighlight) {
            this.renderer.drawHighlighted(canvas, this.indicesToHighlight, this.drawHighlight);
        }

        // Removes clipping rectangle
        if (this.clipHighlightToContent && this.clipDataToContent) {
            canvas.restore();
        }

        this.renderer.drawExtras(canvas);

        if (!xAxis.drawLimitLinesBehindData) this.xAxisRenderer.renderLimitLines(canvas);
        if (!axisLeft.drawLimitLinesBehindData) this.axisRendererLeft.renderLimitLines(canvas);
        if (!axisRight.drawLimitLinesBehindData) this.axisRendererRight.renderLimitLines(canvas);

        if (!xAxis.drawLabelsBehindData) this.xAxisRenderer.renderAxisLabels(canvas);
        if (!axisLeft.drawLabelsBehindData) this.axisRendererLeft.renderAxisLabels(canvas);
        if (!axisRight.drawLabelsBehindData) this.axisRendererRight.renderAxisLabels(canvas);

        if (this.clipValuesToContent) {
            canvas.save();
            canvas.clipRect(this.viewPortHandler.contentRect);
            this.renderer.drawValues(canvas);
            canvas.restore();
        } else {
            this.renderer.drawValues(canvas);
        }
        if (this.legendRenderer) {
            this.legendRenderer.renderLegend(canvas);
        }

        this.drawDescription(canvas);

        this.drawMarkers(canvas);

        this.notify({ eventName: 'postDraw', canvas, object: this });
        if (Trace.isEnabled()) {
            const drawtime = Date.now() - startTime;
            this.totalTime += drawtime;
            this.drawCycles += 1;
            const average = this.totalTime / this.drawCycles;
            CLog(CLogTypes.log, this.constructor.name, 'Drawtime: ' + drawtime + ' ms, average: ' + average + ' ms, cycles: ' + this.drawCycles);
        }
    }

    /**
     * RESET PERFORMANCE TRACKING FIELDS
     */
    public resetTracking() {
        this.totalTime = 0;
        this.drawCycles = 0;
    }

    protected prepareValuePxMatrix() {
        if (Trace.isEnabled()) {
            CLog(CLogTypes.info, LOG_TAG, 'Preparing Value-Px Matrix, xmin: ' + this.xAxis.mAxisMinimum + ', xmax: ' + this.xAxis.mAxisMaximum + ', xdelta: ' + this.xAxis.mAxisRange);
        }
        if (this.mAxisRight?.enabled) {
            this.rightAxisTransformer.prepareMatrixValuePx(this.xAxis.mAxisMinimum, this.xAxis.mAxisRange, this.mAxisRight.mAxisRange, this.mAxisRight.mAxisMinimum);
        }
        if (this.mAxisLeft?.enabled || this.xAxis.enabled) {
            this.leftAxisTransformer.prepareMatrixValuePx(this.xAxis.mAxisMinimum, this.xAxis.mAxisRange, this.mAxisLeft.mAxisRange, this.mAxisLeft.mAxisMinimum);
        }
    }

    protected prepareOffsetMatrix() {
        if (this.mAxisRight?.enabled) {
            this.rightAxisTransformer.prepareMatrixOffset(this.mAxisRight.inverted);
        }
        if (this.mAxisLeft?.enabled || this.xAxis.enabled) {
            this.leftAxisTransformer.prepareMatrixOffset(this.mAxisLeft.inverted);
        }
    }

    public notifyDataSetChanged() {
        if (!this.mData || this.mData.dataSetCount === 0) {
            if (Trace.isEnabled()) {
                CLog(CLogTypes.info, LOG_TAG, 'Preparing... DATA NOT SET.');
            }
            return;
        } else if (!this.viewPortHandler.hasChartDimens) {
            if (Trace.isEnabled()) {
                CLog(CLogTypes.info, LOG_TAG, 'Preparing... NOT SIZED YET.');
            }
            return;
        } else {
            if (Trace.isEnabled()) {
                CLog(CLogTypes.info, LOG_TAG, 'Preparing...');
            }
        }

        this.renderer?.initBuffers();

        this.calcMinMax();

        if (this.mAxisLeft?.enabled) {
            this.axisRendererLeft.computeAxis(this.mAxisLeft.mAxisMinimum, this.mAxisLeft.mAxisMaximum, this.mAxisLeft.inverted);
        }
        if (this.mAxisRight?.enabled) {
            this.axisRendererRight.computeAxis(this.mAxisRight.mAxisMinimum, this.mAxisRight.mAxisMaximum, this.mAxisRight.inverted);
        }
        if (this.xAxis.enabled) {
            this.xAxisRenderer.computeAxis(this.xAxis.mAxisMinimum, this.xAxis.mAxisMaximum, false);
        }

        if (this.mLegend != null && this.mLegend.enabled) {
            this.legendRenderer.computeLegend(this.mData);
        }

        this.calculateOffsets(); // needs chart size
        this.invalidate();
    }

    /**
     * Performs auto scaling of the axis by recalculating the minimum and maximum y-values based on the entries currently in view.
     */
    protected autoScale() {
        const fromX = this.lowestVisibleX;
        const toX = this.highestVisibleX;

        this.mData.calcMinMaxYRange(fromX, toX);

        this.xAxis.calculate(this.mData.xMin, this.mData.xMax);

        // calculate axis range (min / max) according to provided data

        if (this.mAxisLeft?.enabled) {
            this.mAxisLeft.calculate(this.mData.getYMin(AxisDependency.LEFT), this.mData.getYMax(AxisDependency.LEFT));
        }

        if (this.mAxisRight?.enabled) {
            this.mAxisRight.calculate(this.mData.getYMin(AxisDependency.RIGHT), this.mData.getYMax(AxisDependency.RIGHT));
        }
    }

    protected calcMinMax() {
        this.xAxis.calculate(this.mData.xMin, this.mData.xMax);

        // calculate axis range (min / max) according to provided data
        if (this.mAxisLeft?.enabled) {
            this.mAxisLeft.calculate(this.mData.getYMin(AxisDependency.LEFT), this.mData.getYMax(AxisDependency.LEFT));
        }
        if (this.mAxisRight?.enabled) {
            this.mAxisRight.calculate(this.mData.getYMin(AxisDependency.RIGHT), this.mData.getYMax(AxisDependency.RIGHT));
        }
    }

    protected calculateLegendOffsets(offsets) {
        offsets.left = 0;
        offsets.right = 0;
        offsets.top = 0;
        offsets.bottom = 0;

        // setup offsets for legend
        if (this.mLegend != null && this.mLegend.enabled && !this.mLegend.drawInside) {
            switch (this.mLegend.orientation) {
                case LegendOrientation.VERTICAL:
                    switch (this.mLegend.horizontalAlignment) {
                        case LegendHorizontalAlignment.LEFT:
                            offsets.left += Math.min(this.mLegend.mNeededWidth, this.viewPortHandler.chartWidth * this.mLegend.maxSizePercent) + this.mLegend.xOffset;
                            break;

                        case LegendHorizontalAlignment.RIGHT:
                            offsets.right += Math.min(this.mLegend.mNeededWidth, this.viewPortHandler.chartWidth * this.mLegend.maxSizePercent) + this.mLegend.xOffset;
                            break;

                        case LegendHorizontalAlignment.CENTER:
                            switch (this.mLegend.verticalAlignment) {
                                case LegendVerticalAlignment.TOP:
                                    offsets.top += Math.min(this.mLegend.mNeededHeight, this.viewPortHandler.chartHeight * this.mLegend.maxSizePercent) + this.mLegend.yOffset;
                                    break;

                                case LegendVerticalAlignment.BOTTOM:
                                    offsets.bottom += Math.min(this.mLegend.mNeededHeight, this.viewPortHandler.chartHeight * this.mLegend.maxSizePercent) + this.mLegend.yOffset;
                                    break;

                                default:
                                    break;
                            }
                    }

                    break;

                case LegendOrientation.HORIZONTAL:
                    switch (this.mLegend.verticalAlignment) {
                        case LegendVerticalAlignment.TOP:
                            offsets.top += Math.min(this.mLegend.mNeededHeight, this.viewPortHandler.chartHeight * this.mLegend.maxSizePercent) + this.mLegend.yOffset;
                            break;

                        case LegendVerticalAlignment.BOTTOM:
                            offsets.bottom += Math.min(this.mLegend.mNeededHeight, this.viewPortHandler.chartHeight * this.mLegend.maxSizePercent) + this.mLegend.yOffset;
                            break;

                        default:
                            break;
                    }
                    break;
            }
        }
    }

    public calculateOffsets(force = true) {
        if (this.offsetsCalculated && !force) {
            return;
        }
        this.offsetsCalculated = true;
        if (!this.mCustomViewPortEnabled) {
            const offsetBuffer = Utils.getTempRectF();
            this.calculateLegendOffsets(offsetBuffer);

            let offsetLeft = offsetBuffer.left;
            let offsetTop = offsetBuffer.top;
            let offsetRight = offsetBuffer.right;
            let offsetBottom = offsetBuffer.bottom;

            // offsets for y-labels
            if (this.mAxisLeft?.needsOffset) {
                offsetLeft += this.mAxisLeft.getRequiredWidthSpace(this.axisRendererLeft.axisLabelsPaint);
            }

            if (this.mAxisRight?.needsOffset) {
                offsetRight += this.mAxisRight.getRequiredWidthSpace(this.axisRendererRight.axisLabelsPaint);
            }

            if (this.xAxis.enabled && this.xAxis.drawLabels) {
                const xLabelHeight = this.xAxis.mLabelRotatedHeight + this.xAxis.yOffset;
                // offsets for x-labels
                if (this.xAxis.position === XAxisPosition.BOTTOM) {
                    offsetBottom += xLabelHeight;
                } else if (this.xAxis.position === XAxisPosition.TOP) {
                    offsetTop += xLabelHeight;
                } else if (this.xAxis.position === XAxisPosition.BOTH_SIDED) {
                    offsetBottom += xLabelHeight;
                    offsetTop += xLabelHeight;
                }
            }

            offsetTop += this.extraTopOffset;
            offsetRight += this.extraRightOffset;
            offsetBottom += this.extraBottomOffset;
            offsetLeft += this.extraLeftOffset;

            const minOffset = this.minOffset;
            this.viewPortHandler.restrainViewPort(Math.max(minOffset, offsetLeft), Math.max(minOffset, offsetTop), Math.max(minOffset, offsetRight), Math.max(minOffset, offsetBottom));

            if (Trace.isEnabled()) {
                CLog(CLogTypes.info, LOG_TAG, 'offsetLeft: ' + offsetLeft + ', offsetTop: ' + offsetTop + ', offsetRight: ' + offsetRight + ', offsetBottom: ' + offsetBottom);
                CLog(CLogTypes.info, LOG_TAG, 'Content: ' + this.viewPortHandler.contentRect.toString());
            }
        }

        this.prepareOffsetMatrix();
        this.prepareValuePxMatrix();
    }

    /**
     * draws the grid background
     */
    protected drawGridBackground(c: Canvas) {
        if (this.drawGridBackgroundEnabled) {
            // draw the grid background
            c.drawRect(this.viewPortHandler.contentRect, this.gridBackgroundPaint);
        }

        if (this.drawBorders) {
            c.drawRect(this.viewPortHandler.contentRect, this.borderPaint);
        }
    }

    /**
     * Returns the Transformer class that contains all matrices and is
     * responsible for transforming values into pixels on the screen and
     * backwards.
     */
    public getTransformer(which?: AxisDependency) {
        if (which === undefined) {
            return this.transformer;
        }
        if (which === AxisDependency.LEFT) return this.leftAxisTransformer;
        else return this.rightAxisTransformer;
    }
    public get transformer() {
        if (this.mAxisLeft.enabled) {
            return this.leftAxisTransformer;
        }
        return this.rightAxisTransformer;
    }

    // public onTouchEvent( event) {
    //     super.onTouchEvent(event);

    //     if (mChartTouchListener == null || this.mData == null)
    //         return false;

    //     // check if touch gestures are enabled
    //     if (!mTouchEnabled)
    //         return false;
    //     else
    //         return this.chartTouchListener.onTouch(this, event);
    // }

    // public computeScroll() {
    // if (this.chartTouchListener instanceof BarLineChartTouchListener)
    //     (this.chartTouchListener).computeScroll();
    // }

    /**
     * ################ ################ ################ ################
     */
    /**
     * CODE BELOW THIS RELATED TO SCALING AND GESTURES AND MODIFICATION OF THE
     * VIEWPORT
     */
    protected mZoomMatrixBuffer = new Matrix();

    /**
     * Zooms in by 1.4f, into the charts center.
     */
    public zoomIn() {
        const center = this.viewPortHandler.contentCenter;

        this.viewPortHandler.zoomIn(center.x, -center.y, this.mZoomMatrixBuffer);
        this.viewPortHandler.refresh(this.mZoomMatrixBuffer, this, false);

        // Range might have changed, which means that Y-axis labels
        // could have changed in size, affecting Y-axis size.
        // So we need to recalculate offsets.
        this.calculateOffsets();
        this.invalidate();
    }

    /**
     * Zooms out by 0.7f, from the charts center.
     */
    public zoomOut() {
        const center = this.viewPortHandler.contentCenter;

        this.viewPortHandler.zoomOut(center.x, -center.y, this.mZoomMatrixBuffer);
        this.viewPortHandler.refresh(this.mZoomMatrixBuffer, this, false);

        // Range might have changed, which means that Y-axis labels
        // could have changed in size, affecting Y-axis size.
        // So we need to recalculate offsets.
        this.calculateOffsets();
        this.invalidate();
    }

    /**
     * Zooms out to original size.
     */
    public resetZoom() {
        this.viewPortHandler.mMatrixTouch.reset();
        this.viewPortHandler.resetZoom(this.mZoomMatrixBuffer);
        this.viewPortHandler.refresh(this.mZoomMatrixBuffer, this, false);

        // Range might have changed, which means that Y-axis labels
        // could have changed in size, affecting Y-axis size.
        // So we need to recalculate offsets.
        this.calculateOffsets();
        this.invalidate();
    }

    /**
     * Zooms in or out by the given scale factor. x and y are the coordinates
     * (in pixels) of the zoom center.
     *
     * @param scaleX if < 1 --> zoom out, if > 1 --> zoom in
     * @param scaleY if < 1 --> zoom out, if > 1 --> zoom in
     * @param x
     * @param y
     */
    public zoom(scaleX, scaleY, x, y) {
        this.viewPortHandler.zoomAtPosition(scaleX, scaleY, x, y, this.mZoomMatrixBuffer);
        this.viewPortHandler.refresh(this.mZoomMatrixBuffer, this, false);

        // Range might have changed, which  means that Y-axis labels
        // could have changed in size, affecting Y-axis size.
        // So we need to recalculate offsets.
        this.calculateOffsets();
        this.invalidate();
        if (this.hasListeners('zoom')) {
            this.notify({ eventName: 'zoom', object: this, scaleX, scaleY, x, y });
        }
    }

    /**
     * Zooms in or out by the given scale factor.
     * x and y are the values (NOT PIXELS) of the zoom center..
     *
     * @param scaleX
     * @param scaleY
     * @param xValue
     * @param yValue
     * @param axis   the axis relative to which the zoom should take place
     */
    public zoomAtValue(scaleX, scaleY, xValue, yValue, axis) {
        const job = ZoomJob.getInstance(this.viewPortHandler, scaleX, scaleY, xValue, yValue, this.getTransformer(axis), axis, this);
        this.addViewportJob(job);
    }

    /**
     * Zooms to the center of the chart with the given scale factor.
     *
     * @param scaleX
     * @param scaleY
     */
    public zoomToCenter(scaleX, scaleY) {
        const center = this.centerOffsets;
        const save = this.mZoomMatrixBuffer;
        this.viewPortHandler.zoomAtPosition(scaleX, scaleY, center.x, -center.y, save);
        this.viewPortHandler.refresh(save, this, false);
    }

    /**
     * Zooms by the specified scale factor to the specified values on the specified axis.
     *
     * @param scaleX
     * @param scaleY
     * @param xValue
     * @param yValue
     * @param axis
     * @param duration
     */
    public zoomAndCenterAnimated(scaleX, scaleY, xValue, yValue, axis, duration) {
        const origin = this.getValuesByTouchPoint(this.viewPortHandler.contentLeft, this.viewPortHandler.contentTop, axis);

        const job = AnimatedZoomJob.getInstance(
            this.viewPortHandler,
            this,
            this.getTransformer(axis),
            this.getAxis(axis),
            this.xAxis.mAxisRange,
            scaleX,
            scaleY,
            this.viewPortHandler.getScaleX(),
            this.viewPortHandler.getScaleY(),
            xValue,
            yValue,
            origin.x,
            origin.y,
            duration
        );
        this.addViewportJob(job);
    }

    /**
     * Zooms by the specified scale factor to the specified values on the specified axis.
     *
     * @param scaleX
     * @param scaleY
     * @param xValue
     * @param yValue
     * @param axis
     */
    public zoomAndCenter(scaleX, scaleY, xValue, yValue, axis) {
        const origin = this.getValuesByTouchPoint(this.viewPortHandler.contentLeft, this.viewPortHandler.contentTop, axis);

        const job = AnimatedZoomJob.getInstance(
            this.viewPortHandler,
            this,
            this.getTransformer(axis),
            this.getAxis(axis),
            this.xAxis.mAxisRange,
            scaleX,
            scaleY,
            this.viewPortHandler.getScaleX(),
            this.viewPortHandler.getScaleY(),
            xValue,
            yValue,
            origin.x,
            origin.y,
            0
        );
        job.phase = 1;
        job.onAnimationUpdate(0);
    }

    protected mFitScreenMatrixBuffer = new Matrix();

    /**
     * Resets all zooming and dragging and makes the chart fit exactly it's
     * bounds.
     */
    public fitScreen() {
        const save = this.mFitScreenMatrixBuffer;
        this.viewPortHandler.fitScreen(save);
        this.viewPortHandler.refresh(save, this, false);

        this.calculateOffsets();
        this.invalidate();
    }

    /**
     * Sets the minimum scale factor value to which can be zoomed out. 1 =
     * fitScreen
     *
     * @param scaleX
     * @param scaleY
     */
    public setScaleMinima(scaleX, scaleY) {
        this.viewPortHandler.setMinimumScaleX(scaleX);
        this.viewPortHandler.setMinimumScaleY(scaleY);
    }
    /**
     * Sets the  scale factor. 1 =
     * fitScreen
     *
     * @param scaleX
     * @param scaleY
     */
    public setScale(scaleX, scaleY) {
        this.viewPortHandler.setScale(scaleX, scaleY);
    }

    /**
     * Sets the size of the area (range on the x-axis) that should be maximum
     * visible at once (no further zooming out allowed). If this is e.g. set to
     * 10, no more than a range of 10 on the x-axis can be viewed at once without
     * scrolling.
     *
     * @param maxXRange The maximum visible range of x-values.
     */
    public set visibleXRangeMaximum(maxXRange) {
        const xScale = this.xAxis.mAxisRange / maxXRange;
        this.viewPortHandler.setMinimumScaleX(xScale);
    }

    /**
     * Sets the size of the area (range on the x-axis) that should be minimum
     * visible at once (no further zooming in allowed). If this is e.g. set to
     * 10, no less than a range of 10 on the x-axis can be viewed at once without
     * scrolling.
     *
     * @param minXRange The minimum visible range of x-values.
     */
    public set visibleXRangeMinimum(minXRange) {
        const xScale = this.xAxis.mAxisRange / minXRange;
        this.viewPortHandler.setMaximumScaleX(xScale);
    }

    /**
     * Limits the maximum and minimum x range that can be visible by pinching and zooming. e.g. minRange=10, maxRange=100 the
     * smallest range to be displayed at once is 10, and no more than a range of 100 values can be viewed at once without
     * scrolling
     *
     * @param minXRange
     * @param maxXRange
     */
    public setVisibleXRange(minXRange, maxXRange) {
        const minScale = this.xAxis.mAxisRange / minXRange;
        const maxScale = this.xAxis.mAxisRange / maxXRange;
        this.viewPortHandler.setMinMaxScaleX(minScale, maxScale);
    }

    /**
     * Sets the size of the area (range on the y-axis) that should be maximum
     * visible at once.
     *
     * @param maxYRange the maximum visible range on the y-axis
     * @param axis      the axis for which this limit should apply
     */
    public setVisibleYRangeMaximum(maxYRange, axis) {
        const yScale = this.getAxisRange(axis) / maxYRange;
        this.viewPortHandler.setMinimumScaleY(yScale);
    }

    /**
     * Sets the size of the area (range on the y-axis) that should be minimum visible at once, no further zooming in possible.
     *
     * @param minYRange
     * @param axis      the axis for which this limit should apply
     */
    public setVisibleYRangeMinimum(minYRange, axis) {
        const yScale = this.getAxisRange(axis) / minYRange;
        this.viewPortHandler.setMaximumScaleY(yScale);
    }

    /**
     * Limits the maximum and minimum y range that can be visible by pinching and zooming.
     *
     * @param minYRange
     * @param maxYRange
     * @param axis
     */
    public setVisibleYRange(minYRange, maxYRange, axis) {
        const minScale = this.getAxisRange(axis) / minYRange;
        const maxScale = this.getAxisRange(axis) / maxYRange;
        this.viewPortHandler.setMinMaxScaleY(minScale, maxScale);
    }

    /**
     * Moves the left side of the current viewport to the specified x-position.
     * This also refreshes the chart by calling invalidate().
     *
     * @param xValue
     */
    public moveViewToX(xValue) {
        const job = MoveViewJob.getInstance(this.viewPortHandler, xValue, 0, this.transformer, this);
        this.addViewportJob(job);
    }

    /**
     * This will move the left side of the current viewport to the specified
     * x-value on the x-axis, and center the viewport to the specified y value on the y-axis.
     * This also refreshes the chart by calling invalidate().
     *
     * @param xValue
     * @param yValue
     * @param axis   - which axis should be used as a reference for the y-axis
     */
    public moveViewTo(xValue, yValue, axis) {
        const yInView = this.getAxisRange(axis) / this.viewPortHandler.getScaleY();

        const job = MoveViewJob.getInstance(this.viewPortHandler, xValue, yValue + yInView / 2, this.getTransformer(axis), this);

        this.addViewportJob(job);
    }

    /**
     * This will move the left side of the current viewport to the specified x-value
     * and center the viewport to the y value animated.
     * This also refreshes the chart by calling invalidate().
     *
     * @param xValue
     * @param yValue
     * @param axis
     * @param duration the duration of the animation in milliseconds
     */
    public moveViewToAnimated(xValue, yValue, axis, duration) {
        const bounds = this.getValuesByTouchPoint(this.viewPortHandler.contentLeft, this.viewPortHandler.contentTop, axis);

        const yInView = this.getAxisRange(axis) / this.viewPortHandler.getScaleY();

        const job = AnimatedMoveViewJob.getInstance(this.viewPortHandler, xValue, yValue + yInView / 2, this.getTransformer(axis), this, bounds.x, bounds.y, duration);

        this.addViewportJob(job);

        // MPPointD.recycleInstance(bounds);
    }

    /**
     * Centers the viewport to the specified y value on the y-axis.
     * This also refreshes the chart by calling invalidate().
     *
     * @param yValue
     * @param axis   - which axis should be used as a reference for the y-axis
     */
    public centerViewToY(yValue, axis) {
        const valsInView = this.getAxisRange(axis) / this.viewPortHandler.getScaleY();

        const job = MoveViewJob.getInstance(this.viewPortHandler, 0, yValue + valsInView / 2, this.getTransformer(axis), this);

        this.addViewportJob(job);
    }

    /**
     * This will move the center of the current viewport to the specified
     * x and y value.
     * This also refreshes the chart by calling invalidate().
     *
     * @param xValue
     * @param yValue
     * @param axis   - which axis should be used as a reference for the y axis
     */
    public centerViewTo(xValue, yValue, axis) {
        const yInView = this.getAxisRange(axis) / this.viewPortHandler.getScaleY();
        const xInView = this.xAxis.mAxisRange / this.viewPortHandler.getScaleX();

        const job = MoveViewJob.getInstance(this.viewPortHandler, xValue - xInView / 2, yValue + yInView / 2, this.getTransformer(axis), this);

        this.addViewportJob(job);
    }

    /**
     * This will move the center of the current viewport to the specified
     * x and y value animated.
     *
     * @param xValue
     * @param yValue
     * @param axis
     * @param duration the duration of the animation in milliseconds
     */
    public centerViewToAnimated(xValue, yValue, axis, duration) {
        const bounds = this.getValuesByTouchPoint(this.viewPortHandler.contentLeft, this.viewPortHandler.contentTop, axis);

        const yInView = this.getAxisRange(axis) / this.viewPortHandler.getScaleY();
        const xInView = this.xAxis.mAxisRange / this.viewPortHandler.getScaleX();

        const job = AnimatedMoveViewJob.getInstance(this.viewPortHandler, xValue - xInView / 2, yValue + yInView / 2, this.getTransformer(axis), this, bounds.x, bounds.y, duration);

        this.addViewportJob(job);

        // MPPointD.recycleInstance(bounds);
    }

    /**
     * flag that indicates if a custom viewport offset has been set
     */
    private mCustomViewPortEnabled: boolean;

    /**
     * Sets custom offsets for the current ViewPort (the offsets on the sides of
     * the actual chart window). Setting this will prevent the chart from
     * automatically calculating it's offsets. Use resetViewPortOffsets() to
     * undo this. ONLY USE THIS WHEN YOU KNOW WHAT YOU ARE DOING, else use
     * setExtraOffsets(...).
     *
     * @param left
     * @param top
     * @param right
     * @param bottom
     */
    public setViewPortOffsets(left, top, right, bottom) {
        this.mCustomViewPortEnabled = true;
        // post(new Runnable() {

        //     public run() {

        this.viewPortHandler.restrainViewPort(left, top, right, bottom);
        this.prepareOffsetMatrix();
        this.prepareValuePxMatrix();
        // }
        // });
    }

    /**
     * Resets all custom offsets set via setViewPortOffsets(...) method. Allows
     * the chart to again calculate all offsets automatically.
     */
    public resetViewPortOffsets() {
        this.mCustomViewPortEnabled = false;
        this.calculateOffsets();
    }

    /**
     * ################ ################ ################ ################
     */
    /** CODE BELOW IS GETTERS AND SETTERS */

    /**
     * Returns the range of the specified axis.
     *
     * @param axis
     * @return
     */
    protected getAxisRange(axis) {
        if (axis === AxisDependency.LEFT) return this.mAxisLeft.mAxisRange;
        else return this.mAxisRight && this.mAxisRight.mAxisRange;
    }

    /**
     * Returns a recyclable MPPointF instance.
     * Returns the position (in pixels) the provided Entry has inside the chart
     * view or null, if the provided Entry is null.
     *
     * @param e
     * @return
     */
    public getPosition(e: U, axis) {
        if (e == null) return null;
        const pts = Utils.getTempArray(2);

        pts[0] = e.getX();
        pts[1] = e.getY();

        this.getTransformer(axis).pointValuesToPixel(pts);

        return { x: pts[0], y: pts[1] };
    }

    /**
     * Set this to true to allow highlighting per dragging over the chart
     * surface when it is fully zoomed out. Default: true
     *
     * @param enabled
     */
    public set highlightPerDragEnabled(enabled) {
        this.mHighlightPerDragEnabled = enabled;
        if (enabled) {
            this.getOrCreateBarTouchListener().setPan(true);
        } else if (this.chartTouchListener) {
            this.chartTouchListener.setPan(false);
        }
    }

    public get highlightPerDragEnabled() {
        return this.mHighlightPerDragEnabled;
    }

    /**
     * Sets the color for the background of the chart-drawing area (everything
     * behind the grid lines).
     *
     * @param color
     */
    public set gridBackgroundColor(color) {
        this.gridBackgroundPaint.setColor(color);
    }

    /**
     * Set this to true to enable dragging (moving the chart with the finger)
     * for the chart (this does not effect scaling).
     *
     * @param enabled
     */
    public set dragEnabled(enabled) {
        this.dragXEnabled = enabled;
        this.dragYEnabled = enabled;
        if (enabled) {
            this.getOrCreateBarTouchListener().setPan(true);
        } else if (this.chartTouchListener) {
            this.chartTouchListener.setPan(false);
        }
    }

    /**
     * Returns true if dragging is enabled for the chart, false if not.
     */
    public get dragEnabled() {
        return this.dragXEnabled || this.dragYEnabled;
    }

    /**
     * Set this to true to enable scaling (zooming in and out by gesture) for
     * the chart (this does not effect dragging) on both X- and Y-Axis.
     *
     * @param enabled
     */
    public set scaleEnabled(enabled) {
        this.mScaleXEnabled = enabled;
        this.mScaleYEnabled = enabled;
        if (enabled) {
            this.getOrCreateBarTouchListener().setPinch(true);
        } else if (this.chartTouchListener) {
            this.chartTouchListener.setPinch(false);
        }
    }

    public set scaleXEnabled(enabled) {
        this.mScaleXEnabled = enabled;
        if (enabled) {
            this.getOrCreateBarTouchListener().setPinch(true);
        } else if (!this.mScaleYEnabled && this.chartTouchListener) {
            this.chartTouchListener.setPinch(false);
        }
    }
    public get scaleXEnabled() {
        return this.mScaleXEnabled;
    }

    public set scaleYEnabled(enabled) {
        this.mScaleYEnabled = enabled;
        if (enabled) {
            this.getOrCreateBarTouchListener().setPinch(true);
        } else if (!this.mScaleXEnabled && this.chartTouchListener) {
            this.chartTouchListener.setPinch(false);
        }
    }
    public get scaleYEnabled() {
        return this.mScaleYEnabled;
    }

    /**
     * Set this to true to enable zooming in by double-tap on the chart.
     * Default: enabled
     *
     * @param enabled
     */
    public set doubleTapToZoomEnabled(enabled) {
        this.mDoubleTapToZoomEnabled = enabled;
        if (enabled) {
            this.getOrCreateBarTouchListener().setDoubleTap(true);
        } else if (this.chartTouchListener) {
            this.chartTouchListener.setDoubleTap(false);
        }
    }

    /**
     * Returns true if zooming via double-tap is enabled false if not.
     */
    public get doubleTapToZoomEnabled() {
        return this.mDoubleTapToZoomEnabled;
    }

    set highlightPerTapEnabled(enabled) {
        this.mHighlightPerTapEnabled = enabled;
        if (enabled) {
            this.getOrCreateBarTouchListener().setTap(true);
        } else if (this.chartTouchListener) {
            this.chartTouchListener.setTap(false);
        }
    }
    get highlightPerTapEnabled() {
        return this.mHighlightPerTapEnabled;
    }

    /**
     * wheter to highlight drawing will be clipped to contentRect,
     * otherwise they can bleed outside the content rect.
     */
    clipHighlightToContent = true;

    /**
     * Sets the width of the border lines in dp.
     *
     * @param width
     */
    public setBorderWidth(width) {
        this.borderPaint.setStrokeWidth(width);
    }

    /**
     * Sets the color of the chart border lines.
     *
     * @param color
     */
    public setBorderColor(color) {
        this.borderPaint.setColor(color);
    }

    /**
     * Returns a recyclable MPPointD instance
     * Returns the x and y values in the chart at the given touch point
     * (encapsulated in a MPPointD). This method transforms pixel coordinates to
     * coordinates / values in the chart. This is the opposite method to
     * getPixelForValues(...).
     *
     * @param x
     * @param y
     * @return
     */
    // public  getValuesByTouchPoint( x ,y,  axis) {
    //     const result = {x:0, y:0};
    //     this.getValuesByTouchPoint(x, y, axis, result);
    //     return result;
    // }

    public getValuesByTouchPoint(x, y, axis) {
        return this.getTransformer(axis).getValuesByTouchPoint(x, y);
    }

    /**
     * Returns a recyclable MPPointD instance
     * Transforms the given chart values into pixels. This is the opposite
     * method to getValuesByTouchPoint(...).
     *
     * @param x
     * @param y
     * @return
     */
    public getPixelForValues(x, y, axis) {
        return this.getTransformer(axis).getPixelForValues(x, y);
    }

    /**
     * returns the Entry object displayed at the touched position of the chart
     *
     * @param x
     * @param y
     * @return
     */
    public getEntryByTouchPoint(x, y) {
        const h = this.getHighlightByTouchPoint(x, y);
        if (h != null) {
            return this.mData.getEntryForHighlight(h);
        }
        return null;
    }

    /**
     * returns the DataSet object displayed at the touched position of the chart
     *
     * @param x
     * @param y
     * @return
     */
    public getDataSetByTouchPoint(x, y) {
        const h = this.getHighlightByTouchPoint(x, y);
        if (h != null) {
            return this.mData.getDataSetByIndex(h.dataSetIndex);
        }
        return null;
    }

    /**
     * buffer for storing lowest visible x point
     */
    protected posForGetLowestVisibleX = { x: 0, y: 0 };

    /**
     * Returns the lowest x-index (value on the x-axis) that is still visible on
     * the chart.
     */
    public get lowestVisibleX() {
        this.transformer.getValuesByTouchPoint(this.viewPortHandler.contentLeft, this.viewPortHandler.contentBottom, this.posForGetLowestVisibleX);
        const result = Math.max(this.xAxis.mAxisMinimum, this.posForGetLowestVisibleX.x);
        return result;
    }

    /**
     * buffer for storing highest visible x point
     */
    protected posForGetHighestVisibleX = { x: 0, y: 0 };

    /**
     * Returns the highest x-index (value on the x-axis) that is still visible
     * on the chart.
     */
    public get highestVisibleX() {
        this.transformer.getValuesByTouchPoint(this.viewPortHandler.contentRight, this.viewPortHandler.contentBottom, this.posForGetHighestVisibleX);
        const result = Math.min(this.xAxis.mAxisMaximum, this.posForGetHighestVisibleX.x);
        return result;
    }

    /**
     * Returns the range visible on the x-axis.
     */
    public getVisibleXRange() {
        return Math.abs(this.highestVisibleX - this.lowestVisibleX);
    }

    /**
     * returns the current x-scale factor
     */
    public getScaleX() {
        if (this.viewPortHandler == null) return 1;
        else return this.viewPortHandler.getScaleX();
    }

    /**
     * returns the current y-scale factor
     */
    public getScaleY() {
        if (this.viewPortHandler == null) return 1;
        else return this.viewPortHandler.getScaleY();
    }

    /**
     * if the chart is fully zoomed out, return true
     */
    public isFullyZoomedOut() {
        return this.viewPortHandler.isFullyZoomedOut();
    }

    /**
     * Returns the left y-axis object. In the horizontal bar-chart, this is the
     * top axis.
     */
    public get leftAxis() {
        return this.mAxisLeft;
    }
    /**
     * @deprecated use leftAxis
     */
    public get axisLeft() {
        return this.mAxisLeft;
    }

    /**
     * Returns the right y-axis object. In the horizontal bar-chart, this is the
     * bottom axis.
     */
    public get rightAxis() {
        if (!this.mAxisRight) {
            this.mAxisRight = new YAxis(AxisDependency.RIGHT, new WeakRef(this));
            this.rightAxisTransformer = new Transformer(this.viewPortHandler);
            this.axisRendererRight = new YAxisRenderer(this.viewPortHandler, this.mAxisRight, this.rightAxisTransformer);
        }
        return this.mAxisRight;
    }
    /**
     * @deprecated use rightAxis
     */
    public get axisRight() {
        return this.mAxisRight;
    }

    /**
     * Returns the y-axis object to the corresponding AxisDependency. In the
     * horizontal bar-chart, LEFT == top, RIGHT == BOTTOM
     *
     * @param axis
     * @return
     */
    public getAxis(axis) {
        if (axis === AxisDependency.LEFT) return this.mAxisLeft;
        else return this.mAxisRight;
    }

    public isInverted(axis) {
        return this.getAxis(axis).inverted;
    }

    /**
     * Set an offset in dp that allows the user to drag the chart over it's
     * bounds on the x-axis.
     *
     * @param offset
     */
    public setDragOffsetX(offset) {
        this.viewPortHandler.setDragOffsetX(offset);
    }

    /**
     * Set an offset in dp that allows the user to drag the chart over it's
     * bounds on the y-axis.
     *
     * @param offset
     */
    public setDragOffsetY(offset) {
        this.viewPortHandler.setDragOffsetY(offset);
    }

    /**
     * Returns true if both drag offsets (x and y) are zero or smaller.
     */
    public hasNoDragOffset() {
        return this.viewPortHandler.hasNoDragOffset();
    }

    public getRendererXAxis() {
        return this.xAxisRenderer;
    }

    /**
     * Sets a custom XAxisRenderer and overrides the existing (default) one.
     *
     * @param xAxisRenderer
     */
    public setXAxisRenderer(xAxisRenderer) {
        this.xAxisRenderer = xAxisRenderer;
    }

    public getRendererLeftYAxis() {
        return this.axisRendererLeft;
    }

    /**
     * Sets a custom axis renderer for the left axis and overwrites the existing one.
     *
     * @param rendererLeftYAxis
     */
    public setRendererLeftYAxis(rendererLeftYAxis) {
        this.axisRendererLeft = rendererLeftYAxis;
    }

    public getRendererRightYAxis() {
        return this.axisRendererRight;
    }

    /**
     * Sets a custom axis renderer for the right acis and overwrites the existing one.
     *
     * @param rendererRightYAxis
     */
    public setRendererRightYAxis(rendererRightYAxis) {
        this.axisRendererRight = rendererRightYAxis;
    }

    public get yChartMax() {
        let max = -Infinity;
        if (this.mAxisLeft.enabled) {
            max = Math.max(this.mAxisLeft.mAxisMaximum, max);
        }
        if (this.mAxisRight?.enabled) {
            max = Math.max(this.mAxisRight.mAxisMaximum, max);
        }
        return max;
    }

    public get yChartMin() {
        let min = Infinity;
        if (this.mAxisLeft.enabled) {
            min = Math.min(this.mAxisLeft.mAxisMinimum, min);
        }
        if (this.mAxisRight?.enabled) {
            min = Math.min(this.mAxisRight.mAxisMinimum, min);
        }
        return min;
    }

    /**
     * Returns true if either the left or the right or both axes are inverted.
     */
    public get anyAxisInverted() {
        if (this.mAxisLeft.enabled && this.mAxisLeft.inverted) return true;
        if (this.mAxisRight?.enabled && this.mAxisRight.inverted) return true;
        return false;
    }

    protected mOnSizeChangedBuffer = Utils.createArrayBuffer(2);

    public onSizeChanged(w: number, h: number, oldw: number, oldh: number) {
        // Saving current position of chart.
        this.mOnSizeChangedBuffer[0] = this.mOnSizeChangedBuffer[1] = 0;

        if (this.keepPositionOnRotation) {
            this.mOnSizeChangedBuffer[0] = this.viewPortHandler.contentLeft;
            this.mOnSizeChangedBuffer[1] = this.viewPortHandler.contentTop;
            this.transformer.pixelsToValue(this.mOnSizeChangedBuffer);
        }

        //Superclass transforms chart.
        super.onSizeChanged(w, h, oldw, oldh);

        if (this.keepPositionOnRotation) {
            //Restoring old position of chart.
            this.transformer.pointValuesToPixel(this.mOnSizeChangedBuffer);
            this.viewPortHandler.centerViewPort(this.mOnSizeChangedBuffer, this);
        } else {
            // a resize of the view will redraw the view anyway?
            this.viewPortHandler.refresh(this.viewPortHandler.getMatrixTouch(), this, false);
        }
    }

    public addEventListener(arg: string | GestureTypes, callback: (data: EventData) => void, thisArg?: any) {
        if (typeof arg === 'number') {
            arg = GestureTypes[arg];
        }
        if (typeof arg === 'string') {
            arg = getEventOrGestureName(arg);
            const events = arg.split(',');
            if (events.length > 0) {
                for (let i = 0; i < events.length; i++) {
                    const evt = events[i].trim();
                    if (arg === 'tap') {
                        this.getOrCreateBarTouchListener().setTap(true);
                    } else if (arg === 'doubleTap') {
                        this.getOrCreateBarTouchListener().setDoubleTap(true);
                    } else if (arg === 'pan') {
                        this.getOrCreateBarTouchListener().setPan(true);
                    } else if (arg === 'pinch') {
                        this.getOrCreateBarTouchListener().setPinch(true);
                    }
                    Observable.prototype.addEventListener.call(this, evt, callback, thisArg);
                }
            } else {
                Observable.prototype.addEventListener.call(this, arg, callback, thisArg);
            }
        }
    }

    public removeEventListener(arg: string | GestureTypes, callback?: any, thisArg?: any) {
        if (typeof arg === 'number') {
            arg = GestureTypes[arg];
        }
        if (typeof arg === 'string') {
            arg = getEventOrGestureName(arg);
            const events = arg.split(',');
            if (events.length > 0) {
                for (let i = 0; i < events.length; i++) {
                    const evt = events[i].trim();
                    if (arg === 'tap' && !this.highlightPerTapEnabled) {
                        this.chartTouchListener && this.chartTouchListener.setTap(false);
                    } else if (arg === 'doubleTap' && !this.doubleTapToZoomEnabled) {
                        this.chartTouchListener && this.chartTouchListener.setDoubleTap(false);
                    } else if (arg === 'pan' && !this.highlightPerDragEnabled && !this.dragEnabled) {
                        this.chartTouchListener && this.chartTouchListener.setPan(false);
                    } else if (arg === 'pinch' && !this.pinchZoomEnabled) {
                        this.chartTouchListener && this.chartTouchListener.setPinch(false);
                    }
                    Observable.prototype.removeEventListener.call(this, evt, callback, thisArg);
                }
            } else {
                Observable.prototype.removeEventListener.call(this, arg, callback, thisArg);
            }
        }
    }
}
