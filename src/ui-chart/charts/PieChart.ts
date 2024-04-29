import { Canvas, Paint, Path, RectF } from '@nativescript-community/ui-canvas';
import { Trace } from '@nativescript/core';
import { Font } from '@nativescript/core/ui/styling/font';
import { Entry } from '../data/Entry';
import { PieData } from '../data/PieData';
import { PieDataSet } from '../data/PieDataSet';
import { Highlight } from '../highlight/Highlight';
import { PieHighlighter } from '../highlight/PieHighlighter';
import { BaseCustomRenderer } from '../renderer/DataRenderer';
import { PieChartRenderer } from '../renderer/PieChartRenderer';
import { MPPointF } from '../utils/MPPointF';
import { CLog, CLogTypes, Utils } from '../utils/Utils';
import { PieRadarChartBase } from './PieRadarChartBase';

const LOG_TAG = 'PieChart';

export interface CustomRenderer extends BaseCustomRenderer {
    drawSlice?: (c: Canvas, e: Entry, slice: Path, paint: Paint) => void;
    drawHighlight?: (c: Canvas, e: Highlight, slice: Path, paint: Paint) => void;
}
/**
 * View that represents a pie chart. Draws cake like slices.
 *

 */
export class PieChart extends PieRadarChartBase<Entry, PieDataSet, PieData> {
    renderer: PieChartRenderer;
    /**
     * rect object that represents the bounds of the piechart, needed for
     * drawing the circle
     */
    readonly circleBox: RectF = new RectF(0, 0, 0, 0);

    /**
     * flag indicating if entry labels should be drawn or not
     */
    drawEntryLabels: boolean = true;

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
    drawHoleEnabled: boolean = true;

    /**
     * if true, the hole will see-through to the inner tips of the slices
     */
    drawSlicesUnderHoleEnabled: boolean;

    /**
     * if true, the values inside the piechart are drawn as percent values
     */
    usePercentValues: boolean;

    /**
     * if true, the slices of the piechart are rounded
     */
    drawRoundedSlices: boolean;

    /**
     * variable for the text that is drawn in the center of the pie-chart
     */
    centerText = '';

    private mCenterTextOffset: MPPointF = { x: 0, y: 0 };

    /**
     * indicates the size of the hole in the center of the piechart, default:
     * radius / 2
     */
    private mHoleRadiusPercent: number = 50;

    /**
     * the radius of the transparent circle that is drawn next to the hole
     * in the piechart in percent of the maximum radius (max = the radius of the
     * whole chart), default 55% -> means 5% larger than the center-hole by
     */
    transparentCircleRadiusPercent: number = 55;

    /**
     * if enabled, centertext is drawn
     */
    drawCenterText: boolean = true;

    /**
     * the rectangular radius of the bounding box for the center text, as a percentage of the pie
     * hole
     * default 1.f (100%)
     */
    centerTextRadiusPercent: number = 100;

    protected mMaxAngle: number = 360;

    /**
     * Minimum angle to draw slices, this only works if there is enough room for all slices to have
     * the minimum angle, default 0.
     */
    private mMinAngleForSlices: number = 0;

    protected init() {
        super.init();

        this.renderer = new PieChartRenderer(this, this.animator, this.viewPortHandler);
        this.xAxis = null;

        this.highlighter = new PieHighlighter(this);
    }
    public draw(canvas: Canvas) {
        super.draw(canvas);
        if (!this.mData) return;

        this.renderer.drawData(canvas);

        if (this.hasValuesToHighlight && this.drawHighlight) {
            this.renderer.drawHighlighted(canvas, this.indicesToHighlight);
        }

        this.renderer.drawExtras(canvas);

        this.renderer.drawValues(canvas);

        if (this.legendRenderer) {
            this.legendRenderer.renderLegend(canvas);
        }

        this.drawDescription(canvas);
        this.drawMarkers(canvas);
    }

