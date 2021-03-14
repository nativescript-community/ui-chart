import { BarChart } from './BarChart';
import { AxisDependency } from '../components/YAxis';
import { XAxisPosition } from '../components/XAxis';
import { BarData } from '../data/BarData';
import { BarEntry } from '../data/BarEntry';
import { BarDataProvider } from '../interfaces/dataprovider/BarDataProvider';
import { Entry } from '../data/Entry';
import { BarDataSet } from '../data/BarDataSet';
import { HorizontalBarHighlighter } from '../highlight/HorizontalBarHighlighter';
import { Highlight } from '../highlight/Highlight';
import { HorizontalBarChartRenderer } from '../renderer/HorizontalBarChartRenderer';
import { YAxisRendererHorizontalBarChart } from '../renderer/YAxisRendererHorizontalBarChart';
import { XAxisRendererHorizontalBarChart } from '../renderer/XAxisRendererHorizontalBarChart';
import { HorizontalViewPortHandler } from '../utils/HorizontalViewPortHandler';
import { TransformerHorizontalBarChart } from '../utils/TransformerHorizontalBarChart';
import { CLog, CLogTypes, Utils } from '../utils/Utils';
import { RectF } from '@nativescript-community/ui-canvas';
import { getEntryXValue } from '../data/BaseEntry';
import { Trace } from '@nativescript/core';

const LOG_TAG = 'HorizontalBarChart';

export class HorizontalBarChart extends BarChart {
    mRenderer: HorizontalBarChartRenderer;
    protected mGetPositionBuffer = Utils.createNativeArray(2);

    protected init() {
        this.mViewPortHandler = new HorizontalViewPortHandler();

        super.init();

        this.mLeftAxisTransformer = new TransformerHorizontalBarChart(this.mViewPortHandler);

        this.mRenderer = new HorizontalBarChartRenderer(this, this.mAnimator, this.mViewPortHandler);
        this.setHighlighter(new HorizontalBarHighlighter(this));

        this.mAxisRendererLeft = new YAxisRendererHorizontalBarChart(this.mViewPortHandler, this.mAxisLeft, this.mLeftAxisTransformer);
    }

    public get axisRight() {
        if (!this.mAxisRight) {
            this.mAxisRendererRight = new YAxisRendererHorizontalBarChart(this.mViewPortHandler, this.mAxisRight, this.mRightAxisTransformer);
            this.mXAxisRenderer = new XAxisRendererHorizontalBarChart(this.mViewPortHandler, this.mXAxis, this.mLeftAxisTransformer, this);
            this.mRightAxisTransformer = new TransformerHorizontalBarChart(this.mViewPortHandler);
        }
        return this.mAxisRight;
    }

    public calculateOffsets() {
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
        if (this.mAxisLeft && this.mAxisLeft.needsOffset()) {
            offsetTop += this.mAxisLeft.getRequiredHeightSpace(this.mAxisRendererLeft.axisLabelsPaint);
        }

        if (this.mAxisRight && this.mAxisRight.needsOffset()) {
            offsetBottom += this.mAxisRight.getRequiredHeightSpace(this.mAxisRendererRight.axisLabelsPaint);
        }

        const xlabelWidth = this.mXAxis.mLabelRotatedWidth;

        if (this.mXAxis.isEnabled()) {
            // offsets for x-labels
            if (this.mXAxis.getPosition() === XAxisPosition.BOTTOM) {
                offsetLeft += xlabelWidth;
            } else if (this.mXAxis.getPosition() === XAxisPosition.TOP) {
                offsetRight += xlabelWidth;
            } else if (this.mXAxis.getPosition() === XAxisPosition.BOTH_SIDED) {
                offsetLeft += xlabelWidth;
                offsetRight += xlabelWidth;
            }
        }

        offsetTop += this.getExtraTopOffset();
        offsetRight += this.getExtraRightOffset();
        offsetBottom += this.getExtraBottomOffset();
        offsetLeft += this.getExtraLeftOffset();

        const minOffset = this.mMinOffset;

        this.mViewPortHandler.restrainViewPort(Math.max(minOffset, offsetLeft), Math.max(minOffset, offsetTop), Math.max(minOffset, offsetRight), Math.max(minOffset, offsetBottom));

        if (Trace.isEnabled()) {
            CLog(CLogTypes.info, LOG_TAG, 'offsetLeft: ' + offsetLeft + ', offsetTop: ' + offsetTop + ', offsetRight: ' + offsetRight + ', offsetBottom: ' + offsetBottom);
            CLog(CLogTypes.info, LOG_TAG, 'Content: ' + this.mViewPortHandler.getContentRect().toString());
        }

        this.prepareOffsetMatrix();
        this.prepareValuePxMatrix();
    }

