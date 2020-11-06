import { IDataSet } from '../interfaces/datasets/IDataSet';
import { Entry } from '../data/Entry';
import { ChartData } from '../data/ChartData';
import { ChartInterface } from '../interfaces/dataprovider/ChartInterface';
import { Align, Canvas, CanvasView, Paint } from '@nativescript-community/ui-canvas';
import { DefaultValueFormatter } from '../formatter/DefaultValueFormatter';
import { Utils } from '../utils/Utils';
import { Color } from '@nativescript/core/color';
import { Highlight } from '../highlight/Highlight';
import { Legend } from '../components/Legend';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { XAxis } from '../components/XAxis';
import { Description } from '../components/Description';
import { DataRenderer } from '../renderer/DataRenderer';
import { IMarker } from '../components/IMarker';
import { LegendRenderer } from '../renderer/LegendRenderer';
import { IHighlighter } from '../highlight/IHighlighter';
import { profile } from '@nativescript/core/profiling';
import { ChartAnimator, EasingFunction } from '../animation/ChartAnimator';
import { ViewPortJob } from '../jobs/ViewPortJob';
import { ChartTouchListener } from '../listener/ChartTouchListener';
import { layout } from '@nativescript/core/utils/utils';
import { EventData } from '@nativescript/core';

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
 * @author Philipp Jahoda
 */
export abstract class Chart<U extends Entry, D extends IDataSet<U>, T extends ChartData<U, D>> extends CanvasView implements ChartInterface {
    abstract getYChartMin();
    abstract getYChartMax();
    abstract getMaxVisibleCount();

    /**
     * flag that indicates if logging is enabled or not
     */
    protected mLogEnabled = false;

    /**
     * object that holds all data that was originally set for the chart, before
     * it was modified or any filtering algorithms had been applied
     */
    protected mData: T = null;

    /**
     * Flag that indicates if highlighting per tap (touch) is enabled
     */
    protected mHighLightPerTapEnabled = false;

    /**
     * If set to true, chart continues to scroll after touch up
     */
    private mDragDecelerationEnabled = true;

    /**
     * Deceleration friction coefficient in [0 ; 1] interval, higher values
     * indicate that speed will decrease slowly, for example if it set to 0, it
     * will stop immediately. 1 is an invalid value, and will be converted to
     * 0.999f automatically.
     */
    private mDragDecelerationFrictionCoef = 0.9;

    /**
     * default value-formatter, number of digits depends on provided chart-data
     */
    protected mDefaultValueFormatter = new DefaultValueFormatter(0);

    /**
     * palet object used for drawing the description text in the bottom right
     * corner of the chart
     */
    protected mDescPaint: Paint;

    /**
     * palet object for drawing the information text when there are no values in
     * the chart
     */
    protected mInfoPaint: Paint;

    /**
     * the object representing the labels on the x-axis
     */
    protected mXAxis: XAxis;

    /**
     * if true, touch gestures are enabled on the chart
     */
    protected mTouchEnabled = true;

    /**
     * the object responsible for representing the description text
     */
    protected mDescription: Description;

    /**
     * the legend object containing all data associated with the legend
     */
    protected mLegend: Legend;

    protected mChartTouchListener: ChartTouchListener<any>;

    /**
     * text that is displayed when the chart is empty
     */
    private mNoDataText = null;

    /**
     * Gesture listener for custom callbacks when making gestures on the chart.
     */
    // private OnChartGestureListener this.mGestureListener;

    protected mLegendRenderer: LegendRenderer;

    /**
     * object responsible for rendering the data
     */
    protected mRenderer: DataRenderer;

    protected mHighlighter: IHighlighter;

    /**
     * object that manages the bounds and drawing constraints of the chart
     */
    protected mViewPortHandler = new ViewPortHandler();

    /**
     * object responsible for animations
     */
    protected mAnimator: ChartAnimator;

    /**
     * Extra offsets to be appended to the viewport
     */
    private mExtraTopOffset = 0;
    private mExtraRightOffset = 0;
    private mExtraBottomOffset = 0;
    private mExtraLeftOffset = 0;

    /**
     * flag that indicates if offsets calculation has already been done or not
     */
    protected mOffsetsCalculated = false;