    public calculateOffsets() {
        super.calculateOffsets();

        // prevent nullpointer when no data set
        if (!this.mData) {
            return;
        }

        const diameter = this.diameter;
        const radius = diameter / 2;
        const c = this.centerOffsets;
        const shift = this.mData.getDataSet().selectionShift;

        // create the circle box that will contain the pie-chart (the bounds of the pie-chart)
        this.circleBox.set(c.x - radius + shift, c.y - radius + shift, c.x + radius - shift, c.y + radius - shift);
    }

    protected calcMinMax() {
        this.calcAngles();
    }

    protected getMarkerPosition(highlight: Highlight): number[] {
        const center = this.centerCircleBox;
        let r = this.radius;
        let off = (r / 10) * 3.6;

        if (this.drawHoleEnabled) {
            off = (r - (r / 100) * this.holeRadius) / 2;
        }

        r -= off; // offset to keep things inside the chart

        const rotationAngle = this.rotationAngle;
        const entryIndex = highlight.x;

        // offset needed to center the drawn text in the slice
        const offset = this.mDrawAngles[entryIndex] / 2;

        // calculate the text position
        const x = r * Math.cos((rotationAngle + this.mAbsoluteAngles[entryIndex] - offset) * this.animator.phaseY * Utils.DEG2RAD) + center.x;
        const y = r * Math.sin((rotationAngle + this.mAbsoluteAngles[entryIndex] - offset) * this.animator.phaseY * Utils.DEG2RAD) + center.y;

        return [x, y];
    }

