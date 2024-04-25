import { PanGestureHandlerOptions, PinchGestureHandlerOptions, RotationGestureHandlerOptions, TapGestureHandlerOptions } from '@nativescript-community/gesturehandler';
import { Align, Canvas, CanvasView, Paint } from '@nativescript-community/ui-canvas';
import { EventData, Font, Utils as NUtils, Trace } from '@nativescript/core';
import { ChartAnimator, EasingFunction } from '../animation/ChartAnimator';
import { Description } from '../components/Description';
import { IMarker } from '../components/IMarker';
import { Legend } from '../components/Legend';
import { XAxis } from '../components/XAxis';
import { ChartData } from '../data/ChartData';
import { Entry } from '../data/Entry';
import { DefaultValueFormatter } from '../formatter/DefaultValueFormatter';
import { Highlight } from '../highlight/Highlight';
import { IHighlighter } from '../highlight/IHighlighter';
import { ChartInterface } from '../interfaces/dataprovider/ChartInterface';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { ViewPortJob } from '../jobs/ViewPortJob';
import { ChartTouchListener } from '../listener/ChartTouchListener';
import { DataRenderer } from '../renderer/DataRenderer';
import { LegendRenderer } from '../renderer/LegendRenderer';
import { CLog, CLogTypes, Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';

const LOG_TAG = 'NSChart';

// declare module '@nativescript/core/ui/core/view' {
//     interface View {
//         _raiseLayoutChangedEvent();
//     }
// }

export interface HighlightEventData extends EventData {
    entry?: Entry;
    highlight?: Highlight;
}
/**
 * Baseclass of all Chart-Views.
 *

 */
export abstract class Chart<U extends Entry, D extends IDataSet<U>, T extends ChartData<U, D>> extends CanvasView implements ChartInterface {
    abstract yChartMin: number;
    abstract yChartMax: number;
    abstract maxVisibleValueCount: number;

    /**
     * object that holds all data that was originally set for the chart, before
     * it was modified or any filtering algorithms had been applied
     */
    protected mData: T = null;

    /**
     * Flag that indicates if highlighting per tap (touch) is enabled
     */
    protected mHighlightPerTapEnabled: boolean;

    /**
     * If set to true, chart continues to scroll after touch up
     */
    dragDecelerationEnabled = true;

    /**
     * Deceleration friction coefficient in [0 ; 1] interval, higher values
     * indicate that speed will decrease slowly, for example if it set to 0, it
     * will stop immediately. value must be < 1.0
     */
    dragDecelerationFrictionCoef = 0.9;

    /**
     * the default IValueFormatter that has been determined by the chart
     * considering the provided minimum and maximum values, number of digits depends on provided chart-data
     */
    defaultValueFormatter = new DefaultValueFormatter(0);

    /**
     * palet object used for drawing the description text in the bottom right
     * corner of the chart
     */
    descPaint: Paint;

    /**
     * palet object for drawing the information text when there are no values in
     * the chart
     */
    mInfoPaint: Paint;

    /**
     * the object representing the labels on the x-axis
     */
    xAxis: XAxis;

    /**
     * the object responsible for representing the description text
     */
    mDescription: Description;

    /**
     * the legend object containing all data associated with the legend
     */
    protected mLegend: Legend;

    chartTouchListener: ChartTouchListener<any>;

    /**
     * text that is displayed when the chart is empty
     */
    noDataText = null;

    /**
     * Gesture listener for custom callbacks when making gestures on the chart.
     */
    // private OnChartGestureListener this.mGestureListener;

    legendRenderer: LegendRenderer;

    /**
     * object responsible for rendering the data
     */
    renderer: DataRenderer;

    highlighter: IHighlighter;

    /**
     * object that manages the bounds and drawing constraints of the chart
     */
    viewPortHandler = new ViewPortHandler();

    /**
     * object responsible for animations
     */
    animator: ChartAnimator;

    /**
     * Extra offsets to be appended to the viewport
     */
    extraTopOffset = 0;
    extraRightOffset = 0;
    extraBottomOffset = 0;
    extraLeftOffset = 0;

    /**
     * flag that indicates if offsets calculation has already been done or not
     */
    protected offsetsCalculated;

    /**
     * let the chart know it does not need to compute autoScale
     * (it can used the cached ones)
     */
    noComputeAutoScaleOnNextDraw = false;

    /**
     * let the chart know it does not need to compute axis and legends
     * (it can used the cached ones)
     */
    noComputeAxisOnNextDraw = false;
    /**
     * array of Highlight objects that reference the highlighted slices in the
     * chart
     */
    indicesToHighlight: Highlight[];

    /**
     * The maximum distance in dp away from an entry causing it to highlight.
     */
    maxHighlightDistance = 500;

    /**
     * Wether to filter highlights by axis. Default is true
     */
    highlightsFilterByAxis = true;
    /**
     * tasks to be done after the view is setup
     */
    protected jobs = [];

    /**
     * default constructor for initialization in code
     */
    constructor() {
        super();
        this.init();
    }

    initNativeView() {
        super.initNativeView();
        this.chartTouchListener && this.chartTouchListener.init();
    }
    disposeNativeView() {
        super.disposeNativeView();
        this.chartTouchListener && this.chartTouchListener.dispose();
    }

    /**
     * initialize all paints and stuff
     */
    protected init() {
        this.animator = new ChartAnimator((state) => {
            // during animations we dont need to compute autoScale nor axis things
            this.noComputeAutoScaleOnNextDraw = true;
            this.noComputeAxisOnNextDraw = true;
            this.invalidate();
        });

        this.xAxis = new XAxis(new WeakRef(this));

        if (Trace.isEnabled()) {
            CLog(CLogTypes.log, this.constructor.name, 'init()');
        }
    }

    get infoPaint() {
        if (!this.mInfoPaint) {
            this.mInfoPaint = Utils.getTemplatePaint('black-fill');
            this.mInfoPaint.setTextAlign(Align.CENTER);
            this.mInfoPaint.setTextSize(12);
        }
        return this.mInfoPaint;
    }

    public panGestureOptions: PanGestureHandlerOptions & { gestureTag?: number };
    public tapGestureOptions: TapGestureHandlerOptions & { gestureTag?: number };
    public doubleTapGestureOptions: TapGestureHandlerOptions & { gestureTag?: number };
    public pinchGestureOptions: PinchGestureHandlerOptions & { gestureTag?: number };
    public rotationGestureOptions: RotationGestureHandlerOptions & { gestureTag?: number };

    /**
     * Sets a new data object for the chart. The data object contains all values
     * and information needed for displaying.
     *
     * @param data
     */
    public set data(data: T) {
        this.mData = data;
        this.offsetsCalculated = false;

        if (!data) {
            return;
        }

        // Calculate how many digits are needed
        this.setupDefaultFormatter(data.yMin, data.yMax);

        for (const set of this.mData.dataSets) {
            if (set.needsFormatter || set.valueFormatter === this.defaultValueFormatter) {
                set.valueFormatter = this.defaultValueFormatter;
            }
        }

        // let the chart know there is new data
        this.notifyDataSetChanged();
    }

    /**
     * Returns the ChartData object that has been set for the chart.
     */
    public get data() {
        return this.mData;
    }

    get viewPortScaleX() {
        return this.viewPortHandler.scaleX;
    }

    get viewPortScaleY() {
        return this.viewPortHandler.scaleY;
    }

    /**
     * Clears the chart from all data (sets it to null) and refreshes it (by
     * calling invalidate()).
     */
    public clear() {
        this.mData = null;
        this.offsetsCalculated = false;
        this.indicesToHighlight = null;
        if (this.chartTouchListener) {
            this.chartTouchListener.lastHighlighted = null;
        }
        this.invalidate();
    }

    /**
     * Removes all DataSets (and thereby Entries) from the chart. Does not set the data object to null. Also refreshes the
     * chart by calling invalidate().
     */
    public clearValues() {
        this.mData.clearValues();
        this.invalidate();
    }

    /**
     * Returns true if the chart is empty (meaning it's data object is either
     * null or contains no entries).
     */
    public get length() {
        if (!this.mData) return true;
        else {
            if (this.mData.entryCount <= 0) return true;
            else return false;
        }
    }

    /**
     * Lets the chart know its underlying data has changed and performs all
     * necessary recalculations. It is crucial that this method is called
     * everytime data is changed dynamically. Not calling this method can lead
     * to crashes or unexpected behaviour.
     */
    public abstract notifyDataSetChanged();

    /**
     * Calculates the offsets of the chart to the border depending on the
     * position of an eventual legend or depending on the length of the y-axis
     * and x-axis labels and their position
     */
    protected abstract calculateOffsets(force?: boolean);

    /**
     * Calculates the y-min and y-max value and the y-delta and x-delta value
     */
    protected abstract calcMinMax();

    /**
     * Calculates the required number of digits for the values that might be
     * drawn in the chart (if enabled), and creates the default-value-formatter
     */
    protected setupDefaultFormatter(min, max) {
        let reference = 0;

        if (!this.mData || this.mData.entryCount < 2) {
            reference = Math.max(Math.abs(min), Math.abs(max));
        } else {
            reference = Math.abs(max - min);
        }

        const digits = Utils.getDecimals(reference);

        // setup the formatter with a new number of digits
        this.defaultValueFormatter.setup(digits);
    }

    public onDraw(canvas: Canvas) {
        super.onDraw(canvas);

        if (!this.mData) {
            const hasText = this.noDataText && this.noDataText.length > 0;

            if (hasText) {
                const c = this.center;
                canvas.drawText(this.noDataText, c.x, c.y, this.infoPaint);
            }
        }
        this.notify({ eventName: 'postDraw', object: this, canvas });
    }

    /**
     * Draws the description text in the bottom right corner of the chart (per default)
     */
    protected drawDescription(c: Canvas) {
        // check if description should be drawn
        if (this.mDescription?.enabled) {
            const position = this.mDescription.position;
            const paint = Utils.getTempPaint();
            paint.setFont(this.mDescription.typeface);
            paint.setColor(this.mDescription.textColor);
            paint.setTextAlign(this.mDescription.textAlign);

            let x, y;

            const vph = this.viewPortHandler;
            // if no position specified, draw on default position
            if (!position) {
                x = vph.chartWidth - vph.offsetRight - this.mDescription.xOffset;
                y = vph.chartHeight - vph.offsetBottom - this.mDescription.yOffset;
            } else {
                x = position.x;
                y = position.y;
            }

            c.drawText(this.mDescription.text, x, y, paint);
        }
    }

    /**
     * Returns the array of currently highlighted values. This might a null or
     * empty array if nothing is highlighted.
     */
    get highlighted() {
        return this.indicesToHighlight;
    }

    /**
     * Returns true if there are values to highlight, false if there are no
     * values to highlight. Checks if the highlight array is null, has a length
     * of zero or if the first object is null.
     *
     */
    public get hasValuesToHighlight() {
        return this.indicesToHighlight?.[0] !== undefined;
    }

    /**
     * Sets the last highlighted value for the touchlistener.
     *
     * @param highs
     */
    protected set lastHighlighted(highs) {
        if (!this.chartTouchListener) {
            return;
        }
        if (highs?.[0] === undefined) {
            this.chartTouchListener.lastHighlighted = null;
        } else {
            this.chartTouchListener.lastHighlighted = highs[0];
        }
    }

    /**
     * Highlights the values at the given indices in the given DataSets. Provide
     * null or an empty array to undo all highlighting. This should be used to
     * programmatically highlight values.
     * This method *will not* call the listener.
     *
     * @param highs
     */
    public highlightValues(highs) {
        // set the indices to highlight
        this.indicesToHighlight = highs;

        this.lastHighlighted = highs;

        // redraw the chart
        this.noComputeAutoScaleOnNextDraw = true;
        this.noComputeAxisOnNextDraw = true;
        this.invalidate();
    }

    // /**
    //  * Highlights any y-value at the given x-value in the given DataSet.
    //  * Provide -1 as the dataSetIndex to undo all highlighting.
    //  * This method will call the listener.
    //  * @param x The x-value to highlight
    //  * @param dataSetIndex The dataset index to search in
    //  */
    // public highlightValue( x, dataSetIndex) {
    //     this.highlightValue(x, dataSetIndex, true);
    // }

    // /**
    //  * Highlights the value at the given x-value and y-value in the given DataSet.
    //  * Provide -1 as the dataSetIndex to undo all highlighting.
    //  * This method will call the listener.
    //  * @param x The x-value to highlight
    //  * @param y The y-value to highlight. Supply `NaN` for "any"
    //  * @param dataSetIndex The dataset index to search in
    //  */
    // public highlightValue(x, y, dataSetIndex) {
    //     this.highlightValue(x, y, dataSetIndex, true);
    // }

    // /**
    //  * Highlights any y-value at the given x-value in the given DataSet.
    //  * Provide -1 as the dataSetIndex to undo all highlighting.
    //  * @param x The x-value to highlight
    //  * @param dataSetIndex The dataset index to search in
    //  * @param callListener Should the listener be called for this change
    //  */
    // public highlightValue(x, dataSetIndex,  callListener = true) {
    //     this.highlightValue(x, NaN, dataSetIndex, callListener);
    // }

    /**
     * Highlights any y-value at the given x-value in the given DataSet.
     * Provide -1 as the dataSetIndex to undo all highlighting.
     * @param x The x-value to highlight
     * @param y The y-value to highlight. Supply `NaN` for "any"
     * @param dataSetIndex The dataset index to search in
     * @param callListener Should the listener be called for this change
     */
    public highlightValue(x, y, dataSetIndex, callListener = false) {
        if (dataSetIndex < 0 || dataSetIndex >= this.mData.dataSetCount) {
            this.highlight(null, callListener);
        } else {
            this.highlight({ x, y, dataSetIndex }, callListener);
        }
    }

    /**
     * Highlights the value selected by touch gesture. Unlike
     * highlightValues(...), this generates a callback to the
     * OnChartValueSelectedListener.
     *
     * @param high         - the highlight object
     * @param callListener - call the listener
     */
    public highlight(high: Highlight | Highlight[], callListener = false) {
        let e: Entry = null;
        let highlight = Array.isArray(high) ? high[0] : high;
        if (!high) {
            this.indicesToHighlight = null;
        } else {
            e = this.mData.getEntryForHighlight(highlight);
            if (!e) {
                this.indicesToHighlight = null;
                highlight = null;
            } else {
                highlight.entry = e;
                // set the indices to highlight
                this.indicesToHighlight = [highlight];
            }
        }
        this.lastHighlighted = this.indicesToHighlight;

        if (callListener) {
            this.notify({ eventName: 'highlight', object: this, entry: e, highlight, highlights: Array.isArray(high) ? high : [highlight] } as HighlightEventData);
        }

        // redraw the chart
        this.noComputeAutoScaleOnNextDraw = true;
        this.noComputeAxisOnNextDraw = true;
        this.invalidate();
    }

    /**
     * Highlights the value selected by touch gesture. Unlike
     * highlightValues(...), this generates a callback to the
     * OnChartValueSelectedListener.
     *
     * @param high         - the highlight object
     * @param callListener - call the listener
     */
    public highlights(highs: Highlight[], callListener = false) {
        const e: Entry = null;

        if (highs.length === 0) {
            this.indicesToHighlight = null;
        } else {
            highs = highs
                .map((h) => {
                    if (!h.entry) {
                        h.entry = this.mData.getEntryForHighlight(h);
                    }
                    return h;
                })
                .filter((h) => !!h.entry);
            this.indicesToHighlight = highs.length ? highs : null;
        }
        this.lastHighlighted = this.indicesToHighlight;

        if (callListener) {
            this.notify({ eventName: 'highlight', object: this, entry: highs?.[0]?.entry, highlight: highs?.[0], highlights: highs } as HighlightEventData);
        }

        // redraw the chart
        this.noComputeAutoScaleOnNextDraw = true;
        this.noComputeAxisOnNextDraw = true;
        this.invalidate();
    }

    /**
     * Returns the Highlights (contains x-index and DataSet index) of the
     * selected value at the given touch polet inside the Line-, Scatter-, or
     * CandleStick-Chart.
     *
     * @param x
     * @param y
     * @return
     */
    public getHighlightsByTouchPoint(x, y) {
        return this.highlighter.getHighlight(x, y);
    }
    /**
     * Returns the Highlight object (contains x-index and DataSet index) of the
     * selected value at the given touch polet inside the Line-, Scatter-, or
     * CandleStick-Chart.
     *
     * @param x
     * @param y
     * @return
     */
    public getHighlightByTouchPoint(x, y) {
        return this.getHighlightsByTouchPoint(x, y)?.[0];
    }
    /**
     * Returns the Highlight object (contains x-index and DataSet index) of the
     * selected value at the given touch polet inside the Line-, Scatter-, or
     * CandleStick-Chart.
     *
     * @param x
     * @param y
     * @return
     */
    public getHighlightByXValue(xValue) {
        if (!this.mData) {
            return null;
        } else {
            return this.highlighter.getHighlightsAtXValue(xValue);
        }
    }

    // /**
    //  * Set a new (e.g. custom) ChartTouchListener NOTE: make sure to
    //  * setTouchEnabled(true); if you need touch gestures on the chart
    //  *
    //  * @param l
    //  */
    // public setOnTouchListener(ChartTouchListener l) {
    //     this.chartTouchListener = l;
    // }

    // /**
    //  * Returns an instance of the currently active touch listener.
    //  *
    //  * @return
    //  */
    // public ChartTouchListener getOnTouchListener() {
    //     return this.chartTouchListener;
    // }

    /**
     * ################ ################ ################ ################
     */
    /** BELOW CODE IS FOR THE MARKER VIEW */

    /**
     * if set to true, the marker view is drawn when a value is clicked
     */
    drawMarkersEnabled = true;

    /**
     * the view that represents the marker
     */
    marker: IMarker;

    /**
     * draws all MarkerViews on the highlighted positions
     */
    protected drawMarkers(canvas: Canvas) {
        // if there is no marker view or drawing marker is disabled
        if (!this.marker || !this.drawMarkersEnabled || !this.hasValuesToHighlight) return;

        for (let i = 0; i < this.indicesToHighlight.length; i++) {
            const highlight = this.indicesToHighlight[i];

            const set = this.mData.getDataSetByIndex(highlight.dataSetIndex);

            const e = highlight.entry || this.mData.getEntryForHighlight(highlight);
            const entryIndex = set.getEntryIndex(e as any);

            // make sure entry not null
            if (!e || entryIndex > set.entryCount * this.animator.phaseX) continue;

            const pos = this.getMarkerPosition(highlight);

            // check bounds
            if (!this.viewPortHandler.isInBounds(pos[0], pos[1])) continue;

            // callbacks to update the content
            this.marker.refreshContent(e, highlight);

            // draw the marker
            this.marker.draw(canvas, pos[0], pos[1]);
        }
    }

    /**
     * Returns the actual position in pixels of the MarkerView for the given
     * Highlight object.
     *
     * @param high
     * @return
     */
    protected getMarkerPosition(high: Highlight) {
        return [high.drawX, high.drawY];
    }

    /**
     * ################ ################ ################ ################
     * ANIMATIONS ONLY WORK FOR API LEVEL 11 (Android 3.0.x) AND HIGHER.
     */
    /** CODE BELOW THIS RELATED TO ANIMATION */

    /**
     * Returns the animator responsible for animating chart values.
     */
    public get description() {
        if (!this.mDescription) {
            this.mDescription = new Description();
        }
        return this.mDescription;
    }

    /**
     * ################ ################ ################ ################
     * ANIMATIONS ONLY WORK FOR API LEVEL 11 (Android 3.0.x) AND HIGHER.
     */
    /** CODE BELOW FOR PROVIDING EASING FUNCTIONS */

    /**
     * Animates the drawing / rendering of the chart on both x- and y-axis with
     * the specified animation time. If animate(...) is called, no further
     * calling of invalidate() is necessary to refresh the chart. ANIMATIONS
     * ONLY WORK FOR API LEVEL 11 (Android 3.0.x) AND HIGHER.
     *
     * @param durationMillisX
     * @param durationMillisY
     * @param easingX         a custom easing function to be used on the animation phase
     * @param easingY         a custom easing function to be used on the animation phase
     */
    public animateXY(durationMillisX, durationMillisY, easingX?: EasingFunction, easingY?: EasingFunction) {
        this.animator.animateXY(durationMillisX, durationMillisY, easingX, easingY);
    }

    /**
     * Animates the rendering of the chart on the x-axis with the specified
     * animation time. If animate(...) is called, no further calling of
     * invalidate() is necessary to refresh the chart. ANIMATIONS ONLY WORK FOR
     * API LEVEL 11 (Android 3.0.x) AND HIGHER.
     *
     * @param durationMillis
     * @param easing         a custom easing function to be used on the animation phase
     */
    public animateX(durationMillis, easing?: EasingFunction) {
        this.animator.animateX(durationMillis, easing);
    }

    /**
     * Animates the rendering of the chart on the y-axis with the specified
     * animation time. If animate(...) is called, no further calling of
     * invalidate() is necessary to refresh the chart. ANIMATIONS ONLY WORK FOR
     * API LEVEL 11 (Android 3.0.x) AND HIGHER.
     *
     * @param durationMillis
     * @param easing         a custom easing function to be used on the animation phase
     */
    public animateY(durationMillis, easing?: EasingFunction) {
        this.animator.animateY(durationMillis, easing);
    }

    /**
     * ################ ################ ################ ################
     */
    /** BELOW THIS ONLY GETTERS AND SETTERS */

    /**
     * returns the current y-max value across all DataSets
     */
    public get yMax() {
        return this.mData.yMax;
    }

    /**
     * returns the current y-min value across all DataSets
     */
    public get yMin() {
        return this.mData.yMin;
    }

    public get xChartMax() {
        return this.xAxis.axisMaximum;
    }

    public get xChartMin() {
        return this.xAxis.axisMinimum;
    }

    public get xRange() {
        return this.xAxis.axisRange;
    }

    /**
     * Returns a recyclable MPPointF instance.
     * Returns the center polet of the chart (the whole View) in pixels.
     */
    public get center() {
        return { x: this.viewPortHandler.chartWidth / 2, y: this.viewPortHandler.chartHeight / 2 };
    }

    /**
     * Returns a recyclable MPPointF instance.
     * Returns the center of the chart taking offsets under consideration.
     * (returns the center of the content rectangle)
     */
    public get centerOffsets() {
        return this.viewPortHandler.contentCenter;
    }

    /**
     * Sets extra offsets (around the chart view) to be appended to the
     * auto-calculated offsets.
     *
     * @param left
     * @param top
     * @param right
     * @param bottom
     */
    public setExtraOffsets(left, top, right, bottom) {
        this.extraLeftOffset = left;
        this.extraTopOffset = top;
        this.extraRightOffset = right;
        this.extraBottomOffset = bottom;
    }
    /**
     * Sets extra offsets (around the chart view) to be appended to the
     * auto-calculated offsets.
     *
     * @param left
     * @param top
     * @param right
     * @param bottom
     */
    public set extraOffsets(value: [number, number, number, number]) {
        this.extraLeftOffset = value[0];
        this.extraTopOffset = value[1];
        this.extraRightOffset = value[2];
        this.extraBottomOffset = value[3];
    }

    /**
     * Sets the color of the no data text.
     *
     * @param color
     */
    public set noDataTextColor(color) {
        this.infoPaint.setColor(color);
    }

    /**
     * Sets the typeface to be used for the no data text.
     */
    public set noDataTextTypeface(tf: Font) {
        this.infoPaint.setTypeface(tf);
    }

    /**
     * Returns the Legend object of the chart. This method can be used to get an
     * instance of the legend in order to customize the automatically generated
     * Legend.
     */
    public get legend() {
        if (!this.mLegend) {
            this.mLegend = new Legend();
            this.legendRenderer = new LegendRenderer(this.viewPortHandler, this.mLegend);
        }
        return this.mLegend;
    }

    /**
     * Returns the rectangle that defines the borders of the chart-value surface
     * (into which the actual values are drawn).
     */
    public get contentRect() {
        return this.viewPortHandler.contentRect;
    }

    /**
     * Returns a recyclable MPPointF instance.
     */
    public get centerOfView() {
        return this.center;
    }

    /**
     * Flag that indicates if highlighting per tap (touch) is enabled
     */
    get highlightPerTapEnabled() {
        return this.mHighlightPerTapEnabled;
    }
    /**
     * Flag that indicates if highlighting per tap (touch) is enabled
     */
    set highlightPerTapEnabled(value: boolean) {
        this.mHighlightPerTapEnabled = value;
    }

    /**
     * Returns the bitmap that represents the chart.
     */
    public get chartBitmap() {
        //Define a bitmap with the same size as the view
        const canvas = new Canvas(this.getMeasuredWidth(), this.getMeasuredHeight());
        canvas.drawColor(this.backgroundColor);

        // draw the view on the canvas
        this.onDraw(canvas);
        // return the bitmap
        return canvas.getImage();
    }

    public removeViewportJob(job) {
        const index = this.jobs.indexOf(job);
        if (index >= 0) {
            this.jobs.splice(index, 1);
        }
    }

    public clearAllViewportJobs() {
        this.jobs = [];
    }

    /**
     * Either posts a job immediately if the chart has already setup it's
     * dimensions or adds the job to the execution queue.
     *
     * @param job
     */
    public addViewportJob(job: ViewPortJob) {
        if (this.viewPortHandler.hasChartDimens) {
            setTimeout(() => {
                job.run();
            }, 0);
        } else {
            this.jobs.push(job);
        }
    }

    /**
     * Returns all jobs that are scheduled to be executed after
     * onSizeChanged(...).
     */
    public getJobs() {
        return this.jobs;
    }

    onSetWidthHeight(w: number, h: number) {
        const needsDataSetChanged = !this.viewPortHandler.hasChartDimens;
        if (Trace.isEnabled()) {
            CLog(CLogTypes.info, LOG_TAG, 'onSetWidthHeight', w, h, needsDataSetChanged);
        }

        if (w > 0 && h > 0) {
            if (Trace.isEnabled()) {
                CLog(CLogTypes.info, LOG_TAG, 'Setting chart dimens, width: ' + w + ', height: ' + h);
            }
            this.viewPortHandler.setChartDimens(w, h);
        }

        // This may cause the chart view to mutate properties affecting the view port --
        //   lets do this before we try to run any pending jobs on the view port itself
        // this.notifyDataSetChanged();
        if (needsDataSetChanged) {
            this.notifyDataSetChanged();
        } else {
            this.offsetsCalculated = false;
            this.invalidate(); // needs chart size
        }

        for (const r of this.jobs) {
            setTimeout(() => {
                r.run();
            }, 0);
        }

        this.jobs = [];
        this.notify({ eventName: 'sizeChanged', object: this });
    }
    public onLayout(left: number, top: number, right: number, bottom: number) {
        super.onLayout(left, top, right, bottom);

        if (__IOS__) {
            this.onSetWidthHeight(Math.round(NUtils.layout.toDeviceIndependentPixels(right - left)), Math.round(NUtils.layout.toDeviceIndependentPixels(bottom - top)));
        }
    }
    public onSizeChanged(w: number, h: number, oldw: number, oldh: number): void {
        super.onSizeChanged(w, h, oldw, oldh);
        if (__ANDROID__) {
            this.onSetWidthHeight(Math.round(w), Math.round(h));
        }
    }

    /**
     * Setting this to true will set the layer-type HARDWARE for the view, false
     * will set layer-type SOFTWARE.
     *
     * @param enabled
     */
    public set hardwareAccelerationEnabled(enabled) {
        this.hardwareAccelerated = enabled;
    }

    /**
     * disables intercept touchevents
     */
    disableScroll() {
        if (__ANDROID__) {
            const parent: android.view.ViewParent = this.nativeViewProtected?.getParent();
            parent?.requestDisallowInterceptTouchEvent(true);
        }
    }

    /**
     * enables intercept touchevents
     */
    enableScroll() {
        if (__ANDROID__) {
            const parent: android.view.ViewParent = this.nativeViewProtected?.getParent();
            parent?.requestDisallowInterceptTouchEvent(false);
        }
    }
}
