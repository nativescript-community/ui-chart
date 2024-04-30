import { RectF } from '@nativescript-community/ui-canvas';
import { Trace } from '@nativescript/core';
import { XAxisPosition } from '../components/XAxis';
import { AxisDependency } from '../components/YAxis';
import { BarEntry } from '../data/BarEntry';
import { Entry } from '../data/Entry';
import { Highlight } from '../highlight/Highlight';
import { HorizontalBarHighlighter } from '../highlight/HorizontalBarHighlighter';
import { HorizontalBarChartRenderer } from '../renderer/HorizontalBarChartRenderer';
import { XAxisRendererHorizontalBarChart } from '../renderer/XAxisRendererHorizontalBarChart';
import { YAxisRendererHorizontalBarChart } from '../renderer/YAxisRendererHorizontalBarChart';
import { HorizontalViewPortHandler } from '../utils/HorizontalViewPortHandler';
import { TransformerHorizontalBarChart } from '../utils/TransformerHorizontalBarChart';
import { CLog, CLogTypes, Utils } from '../utils/Utils';
import { BarChart } from './BarChart';

const LOG_TAG = 'HorizontalBarChart';

export class HorizontalBarChart extends BarChart {
    mRenderer: HorizontalBarChartRenderer;

    protected init() {
        this.viewPortHandler = new HorizontalViewPortHandler();

        super.init();

        this.leftAxisTransformer = new TransformerHorizontalBarChart(this.viewPortHandler);

        this.renderer = new HorizontalBarChartRenderer(this, this.animator, this.viewPortHandler);
        this.highlighter = new HorizontalBarHighlighter(this);

        this.leftAxisRenderer = new YAxisRendererHorizontalBarChart(this.viewPortHandler, this.mAxisLeft, this.leftAxisTransformer);
    }

    public get axisRight() {
        if (!this.mAxisRight) {
            this.rightAxisRenderer = new YAxisRendererHorizontalBarChart(this.viewPortHandler, this.mAxisRight, this.rightAxisTransformer);
            this.xAxisRenderer = new XAxisRendererHorizontalBarChart(this.viewPortHandler, this.xAxis, this.leftAxisTransformer, this);
            this.rightAxisTransformer = new TransformerHorizontalBarChart(this.viewPortHandler);
        }
        return this.mAxisRight;
    }