    /**
     * let the drawer know it does not need to compute axis and legends
     * (it can used the cached ones)
     */
    protected noComputeOnNextDraw = false;
    /**
     * array of Highlight objects that reference the highlighted slices in the
     * chart
     */
    protected mIndicesToHighlight: Highlight[];

    /**
     * The maximum distance in dp away from an entry causing it to highlight.
     */
    protected mMaxHighlightDistance = 0;

    /**
     * default constructor for initialization in code
     */
    constructor() {
        super();
        this.init();
    }

    initNativeView() {
        super.initNativeView();
        this.mChartTouchListener && this.mChartTouchListener.init();
    }
    disposeNativeView() {
        super.disposeNativeView();
        this.mChartTouchListener && this.mChartTouchListener.dispose();
    }

    /**
     * initialize all paints and stuff
     */
    protected init() {
        this.mAnimator = new ChartAnimator(() => {
            // during animations we dont need to compute axis things
            this.noComputeOnNextDraw = true;
            this.invalidate();
        });

        this.mMaxHighlightDistance = 500;

        // this.mDescription = new Description();
        this.mLegend = new Legend();

        this.mLegendRenderer = new LegendRenderer(this.mViewPortHandler, this.mLegend);

        this.mXAxis = new XAxis();

        this.mDescPaint = new Paint();
        this.mDescPaint.setAntiAlias(true);

        this.mInfoPaint = new Paint();
        this.mInfoPaint.setAntiAlias(true);
        this.mInfoPaint.setColor('#F7BD33'); // orange
        this.mInfoPaint.setTextAlign(Align.CENTER);
        this.mInfoPaint.setTextSize(12);

        if (this.mLogEnabled) console.log('', 'Chart.init()');
    }

    /**
     * Sets a new data object for the chart. The data object contains all values
     * and information needed for displaying.
     *
     * @param data
     */
    public setData(data: T) {
        this.mData = data;
        this.mOffsetsCalculated = false;

        if (data == null) {
            return;
        }

        // calculate how many digits are needed
        this.setupDefaultFormatter(data.getYMin(), data.getYMax());

        for (const set of this.mData.getDataSets()) {
            if (set.needsFormatter() || set.getValueFormatter() === this.mDefaultValueFormatter) set.setValueFormatter(this.mDefaultValueFormatter);
        }

        // let the chart know there is new data
        this.notifyDataSetChanged();
    }

