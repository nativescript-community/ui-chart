import { Canvas, Paint } from '@nativescript-community/ui-canvas';
import { Color, Trace } from '@nativescript/core';
import { PieRadarChartBase } from './PieRadarChartBase';
import { AxisDependency, YAxis } from '../components/YAxis';
import { RadarData } from '../data/RadarData';
import { RadarDataSet } from '../data/RadarDataSet';
import { Entry } from '../data/Entry';
import { RadarHighlighter } from '../highlight/RadarHighlighter';
import { RadarChartRenderer } from '../renderer/RadarChartRenderer';
import { XAxisRendererRadarChart } from '../renderer/XAxisRendererRadarChart';
import { YAxisRendererRadarChart } from '../renderer/YAxisRendererRadarChart';
import { CLog, CLogTypes, Utils } from '../utils/Utils';
import { Highlight } from '../highlight/Highlight';
import { BaseCustomRenderer } from '../renderer/DataRenderer';

const LOG_TAG = 'RadarChart';
export interface CustomRenderer extends BaseCustomRenderer {
    drawRadar?: (c: Canvas, e: Entry, left: number, top: number, right: number, bottom: number, paint: Paint) => void;
    drawHighlight?: (c: Canvas, e: Highlight, left: number, top: number, right: number, bottom: number, paint: Paint) => void;
}
/**
 * Implementation of the RadarChart, a "spidernet"-like chart. It works best
 * when displaying 5-10 entries per DataSet.
 *

 */
export class RadarChart extends PieRadarChartBase<Entry, RadarDataSet, RadarData> {
    renderer: RadarChartRenderer;
    /**
     * width of the main web lines
     */
    webLineWidth = 1.5;

    /**
     * width of the inner web lines
     */
    webLineWidthInner = 1.5;

    /**
     * color for the main web lines
     */
    webColor: Color | string = new Color(255, 122, 122, 122);

    /**
     * color for the inner web
     */
    webColorInner: Color | string = new Color(255, 122, 122, 122);

    /**
     * transparency the grid is drawn with (0-255)
     */
    webAlpha = 150;

    /**
     * flag indicating if the web lines should be drawn or not
     */
    drawWeb = true;

    /**
     * modulus that determines how many labels and web-lines are skipped before the next is drawn
     */
    private mSkipWebLineCount = 0;

    /**
     * the object reprsenting the y-axis labels
     */
    yAxis: YAxis;

    // for performance tracking
    private mTotalTime = 0;
    private mDrawCycles = 0;

    protected yAxisRenderer: YAxisRendererRadarChart;
    protected xAxisRenderer: XAxisRendererRadarChart;

    protected init() {
        super.init();

        this.yAxis = new YAxis(AxisDependency.LEFT, new WeakRef(this));

        this.renderer = new RadarChartRenderer(this, this.animator, this.viewPortHandler);
        this.yAxisRenderer = new YAxisRendererRadarChart(this.viewPortHandler, this.yAxis, this);
        this.xAxisRenderer = new XAxisRendererRadarChart(this.viewPortHandler, this.xAxis, this);

        this.highlighter = new RadarHighlighter(this);
    }

    protected calcMinMax() {
        super.calcMinMax();

        this.yAxis.calculate(this.mData.getYMin(AxisDependency.LEFT), this.mData.getYMax(AxisDependency.LEFT));
        this.xAxis.calculate(0, this.mData.maxEntryCountSet.entryCount);
    }

    public notifyDataSetChanged() {
        if (!this.mData) return;

        this.calcMinMax();

        this.yAxisRenderer.computeAxis(this.yAxis.axisMinimum, this.yAxis.axisMaximum, this.yAxis.inverted);
        this.xAxisRenderer.computeAxis(this.xAxis.axisMinimum, this.xAxis.axisMaximum, false);

        if (this.mLegend && !this.mLegend.isLegendCustom()) this.legendRenderer.computeLegend(this.mData);

        this.calculateOffsets();
    }