    /**
     * calculates the needed angles for the chart slices
     */
    private calcAngles() {
        const entryCount = this.mData.entryCount;

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
        const dataSets = this.mData.dataSets;

        const hasMinAngle = this.mMinAngleForSlices !== 0 && entryCount * this.mMinAngleForSlices <= this.mMaxAngle;
        const minAngles = [];

        let cnt = 0;
        let offset = 0;
        let diff = 0;

        for (let i = 0; i < this.mData.dataSetCount; i++) {
            const set = dataSets[i];
            const yKey = set.yProperty;

            for (let j = 0; j < set.entryCount; j++) {
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
        if (!this.hasValuesToHighlight) {
            return false;
        }

        for (let i = 0; i < this.indicesToHighlight.length; i++) {
            // check if the xvalue for the given dataset needs highlight
            if (this.indicesToHighlight[i].x === index) {
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

    public getIndexForAngle(angle: number) {
        // take the current angle of the chart into consideration
        const a = Utils.getNormalizedAngle(angle - this.rotationAngle);

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
        const dataSets = this.mData.dataSets;

        for (let i = 0; i < dataSets.length; i++) {
            if (dataSets[i].getEntryForXValue(xIndex, NaN)) {
                return i;
            }
        }

        return -1;
    }

    /**
     * returns an integer array of all the different angles the chart slices
     * have the angles in the returned array determine how much space (of 360°)
     * each slice takes
     */
    public get drawAngles(): number[] {
        return this.mDrawAngles;
    }

    /**
     * returns the absolute angles of the different chart slices (where the
     * slices end)
     */
    public get absoluteAngles(): number[] {
        return this.mAbsoluteAngles;
    }

    /**
     * Sets the color for the hole that is drawn in the center of the PieChart
     * (if enabled).
     *
     * @param color
     */
    public set holeColor(color) {
        this.renderer.holePaint.setColor(color);
    }
    public get holeColor() {
        return this.renderer.holePaint.color;
    }

    protected get requiredLegendOffset() {
        return this.legendRenderer.labelPaint.getTextSize() * 2;
    }

    protected get requiredBaseOffset() {
        return 0;
    }

    public get radius() {
        if (!this.circleBox) {
            return 0;
        } else {
            return Math.min(this.circleBox.width() / 2, this.circleBox.height() / 2);
        }
    }

    /**
     * Returns the center of the circlebox
     */
    public get centerCircleBox(): MPPointF {
        return { x: this.circleBox.centerX(), y: this.circleBox.centerY() };
    }

    /**
     * Sets the typeface for the center-text paint
     *
     * @param t
     */
    public set centerTextTypeface(t: Font) {
        this.renderer.centerTextPaint.setTypeface(t);
    }
    public get centerTextTypeface() {
        return this.renderer.centerTextPaint.font;
    }

    /**
     * Sets the size of the center text of the PieChart in dp.
     *
     * @param sizeDp
     */
    public set centerTextSize(sizeDp) {
        this.renderer.centerTextPaint.setTextSize(sizeDp);
    }
    public get centerTextSize() {
        return this.renderer.centerTextPaint.textSize;
    }

    /**
     * Sets the offset the center text should have from it's original position in dp. Default x = 0, y = 0
     *
     * @param x
     * @param y
     */
    public set centerTextOffset({ x, y }: { x: number; y: number }) {
        this.mCenterTextOffset.x = x;
        this.mCenterTextOffset.y = y;
    }

    /**
     * Returns the offset on the x- and y-axis the center text has in dp.
     */
    public get centerTextOffset(): MPPointF {
        return { x: this.mCenterTextOffset.x, y: this.mCenterTextOffset.y };
    }

    /**
     * Sets the color of the center text of the PieChart.
     *
     * @param color
     */
    public set centerTextColor(color) {
        this.renderer.centerTextPaint.setColor(color);
    }
    public get centerTextColor() {
        return this.renderer.centerTextPaint.color;
    }

    /**
     * sets the radius of the hole in the center of the piechart in percent of
     * the maximum radius (max = the radius of the whole chart), default 50%
     *
     * @param percent
     */
    public set holeRadius(percent) {
        this.mHoleRadiusPercent = percent;
    }

    /**
     * Returns the size of the hole radius in percent of the total radius.
     */
    public get holeRadius() {
        return this.mHoleRadiusPercent;
    }

    /**
     * Sets the color the transparent-circle should have.
     *
     * @param color
     */
    public set transparentCircleColor(color) {
        const p: Paint = this.renderer.transparentCirclePaint;
        const alpha = p.getAlpha();
        p.setColor(color);
        p.setAlpha(alpha);
    }

    /**
     * Sets the amount of transparency the transparent circle should have 0 = fully transparent,
     * 255 = fully opaque.
     * Default value is 100.
     *
     * @param alpha 0-255
     */
    public set transparentCircleAlpha(alpha) {
        this.renderer.transparentCirclePaint.setAlpha(alpha);
    }

    /**
     * Sets the color the entry labels are drawn with.
     *
     * @param color
     */
    public set entryLabelColor(color) {
        this.renderer.entryLabelsPaint.setColor(color);
    }

    /**
     * Sets a custom font for the drawing of the entry labels.
     *
     * @param tf
     */
    public set entryLabelTypeface(tf) {
        this.renderer.entryLabelsPaint.setTypeface(tf);
    }

    /**
     * Sets the size of the entry labels in dp. Default: 13dp
     *
     * @param size
     */
    public set entryLabelTextSize(size) {
        this.renderer.entryLabelsPaint.setTextSize(size);
    }

    public get maxAngle() {
        return this.mMaxAngle;
    }

    /**
     * Sets the max angle that is used for calculating the pie-circle. 360 means
     * it's a full PieChart, 180 results in a half-pie-chart. Default: 360
     *
     * @param maxangle min 90, max 360
     */
    public set maxAngle(maxangle) {
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
    public get minAngleForSlices() {
        return this.mMinAngleForSlices;
    }

    /**
     * Set the angle to set minimum size for slices, you must call {@link #notifyDataSetChanged()}
     * and {@link #invalidate()} when changing this, only works if there is enough room for all
     * slices to have the minimum angle.
     *
     * @param minAngle minimum 0, maximum is half of {@link #setMaxAngle}
     */
    public set minAngleForSlices(minAngle) {
        if (minAngle > this.mMaxAngle / 2) {
            minAngle = this.mMaxAngle / 2;
        } else if (minAngle < 0) {
            minAngle = 0;
        }

        this.mMinAngleForSlices = minAngle;
    }

    public _onDetachedFromWindow() {
        // releases the bitmap in the renderer to avoid oom error
        if (this.renderer instanceof PieChartRenderer) {
            this.renderer.releaseBitmap();
        }
        //super.onDetachedFromWindow();
    }

    customRenderer: CustomRenderer;
}
