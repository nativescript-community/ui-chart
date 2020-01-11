import { IBarLineScatterCandleBubbleDataSet } from '../interfaces/datasets/IBarLineScatterCandleBubbleDataSet';
import { Entry } from '../data/Entry';
import { BarLineScatterCandleBubbleData } from '../data/BarLineScatterCandleBubbleData';
import { ChartInterface } from '../interfaces/dataprovider/ChartInterface';
import { CanvasView, Paint, Canvas, Style, Matrix, RectF } from 'nativescript-canvas';
import { DefaultValueFormatter } from '../formatter/DefaultValueFormatter';
import { Utils } from '../utils/Utils';
import { Color } from '@nativescript/core/color/color';
import { Chart } from './Chart';
import { Highlight } from '../highlight/Highlight';
import { AxisDependency, YAxis } from '../components/YAxis';
import { BarLineScatterCandleBubbleDataProvider } from '../interfaces/dataprovider/BarLineScatterCandleBubbleDataProvider';

import { profile } from '@nativescript/core/profiling';
import { Transformer } from '../utils/Transformer';
import { LegendHorizontalAlignment, LegendVerticalAlignment, LegendOrientation } from '../components/Legend';
import { XAxisPosition } from '../components/XAxis';
import { YAxisRenderer } from '../renderer/YAxisRenderer';
import { XAxisRenderer } from '../renderer/XAxisRenderer';
import { ChartHighlighter } from '../highlight/ChartHighlighter';
import { MoveViewJob } from '../jobs/MoveViewJob';
import { AnimatedMoveViewJob } from '../jobs/AnimatedMoveViewJob';
import { AnimatedZoomJob } from '../jobs/AnimatedZoomJob';
import { ZoomJob } from '../jobs/ZoomJob';
import { BarLineChartTouchListener } from '../listener/BarLineChartTouchListener';

const LOG_TAG = 'BarLineChartBase';

