import { EventData, Observable, Trace } from '@nativescript/core';
import { getEventOrGestureName } from '@nativescript/core/ui/core/bindable';
import { GestureTypes } from '@nativescript/core/ui/gestures';
import { BarLineChartBase } from './BarLineChartBase';
import { Chart } from './Chart';
import { LegendHorizontalAlignment, LegendOrientation, LegendVerticalAlignment } from '../components/Legend';
import { ChartData } from '../data/ChartData';
import { Entry } from '../data/Entry';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { PieRadarChartTouchListener } from '../listener/PieRadarChartTouchListener';
import { MPPointF } from '../utils/MPPointF';
import { CLog, CLogTypes, Utils } from '../utils/Utils';

const LOG_TAG = 'PieRadarChartBase';

/**
 * View that represents a pie chart. Draws cake like slices.
 *

 */
export abstract class PieRadarChartBase<U extends Entry, D extends IDataSet<U>, T extends ChartData<U, D>> extends Chart<U, D, T> {
    chartTouchListener: PieRadarChartTouchListener;

    /**
     * holds the normalized version of the current rotation angle of the chart
     */
    private mRotationAngle: number = 270;

    /**
     * holds the raw version of the current rotation angle of the chart
     */
    private mRawRotationAngle: number = 270;

    /**
     * flag that indicates if rotation is enabled or not
     */
    protected mRotateEnabled: boolean = true;

    /**
     * Sets the minimum offset (padding) around the chart, defaults to 0
     */
    minOffset: number = 0;

    protected init() {
        super.init();

        //this.chartTouchListener = new PieRadarChartTouchListener(this);
    }

    getOrCreateTouchListener() {
        if (!this.chartTouchListener) {
            this.chartTouchListener = new PieRadarChartTouchListener(this);
            if (!!this.nativeViewProtected) {
                this.chartTouchListener.init();
            }
        }
        return this.chartTouchListener;
    }

    protected calcMinMax() {
        //mXAxis.mAxisRange = this.mData.getXVals().length - 1;
    }

    get maxVisibleValueCount() {
        return this.mData.entryCount;
    }

    public notifyDataSetChanged() {
        if (this.mData == null) {
            return;
        }

        this.calcMinMax();

        if (this.mLegend != null && this.mLegend.enabled) {
            this.legendRenderer.computeLegend(this.mData);
        }

        this.calculateOffsets();
    }