    onDraw(c: Canvas) {
        const startTime = Date.now();
        super.onDraw(c);

        if (!this.mData) return;

        if (this.xAxis.enabled) {
            this.xAxisRenderer.computeAxis(this.xAxis.axisMinimum, this.xAxis.axisMaximum, false);
            this.xAxisRenderer.renderAxisLabels(c);
        }

        if (this.drawWeb) this.renderer.drawExtras(c);

        if (this.yAxis?.drawLimitLinesBehindData) this.yAxisRenderer.renderLimitLines(c);
        if (this.yAxis?.drawLabelsBehindData) this.yAxisRenderer.renderAxisLabels(c);

        this.renderer.drawData(c);

        if (this.hasValuesToHighlight) this.renderer.drawHighlighted(c, this.indicesToHighlight);

        if (!this.yAxis?.drawLimitLinesBehindData) this.yAxisRenderer.renderLimitLines(c);
        if (!this.yAxis?.drawLabelsBehindData) this.yAxisRenderer.renderAxisLabels(c);
        this.renderer.drawValues(c);

        this.legendRenderer?.renderLegend(c);

        this.drawDescription(c);

        this.drawMarkers(c);

        this.notify({ eventName: 'drawn', object: this });
        if (Trace.isEnabled()) {
            const drawtime = Date.now() - startTime;
            this.mTotalTime += drawtime;
            this.mDrawCycles += 1;
            const average = this.mTotalTime / this.mDrawCycles;
            CLog(CLogTypes.log, this.constructor.name, 'Drawtime: ' + drawtime + ' ms, average: ' + average + ' ms, cycles: ' + this.mDrawCycles);
        }
    }

    /**
     * Returns the factor that is needed to transform values into pixels.
     */
    public get factor() {
        const content = this.viewPortHandler.contentRect;
        return Math.min(content.width() / 2, content.height() / 2) / this.yAxis.axisRange;
    }

    /**
     * Returns the angle that each slice in the radar chart occupies.
     */
    public get sliceAngle() {
        return 360 / this.mData.maxEntryCountSet.entryCount;
    }

    public getIndexForAngle(angle: number) {
        // take the current angle of the chart into consideration
        const a = Utils.getNormalizedAngle(angle - this.rotationAngle);

        const sliceangle = this.sliceAngle;

        const max = this.mData.maxEntryCountSet.entryCount;

        let index = 0;

        for (let i = 0; i < max; i++) {
            const referenceAngle = sliceangle * (i + 1) - sliceangle / 2;

            if (referenceAngle > a) {
                index = i;
                break;
            }
        }

        return index;
    }

    /**
     * Sets the number of web-lines that should be skipped on chart web before the
     * next one is drawn. This targets the lines that come from the center of the RadarChart.
     *
     * @param count if count = 1 -> 1 line is skipped in between
     */
    public set skipWebLineCount(count: number) {
        this.mSkipWebLineCount = Math.max(0, count);
    }

    /**
     * Returns the modulus that is used for skipping web-lines.
     */
    public get skipWebLineCount() {
        return this.mSkipWebLineCount;
    }

    protected get requiredLegendOffset() {
        return this.legendRenderer.labelPaint.getTextSize() * 4;
    }

    protected get requiredBaseOffset() {
        return this.xAxis.enabled && this.xAxis.drawLabels ? this.xAxis.mLabelRotatedWidth : 10;
    }

    public get radius() {
        const content = this.viewPortHandler.contentRect;
        return Math.min(content.width() / 2, content.height() / 2);
    }

    /**
     * Returns the maximum value this chart can display on it's y-axis.
     */
    public get yChartMax() {
        return this.yAxis.axisMaximum;
    }

    /**
     * Returns the minimum value this chart can display on it's y-axis.
     */
    public get yChartMin() {
        return this.yAxis.axisMinimum;
    }

    /**
     * Returns the range of y-values this chart can display.
     */
    public get yRange() {
        return this.yAxis.axisRange;
    }

    customRenderer: CustomRenderer;
}