export abstract class BarLineChartBase<U extends Entry, D extends IBarLineScatterCandleBubbleDataSet<U>, T extends BarLineScatterCandleBubbleData<U, D>> extends Chart<U, D, T>
    implements BarLineScatterCandleBubbleDataProvider {
    /**
     * the maximum number of entries to which values will be drawn
     * (entry numbers greater than this value will cause value-labels to disappear)
     */
    protected mMaxVisibleCount = 100;

    /**
     * flag that indicates if auto scaling on the y axis is enabled
     */
    protected mAutoScaleMinMaxEnabled = false;

    /**
     * flag that indicates if pinch-zoom is enabled. if true, both x and y axis
     * can be scaled with 2 fingers, if false, x and y axis can be scaled
     * separately
     */
    protected mPinchZoomEnabled = false;

    /**
     * flag that indicates if double tap zoom is enabled or not
     */
    protected mDoubleTapToZoomEnabled = true;

    /**
     * flag that indicates if highlighting per dragging over a fully zoomed out
     * chart is enabled
     */
    protected mHighlightPerDragEnabled = true;

    /**
     * if true, dragging is enabled for the chart
     */
    private mDragXEnabled = true;
    private mDragYEnabled = true;

    private mScaleXEnabled = true;
    private mScaleYEnabled = true;

    /**
     * palet object for the (by default) lightgrey background of the grid
     */
    protected mGridBackgroundPaint: Paint;

    protected mBorderPaint: Paint;

    /**
     * flag indicating if the grid background should be drawn or not
     */
    protected mDrawGridBackground = false;

    protected mDrawBorders = false;

    protected mClipValuesToContent = false;

    /**
     * Sets the minimum offset (padding) around the chart, defaults to 15
     */
    protected mMinOffset = 15;

    /**
     * flag indicating if the chart should stay at the same position after a rotation. Default is false.
     */
    protected mKeepPositionOnRotation = false;

    /**
     * the listener for user drawing on the chart
     */
    // protected OnDrawListener this.mDrawListener;

    /**
     * the object representing the labels on the left y-axis
     */
    protected mAxisLeft: YAxis;

    /**
     * the object representing the labels on the right y-axis
     */
    protected mAxisRight: YAxis;

    protected mAxisRendererLeft: YAxisRenderer;
    protected mAxisRendererRight: YAxisRenderer;

    protected mLeftAxisTransformer: Transformer;
    protected mRightAxisTransformer: Transformer;

    protected mXAxisRenderer: XAxisRenderer;

    // /** the approximator object used for data filtering */
    // private Approximator this.mApproximator;

    protected init() {
        super.init();

        this.mAxisLeft = new YAxis(AxisDependency.LEFT);
        this.mAxisRight = new YAxis(AxisDependency.RIGHT);

        this.mLeftAxisTransformer = new Transformer(this.mViewPortHandler);
        this.mRightAxisTransformer = new Transformer(this.mViewPortHandler);

        this.mAxisRendererLeft = new YAxisRenderer(this.mViewPortHandler, this.mAxisLeft, this.mLeftAxisTransformer);
        this.mAxisRendererRight = new YAxisRenderer(this.mViewPortHandler, this.mAxisRight, this.mRightAxisTransformer);

        this.mXAxisRenderer = new XAxisRenderer(this.mViewPortHandler, this.mXAxis, this.mLeftAxisTransformer);

        this.setHighlighter(new ChartHighlighter(this));

        this.mChartTouchListener = new BarLineChartTouchListener(this, this.mViewPortHandler.getMatrixTouch(), 3);

        this.mGridBackgroundPaint = new Paint();
        this.mGridBackgroundPaint.setStyle(Style.FILL);
        // this.mGridBackgroundPaint.setColor(Color.WHITE);
        this.mGridBackgroundPaint.setColor(new Color(255, 240, 240, 240)); // light
        // grey

        this.mBorderPaint = new Paint();
        this.mBorderPaint.setStyle(Style.STROKE);
        this.mBorderPaint.setColor('black');
        this.mBorderPaint.setStrokeWidth(Utils.convertDpToPixel(1));
    }

    // for performance tracking
    private totalTime = 0;
    private drawCycles = 0;

    @profile
    protected onDraw(canvas: Canvas) {
        super.onDraw(canvas);

        if (this.mData == null) return;

        const starttime = Date.now();

        // execute all drawing commands
        this.drawGridBackground(canvas);

        if (this.mAutoScaleMinMaxEnabled) {
            this.autoScale();
        }

        if (this.mAxisLeft.isEnabled()) this.mAxisRendererLeft.computeAxis(this.mAxisLeft.mAxisMinimum, this.mAxisLeft.mAxisMaximum, this.mAxisLeft.isInverted());

        if (this.mAxisRight.isEnabled()) this.mAxisRendererRight.computeAxis(this.mAxisRight.mAxisMinimum, this.mAxisRight.mAxisMaximum, this.mAxisRight.isInverted());

        if (this.mXAxis.isEnabled()) this.mXAxisRenderer.computeAxis(this.mXAxis.mAxisMinimum, this.mXAxis.mAxisMaximum, false);

        this.mXAxisRenderer.renderAxisLine(canvas);
        this.mAxisRendererLeft.renderAxisLine(canvas);
        this.mAxisRendererRight.renderAxisLine(canvas);

        if (this.mXAxis.isDrawGridLinesBehindDataEnabled()) this.mXAxisRenderer.renderGridLines(canvas);

        if (this.mAxisLeft.isDrawGridLinesBehindDataEnabled()) this.mAxisRendererLeft.renderGridLines(canvas);

        if (this.mAxisRight.isDrawGridLinesBehindDataEnabled()) this.mAxisRendererRight.renderGridLines(canvas);

        if (this.mXAxis.isEnabled() && this.mXAxis.isDrawLimitLinesBehindDataEnabled()) this.mXAxisRenderer.renderLimitLines(canvas);

        if (this.mAxisLeft.isEnabled() && this.mAxisLeft.isDrawLimitLinesBehindDataEnabled()) this.mAxisRendererLeft.renderLimitLines(canvas);

        if (this.mAxisRight.isEnabled() && this.mAxisRight.isDrawLimitLinesBehindDataEnabled()) this.mAxisRendererRight.renderLimitLines(canvas);

        // make sure the data cannot be drawn outside the content-rect
        let clipRestoreCount = canvas.save();
        canvas.clipRect(this.mViewPortHandler.getContentRect());

        this.mRenderer.drawData(canvas);

        if (!this.mXAxis.isDrawGridLinesBehindDataEnabled()) this.mXAxisRenderer.renderGridLines(canvas);

        if (!this.mAxisLeft.isDrawGridLinesBehindDataEnabled()) this.mAxisRendererLeft.renderGridLines(canvas);

        if (!this.mAxisRight.isDrawGridLinesBehindDataEnabled()) this.mAxisRendererRight.renderGridLines(canvas);

        // if highlighting is enabled
        if (this.valuesToHighlight()) this.mRenderer.drawHighlighted(canvas, this.mIndicesToHighlight);

        // Removes clipping rectangle
        canvas.restoreToCount(clipRestoreCount);

        this.mRenderer.drawExtras(canvas);

        if (this.mXAxis.isEnabled() && !this.mXAxis.isDrawLimitLinesBehindDataEnabled()) this.mXAxisRenderer.renderLimitLines(canvas);

        if (this.mAxisLeft.isEnabled() && !this.mAxisLeft.isDrawLimitLinesBehindDataEnabled()) this.mAxisRendererLeft.renderLimitLines(canvas);

        if (this.mAxisRight.isEnabled() && !this.mAxisRight.isDrawLimitLinesBehindDataEnabled()) this.mAxisRendererRight.renderLimitLines(canvas);

        this.mXAxisRenderer.renderAxisLabels(canvas);
        this.mAxisRendererLeft.renderAxisLabels(canvas);
        this.mAxisRendererRight.renderAxisLabels(canvas);

        if (this.isClipValuesToContentEnabled()) {
            clipRestoreCount = canvas.save();
            canvas.clipRect(this.mViewPortHandler.getContentRect());

            this.mRenderer.drawValues(canvas);

            // canvas.restoreToCount(clipRestoreCount);
            canvas.restore();
        } else {
            this.mRenderer.drawValues(canvas);
        }

        this.mLegendRenderer.renderLegend(canvas);

        this.drawDescription(canvas);

        this.drawMarkers(canvas);

        this.notify({ eventName: 'drawn', object: this });
        if (this.mLogEnabled) {
            const drawtime = Date.now() - starttime;
            this.totalTime += drawtime;
            this.drawCycles += 1;
            const average = this.totalTime / this.drawCycles;
            console.log(LOG_TAG, 'Drawtime: ' + drawtime + ' ms, average: ' + average + ' ms, cycles: ' + this.drawCycles);
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
        if (this.mLogEnabled) console.log(LOG_TAG, 'Preparing Value-Px Matrix, xmin: ' + this.mXAxis.mAxisMinimum + ', xmax: ' + this.mXAxis.mAxisMaximum + ', xdelta: ' + this.mXAxis.mAxisRange);

        this.mRightAxisTransformer.prepareMatrixValuePx(this.mXAxis.mAxisMinimum, this.mXAxis.mAxisRange, this.mAxisRight.mAxisRange, this.mAxisRight.mAxisMinimum);
        this.mLeftAxisTransformer.prepareMatrixValuePx(this.mXAxis.mAxisMinimum, this.mXAxis.mAxisRange, this.mAxisLeft.mAxisRange, this.mAxisLeft.mAxisMinimum);
    }

    protected prepareOffsetMatrix() {
        this.mRightAxisTransformer.prepareMatrixOffset(this.mAxisRight.isInverted());
        this.mLeftAxisTransformer.prepareMatrixOffset(this.mAxisLeft.isInverted());
    }

    public notifyDataSetChanged() {
        if (this.mData == null) {
            if (this.mLogEnabled) console.log(LOG_TAG, 'Preparing... DATA NOT SET.');
            return;
        } else if (!this.mViewPortHandler.hasChartDimens()) {
            if (this.mLogEnabled) console.log(LOG_TAG, 'Preparing... NOT SIZED YET.');
            return;
        } else {
            if (this.mLogEnabled) console.log(LOG_TAG, 'Preparing...');
        }

        if (this.mRenderer != null) this.mRenderer.initBuffers();

        this.calcMinMax();

        this.mAxisRendererLeft.computeAxis(this.mAxisLeft.mAxisMinimum, this.mAxisLeft.mAxisMaximum, this.mAxisLeft.isInverted());
        this.mAxisRendererRight.computeAxis(this.mAxisRight.mAxisMinimum, this.mAxisRight.mAxisMaximum, this.mAxisRight.isInverted());
        this.mXAxisRenderer.computeAxis(this.mXAxis.mAxisMinimum, this.mXAxis.mAxisMaximum, false);

        if (this.mLegend != null) this.mLegendRenderer.computeLegend(this.mData);

        this.calculateOffsets(); // needs chart size
    }

    /**
     * Performs auto scaling of the axis by recalculating the minimum and maximum y-values based on the entries currently in view.
     */
    protected autoScale() {
        let fromX = this.getLowestVisibleX();
        let toX = this.getHighestVisibleX();

        this.mData.calcMinMaxYRange(fromX, toX);

        this.mXAxis.calculate(this.mData.getXMin(), this.mData.getXMax());

        // calculate axis range (min / max) according to provided data

        if (this.mAxisLeft.isEnabled()) this.mAxisLeft.calculate(this.mData.getYMin(AxisDependency.LEFT), this.mData.getYMax(AxisDependency.LEFT));

        if (this.mAxisRight.isEnabled()) this.mAxisRight.calculate(this.mData.getYMin(AxisDependency.RIGHT), this.mData.getYMax(AxisDependency.RIGHT));

        this.calculateOffsets();
    }

    protected calcMinMax() {
        this.mXAxis.calculate(this.mData.getXMin(), this.mData.getXMax());

        // calculate axis range (min / max) according to provided data
        this.mAxisLeft.calculate(this.mData.getYMin(AxisDependency.LEFT), this.mData.getYMax(AxisDependency.LEFT));
        this.mAxisRight.calculate(this.mData.getYMin(AxisDependency.RIGHT), this.mData.getYMax(AxisDependency.RIGHT));
    }

    protected calculateLegendOffsets(offsets) {
        offsets.left = 0;
        offsets.right = 0;
        offsets.top = 0;
        offsets.bottom = 0;

        // setup offsets for legend
        if (this.mLegend != null && this.mLegend.isEnabled() && !this.mLegend.isDrawInsideEnabled()) {
            switch (this.mLegend.getOrientation()) {
                case LegendOrientation.VERTICAL:
                    switch (this.mLegend.getHorizontalAlignment()) {
                        case LegendHorizontalAlignment.LEFT:
                            offsets.left += Math.min(this.mLegend.mNeededWidth, this.mViewPortHandler.getChartWidth() * this.mLegend.getMaxSizePercent()) + this.mLegend.getXOffset();
                            break;

                        case LegendHorizontalAlignment.RIGHT:
                            offsets.right += Math.min(this.mLegend.mNeededWidth, this.mViewPortHandler.getChartWidth() * this.mLegend.getMaxSizePercent()) + this.mLegend.getXOffset();
                            break;

                        case LegendHorizontalAlignment.CENTER:
                            switch (this.mLegend.getVerticalAlignment()) {
                                case LegendVerticalAlignment.TOP:
                                    offsets.top += Math.min(this.mLegend.mNeededHeight, this.mViewPortHandler.getChartHeight() * this.mLegend.getMaxSizePercent()) + this.mLegend.getYOffset();
                                    break;

                                case LegendVerticalAlignment.BOTTOM:
                                    offsets.bottom += Math.min(this.mLegend.mNeededHeight, this.mViewPortHandler.getChartHeight() * this.mLegend.getMaxSizePercent()) + this.mLegend.getYOffset();
                                    break;

                                default:
                                    break;
                            }
                    }

                    break;

                case LegendOrientation.HORIZONTAL:
                    switch (this.mLegend.getVerticalAlignment()) {
                        case LegendVerticalAlignment.TOP:
                            offsets.top += Math.min(this.mLegend.mNeededHeight, this.mViewPortHandler.getChartHeight() * this.mLegend.getMaxSizePercent()) + this.mLegend.getYOffset();
                            break;

                        case LegendVerticalAlignment.BOTTOM:
                            offsets.bottom += Math.min(this.mLegend.mNeededHeight, this.mViewPortHandler.getChartHeight() * this.mLegend.getMaxSizePercent()) + this.mLegend.getYOffset();
                            break;

                        default:
                            break;
                    }
                    break;
            }
        }
    }

    private mOffsetsBuffer = new RectF(0, 0, 0, 0);

    public calculateOffsets(force = true) {
        if (this.mOffsetsCalculated && !force) {
            return;
        }
        this.mOffsetsCalculated = true;
        if (!this.mCustomViewPortEnabled) {
            let offsetLeft = 0,
                offsetRight = 0,
                offsetTop = 0,
                offsetBottom = 0;

            this.calculateLegendOffsets(this.mOffsetsBuffer);

            offsetLeft += this.mOffsetsBuffer.left;
            offsetTop += this.mOffsetsBuffer.top;
            offsetRight += this.mOffsetsBuffer.right;
            offsetBottom += this.mOffsetsBuffer.bottom;


            // offsets for y-labels
            if (this.mAxisLeft.needsOffset()) {
                offsetLeft += this.mAxisLeft.getRequiredWidthSpace(this.mAxisRendererLeft.getPaintAxisLabels());
            }

            if (this.mAxisRight.needsOffset()) {
                offsetRight += this.mAxisRight.getRequiredWidthSpace(this.mAxisRendererRight.getPaintAxisLabels());
            }

            if (this.mXAxis.isEnabled() && this.mXAxis.isDrawLabelsEnabled()) {
                let xLabelHeight = this.mXAxis.mLabelRotatedHeight + this.mXAxis.getYOffset();

                // offsets for x-labels
                if (this.mXAxis.getPosition() == XAxisPosition.BOTTOM) {
                    offsetBottom += xLabelHeight;
                } else if (this.mXAxis.getPosition() == XAxisPosition.TOP) {
                    offsetTop += xLabelHeight;
                } else if (this.mXAxis.getPosition() == XAxisPosition.BOTH_SIDED) {
                    offsetBottom += xLabelHeight;
                    offsetTop += xLabelHeight;
                }
            }

            offsetTop += this.getExtraTopOffset();
            offsetRight += this.getExtraRightOffset();
            offsetBottom += this.getExtraBottomOffset();
            offsetLeft += this.getExtraLeftOffset();

            let minOffset = this.mMinOffset;

            this.mViewPortHandler.restrainViewPort(Math.max(minOffset, offsetLeft), Math.max(minOffset, offsetTop), Math.max(minOffset, offsetRight), Math.max(minOffset, offsetBottom));

            if (this.mLogEnabled) {
                console.log(LOG_TAG, 'offsetLeft: ' + offsetLeft + ', offsetTop: ' + offsetTop + ', offsetRight: ' + offsetRight + ', offsetBottom: ' + offsetBottom);
                console.log(LOG_TAG, 'Content: ' + this.mViewPortHandler.getContentRect().toString());
            }
        }

        this.prepareOffsetMatrix();
        this.prepareValuePxMatrix();
    }

    /**
     * draws the grid background
     */
    protected drawGridBackground(c: Canvas) {
        if (this.mDrawGridBackground) {
            // draw the grid background
            c.drawRect(this.mViewPortHandler.getContentRect(), this.mGridBackgroundPaint);
        }

        if (this.mDrawBorders) {
            c.drawRect(this.mViewPortHandler.getContentRect(), this.mBorderPaint);
        }
    }

    /**
     * Returns the Transformer class that contains all matrices and is
     * responsible for transforming values into pixels on the screen and
     * backwards.
     *
     * @return
     */
    public getTransformer(which: AxisDependency) {
        if (which == AxisDependency.LEFT) return this.mLeftAxisTransformer;
        else return this.mRightAxisTransformer;
    }

    // public onTouchEvent( event) {
    //     super.onTouchEvent(event);

    //     if (mChartTouchListener == null || this.mData == null)
    //         return false;

    //     // check if touch gestures are enabled
    //     if (!mTouchEnabled)
    //         return false;
    //     else
    //         return this.mChartTouchListener.onTouch(this, event);
    // }

    // public computeScroll() {
        // if (this.mChartTouchListener instanceof BarLineChartTouchListener)
        //     (this.mChartTouchListener).computeScroll();
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
        const center = this.mViewPortHandler.getContentCenter();

        this.mViewPortHandler.zoomIn(center.x, -center.y, this.mZoomMatrixBuffer);
        this.mViewPortHandler.refresh(this.mZoomMatrixBuffer, this, false);

        // MPPointF.recycleInstance(center);

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
        const center = this.mViewPortHandler.getContentCenter();

        this.mViewPortHandler.zoomOut(center.x, -center.y, this.mZoomMatrixBuffer);
        this.mViewPortHandler.refresh(this.mZoomMatrixBuffer, this, false);

        // MPPointF.recycleInstance(center);

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
        this.mViewPortHandler.resetZoom(this.mZoomMatrixBuffer);
        this.mViewPortHandler.refresh(this.mZoomMatrixBuffer, this, false);

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
        this.mViewPortHandler.zoomAtPosition(scaleX, scaleY, x, y, this.mZoomMatrixBuffer);
        this.mViewPortHandler.refresh(this.mZoomMatrixBuffer, this, false);

        // Range might have changed, which means that Y-axis labels
        // could have changed in size, affecting Y-axis size.
        // So we need to recalculate offsets.
        this.calculateOffsets();
        this.invalidate();
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
        const job = ZoomJob.getInstance(this.mViewPortHandler, scaleX, scaleY, xValue, yValue, this.getTransformer(axis), axis, this);
        this.addViewportJob(job);
    }

    /**
     * Zooms to the center of the chart with the given scale factor.
     *
     * @param scaleX
     * @param scaleY
     */
    public zoomToCenter(scaleX, scaleY) {
        const center = this.getCenterOffsets();

        const save = this.mZoomMatrixBuffer;
        this.mViewPortHandler.zoomAtPosition(scaleX, scaleY, center.x, -center.y, save);
        this.mViewPortHandler.refresh(save, this, false);
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
        const origin = this.getValuesByTouchPoint(this.mViewPortHandler.contentLeft(), this.mViewPortHandler.contentTop(), axis);

        const job = AnimatedZoomJob.getInstance(
            this.mViewPortHandler,
            this,
            this.getTransformer(axis),
            this.getAxis(axis),
            this.mXAxis.mAxisRange,
            scaleX,
            scaleY,
            this.mViewPortHandler.getScaleX(),
            this.mViewPortHandler.getScaleY(),
            xValue,
            yValue,
            origin.x,
            origin.y,
            duration
        );
        this.addViewportJob(job);

        // MPPointD.recycleInstance(origin);
    }

    protected mFitScreenMatrixBuffer = new Matrix();

    /**
     * Resets all zooming and dragging and makes the chart fit exactly it's
     * bounds.
     */
    public fitScreen() {
        const save = this.mFitScreenMatrixBuffer;
        this.mViewPortHandler.fitScreen(save);
        this.mViewPortHandler.refresh(save, this, false);

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
        this.mViewPortHandler.setMinimumScaleX(scaleX);
        this.mViewPortHandler.setMinimumScaleY(scaleY);
    }

    /**
     * Sets the size of the area (range on the x-axis) that should be maximum
     * visible at once (no further zooming out allowed). If this is e.g. set to
     * 10, no more than a range of 10 on the x-axis can be viewed at once without
     * scrolling.
     *
     * @param maxXRange The maximum visible range of x-values.
     */
    public setVisibleXRangeMaximum(maxXRange) {
        let xScale = this.mXAxis.mAxisRange / maxXRange;
        this.mViewPortHandler.setMinimumScaleX(xScale);
    }

    /**
     * Sets the size of the area (range on the x-axis) that should be minimum
     * visible at once (no further zooming in allowed). If this is e.g. set to
     * 10, no less than a range of 10 on the x-axis can be viewed at once without
     * scrolling.
     *
     * @param minXRange The minimum visible range of x-values.
     */
    public setVisibleXRangeMinimum(minXRange) {
        let xScale = this.mXAxis.mAxisRange / minXRange;
        this.mViewPortHandler.setMaximumScaleX(xScale);
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
        let minScale = this.mXAxis.mAxisRange / minXRange;
        let maxScale = this.mXAxis.mAxisRange / maxXRange;
        this.mViewPortHandler.setMinMaxScaleX(minScale, maxScale);
    }

    /**
     * Sets the size of the area (range on the y-axis) that should be maximum
     * visible at once.
     *
     * @param maxYRange the maximum visible range on the y-axis
     * @param axis      the axis for which this limit should apply
     */
    public setVisibleYRangeMaximum(maxYRange, axis) {
        let yScale = this.getAxisRange(axis) / maxYRange;
        this.mViewPortHandler.setMinimumScaleY(yScale);
    }

    /**
     * Sets the size of the area (range on the y-axis) that should be minimum visible at once, no further zooming in possible.
     *
     * @param minYRange
     * @param axis      the axis for which this limit should apply
     */
    public setVisibleYRangeMinimum(minYRange, axis) {
        let yScale = this.getAxisRange(axis) / minYRange;
        this.mViewPortHandler.setMaximumScaleY(yScale);
    }

    /**
     * Limits the maximum and minimum y range that can be visible by pinching and zooming.
     *
     * @param minYRange
     * @param maxYRange
     * @param axis
     */
    public setVisibleYRange(minYRange, maxYRange, axis) {
        let minScale = this.getAxisRange(axis) / minYRange;
        let maxScale = this.getAxisRange(axis) / maxYRange;
        this.mViewPortHandler.setMinMaxScaleY(minScale, maxScale);
    }

    /**
     * Moves the left side of the current viewport to the specified x-position.
     * This also refreshes the chart by calling invalidate().
     *
     * @param xValue
     */
    public moveViewToX(xValue) {
        const job = MoveViewJob.getInstance(this.mViewPortHandler, xValue, 0, this.getTransformer(AxisDependency.LEFT), this);
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
        let yInView = this.getAxisRange(axis) / this.mViewPortHandler.getScaleY();

        const job = MoveViewJob.getInstance(this.mViewPortHandler, xValue, yValue + yInView / 2, this.getTransformer(axis), this);

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
        const bounds = this.getValuesByTouchPoint(this.mViewPortHandler.contentLeft(), this.mViewPortHandler.contentTop(), axis);

        let yInView = this.getAxisRange(axis) / this.mViewPortHandler.getScaleY();

        const job = AnimatedMoveViewJob.getInstance(this.mViewPortHandler, xValue, yValue + yInView / 2, this.getTransformer(axis), this, bounds.x, bounds.y, duration);

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
        let valsInView = this.getAxisRange(axis) / this.mViewPortHandler.getScaleY();

        const job = MoveViewJob.getInstance(this.mViewPortHandler, 0, yValue + valsInView / 2, this.getTransformer(axis), this);

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
        let yInView = this.getAxisRange(axis) / this.mViewPortHandler.getScaleY();
        let xInView = this.getXAxis().mAxisRange / this.mViewPortHandler.getScaleX();

        const job = MoveViewJob.getInstance(this.mViewPortHandler, xValue - xInView / 2, yValue + yInView / 2, this.getTransformer(axis), this);

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
        const bounds = this.getValuesByTouchPoint(this.mViewPortHandler.contentLeft(), this.mViewPortHandler.contentTop(), axis);

        let yInView = this.getAxisRange(axis) / this.mViewPortHandler.getScaleY();
        let xInView = this.getXAxis().mAxisRange / this.mViewPortHandler.getScaleX();

        const job = AnimatedMoveViewJob.getInstance(this.mViewPortHandler, xValue - xInView / 2, yValue + yInView / 2, this.getTransformer(axis), this, bounds.x, bounds.y, duration);

        this.addViewportJob(job);

        // MPPointD.recycleInstance(bounds);
    }

    /**
     * flag that indicates if a custom viewport offset has been set
     */
    private mCustomViewPortEnabled = false;

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

        this.mViewPortHandler.restrainViewPort(left, top, right, bottom);
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
        if (axis == AxisDependency.LEFT) return this.mAxisLeft.mAxisRange;
        else return this.mAxisRight.mAxisRange;
    }

    /**
     * Sets the OnDrawListener
     *
     * @param drawListener
     */
    // public setOnDrawListener(OnDrawListener drawListener) {
    //     this.mDrawListener = drawListener;
    // }

    /**
     * Gets the OnDrawListener. May be null.
     *
     * @return
     */
    // public OnDrawListener getDrawListener() {
    //     return this.mDrawListener;
    // }

    protected mGetPositionBuffer = [];

    /**
     * Returns a recyclable MPPointF instance.
     * Returns the position (in pixels) the provided Entry has inside the chart
     * view or null, if the provided Entry is null.
     *
     * @param e
     * @return
     */
    public getPosition(e, axis) {
        if (e == null) return null;

        this.mGetPositionBuffer[0] = e.getX();
        this.mGetPositionBuffer[1] = e.getY();

        this.getTransformer(axis).pointValuesToPixel(this.mGetPositionBuffer);

        return { x: this.mGetPositionBuffer[0], y: this.mGetPositionBuffer[1] };
    }

    /**
     * sets the number of maximum visible drawn values on the chart only active
     * when setDrawValues() is enabled
     *
     * @param count
     */
    public setMaxVisibleValueCount(count) {
        this.mMaxVisibleCount = count;
    }

    public getMaxVisibleCount() {
        return this.mMaxVisibleCount;
    }

    /**
     * Set this to true to allow highlighting per dragging over the chart
     * surface when it is fully zoomed out. Default: true
     *
     * @param enabled
     */
    public setHighlightPerDragEnabled(enabled) {
        this.mHighlightPerDragEnabled = enabled;
    }

    public isHighlightPerDragEnabled() {
        return this.mHighlightPerDragEnabled;
    }

    /**
     * Sets the color for the background of the chart-drawing area (everything
     * behind the grid lines).
     *
     * @param color
     */
    public setGridBackgroundColor(color) {
        this.mGridBackgroundPaint.setColor(color);
    }

    /**
     * Set this to true to enable dragging (moving the chart with the finger)
     * for the chart (this does not effect scaling).
     *
     * @param enabled
     */
    public setDragEnabled(enabled) {
        this.mDragXEnabled = enabled;
        this.mDragYEnabled = enabled;
    }

    /**
     * Returns true if dragging is enabled for the chart, false if not.
     *
     * @return
     */
    public isDragEnabled() {
        return this.mDragXEnabled || this.mDragYEnabled;
    }

    /**
     * Set this to true to enable dragging on the X axis
     *
     * @param enabled
     */
    public setDragXEnabled(enabled) {
        this.mDragXEnabled = enabled;
    }

    /**
     * Returns true if dragging on the X axis is enabled for the chart, false if not.
     *
     * @return
     */
    public isDragXEnabled() {
        return this.mDragXEnabled;
    }

    /**
     * Set this to true to enable dragging on the Y axis
     *
     * @param enabled
     */
    public setDragYEnabled(enabled) {
        this.mDragYEnabled = enabled;
    }

    /**
     * Returns true if dragging on the Y axis is enabled for the chart, false if not.
     *
     * @return
     */
    public isDragYEnabled() {
        return this.mDragYEnabled;
    }

    /**
     * Set this to true to enable scaling (zooming in and out by gesture) for
     * the chart (this does not effect dragging) on both X- and Y-Axis.
     *
     * @param enabled
     */
    public setScaleEnabled(enabled) {
        this.mScaleXEnabled = enabled;
        this.mScaleYEnabled = enabled;
    }

    public setScaleXEnabled(enabled) {
        this.mScaleXEnabled = enabled;
    }

    public setScaleYEnabled(enabled) {
        this.mScaleYEnabled = enabled;
    }

    public isScaleXEnabled() {
        return this.mScaleXEnabled;
    }

    public isScaleYEnabled() {
        return this.mScaleYEnabled;
    }

    /**
     * Set this to true to enable zooming in by double-tap on the chart.
     * Default: enabled
     *
     * @param enabled
     */
    public setDoubleTapToZoomEnabled(enabled) {
        this.mDoubleTapToZoomEnabled = enabled;
    }

    /**
     * Returns true if zooming via double-tap is enabled false if not.
     *
     * @return
     */
    public isDoubleTapToZoomEnabled() {
        return this.mDoubleTapToZoomEnabled;
    }

    /**
     * set this to true to draw the grid background, false if not
     *
     * @param enabled
     */
    public setDrawGridBackground(enabled) {
        this.mDrawGridBackground = enabled;
    }

    /**
     * When enabled, the borders rectangle will be rendered.
     * If this is enabled, there is no polet drawing the axis-lines of x- and y-axis.
     *
     * @param enabled
     */
    public setDrawBorders(enabled) {
        this.mDrawBorders = enabled;
    }

    /**
     * When enabled, the borders rectangle will be rendered.
     * If this is enabled, there is no polet drawing the axis-lines of x- and y-axis.
     *
     * @return
     */
    public isDrawBordersEnabled() {
        return this.mDrawBorders;
    }

    /**
     * When enabled, the values will be clipped to contentRect,
     * otherwise they can bleed outside the content rect.
     *
     * @param enabled
     */
    public setClipValuesToContent(enabled) {
        this.mClipValuesToContent = enabled;
    }

    /**
     * When enabled, the values will be clipped to contentRect,
     * otherwise they can bleed outside the content rect.
     *
     * @return
     */
    public isClipValuesToContentEnabled() {
        return this.mClipValuesToContent;
    }

    /**
     * Sets the width of the border lines in dp.
     *
     * @param width
     */
    public setBorderWidth(width) {
        this.mBorderPaint.setStrokeWidth(Utils.convertDpToPixel(width));
    }

    /**
     * Sets the color of the chart border lines.
     *
     * @param color
     */
    public setBorderColor(color) {
        this.mBorderPaint.setColor(color);
    }

    /**
     * Gets the minimum offset (padding) around the chart, defaults to 15.f
     */
    public getMinOffset() {
        return this.mMinOffset;
    }

    /**
     * Sets the minimum offset (padding) around the chart, defaults to 15.f
     */
    public setMinOffset(minOffset) {
        this.mMinOffset = minOffset;
    }

    /**
     * Returns true if keeping the position on rotation is enabled and false if not.
     */
    public isKeepPositionOnRotation() {
        return this.mKeepPositionOnRotation;
    }

    /**
     * Sets whether the chart should keep its position (zoom / scroll) after a rotation (orientation change)
     */
    public setKeepPositionOnRotation(keepPositionOnRotation) {
        this.mKeepPositionOnRotation = keepPositionOnRotation;
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
        console.log('getDataSetByTouchPoint', x, y);
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
     *
     * @return
     */

    public getLowestVisibleX() {
        this.getTransformer(AxisDependency.LEFT).getValuesByTouchPoint(this.mViewPortHandler.contentLeft(), this.mViewPortHandler.contentBottom(), this.posForGetLowestVisibleX);
        let result = Math.max(this.mXAxis.mAxisMinimum, this.posForGetLowestVisibleX.x);
        return result;
    }

    /**
     * buffer for storing highest visible x point
     */
    protected posForGetHighestVisibleX = { x: 0, y: 0 };

    /**
     * Returns the highest x-index (value on the x-axis) that is still visible
     * on the chart.
     *
     * @return
     */

    public getHighestVisibleX() {
        this.getTransformer(AxisDependency.LEFT).getValuesByTouchPoint(this.mViewPortHandler.contentRight(), this.mViewPortHandler.contentBottom(), this.posForGetHighestVisibleX);
        // console.log('getHighestVisibleX', this.mViewPortHandler.contentRight(), this.mViewPortHandler.contentBottom(), this.posForGetHighestVisibleX, this.mXAxis.mAxisMaximum);
        let result = Math.min(this.mXAxis.mAxisMaximum, this.posForGetHighestVisibleX.x);
        return result;
    }

    /**
     * Returns the range visible on the x-axis.
     *
     * @return
     */
    public getVisibleXRange() {
        return Math.abs(this.getHighestVisibleX() - this.getLowestVisibleX());
    }

    /**
     * returns the current x-scale factor
     */
    public getScaleX() {
        if (this.mViewPortHandler == null) return 1;
        else return this.mViewPortHandler.getScaleX();
    }

    /**
     * returns the current y-scale factor
     */
    public getScaleY() {
        if (this.mViewPortHandler == null) return 1;
        else return this.mViewPortHandler.getScaleY();
    }

    /**
     * if the chart is fully zoomed out, return true
     *
     * @return
     */
    public isFullyZoomedOut() {
        return this.mViewPortHandler.isFullyZoomedOut();
    }

    /**
     * Returns the left y-axis object. In the horizontal bar-chart, this is the
     * top axis.
     *
     * @return
     */
    public getAxisLeft() {
        return this.mAxisLeft;
    }

    /**
     * Returns the right y-axis object. In the horizontal bar-chart, this is the
     * bottom axis.
     *
     * @return
     */
    public getAxisRight() {
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
        if (axis == AxisDependency.LEFT) return this.mAxisLeft;
        else return this.mAxisRight;
    }

    public isInverted(axis) {
        return this.getAxis(axis).isInverted();
    }

    /**
     * If set to true, both x and y axis can be scaled simultaneously with 2 fingers, if false,
     * x and y axis can be scaled separately. default: false
     *
     * @param enabled
     */
    public setPinchZoom(enabled) {
        this.mPinchZoomEnabled = enabled;
    }

    /**
     * returns true if pinch-zoom is enabled, false if not
     *
     * @return
     */
    public isPinchZoomEnabled() {
        return this.mPinchZoomEnabled;
    }

    /**
     * Set an offset in dp that allows the user to drag the chart over it's
     * bounds on the x-axis.
     *
     * @param offset
     */
    public setDragOffsetX(offset) {
        this.mViewPortHandler.setDragOffsetX(offset);
    }

    /**
     * Set an offset in dp that allows the user to drag the chart over it's
     * bounds on the y-axis.
     *
     * @param offset
     */
    public setDragOffsetY(offset) {
        this.mViewPortHandler.setDragOffsetY(offset);
    }

    /**
     * Returns true if both drag offsets (x and y) are zero or smaller.
     *
     * @return
     */
    public hasNoDragOffset() {
        return this.mViewPortHandler.hasNoDragOffset();
    }

    public getRendererXAxis() {
        return this.mXAxisRenderer;
    }

    /**
     * Sets a custom XAxisRenderer and overrides the existing (default) one.
     *
     * @param xAxisRenderer
     */
    public setXAxisRenderer(xAxisRenderer) {
        this.mXAxisRenderer = xAxisRenderer;
    }

    public getRendererLeftYAxis() {
        return this.mAxisRendererLeft;
    }

    /**
     * Sets a custom axis renderer for the left axis and overwrites the existing one.
     *
     * @param rendererLeftYAxis
     */
    public setRendererLeftYAxis(rendererLeftYAxis) {
        this.mAxisRendererLeft = rendererLeftYAxis;
    }

    public getRendererRightYAxis() {
        return this.mAxisRendererRight;
    }

    /**
     * Sets a custom axis renderer for the right acis and overwrites the existing one.
     *
     * @param rendererRightYAxis
     */
    public setRendererRightYAxis(rendererRightYAxis) {
        this.mAxisRendererRight = rendererRightYAxis;
    }

    public getYChartMax() {
        return Math.max(this.mAxisLeft.mAxisMaximum, this.mAxisRight.mAxisMaximum);
    }

    public getYChartMin() {
        return Math.min(this.mAxisLeft.mAxisMinimum, this.mAxisRight.mAxisMinimum);
    }

    /**
     * Returns true if either the left or the right or both axes are inverted.
     *
     * @return
     */
    public isAnyAxisInverted() {
        if (this.mAxisLeft.isInverted()) return true;
        if (this.mAxisRight.isInverted()) return true;
        return false;
    }

    /**
     * Flag that indicates if auto scaling on the y axis is enabled. This is
     * especially interesting for charts displaying financial data.
     *
     * @param enabled the y axis automatically adjusts to the min and max y
     *                values of the current x axis range whenever the viewport
     *                changes
     */
    public setAutoScaleMinMaxEnabled(enabled) {
        this.mAutoScaleMinMaxEnabled = enabled;
    }

    /**
     * @return true if auto scaling on the y axis is enabled.
     * @default false
     */
    public isAutoScaleMinMaxEnabled() {
        return this.mAutoScaleMinMaxEnabled;
    }

    public setPaint(p, which) {
        super.setPaint(p, which);

        switch (which) {
            case Chart.PAINT_GRID_BACKGROUND:
                this.mGridBackgroundPaint = p;
                break;
        }
    }

    public getPaint(which) {
        const p = super.getPaint(which);
        if (p != null) return p;

        switch (which) {
            case Chart.PAINT_GRID_BACKGROUND:
                return this.mGridBackgroundPaint;
        }

        return null;
    }

    protected mOnSizeChangedBuffer = Utils.createNativeArray(2);

    public onSizeChanged(w: number, h: number, oldw:number, oldh:number) {
        // Saving current position of chart.
        this.mOnSizeChangedBuffer[0] = this.mOnSizeChangedBuffer[1] = 0;

        if (this.mKeepPositionOnRotation) {
            this.mOnSizeChangedBuffer[0] = this.mViewPortHandler.contentLeft();
            this.mOnSizeChangedBuffer[1] = this.mViewPortHandler.contentTop();
            this.getTransformer(AxisDependency.LEFT).pixelsToValue(this.mOnSizeChangedBuffer);
        }

        //Superclass transforms chart.
        super.onSizeChanged(w, h, oldw, oldh);

        if (this.mKeepPositionOnRotation) {
            //Restoring old position of chart.
            this.getTransformer(AxisDependency.LEFT).pointValuesToPixel(this.mOnSizeChangedBuffer);
            this.mViewPortHandler.centerViewPort(this.mOnSizeChangedBuffer, this);
        } else {
            // a resize of the view will redraw the view anyway?
            this.mViewPortHandler.refresh(this.mViewPortHandler.getMatrixTouch(), this, false);
        }
    }
}