    public calculateOffsets() {
        let legendLeft = 0,
            legendRight = 0,
            legendBottom = 0,
            legendTop = 0;

        if (this.mLegend?.enabled && !this.mLegend.drawInside) {
            const fullLegendWidth = Math.min(this.mLegend.mNeededWidth, this.viewPortHandler.chartWidth * this.mLegend.maxSizePercent);

            switch (this.mLegend.orientation) {
                case LegendOrientation.VERTICAL:
                    {
                        let xLegendOffset = 0;

                        if (this.mLegend.horizontalAlignment === LegendHorizontalAlignment.LEFT || this.mLegend.horizontalAlignment === LegendHorizontalAlignment.RIGHT) {
                            if (this.mLegend.verticalAlignment === LegendVerticalAlignment.CENTER) {
                                // this is the space between the legend and the chart
                                const spacing = 13;

                                xLegendOffset = fullLegendWidth + spacing;
                            } else {
                                // this is the space between the legend and the chart
                                const spacing = 8;

                                const legendWidth = fullLegendWidth + spacing;
                                const legendHeight = this.mLegend.mNeededHeight + this.mLegend.mTextHeightMax;

                                const center = this.center;

                                const bottomX = this.mLegend.horizontalAlignment === LegendHorizontalAlignment.RIGHT ? this.viewPortHandler.chartWidth - legendWidth + 15 : legendWidth - 15;
                                const bottomY = legendHeight + 15;
                                const distLegend = this.distanceToCenter(bottomX, bottomY);

                                const reference = this.getPosition(center, this.radius, this.getAngleForPoint(bottomX, bottomY));

                                const distReference = this.distanceToCenter(reference.x, reference.y);
                                const minOffset = 5;

                                if (bottomY >= center.y && this.viewPortHandler.chartHeight - legendWidth > this.viewPortHandler.chartWidth) {
                                    xLegendOffset = legendWidth;
                                } else if (distLegend < distReference) {
                                    const diff = distReference - distLegend;
                                    xLegendOffset = minOffset + diff;
                                }
                            }
                        }

                        switch (this.mLegend.horizontalAlignment) {
                            case LegendHorizontalAlignment.LEFT:
                                legendLeft = xLegendOffset;
                                break;
                            case LegendHorizontalAlignment.RIGHT:
                                legendRight = xLegendOffset;
                                break;
                            case LegendHorizontalAlignment.CENTER:
                                switch (this.mLegend.verticalAlignment) {
                                    case LegendVerticalAlignment.TOP:
                                        legendTop = Math.min(this.mLegend.mNeededHeight, this.viewPortHandler.chartHeight * this.mLegend.maxSizePercent);
                                        break;
                                    case LegendVerticalAlignment.BOTTOM:
                                        legendBottom = Math.min(this.mLegend.mNeededHeight, this.viewPortHandler.chartHeight * this.mLegend.maxSizePercent);
                                        break;
                                }
                                break;
                        }
                    }
                    break;
                case LegendOrientation.HORIZONTAL:
                    let yLegendOffset = 0;

                    if (this.mLegend.verticalAlignment === LegendVerticalAlignment.TOP || this.mLegend.verticalAlignment === LegendVerticalAlignment.BOTTOM) {
                        // It's possible that we do not need this offset anymore as it
                        //   is available through the extraOffsets, but changing it can mean
                        //   changing default visibility for existing apps.
                        const yOffset = this.requiredLegendOffset;

                        yLegendOffset = Math.min(this.mLegend.mNeededHeight + yOffset, this.viewPortHandler.chartHeight * this.mLegend.maxSizePercent);

                        switch (this.mLegend.verticalAlignment) {
                            case LegendVerticalAlignment.TOP:
                                legendTop = yLegendOffset;
                                break;
                            case LegendVerticalAlignment.BOTTOM:
                                legendBottom = yLegendOffset;
                                break;
                        }
                    }
                    break;
            }

            legendLeft += this.requiredBaseOffset;
            legendRight += this.requiredBaseOffset;
            legendTop += this.requiredBaseOffset;
            legendBottom += this.requiredBaseOffset;
        }

        let minOffset = this.minOffset;

        // detect PieChart while preventing circular dep
        if (!this['circleBox']) {
            const x = this.xAxis;

            if (x.enabled && x.drawLabels) {
                minOffset = Math.max(minOffset, x.mLabelRotatedWidth);
            }
        }

        legendTop += this.extraTopOffset;
        legendRight += this.extraRightOffset;
        legendBottom += this.extraBottomOffset;
        legendLeft += this.extraLeftOffset;

        const offsetLeft = Math.max(minOffset, legendLeft);
        const offsetTop = Math.max(minOffset, legendTop);
        const offsetRight = Math.max(minOffset, legendRight);
        const offsetBottom = Math.max(minOffset, Math.max(this.requiredBaseOffset, legendBottom));

        this.viewPortHandler.restrainViewPort(offsetLeft, offsetTop, offsetRight, offsetBottom);

        if (Trace.isEnabled()) {
            CLog(CLogTypes.info, LOG_TAG, 'offsetLeft: ' + offsetLeft + ', offsetTop: ' + offsetTop + ', offsetRight: ' + offsetRight + ', offsetBottom: ' + offsetBottom);
        }
    }

    /**
     * Returns the angle relative to the chart center for the given polet on the
     * chart in degrees. The angle is always between 0 and 360°, 0° is NORTH,
     * 90° is EAST, ...
     *
     * @param x
     * @param y
     * @return
     */
    public getAngleForPoint(x, y) {
        const c = this.centerOffsets;

        const tx = x - c.x,
            ty = y - c.y;
        const length = Math.sqrt(tx * tx + ty * ty);
        const radians = Math.acos(ty / length);

        let angle = radians * Utils.RAD2DEG;

        if (x > c.x) {
            angle = 360 - angle;
        }

        // add 90° because chart starts EAST
        angle = angle + 90;

        // neutralize overflow
        if (angle > 360) angle = angle - 360;

        return angle;
    }

    /**
     * Returns a recyclable MPPointF instance.
     * Calculates the position around a center point, depending on the distance
     * from the center, and the angle of the position around the center.
     *
     * @param center
     * @param dist
     * @param angle  in degrees, converted to radians internally
     * @return
     */
    public getPosition(center: MPPointF, dist: number, angle: number, outputPoint: MPPointF = { x: 0, y: 0 }): MPPointF {
        outputPoint.x = center.x + dist * Math.cos(angle * Utils.DEG2RAD);
        outputPoint.y = center.y + dist * Math.sin(angle * Utils.DEG2RAD);
        return outputPoint;
    }