    public calculateOffsets() {
        const offsetBuffer = Utils.getTempRectF();
        this.calculateLegendOffsets(offsetBuffer);

        let offsetLeft = offsetBuffer.left;
        let offsetTop = offsetBuffer.top;
        let offsetRight = offsetBuffer.right;
        let offsetBottom = offsetBuffer.bottom;

        // offsets for y-labels
        if (this.mAxisLeft?.needsOffset) {
            offsetTop += this.mAxisLeft.getRequiredHeightSpace(this.leftAxisRenderer.axisLabelsPaint);
        }

        if (this.mAxisRight?.needsOffset) {
            offsetBottom += this.mAxisRight.getRequiredHeightSpace(this.rightAxisRenderer.axisLabelsPaint);
        }

        const xlabelWidth = this.xAxis.mLabelRotatedWidth;

        if (this.xAxis.enabled) {
            // offsets for x-labels
            if (this.xAxis.position === XAxisPosition.BOTTOM) {
                offsetLeft += xlabelWidth;
            } else if (this.xAxis.position === XAxisPosition.TOP) {
                offsetRight += xlabelWidth;
            } else if (this.xAxis.position === XAxisPosition.BOTH_SIDED) {
                offsetLeft += xlabelWidth;
                offsetRight += xlabelWidth;
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

        this.prepareOffsetMatrix();
        this.prepareValuePxMatrix();
    }

    protected prepareValuePxMatrix() {
        if (this.mAxisRight?.enabled) {
            this.rightAxisTransformer.prepareMatrixValuePx(this.mAxisRight.axisMinimum, this.mAxisRight.axisRange, this.xAxis.axisRange, this.xAxis.axisMinimum);
        }
        if (this.mAxisLeft.enabled) {
            this.leftAxisTransformer.prepareMatrixValuePx(this.mAxisLeft.axisMinimum, this.mAxisLeft.axisRange, this.xAxis.axisRange, this.xAxis.axisMinimum);
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
        if (!set) {
            return new RectF(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
        }

        const xKey = set.xProperty;
        const yKey = set.yProperty;

        const x = set.getEntryXValue(e, index);
        const y = e[yKey];

        const barWidth = this.mData.barWidth;

        const top = x - barWidth / 2;
        const bottom = x + barWidth / 2;
        const left = y >= 0 ? y : 0;
        const right = y <= 0 ? y : 0;

        const outputRect = new RectF(left, top, right, bottom);
        this.getTransformer(set.axisDependency).rectValueToPixel(outputRect);
        return outputRect;
    }

    /**
     * Returns position for given entry according to given axis.
     *
     * @param e
     * @param axis
     * @return
     */
    public getPosition(e: Entry, axis: AxisDependency) {
        if (!e) {
            return null;
        }

        const set = this.mData.getDataSetForEntry(e);
        if (!set) {
            return null;
        }

        const xKey = set.xProperty;
        const yKey = set.yProperty;

        const vals = Utils.getTempArray(2);
        vals[0] = e[xKey];
        vals[1] = e[yKey];

        this.getTransformer(axis).pointValuesToPixel(vals);

        return { x: vals[0], y: vals[1] };
    }

    /**
     * Returns the Highlight object (contains x-index and DataSet index) of the selected value at the given touch point
     * inside the BarChart.
     *
     * @param x
     * @param y
     * @return
     */
    public getHighlightByTouchPoint(x, y) {
        return this.highlighter.getHighlight(x, y)?.[0];
    }

    public get lowestVisibleX() {
        this.transformer.getValuesByTouchPoint(this.viewPortHandler.contentLeft, this.viewPortHandler.contentBottom, this.posForGetLowestVisibleX);
        return Math.max(this.xAxis.axisMinimum, this.posForGetLowestVisibleX.y);
    }

    public get highestVisibleX() {
        this.transformer.getValuesByTouchPoint(this.viewPortHandler.contentLeft, this.viewPortHandler.contentTop, this.posForGetHighestVisibleX);
        return Math.min(this.xAxis.axisMaximum, this.posForGetHighestVisibleX.y);
    }

    /**
     * ###### VIEWPORT METHODS BELOW THIS ######
     */
    public set visibleXRangeMaximum(maxXRange) {
        const xScale = this.xAxis.axisRange / maxXRange;
        this.viewPortHandler.setMinimumScaleY(xScale);
    }

    public set visibleXRangeMinimum(minXRange) {
        const xScale = this.xAxis.axisRange / minXRange;
        this.viewPortHandler.setMaximumScaleY(xScale);
    }

    public setVisibleXRange(minXRange, maxXRange) {
        const minScale = this.xAxis.axisRange / minXRange;
        const maxScale = this.xAxis.axisRange / maxXRange;
        this.viewPortHandler.setMinMaxScaleY(minScale, maxScale);
    }

    public setVisibleYRangeMaximum(maxYRange, axis: AxisDependency) {
        const yScale = this.getAxisRange(axis) / maxYRange;
        this.viewPortHandler.setMinimumScaleX(yScale);
    }

    public setVisibleYRangeMinimum(minYRange, axis: AxisDependency) {
        const yScale = this.getAxisRange(axis) / minYRange;
        this.viewPortHandler.setMaximumScaleX(yScale);
    }

    public setVisibleYRange(minYRange, maxYRange, axis: AxisDependency) {
        const minScale = this.getAxisRange(axis) / minYRange;
        const maxScale = this.getAxisRange(axis) / maxYRange;
        this.viewPortHandler.setMinMaxScaleX(minScale, maxScale);
    }
}
