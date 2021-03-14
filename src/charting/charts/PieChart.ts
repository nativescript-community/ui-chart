import { PieRadarChartBase } from './PieRadarChartBase';
import { XAxis } from '../components/XAxis';
import { Entry } from '../data/Entry';
import { PieData } from '../data/PieData';
import { PieDataSet } from '../data/PieDataSet';
import { PieHighlighter } from '../highlight/PieHighlighter';
import { Highlight } from '../highlight/Highlight';
import { PieChartRenderer } from '../renderer/PieChartRenderer';
import { MPPointF } from '../utils/MPPointF';
import { CLog, CLogTypes, Utils } from '../utils/Utils';
import { Font } from '@nativescript/core/ui/styling/font';
import { Canvas, Paint, Path, RectF } from '@nativescript-community/ui-canvas';
import { Trace } from '@nativescript/core';

const LOG_TAG = 'PieChart';

export interface CustomRenderer {
    drawSlice: (c: Canvas, e: Entry, slice: Path, paint: Paint) => void;
    drawHighlight: (c: Canvas, e: Highlight, slice: Path, paint: Paint) => void;
}
/**
 * View that represents a pie chart. Draws cake like slices.
 *
 * @author Philipp Jahoda
 */
export class PieChart extends PieRadarChartBase<Entry, PieDataSet, PieData> {
    mRenderer: PieChartRenderer;
    /**
     * rect object that represents the bounds of the piechart, needed for
     * drawing the circle
     */
    private mCircleBox: RectF = new RectF(0, 0, 0, 0);

    /**
     * flag indicating if entry labels should be drawn or not
     */
    private mDrawEntryLabels: boolean = true;

    /**
     * array that holds the width of each pie-slice in degrees
     */
    private mDrawAngles: number[] = [];

    /**
     * array that holds the absolute angle in degrees of each slice
     */
    private mAbsoluteAngles: number[] = [];

    /**
     * if true, the white hole inside the chart will be drawn
     */
    private mDrawHole: boolean = true;

    /**
     * if true, the hole will see-through to the inner tips of the slices
     */
    private mDrawSlicesUnderHole: boolean = false;

    /**
     * if true, the values inside the piechart are drawn as percent values
     */
    private mUsePercentValues: boolean = false;

    /**
     * if true, the slices of the piechart are rounded
     */
    private mDrawRoundedSlices: boolean = false;

    /**
     * variable for the text that is drawn in the center of the pie-chart
     */
    private mCenterText = '';

    private mCenterTextOffset: MPPointF = { x: 0, y: 0 };

    /**
     * indicates the size of the hole in the center of the piechart, default:
     * radius / 2
     */
    private mHoleRadiusPercent: number = 50;

    /**
     * the radius of the transparent circle next to the chart-hole in the center
     */
    protected mTransparentCircleRadiusPercent: number = 55;

    /**
     * if enabled, centertext is drawn
     */
    private mDrawCenterText: boolean = true;

    private mCenterTextRadiusPercent: number = 100;

    protected mMaxAngle: number = 360;

    /**
     * Minimum angle to draw slices, this only works if there is enough room for all slices to have
     * the minimum angle, default 0.
     */
    private mMinAngleForSlices: number = 0;

    protected init() {
        super.init();

        this.mRenderer = new PieChartRenderer(this, this.mAnimator, this.mViewPortHandler);
        this.mXAxis = null;

        this.mHighlighter = new PieHighlighter(this);
    }
    // for performance tracking
    private totalTime = 0;
    private drawCycles = 0;
    public onDraw(canvas: Canvas) {
        const startTime = Date.now();
        super.onDraw(canvas);

        if (this.mData == null) {
            return;
        }

        this.mRenderer.drawData(canvas);

        if (this.valuesToHighlight()) {
            this.mRenderer.drawHighlighted(canvas, this.mIndicesToHighlight);
        }

        this.mRenderer.drawExtras(canvas);

        this.mRenderer.drawValues(canvas);

        if (this.mLegendRenderer) {
            this.mLegendRenderer.renderLegend(canvas);
        }

        this.drawDescription(canvas);
        this.drawMarkers(canvas);
        this.notify({ eventName: 'drawn', object: this });
        if (Trace.isEnabled()) {
            const drawtime = Date.now() - startTime;
            this.totalTime += drawtime;
            this.drawCycles += 1;
            const average = this.totalTime / this.drawCycles;
            CLog(CLogTypes.log, this.constructor.name, 'Drawtime: ' + drawtime + ' ms, average: ' + average + ' ms, cycles: ' + this.drawCycles);
        }
        this.notify({ eventName: 'postDraw', object: this, canvas });
    }