    protected prepareValuePxMatrix() {
        if (this.mAxisRight.isEnabled()) {
            this.mRightAxisTransformer.prepareMatrixValuePx(this.mAxisRight.mAxisMinimum, this.mAxisRight.mAxisRange, this.mXAxis.mAxisRange, this.mXAxis.mAxisMinimum);
        }
        if (this.mAxisLeft.isEnabled()) {
            this.mLeftAxisTransformer.prepareMatrixValuePx(this.mAxisLeft.mAxisMinimum, this.mAxisLeft.mAxisRange, this.mXAxis.mAxisRange, this.mXAxis.mAxisMinimum);
        }
    }

    protected getMarkerPosition(high: Highlight) {
        return [high.drawY, high.drawX];
    }

    /**
     * Returns the bounding box of the specified Entry in the specified DataSet. Returns null if the Entry could not be
     * found in the charts data.
     *
     * @param e
     * @return
     */
    public getBarBounds(e: BarEntry): RectF {
        // WARNING: wont work if index is used as xKey(xKey not set)
        const { set, index } = this.mData.getDataSetAndIndexForEntry(e);
        if (set === null) {
            return new RectF(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
        }

        const xKey = set.xProperty;
        const yKey = set.yProperty;

        const x = getEntryXValue(e, xKey, index);
        const y = e[yKey];

        const barWidth = this.mData.getBarWidth();

        const top = x - barWidth / 2;
        const bottom = x + barWidth / 2;
        const left = y >= 0 ? y : 0;
        const right = y <= 0 ? y : 0;

        const outputRect = new RectF(left, top, right, bottom);
        this.getTransformer(set.getAxisDependency()).rectValueToPixel(outputRect);
        return outputRect;
    }

    /**
     * Returns position for given entry according to given axis.
     *
     * @param e
     * @param axis
     * @return
     */

    // public getPosition(e: Entry, axis: AxisDependency) {
    //     if (e == null) {
    //         return null;
    //     }

    //     const set = this.mData.getDataSetForEntry(e);
    //     if (set === null) {
    //         return null;
    //     }

    //     const xKey = set.xProperty;
    //     const yKey = set.yProperty;

    //     const vals = this.mGetPositionBuffer;
    //     vals[0] = e[xKey];
    //     vals[1] = e[yKey];

    //     this.getTransformer(axis).pointValuesToPixel(vals);

    //     return { x: vals[0], y: vals[1] };
    // }

    /**
     * Returns the Highlight object (contains x-index and DataSet index) of the selected value at the given touch point
     * inside the BarChart.
     *
     * @param x
     * @param y
     * @return
     */

    public getHighlightByTouchPoint(x, y): Highlight {
        if (this.mData == null) {
            if (Trace.isEnabled()) {
                CLog(CLogTypes.error, LOG_TAG, "Can't select by touch. No data set.");
            }
            return null;
        }
        return this.getHighlighter().getHighlight(x, y);
    }

    public getLowestVisibleX() {
        this.getTransformer().getValuesByTouchPoint(this.mViewPortHandler.contentLeft(), this.mViewPortHandler.contentBottom(), this.posForGetLowestVisibleX);
        return Math.max(this.mXAxis.mAxisMinimum, this.posForGetLowestVisibleX.y);
    }

    public getHighestVisibleX() {
        this.getTransformer().getValuesByTouchPoint(this.mViewPortHandler.contentLeft(), this.mViewPortHandler.contentTop(), this.posForGetHighestVisibleX);
        return Math.min(this.mXAxis.mAxisMaximum, this.posForGetHighestVisibleX.y);
    }

    /**
     * ###### VIEWPORT METHODS BELOW THIS ######
     */

    public setVisibleXRangeMaximum(maxXRange) {
        const xScale = this.mXAxis.mAxisRange / maxXRange;
        this.mViewPortHandler.setMinimumScaleY(xScale);
    }

    public setVisibleXRangeMinimum(minXRange) {
        const xScale = this.mXAxis.mAxisRange / minXRange;
        this.mViewPortHandler.setMaximumScaleY(xScale);
    }

    public setVisibleXRange(minXRange, maxXRange) {
        const minScale = this.mXAxis.mAxisRange / minXRange;
        const maxScale = this.mXAxis.mAxisRange / maxXRange;
        this.mViewPortHandler.setMinMaxScaleY(minScale, maxScale);
    }

    public setVisibleYRangeMaximum(maxYRange, axis: AxisDependency) {
        const yScale = this.getAxisRange(axis) / maxYRange;
        this.mViewPortHandler.setMinimumScaleX(yScale);
    }

    public setVisibleYRangeMinimum(minYRange, axis: AxisDependency) {
        const yScale = this.getAxisRange(axis) / minYRange;
        this.mViewPortHandler.setMaximumScaleX(yScale);
    }

    public setVisibleYRange(minYRange, maxYRange, axis: AxisDependency) {
        const minScale = this.getAxisRange(axis) / minYRange;
        const maxScale = this.getAxisRange(axis) / maxYRange;
        this.mViewPortHandler.setMinMaxScaleX(minScale, maxScale);
    }
}
