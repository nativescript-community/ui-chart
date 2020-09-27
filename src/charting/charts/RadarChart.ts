import { Canvas } from '@nativescript-community/ui-canvas';
import { Color } from '@nativescript/core';
import { AxisDependency, YAxis } from '../components/YAxis';
import { RadarData } from '../data/RadarData';
import { RadarDataSet } from '../data/RadarDataSet';
import { RadarEntry } from '../data/RadarEntry';
import { RadarHighlighter } from '../highlight/RadarHighlighter';
import { RadarChartRenderer } from '../renderer/RadarChartRenderer';
import { XAxisRendererRadarChart } from '../renderer/XAxisRendererRadarChart';
import { YAxisRendererRadarChart } from '../renderer/YAxisRendererRadarChart';
import { Utils } from '../utils/Utils';
import { PieRadarChartBase } from './PieRadarChartBase';

const LOG_TAG = 'RadarChart';

/**
 * Implementation of the RadarChart, a "spidernet"-like chart. It works best
 * when displaying 5-10 entries per DataSet.
 *
 * @author Philipp Jahoda
 */
export class RadarChart extends PieRadarChartBase<RadarEntry, RadarDataSet, RadarData> {
    /**
     * width of the main web lines
     */
    private mWebLineWidth = 2.5;

    /**
     * width of the inner web lines
     */
    private mInnerWebLineWidth = 1.5;

    /**
     * color for the main web lines
     */
    private mWebColor: Color | string = new Color(255, 122, 122, 122);

    /**
     * color for the inner web
     */
    private mWebColorInner: Color | string = new Color(255, 122, 122, 122);

    /**
     * transparency the grid is drawn with (0-255)
     */
    private mWebAlpha = 150;

    /**
     * flag indicating if the web lines should be drawn or not
     */
    private mDrawWeb = true;

    /**
     * modulus that determines how many labels and web-lines are skipped before the next is drawn
     */
    private mSkipWebLineCount = 0;

    /**
     * the object reprsenting the y-axis labels
     */
    private mYAxis: YAxis;

    protected mYAxisRenderer: YAxisRendererRadarChart;
    protected mXAxisRenderer: XAxisRendererRadarChart;

    protected init() {
        super.init();

        this.mYAxis = new YAxis(AxisDependency.LEFT);

        this.mWebLineWidth = 1.5;
        this.mInnerWebLineWidth = 0.75;

        this.mRenderer = new RadarChartRenderer(this, this.mAnimator, this.mViewPortHandler);
        this.mYAxisRenderer = new YAxisRendererRadarChart(this.mViewPortHandler, this.mYAxis, this);
        this.mXAxisRenderer = new XAxisRendererRadarChart(this.mViewPortHandler, this.mXAxis, this);

        this.mHighlighter = new RadarHighlighter(this);
    }

    protected calcMinMax() {
        super.calcMinMax();

        this.mYAxis.calculate(this.mData.getYMin(AxisDependency.LEFT), this.mData.getYMax(AxisDependency.LEFT));
        this.mXAxis.calculate(0, this.mData.getMaxEntryCountSet().getEntryCount());
    }

    public notifyDataSetChanged() {
        if (this.mData == null) return;

        this.calcMinMax();

        this.mYAxisRenderer.computeAxis(this.mYAxis.mAxisMinimum, this.mYAxis.mAxisMaximum, this.mYAxis.isInverted());
        this.mXAxisRenderer.computeAxis(this.mXAxis.mAxisMinimum, this.mXAxis.mAxisMaximum, false);

        if (this.mLegend != null && !this.mLegend.isLegendCustom()) this.mLegendRenderer.computeLegend(this.mData);

        this.calculateOffsets();
    }

    // for performance tracking
    private totalTime = 0;
    private drawCycles = 0;

    onDraw(c: Canvas) {
        const startTime = Date.now();
        super.onDraw(c);

        if (this.mData == null) return;

        //        if (mYAxis.isEnabled())
        //            this.mYAxisRenderer.computeAxis(mYAxis.mAxisMinimum, this.mYAxis.mAxisMaximum, this.mYAxis.isInverted());

        if (this.mXAxis.isEnabled()) this.mXAxisRenderer.computeAxis(this.mXAxis.mAxisMinimum, this.mXAxis.mAxisMaximum, false);

        this.mXAxisRenderer.renderAxisLabels(c);

        if (this.mDrawWeb) this.mRenderer.drawExtras(c);

        if (this.mYAxis.isEnabled() && this.mYAxis.isDrawLimitLinesBehindDataEnabled()) this.mYAxisRenderer.renderLimitLines(c);

        this.mRenderer.drawData(c);

        if (this.valuesToHighlight()) this.mRenderer.drawHighlighted(c, this.mIndicesToHighlight);

        if (this.mYAxis.isEnabled() && !this.mYAxis.isDrawLimitLinesBehindDataEnabled()) this.mYAxisRenderer.renderLimitLines(c);

        this.mYAxisRenderer.renderAxisLabels(c);

        this.mRenderer.drawValues(c);

        this.mLegendRenderer.renderLegend(c);

        this.drawDescription(c);

        this.drawMarkers(c);

        this.notify({ eventName: 'drawn', object: this });
        if (this.mLogEnabled) {
            const drawtime = Date.now() - startTime;
            this.totalTime += drawtime;
            this.drawCycles += 1;
            const average = this.totalTime / this.drawCycles;
            console.log(this.constructor.name, 'Drawtime: ' + drawtime + ' ms, average: ' + average + ' ms, cycles: ' + this.drawCycles);
        }
    }