    public calculateOffsets() {
        super.calculateOffsets();

        // prevent nullpointer when no data set
        if (this.mData == null) {
            return;
        }

        const diameter = this.getDiameter();
        const radius = diameter / 2;
        const c = this.getCenterOffsets();
        const shift = this.mData.getDataSet().getSelectionShift();

        // create the circle box that will contain the pie-chart (the bounds of the pie-chart)
        this.mCircleBox.set(c.x - radius + shift, c.y - radius + shift, c.x + radius - shift, c.y + radius - shift);
    }

    protected calcMinMax() {
        this.calcAngles();
    }

    protected getMarkerPosition(highlight: Highlight): number[] {
        const center = this.getCenterCircleBox();
        let r = this.getRadius();
        let off = (r / 10) * 3.6;

        if (this.isDrawHoleEnabled()) {
            off = (r - (r / 100) * this.getHoleRadius()) / 2;
        }

        r -= off; // offset to keep things inside the chart

        const rotationAngle = this.getRotationAngle();
        const entryIndex = highlight.x;

        // offset needed to center the drawn text in the slice
        const offset = this.mDrawAngles[entryIndex] / 2;

        // calculate the text position
        const x = r * Math.cos((rotationAngle + this.mAbsoluteAngles[entryIndex] - offset) * this.mAnimator.getPhaseY() * Utils.DEG2RAD) + center.x;
        const y = r * Math.sin((rotationAngle + this.mAbsoluteAngles[entryIndex] - offset) * this.mAnimator.getPhaseY() * Utils.DEG2RAD) + center.y;

        return [x, y];
    }

    /**
     * calculates the needed angles for the chart slices
     */
    private calcAngles() {
        const entryCount = this.mData.getEntryCount();

        if (this.mDrawAngles.length !== entryCount) {
            this.mDrawAngles = [];
        } else {
            for (let i = 0; i < entryCount; i++) {
                this.mDrawAngles[i] = 0;
            }
        }
        if (this.mAbsoluteAngles.length !== entryCount) {
            this.mAbsoluteAngles = [];
        } else {
            for (let i = 0; i < entryCount; i++) {
                this.mAbsoluteAngles[i] = 0;
            }
        }

        const yValueSum = this.mData.getYValueSum();
        const dataSets = this.mData.getDataSets();

        const hasMinAngle = this.mMinAngleForSlices !== 0 && entryCount * this.mMinAngleForSlices <= this.mMaxAngle;
        const minAngles = [];

        let cnt = 0;
        let offset = 0;
        let diff = 0;

        for (let i = 0; i < this.mData.getDataSetCount(); i++) {
            const set = dataSets[i];
            const yKey = set.yProperty;

            for (let j = 0; j < set.getEntryCount(); j++) {
                const drawAngle = this.calcAngle(Math.abs(set.getEntryForIndex(j)[yKey]), yValueSum);

                if (hasMinAngle) {
                    const temp = drawAngle - this.mMinAngleForSlices;
                    if (temp <= 0) {
                        minAngles[cnt] = this.mMinAngleForSlices;
                        offset += -temp;
                    } else {
                        minAngles[cnt] = drawAngle;
                        diff += temp;
                    }
                }

                this.mDrawAngles[cnt] = drawAngle;

                if (cnt === 0) {
                    this.mAbsoluteAngles[cnt] = this.mDrawAngles[cnt];
                } else {
                    this.mAbsoluteAngles[cnt] = this.mAbsoluteAngles[cnt - 1] + this.mDrawAngles[cnt];
                }

                cnt++;
            }
        }

        if (hasMinAngle) {
            // Correct bigger slices by relatively reducing their angles based on the total angle needed to subtract
            // This requires that `entryCount * this.mMinAngleForSlices <= this.mMaxAngle` be true to properly work!
            for (let i = 0; i < entryCount; i++) {
                minAngles[i] -= ((minAngles[i] - this.mMinAngleForSlices) / diff) * offset;
                if (i === 0) {
                    this.mAbsoluteAngles[0] = minAngles[0];
                } else {
                    this.mAbsoluteAngles[i] = this.mAbsoluteAngles[i - 1] + minAngles[i];
                }
            }

            this.mDrawAngles = minAngles;
        }
    }