    /**
     * Clears the chart from all data (sets it to null) and refreshes it (by
     * calling invalidate()).
     */
    public clear() {
        this.mData = null;
        this.mOffsetsCalculated = false;
        this.mIndicesToHighlight = null;
        this.mChartTouchListener && this.mChartTouchListener.setLastHighlighted(null);
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
     *
     * @return
     */
    public length() {
        if (this.mData == null) return true;
        else {
            if (this.mData.getEntryCount() <= 0) return true;
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

        if (this.mData == null || this.mData.getEntryCount() < 2) {
            reference = Math.max(Math.abs(min), Math.abs(max));
        } else {
            reference = Math.abs(max - min);
        }

        const digits = Utils.getDecimals(reference);

        // setup the formatter with a new number of digits
        this.mDefaultValueFormatter.setup(digits);
    }

    public onDraw(canvas: Canvas) {
        // super.onDraw(canvas);

        if (this.mData === null) {
            const hasText = this.mNoDataText && this.mNoDataText.length > 0;

            if (hasText) {
                const c = this.getCenter();
                canvas.drawText(this.mNoDataText, c.x, c.y, this.mInfoPaint);
            }

            return;
        }

        // if (!this.mOffsetsCalculated) {
        this.calculateOffsets(false);
        // this.mOffsetsCalculated = true;
        // }
    }

    /**
     * Draws the description text in the bottom right corner of the chart (per default)
     */

    protected drawDescription(c: Canvas) {
        // check if description should be drawn
        if (this.mDescription != null && this.mDescription.isEnabled()) {
            const position = this.mDescription.getPosition();

            this.mDescPaint.setFont(this.mDescription.getFont());
            this.mDescPaint.setColor(this.mDescription.getTextColor());
            this.mDescPaint.setTextAlign(this.mDescription.getTextAlign());

            let x, y;

            const vph = this.mViewPortHandler;
            // if no position specified, draw on default position
            if (position == null) {
                x = vph.getChartWidth() - vph.offsetRight() - this.mDescription.getXOffset();
                y = vph.getChartHeight() - vph.offsetBottom() - this.mDescription.getYOffset();
            } else {
                x = position.x;
                y = position.y;
            }

            c.drawText(this.mDescription.getText(), x, y, this.mDescPaint);
        }
    }

    /**
     * ################ ################ ################ ################
     */
    /** BELOW THIS CODE FOR HIGHLIGHTING */

    public getMaxHighlightDistance() {
        return this.mMaxHighlightDistance;
    }

    /**
     * Sets the maximum distance in screen dp a touch can be away from an entry to cause it to get highlighted.
     * Default: 500dp
     *
     * @param distDp
     */
    public setMaxHighlightDistance(distDp) {
        this.mMaxHighlightDistance = distDp;
    }

    /**
     * Returns the array of currently highlighted values. This might a null or
     * empty array if nothing is highlighted.
     *
     * @return
     */
    public getHighlighted() {
        return this.mIndicesToHighlight;
    }

    /**
     * Returns true if values can be highlighted via tap gesture, false if not.
     *
     * @return
     */
    public isHighlightPerTapEnabled() {
        return this.mHighLightPerTapEnabled;
    }

    /**
     * Set this to false to prevent values from being highlighted by tap gesture.
     * Values can still be highlighted via drag or programmatically. Default: true
     *
     * @param enabled
     */
    public setHighlightPerTapEnabled(enabled) {
        this.mHighLightPerTapEnabled = enabled;
    }

    /**
     * Returns true if there are values to highlight, false if there are no
     * values to highlight. Checks if the highlight array is null, has a length
     * of zero or if the first object is null.
     *
     * @return
     */
    public valuesToHighlight() {
        return this.mIndicesToHighlight == null || this.mIndicesToHighlight.length <= 0 || this.mIndicesToHighlight[0] == null ? false : true;
    }

    /**
     * Sets the last highlighted value for the touchlistener.
     *
     * @param highs
     */
    protected setLastHighlighted(highs) {
        if (!this.mChartTouchListener) {
            return;
        }
        if (highs == null || highs.length <= 0 || highs[0] == null) {
            this.mChartTouchListener.setLastHighlighted(null);
        } else {
            this.mChartTouchListener.setLastHighlighted(highs[0]);
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
        this.mIndicesToHighlight = highs;

        this.setLastHighlighted(highs);

        // redraw the chart
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
        if (dataSetIndex < 0 || dataSetIndex >= this.mData.getDataSetCount()) {
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
    public highlight(high: Highlight, callListener = false) {
        let e: Entry = null;

        if (high == null) {
            this.mIndicesToHighlight = null;
        } else {
            // if (this.mLogEnabled) console.log(LOG_TAG, 'Highlighted', high);

            e = this.mData.getEntryForHighlight(high);
            if (e == null) {
                this.mIndicesToHighlight = null;
                high = null;
            } else {
                high.entry = e;
                // set the indices to highlight
                this.mIndicesToHighlight = [high];
            }
        }

        this.setLastHighlighted(this.mIndicesToHighlight);

        if (callListener) {
            this.notify({ eventName: 'highlight', object: this, entry: e, highlight: high } as HighlightEventData);
        }

        // redraw the chart
        this.invalidate();
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
        if (this.mData == null) {
            console.error(LOG_TAG, "Can't select by touch. No data set.");
            return null;
        } else return this.getHighlighter().getHighlight(x, y);
    }

    // /**
    //  * Set a new (e.g. custom) ChartTouchListener NOTE: make sure to
    //  * setTouchEnabled(true); if you need touch gestures on the chart
    //  *
    //  * @param l
    //  */
    // public setOnTouchListener(ChartTouchListener l) {
    //     this.mChartTouchListener = l;
    // }

    // /**
    //  * Returns an instance of the currently active touch listener.
    //  *
    //  * @return
    //  */
    // public ChartTouchListener getOnTouchListener() {
    //     return this.mChartTouchListener;
    // }

    /**
     * ################ ################ ################ ################
     */
    /** BELOW CODE IS FOR THE MARKER VIEW */

    /**
     * if set to true, the marker view is drawn when a value is clicked
     */
    protected mDrawMarkers = true;

    /**
     * the view that represents the marker
     */
    protected mMarker: IMarker;

    /**
     * draws all MarkerViews on the highlighted positions
     */
    protected drawMarkers(canvas: Canvas) {
        // if there is no marker view or drawing marker is disabled
        if (this.mMarker == null || !this.isDrawMarkersEnabled() || !this.valuesToHighlight()) return;

        for (let i = 0; i < this.mIndicesToHighlight.length; i++) {
            const highlight = this.mIndicesToHighlight[i];

            const set = this.mData.getDataSetByIndex(highlight.dataSetIndex);

            const e = highlight.entry || this.mData.getEntryForHighlight(highlight);
            const entryIndex = set.getEntryIndex(e as any);

            // make sure entry not null
            if (e == null || entryIndex > set.getEntryCount() * this.mAnimator.getPhaseX()) continue;

            const pos = this.getMarkerPosition(highlight);

            // check bounds
            if (!this.mViewPortHandler.isInBounds(pos[0], pos[1])) continue;

            // callbacks to update the content
            this.mMarker.refreshContent(e, highlight);

            // draw the marker
            this.mMarker.draw(canvas, pos[0], pos[1]);
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
     *
     * @return
     */
    public getAnimator() {
        return this.mAnimator;
    }

    /**
     * If set to true, chart continues to scroll after touch up default: true
     */
    public isDragDecelerationEnabled() {
        return this.mDragDecelerationEnabled;
    }

    /**
     * If set to true, chart continues to scroll after touch up. Default: true.
     *
     * @param enabled
     */
    public setDragDecelerationEnabled(enabled) {
        this.mDragDecelerationEnabled = enabled;
    }

    /**
     * Returns drag deceleration friction coefficient
     *
     * @return
     */
    public getDragDecelerationFrictionCoef() {
        return this.mDragDecelerationFrictionCoef;
    }

    /**
     * Deceleration friction coefficient in [0 ; 1] interval, higher values
     * indicate that speed will decrease slowly, for example if it set to 0, it
     * will stop immediately. 1 is an invalid value, and will be converted to
     * 0.999f automatically.
     *
     * @param newValue
     */
    public setDragDecelerationFrictionCoef(newValue) {
        if (newValue < 0) newValue = 0;

        if (newValue >= 1) newValue = 0.999;

        this.mDragDecelerationFrictionCoef = newValue;
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
        this.mAnimator.animateXY(durationMillisX, durationMillisY, easingX, easingY);
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
        this.mAnimator.animateX(durationMillis, easing);
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
        this.mAnimator.animateY(durationMillis, easing);
    }

    /**
     * ################ ################ ################ ################
     */
    /** BELOW THIS ONLY GETTERS AND SETTERS */

    /**
     * Returns the object representing all x-labels, this method can be used to
     * acquire the XAxis object and modify it (e.g. change the position of the
     * labels, styling, etc.)
     *
     * @return
     */
    public getXAxis() {
        return this.mXAxis;
    }

    /**
     * Returns the default IValueFormatter that has been determined by the chart
     * considering the provided minimum and maximum values.
     *
     * @return
     */
    public getDefaultValueFormatter() {
        return this.mDefaultValueFormatter;
    }

    /**
     * returns the current y-max value across all DataSets
     *
     * @return
     */
    public getYMax() {
        return this.mData.getYMax();
    }

    /**
     * returns the current y-min value across all DataSets
     *
     * @return
     */
    public getYMin() {
        return this.mData.getYMin();
    }

    public getXChartMax() {
        return this.mXAxis.mAxisMaximum;
    }

    public getXChartMin() {
        return this.mXAxis.mAxisMinimum;
    }

    public getXRange() {
        return this.mXAxis.mAxisRange;
    }

    /**
     * Returns a recyclable MPPointF instance.
     * Returns the center polet of the chart (the whole View) in pixels.
     *
     * @return
     */
    public getCenter() {
        return { x: this.mViewPortHandler.getChartWidth() / 2, y: this.mViewPortHandler.getChartHeight() / 2 };
    }

    /**
     * Returns a recyclable MPPointF instance.
     * Returns the center of the chart taking offsets under consideration.
     * (returns the center of the content rectangle)
     *
     * @return
     */

    public getCenterOffsets() {
        return this.mViewPortHandler.getContentCenter();
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
        this.setExtraLeftOffset(left);
        this.setExtraTopOffset(top);
        this.setExtraRightOffset(right);
        this.setExtraBottomOffset(bottom);
    }

    /**
     * Set an extra offset to be appended to the viewport's top
     */
    public setExtraTopOffset(offset) {
        this.mExtraTopOffset = offset;
    }

    /**
     * @return the extra offset to be appended to the viewport's top
     */
    public getExtraTopOffset() {
        return this.mExtraTopOffset;
    }

    /**
     * Set an extra offset to be appended to the viewport's right
     */
    public setExtraRightOffset(offset) {
        this.mExtraRightOffset = offset;
    }

    /**
     * @return the extra offset to be appended to the viewport's right
     */
    public getExtraRightOffset() {
        return this.mExtraRightOffset;
    }

    /**
     * Set an extra offset to be appended to the viewport's bottom
     */
    public setExtraBottomOffset(offset) {
        this.mExtraBottomOffset = offset;
    }

    /**
     * @return the extra offset to be appended to the viewport's bottom
     */
    public getExtraBottomOffset() {
        return this.mExtraBottomOffset;
    }

    /**
     * Set an extra offset to be appended to the viewport's left
     */
    public setExtraLeftOffset(offset) {
        this.mExtraLeftOffset = offset;
    }

    /**
     * @return the extra offset to be appended to the viewport's left
     */
    public getExtraLeftOffset() {
        return this.mExtraLeftOffset;
    }

    /**
     * Set this to true to enable logcat outputs for the chart. Beware that
     * logcat output decreases rendering performance. Default: disabled.
     *
     * @param enabled
     */
    public setLogEnabled(enabled) {
        this.mLogEnabled = enabled;
    }

    /**
     * Returns true if log-output is enabled for the chart, fals if not.
     *
     * @return
     */
    public isLogEnabled() {
        return this.mLogEnabled;
    }

    /**
     * Sets the text that informs the user that there is no data available with
     * which to draw the chart.
     *
     * @param text
     */
    public setNoDataText(text) {
        this.mNoDataText = text;
    }

    /**
     * Sets the color of the no data text.
     *
     * @param color
     */
    public setNoDataTextColor(color) {
        this.mInfoPaint.setColor(color);
    }

    /**
     * Sets the typeface to be used for the no data text.
     *
     * @param tf
     */
    public setNoDataTextTypeface(tf) {
        this.mInfoPaint.setTypeface(tf);
    }

    /**
     * Set this to false to disable all gestures and touches on the chart,
     * default: true
     *
     * @param enabled
     */
    public setTouchEnabled(enabled) {
        // actually not used...
        this.mTouchEnabled = enabled;
    }

    /**
     * sets the marker that is displayed when a value is clicked on the chart
     *
     * @param marker
     */
    public setMarker(marker: IMarker) {
        this.mMarker = marker;
    }

    /**
     * returns the marker that is set as a marker view for the chart
     *
     * @return
     */
    public getMarker() {
        return this.mMarker;
    }

    public setMarkerView(v: IMarker) {
        this.setMarker(v);
    }

    public getMarkerView() {
        return this.getMarker();
    }

    /**
     * Sets a new Description object for the chart.
     *
     * @param desc
     */
    public setDescription(desc: Description) {
        this.mDescription = desc;
    }

    /**
     * Returns the Description object of the chart that is responsible for holding all information related
     * to the description text that is displayed in the bottom right corner of the chart (by default).
     *
     * @return
     */
    public getDescription() {
        return this.mDescription;
    }

    /**
     * Returns the Legend object of the chart. This method can be used to get an
     * instance of the legend in order to customize the automatically generated
     * Legend.
     *
     * @return
     */
    public getLegend() {
        return this.mLegend;
    }

    /**
     * Returns the renderer object responsible for rendering / drawing the
     * Legend.
     *
     * @return
     */
    public getLegendRenderer() {
        return this.mLegendRenderer;
    }

    /**
     * Returns the rectangle that defines the borders of the chart-value surface
     * (into which the actual values are drawn).
     *
     * @return
     */

    public getContentRect() {
        return this.mViewPortHandler.getContentRect();
    }

    /**
     * disables intercept touchevents
     */
    public disableScroll() {
        // const parent = getParent();
        // if (parent != null)
        //     parent.requestDisallowInterceptTouchEvent(true);
    }

    /**
     * enables intercept touchevents
     */
    public enableScroll() {
        // ViewParent parent = getParent();
        // if (parent != null)
        //     parent.requestDisallowInterceptTouchEvent(false);
    }

    /**
     * palet for the grid background (only line and barchart)
     */
    public static PAINT_GRID_BACKGROUND = 4;

    /**
     * palet for the info text that is displayed when there are no values in the
     * chart
     */
    public static PAINT_INFO = 7;

    /**
     * palet for the description text in the bottom right corner
     */
    public static PAINT_DESCRIPTION = 11;

    /**
     * palet for the hole in the middle of the pie chart
     */
    public static PAINT_HOLE = 13;

    /**
     * palet for the text in the middle of the pie chart
     */
    public static PAINT_CENTER_TEXT = 14;

    /**
     * palet used for the legend
     */
    public static PAINT_LEGEND_LABEL = 18;

    /**
     * set a new palet object for the specified parameter in the chart e.g.
     * Chart.PAINT_VALUES
     *
     * @param p     the new palet object
     * @param which Chart.PAINT_VALUES, Chart.PAINT_GRID, Chart.PAINT_VALUES,
     *              ...
     */
    public setPaint(p, which) {
        switch (which) {
            case Chart.PAINT_INFO:
                this.mInfoPaint = p;
                break;
            case Chart.PAINT_DESCRIPTION:
                this.mDescPaint = p;
                break;
        }
    }

    /**
     * Returns the palet object associated with the provided constant.
     *
     * @param which e.g. Chart.PAINT_LEGEND_LABEL
     * @return
     */
    public getPaint(which) {
        switch (which) {
            case Chart.PAINT_INFO:
                return this.mInfoPaint;
            case Chart.PAINT_DESCRIPTION:
                return this.mDescPaint;
        }

        return null;
    }

    public isDrawMarkerViewsEnabled() {
        return this.isDrawMarkersEnabled();
    }

    public setDrawMarkerViews(enabled) {
        this.setDrawMarkers(enabled);
    }

    /**
     * returns true if drawing the marker is enabled when tapping on values
     * (use the setMarker(IMarker marker) method to specify a marker)
     *
     * @return
     */
    public isDrawMarkersEnabled() {
        return this.mDrawMarkers;
    }

    /**
     * Set this to true to draw a user specified marker when tapping on
     * chart values (use the setMarker(IMarker marker) method to specify a
     * marker). Default: true
     *
     * @param enabled
     */
    public setDrawMarkers(enabled) {
        this.mDrawMarkers = enabled;
    }

    /**
     * Returns the ChartData object that has been set for the chart.
     *
     * @return
     */
    public getData() {
        return this.mData;
    }

    /**
     * Returns the ViewPortHandler of the chart that is responsible for the
     * content area of the chart and its offsets and dimensions.
     *
     * @return
     */
    public getViewPortHandler() {
        return this.mViewPortHandler;
    }

    /**
     * Returns the Renderer object the chart uses for drawing data.
     *
     * @return
     */
    public getRenderer() {
        return this.mRenderer;
    }

    /**
     * Sets a new DataRenderer object for the chart.
     *
     * @param renderer
     */
    public setRenderer(renderer) {
        if (renderer != null) this.mRenderer = renderer;
    }

    public getHighlighter() {
        return this.mHighlighter;
    }

    /**
     * Sets a custom highligher object for the chart that handles / processes
     * all highlight touch events performed on the chart-view.
     *
     * @param highlighter
     */
    public setHighlighter(highlighter) {
        this.mHighlighter = highlighter;
    }

    /**
     * Returns a recyclable MPPointF instance.
     *
     * @return
     */

    public getCenterOfView() {
        return this.getCenter();
    }

    /**
     * Returns the bitmap that represents the chart.
     *
     * @return
     */
    public getChartBitmap() {
        // Define a bitmap with the same size as the view
        // Bitmap returnedBitmap = Bitmap.createBitmap(getWidth(), getHeight(), Bitmap.Config.RGB_565);
        // // Bind a canvas to it
        // c: Canvasanvas = new Canvas(returnedBitmap);
        // // Get the view's background
        // Drawable bgDrawable = getBackground();
        // if (bgDrawable != null)
        //     // has background drawable, then draw it on the canvas
        //     bgDrawable.draw(canvas);
        // else
        //     // does not have background drawable, then draw white background on
        //     // the canvas
        //     canvas.drawColor(Color.WHITE);
        // // draw the view on the canvas
        // draw(canvas);
        // // return the bitmap
        // return returnedBitmap;
    }

    /**
     * Saves the current chart state with the given name to the given path on
     * the sdcard leaving the path empty "" will put the saved file directly on
     * the SD card chart is saved as a PNG image, example:
     * saveToPath("myfilename", "foldername1/foldername2");
     *
     * @param title
     * @param pathOnSD e.g. "folder1/folder2/folder3"
     * @return returns true on success, false on error
     */
    public saveToPath(title, pathOnSD) {
        // Bitmap b = getChartBitmap();

        // OutputStream stream = null;
        // try {
        //     stream = new FileOutputStream(Environment.getExternalStorageDirectory().getPath()
        //             + pathOnSD + "/" + title
        //             + ".png");

        //     /*
        //      * Write bitmap to file using JPEG or PNG and 40% quality hlet for
        //      * JPEG.
        //      */
        //     b.compress(CompressFormat.PNG, 40, stream);

        //     stream.close();
        // } catch (Exception e) {
        //     e.printStackTrace();
        //     return false;
        // }

        return true;
    }

    /**
     * Saves the current state of the chart to the gallery as an image type. The
     * compression must be set for JPEG only. 0 == maximum compression, 100 = low
     * compression (high quality). NOTE: Needs permission WRITE_EXTERNAL_STORAGE
     *
     * @param fileName        e.g. "my_image"
     * @param subFolderPath   e.g. "ChartPics"
     * @param fileDescription e.g. "Chart details"
     * @param format          e.g. Bitmap.CompressFormat.PNG
     * @param quality         e.g. 50, min = 0, max = 100
     * @return returns true if saving was successful, false if not
     */
    public saveToGallery(fileName, subFolderPath, fileDescription, format, quality) {
        // restrain quality
        // if (quality < 0 || quality > 100)
        //     quality = 50;
        // long currentTime = System.currentTimeMillis();
        // File extBaseDir = Environment.getExternalStorageDirectory();
        // File file = new File(extBaseDir.getAbsolutePath() + "/DCIM/" + subFolderPath);
        // if (!file.exists()) {
        //     if (!file.mkdirs()) {
        //         return false;
        //     }
        // }
        // let mimeType = "";
        // switch (format) {
        //     case PNG:
        //         mimeType = "image/png";
        //         if (!fileName.endsWith(".png"))
        //             fileName += ".png";
        //         break;
        //     case WEBP:
        //         mimeType = "image/webp";
        //         if (!fileName.endsWith(".webp"))
        //             fileName += ".webp";
        //         break;
        //     case JPEG:
        //     default:
        //         mimeType = "image/jpeg";
        //         if (!(fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")))
        //             fileName += ".jpg";
        //         break;
        // }
        // let filePath = file.getAbsolutePath() + "/" + fileName;
        // FileOutputStream out = null;
        // try {
        //     out = new FileOutputStream(filePath);
        //     Bitmap b = getChartBitmap();
        //     b.compress(format, quality, out);
        //     out.flush();
        //     out.close();
        // } catch (IOException e) {
        //     e.printStackTrace();
        //     return false;
        // }
        // long size = new File(filePath).length;
        // ContentValues values = new ContentValues(8);
        // // store the details
        // values.put(Images.Media.TITLE, fileName);
        // values.put(Images.Media.DISPLAY_NAME, fileName);
        // values.put(Images.Media.DATE_ADDED, currentTime);
        // values.put(Images.Media.MIME_TYPE, mimeType);
        // values.put(Images.Media.DESCRIPTION, fileDescription);
        // values.put(Images.Media.ORIENTATION, 0);
        // values.put(Images.Media.DATA, filePath);
        // values.put(Images.Media.SIZE, size);
        // return getContext().getContentResolver().insert(Images.Media.EXTERNAL_CONTENT_URI, values) != null;
    }

    /**
     * Saves the current state of the chart to the gallery as a JPEG image. The
     * filename and compression can be set. 0 == maximum compression, 100 = low
     * compression (high quality). NOTE: Needs permission WRITE_EXTERNAL_STORAGE
     *
     * @param fileName e.g. "my_image"
     * @param quality  e.g. 50, min = 0, max = 100
     * @return returns true if saving was successful, false if not
     */
    // public saveToGallery(fileName, quality) {
    //     return saveToGallery(fileName, "", "MPAndroidChart-Library Save", Bitmap.CompressFormat.PNG, quality);
    // }

    /**
     * Saves the current state of the chart to the gallery as a PNG image.
     * NOTE: Needs permission WRITE_EXTERNAL_STORAGE
     *
     * @param fileName e.g. "my_image"
     * @return returns true if saving was successful, false if not
     */
    // public saveToGallery(fileName) {
    //     return saveToGallery(fileName, "", "MPAndroidChart-Library Save", Bitmap.CompressFormat.PNG, 40);
    // }

    /**
     * tasks to be done after the view is setup
     */
    protected mJobs = [];

    public removeViewportJob(job) {
        const index = this.mJobs.indexOf(job);
        if (index >= 0) {
            this.mJobs.splice(index, 1);
        }
    }

    public clearAllViewportJobs() {
        this.mJobs = [];
    }

    /**
     * Either posts a job immediately if the chart has already setup it's
     * dimensions or adds the job to the execution queue.
     *
     * @param job
     */
    public addViewportJob(job: ViewPortJob) {
        if (this.mViewPortHandler.hasChartDimens()) {
            setTimeout(() => {
                job.run();
            }, 0);
        } else {
            this.mJobs.push(job);
        }
    }

    /**
     * Returns all jobs that are scheduled to be executed after
     * onSizeChanged(...).
     *
     * @return
     */
    public getJobs() {
        return this.mJobs;
    }

    onSetWidthHeight(w: number, h: number) {
        const needsDataSetChanged = !this.mViewPortHandler.hasChartDimens();
        if (this.mLogEnabled) console.log(LOG_TAG, 'OnSizeChanged', w, h, needsDataSetChanged);

        if (w > 0 && h > 0 && h < 10000 && h < 10000) {
            if (this.mLogEnabled) console.log(LOG_TAG, 'Setting chart dimens, width: ' + w + ', height: ' + h);
            this.mViewPortHandler.setChartDimens(w, h);
        } else {
            console.warn(LOG_TAG, '*Avoiding* setting chart dimens! width: ' + w + ', height: ' + h);
        }

        // This may cause the chart view to mutate properties affecting the view port --
        //   lets do this before we try to run any pending jobs on the view port itself
        // this.notifyDataSetChanged();
        if (needsDataSetChanged) {
            this.notifyDataSetChanged();
        } else {
            this.calculateOffsets(); // needs chart size
        }

        for (const r of this.mJobs) {
            setTimeout(() => {
                r.run();
            }, 0);
        }

        this.mJobs = [];
    }
    public onLayout(left: number, top: number, right: number, bottom: number) {
        super.onLayout(left, top, right, bottom);

        if (global.isIOS) {
            this.onSetWidthHeight(Math.round(layout.toDeviceIndependentPixels(right - left)), Math.round(layout.toDeviceIndependentPixels(bottom - top)));
        }
    }
    public onSizeChanged(w: number, h: number, oldw: number, oldh: number): void {
        super.onSizeChanged(w, h, oldw, oldh);
        if (global.isAndroid) {
            this.onSetWidthHeight(Math.round(w), Math.round(h));
        }
    }

    /**
     * Setting this to true will set the layer-type HARDWARE for the view, false
     * will set layer-type SOFTWARE.
     *
     * @param enabled
     */
    public setHardwareAccelerationEnabled(enabled) {
        this.hardwareAccelerated = enabled;
    }
}