    /**
     * Returns the factor that is needed to transform values into pixels.
     *
     * @return
     */
    public getFactor() {
        const content = this.mViewPortHandler.getContentRect();
        return Math.min(content.width() / 2, content.height() / 2) / this.mYAxis.mAxisRange;
    }

    /**
     * Returns the angle that each slice in the radar chart occupies.
     *
     * @return
     */
    public getSliceAngle() {
        return 360 / this.mData.getMaxEntryCountSet().getEntryCount();
    }

    public getIndexForAngle(angle: number) {
        // take the current angle of the chart into consideration
        const a = Utils.getNormalizedAngle(angle - this.getRotationAngle());

        const sliceangle = this.getSliceAngle();

        const max = this.mData.getMaxEntryCountSet().getEntryCount();

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
     * Returns the object that represents all y-labels of the RadarChart.
     *
     * @return
     */
    public getYAxis() {
        return this.mYAxis;
    }

    /**
     * Sets the width of the web lines that come from the center.
     *
     * @param width
     */
    public setWebLineWidth(width: number) {
        this.mWebLineWidth = width;
    }

    public getWebLineWidth() {
        return this.mWebLineWidth;
    }

    /**
     * Sets the width of the web lines that are in between the lines coming from
     * the center.
     *
     * @param width
     */
    public setWebLineWidthInner(width: number) {
        this.mInnerWebLineWidth = width;
    }

    public getWebLineWidthInner() {
        return this.mInnerWebLineWidth;
    }

    /**
     * Sets the transparency (alpha) value for all web lines, default: 150, 255
     * = 100% opaque, 0 = 100% transparent
     *
     * @param alpha
     */
    public setWebAlpha(alpha: number) {
        this.mWebAlpha = alpha;
    }

    /**
     * Returns the alpha value for all web lines.
     *
     * @return
     */
    public getWebAlpha() {
        return this.mWebAlpha;
    }

    /**
     * Sets the color for the web lines that come from the center. Don't forget
     * to use getResources().getColor(...) when loading a color from the
     * resources. Default: new Color(255, 122, 122, 122)
     *
     * @param color
     */
    public setWebColor(color: Color | string) {
        this.mWebColor = color;
    }

    public getWebColor() {
        return this.mWebColor;
    }

    /**
     * Sets the color for the web lines in between the lines that come from the
     * center. Don't forget to use getResources().getColor(...) when loading a
     * color from the resources. Default: new Color(255, 122, 122, 122)
     *
     * @param color
     */
    public setWebColorInner(color: Color | string) {
        this.mWebColorInner = color;
    }

    public getWebColorInner() {
        return this.mWebColorInner;
    }

    /**
     * If set to true, drawing the web is enabled, if set to false, drawing the
     * whole web is disabled. Default: true
     *
     * @param enabled
     */
    public setDrawWeb(enabled) {
        this.mDrawWeb = enabled;
    }

    /**
     * Sets the number of web-lines that should be skipped on chart web before the
     * next one is drawn. This targets the lines that come from the center of the RadarChart.
     *
     * @param count if count = 1 -> 1 line is skipped in between
     */
    public setSkipWebLineCount(count: number) {
        this.mSkipWebLineCount = Math.max(0, count);
    }

    /**
     * Returns the modulus that is used for skipping web-lines.
     *
     * @return
     */
    public getSkipWebLineCount() {
        return this.mSkipWebLineCount;
    }

    protected getRequiredLegendOffset() {
        return this.mLegendRenderer.getLabelPaint().getTextSize() * 4;
    }

    protected getRequiredBaseOffset() {
        return this.mXAxis.isEnabled() && this.mXAxis.isDrawLabelsEnabled() ? this.mXAxis.mLabelRotatedWidth : 10;
    }

    public getRadius() {
        const content = this.mViewPortHandler.getContentRect();
        return Math.min(content.width() / 2, content.height() / 2);
    }

    /**
     * Returns the maximum value this chart can display on it's y-axis.
     */
    public getYChartMax() {
        return this.mYAxis.mAxisMaximum;
    }

    /**
     * Returns the minimum value this chart can display on it's y-axis.
     */
    public getYChartMin() {
        return this.mYAxis.mAxisMinimum;
    }

    /**
     * Returns the range of y-values this chart can display.
     *
     * @return
     */
    public getYRange() {
        return this.mYAxis.mAxisRange;
    }
}