    /**
     * Checks if the given index is set to be highlighted.
     *
     * @param index
     * @return
     */
    public needsHighlight(index: number) {
        // no highlight
        if (!this.valuesToHighlight()) {
            return false;
        }

        for (let i = 0; i < this.mIndicesToHighlight.length; i++) {
            // check if the xvalue for the given dataset needs highlight
            if (this.mIndicesToHighlight[i].x === index) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculates the needed angle for a given value
     *
     * @param value
     * @param yValueSum
     * @return
     */
    private calcAngle(value: number, yValueSum: number) {
        return (value / yValueSum) * this.mMaxAngle;
    }

    /**
     * This will throw an exception, PieChart has no XAxis object.
     *
     * @return
     */
    public getXAxis(): XAxis {
        throw new Error('PieChart has no XAxis');
    }

    public getIndexForAngle(angle: number) {
        // take the current angle of the chart into consideration
        const a = Utils.getNormalizedAngle(angle - this.getRotationAngle());

        for (let i = 0; i < this.mAbsoluteAngles.length; i++) {
            if (this.mAbsoluteAngles[i] > a) {
                return i;
            }
        }

        return -1; // return -1 if no index found
    }

    /**
     * Returns the index of the DataSet this x-index belongs to.
     *
     * @param xIndex
     * @return
     */
    public getDataSetIndexForIndex(xIndex: number) {
        const dataSets = this.mData.getDataSets();

        for (let i = 0; i < dataSets.length; i++) {
            if (dataSets[i].getEntryForXValue(xIndex, NaN) != null) {
                return i;
            }
        }

        return -1;
    }

    /**
     * returns an integer array of all the different angles the chart slices
     * have the angles in the returned array determine how much space (of 360°)
     * each slice takes
     *
     * @return
     */
    public getDrawAngles(): number[] {
        return this.mDrawAngles;
    }

    /**
     * returns the absolute angles of the different chart slices (where the
     * slices end)
     *
     * @return
     */
    public getAbsoluteAngles(): number[] {
        return this.mAbsoluteAngles;
    }

    /**
     * Sets the color for the hole that is drawn in the center of the PieChart
     * (if enabled).
     *
     * @param color
     */
    public setHoleColor(color) {
        this.mRenderer.holePaint.setColor(color);
    }

    /**
     * Enable or disable the visibility of the inner tips of the slices behind the hole
     */
    public setDrawSlicesUnderHole(enable) {
        this.mDrawSlicesUnderHole = enable;
    }

    /**
     * Returns true if the inner tips of the slices are visible behind the hole,
     * false if not.
     *
     * @return true if slices are visible behind the hole.
     */
    public isDrawSlicesUnderHoleEnabled() {
        return this.mDrawSlicesUnderHole;
    }

    /**
     * set this to true to draw the pie center empty
     *
     * @param enabled
     */
    public setDrawHoleEnabled(enabled) {
        this.mDrawHole = enabled;
    }

    /**
     * returns true if the hole in the center of the pie-chart is set to be
     * visible, false if not
     *
     * @return
     */
    public isDrawHoleEnabled() {
        return this.mDrawHole;
    }

    /**
     * Sets the text let that is displayed in the center of the PieChart.
     *
     * @param text
     */
    public setCenterText(text) {
        if (text == null) {
            this.mCenterText = '';
        } else {
            this.mCenterText = text;
        }
    }

    /**
     * returns the text that is drawn in the center of the pie-chart
     *
     * @return
     */
    public getCenterText() {
        return this.mCenterText;
    }

    /**
     * set this to true to draw the text that is displayed in the center of the
     * pie chart
     *
     * @param enabled
     */
    public setDrawCenterText(enabled) {
        this.mDrawCenterText = enabled;
    }

    /**
     * returns true if drawing the center text is enabled
     *
     * @return
     */
    public isDrawCenterTextEnabled() {
        return this.mDrawCenterText;
    }

    protected getRequiredLegendOffset() {
        return this.mLegendRenderer.labelPaint.getTextSize() * 2;
    }

    protected getRequiredBaseOffset() {
        return 0;
    }

    public getRadius() {
        if (this.mCircleBox == null) {
            return 0;
        } else {
            return Math.min(this.mCircleBox.width() / 2, this.mCircleBox.height() / 2);
        }
    }

    /**
     * Returns the circlebox, the boundingbox of the pie-chart slices
     *
     * @return
     */
    public getCircleBox(): RectF {
        return this.mCircleBox;
    }

    /**
     * Returns the center of the circlebox
     *
     * @return
     */
    public getCenterCircleBox(): MPPointF {
        return { x: this.mCircleBox.centerX(), y: this.mCircleBox.centerY() };
    }

    /**
     * Sets the typeface for the center-text paint
     *
     * @param t
     */
    public setCenterTextTypeface(t: Font) {
        this.mRenderer.centerTextPaint.setTypeface(t);
    }

    /**
     * Sets the size of the center text of the PieChart in dp.
     *
     * @param sizeDp
     */
    public setCenterTextSize(sizeDp) {
        this.mRenderer.centerTextPaint.setTextSize(sizeDp);
    }

    /**
     * Sets the size of the center text of the PieChart in pixels.
     *
     * @param sizePixels
     */
    public setCenterTextSizePixels(sizePixels) {
        this.mRenderer.centerTextPaint.setTextSize(sizePixels);
    }

    /**
     * Sets the offset the center text should have from it's original position in dp. Default x = 0, y = 0
     *
     * @param x
     * @param y
     */
    public setCenterTextOffset(x: number, y: number) {
        this.mCenterTextOffset.x = x;
        this.mCenterTextOffset.y = y;
    }

    /**
     * Returns the offset on the x- and y-axis the center text has in dp.
     *
     * @return
     */
    public getCenterTextOffset(): MPPointF {
        return { x: this.mCenterTextOffset.x, y: this.mCenterTextOffset.y };
    }

    /**
     * Sets the color of the center text of the PieChart.
     *
     * @param color
     */
    public setCenterTextColor(color) {
        this.mRenderer.centerTextPaint.setColor(color);
    }

    /**
     * sets the radius of the hole in the center of the piechart in percent of
     * the maximum radius (max = the radius of the whole chart), default 50%
     *
     * @param percent
     */
    public setHoleRadius(percent) {
        this.mHoleRadiusPercent = percent;
    }

    /**
     * Returns the size of the hole radius in percent of the total radius.
     *
     * @return
     */
    public getHoleRadius() {
        return this.mHoleRadiusPercent;
    }

    /**
     * Sets the color the transparent-circle should have.
     *
     * @param color
     */
    public setTransparentCircleColor(color) {
        const p: Paint = this.mRenderer.transparentCirclePaint;
        const alpha = p.getAlpha();
        p.setColor(color);
        p.setAlpha(alpha);
    }

    /**
     * sets the radius of the transparent circle that is drawn next to the hole
     * in the piechart in percent of the maximum radius (max = the radius of the
     * whole chart), default 55% -> means 5% larger than the center-hole by
     * default
     *
     * @param percent
     */
    public setTransparentCircleRadius(percent) {
        this.mTransparentCircleRadiusPercent = percent;
    }

    public getTransparentCircleRadius() {
        return this.mTransparentCircleRadiusPercent;
    }

    /**
     * Sets the amount of transparency the transparent circle should have 0 = fully transparent,
     * 255 = fully opaque.
     * Default value is 100.
     *
     * @param alpha 0-255
     */
    public setTransparentCircleAlpha(alpha) {
        this.mRenderer.transparentCirclePaint.setAlpha(alpha);
    }

    /**
     * Set this to true to draw the entry labels into the pie slices (Provided by the getLabel() method of the PieEntry class).
     * Deprecated -> use setDrawEntryLabels(...) instead.
     *
     * @param enabled
     */

    public setDrawSliceText(enabled) {
        this.mDrawEntryLabels = enabled;
    }

    /**
     * Set this to true to draw the entry labels into the pie slices (Provided by the getLabel() method of the PieEntry class).
     *
     * @param enabled
     */
    public setDrawEntryLabels(enabled) {
        this.mDrawEntryLabels = enabled;
    }

    /**
     * Returns true if drawing the entry labels is enabled, false if not.
     *
     * @return
     */
    public isDrawEntryLabelsEnabled() {
        return this.mDrawEntryLabels;
    }

    /**
     * Sets the color the entry labels are drawn with.
     *
     * @param color
     */
    public setEntryLabelColor(color) {
        this.mRenderer.entryLabelsPaint.setColor(color);
    }

    /**
     * Sets a custom font for the drawing of the entry labels.
     *
     * @param tf
     */
    public setEntryLabelTypeface(tf) {
        this.mRenderer.entryLabelsPaint.setTypeface(tf);
    }

    /**
     * Sets the size of the entry labels in dp. Default: 13dp
     *
     * @param size
     */
    public setEntryLabelTextSize(size) {
        this.mRenderer.entryLabelsPaint.setTextSize(size);
    }

    /**
     * Sets whether to draw slices in a curved fashion, only works if drawing the hole is enabled
     * and if the slices are not drawn under the hole.
     *
     * @param enabled draw curved ends of slices
     */
    public setDrawRoundedSlices(enabled) {
        this.mDrawRoundedSlices = enabled;
    }

    /**
     * Returns true if the chart is set to draw each end of a pie-slice
     * "rounded".
     *
     * @return
     */
    public isDrawRoundedSlicesEnabled() {
        return this.mDrawRoundedSlices;
    }

    /**
     * If this is enabled, values inside the PieChart are drawn in percent and
     * not with their original value. Values provided for the IValueFormatter to
     * format are then provided in percent.
     *
     * @param enabled
     */
    public setUsePercentValues(enabled) {
        this.mUsePercentValues = enabled;
    }

    /**
     * Returns true if using percentage values is enabled for the chart.
     *
     * @return
     */
    public isUsePercentValuesEnabled() {
        return this.mUsePercentValues;
    }

    /**
     * the rectangular radius of the bounding box for the center text, as a percentage of the pie
     * hole
     * default 1.f (100%)
     */
    public setCenterTextRadiusPercent(percent) {
        this.mCenterTextRadiusPercent = percent;
    }

    /**
     * the rectangular radius of the bounding box for the center text, as a percentage of the pie
     * hole
     * default 1.f (100%)
     */
    public getCenterTextRadiusPercent() {
        return this.mCenterTextRadiusPercent;
    }

    public getMaxAngle() {
        return this.mMaxAngle;
    }

    /**
     * Sets the max angle that is used for calculating the pie-circle. 360 means
     * it's a full PieChart, 180 results in a half-pie-chart. Default: 360
     *
     * @param maxangle min 90, max 360
     */
    public setMaxAngle(maxangle) {
        if (maxangle > 360) {
            maxangle = 360;
        }

        if (maxangle < 90) {
            maxangle = 90;
        }

        this.mMaxAngle = maxangle;
    }

    /**
     * The minimum angle slices on the chart are rendered with, default is 0.
     *
     * @return minimum angle for slices
     */
    public getMinAngleForSlices() {
        return this.mMinAngleForSlices;
    }

    /**
     * Set the angle to set minimum size for slices, you must call {@link #notifyDataSetChanged()}
     * and {@link #invalidate()} when changing this, only works if there is enough room for all
     * slices to have the minimum angle.
     *
     * @param minAngle minimum 0, maximum is half of {@link #setMaxAngle}
     */
    public setMinAngleForSlices(minAngle) {
        if (minAngle > this.mMaxAngle / 2) {
            minAngle = this.mMaxAngle / 2;
        } else if (minAngle < 0) {
            minAngle = 0;
        }

        this.mMinAngleForSlices = minAngle;
    }

    public _onDetachedFromWindow() {
        // releases the bitmap in the renderer to avoid oom error
        if (this.mRenderer != null && this.mRenderer instanceof PieChartRenderer) {
            this.mRenderer.releaseBitmap();
        }
        //super.onDetachedFromWindow();
    }

    mCustomRenderer: CustomRenderer;
    /**
     * set a custom line renderer
     */
    public setCustomRenderer(renderer: CustomRenderer) {
        this.mCustomRenderer = renderer;
    }
    /**
     * get the custom line renderer
     */
    public getCustomRenderer() {
        return this.mCustomRenderer;
    }
}