    /**
     * Returns the distance of a certain polet on the chart to the center of the
     * chart.
     *
     * @param x
     * @param y
     * @return
     */
    public distanceToCenter(x: number, y: number) {
        const c = this.centerOffsets;

        let dist = 0;
        let xDist = 0;
        let yDist = 0;

        if (x > c.x) {
            xDist = x - c.x;
        } else {
            xDist = c.x - x;
        }

        if (y > c.y) {
            yDist = y - c.y;
        } else {
            yDist = c.y - y;
        }

        // pythagoras
        dist = Math.sqrt(Math.pow(xDist, 2.0) + Math.pow(yDist, 2.0));

        return dist;
    }

    /**
     * Returns the xIndex for the given angle around the center of the chart.
     * Returns -1 if not found / outofbounds.
     *
     * @param angle
     * @return
     */
    public abstract getIndexForAngle(angle);

    set highlightPerTapEnabled(enabled) {
        this.mHighlightPerTapEnabled = enabled;
        if (enabled) {
            this.getOrCreateTouchListener().setTap(true);
        } else if (this.chartTouchListener) {
            this.chartTouchListener.setTap(false);
        }
    }
    get highlightPerTapEnabled() {
        return this.mHighlightPerTapEnabled;
    }
    /**
     * Set an offset for the rotation of the RadarChart in degrees. Default 270
     * --> top (NORTH)
     *
     * @param angle
     */
    public set rotationAngle(angle) {
        this.mRawRotationAngle = angle;
        this.mRotationAngle = Utils.getNormalizedAngle(this.mRawRotationAngle);
    }

    /**
     * gets a normalized version of the current rotation angle of the pie chart,
     * which will always be between 0.0 < 360.0
     */
    public get rotationAngle() {
        return this.mRotationAngle;
    }

    /**
     * gets the raw version of the current rotation angle of the pie chart the
     * returned value could be any value, negative or positive, outside of the
     * 360 degrees. this is used when working with rotation direction, mainly by
     * gestures and animations.
     */
    public get rawRotationAngle() {
        return this.mRawRotationAngle;
    }

    /**
     * Set this to true to enable the rotation / spinning of the chart by touch.
     * Set it to false to disable it. Default: true
     *
     * @param enabled
     */
    public set rotationEnabled(enabled) {
        this.mRotateEnabled = enabled;
        if (enabled) {
            this.getOrCreateTouchListener().setRotation(true);
        } else if (this.chartTouchListener) {
            this.chartTouchListener.setRotation(false);
        }
    }

    /**
     * Returns true if rotation of the chart by touch is enabled, false if not.
     */
    public get rotationEnabled() {
        return this.mRotateEnabled;
    }

    /**
     * returns the diameter of the pie- or radar-chart
     */
    public get diameter() {
        const content = this.viewPortHandler.contentRect;
        content.left += this.extraLeftOffset;
        content.top += this.extraTopOffset;
        content.right -= this.extraRightOffset;
        content.bottom -= this.extraBottomOffset;
        return Math.min(content.width(), content.height());
    }

    /**
     * Returns the radius of the chart in pixels.
     */
    public abstract radius: number;

    /**
     * Returns the required offset for the chart legend.
     */
    protected abstract requiredLegendOffset: number;

    /**
     * Returns the base offset needed for the chart without calculating the
     * legend size.
     */
    protected abstract requiredBaseOffset: number;

    public get yChartMax() {
        // TODO Auto-generated method stub
        return 0;
    }

    public get yChartMin() {
        // TODO Auto-generated method stub
        return 0;
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
                        this.getOrCreateTouchListener().setTap(true);
                    } else if (arg === 'rotate') {
                        this.getOrCreateTouchListener().setRotation(true);
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
                        this.getOrCreateTouchListener().setTap(false);
                    } else if (arg === 'rotate' && !this.rotationEnabled) {
                        this.getOrCreateTouchListener().setRotation(false);
                    }
                    Observable.prototype.removeEventListener.call(this, evt, callback, thisArg);
                }
            } else {
                Observable.prototype.removeEventListener.call(this, arg, callback, thisArg);
            }
        }
    }
}
