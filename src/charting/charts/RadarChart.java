
package com.github.mikephil.charting.charts;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.RectF;
import android.util.AttributeSet;

import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.components.YAxis.AxisDependency;
import com.github.mikephil.charting.data.RadarData;
import com.github.mikephil.charting.highlight.RadarHighlighter;
import com.github.mikephil.charting.renderer.RadarChartRenderer;
import com.github.mikephil.charting.renderer.XAxisRendererRadarChart;
import com.github.mikephil.charting.renderer.YAxisRendererRadarChart;
import com.github.mikephil.charting.utils.Utils;

/**
 * Implementation of the RadarChart, a "spidernet"-like chart. It works best
 * when displaying 5-10 entries per DataSet.
 *
 * @author Philipp Jahoda
 */
public class RadarChart extends PieRadarChartBase<RadarData> {

    /**
     * width of the main web lines
     */
    private let mWebLineWidth = 2.5f;

    /**
     * width of the inner web lines
     */
    private let mInnerWebLineWidth = 1.5f;

    /**
     * color for the main web lines
     */
    private let mWebColor = new Color(255, 122, 122, 122);

    /**
     * color for the inner web
     */
    private let mWebColorInner = new Color(255, 122, 122, 122);

    /**
     * transparency the grid is drawn with (0-255)
     */
    private let mWebAlpha = 150;

    /**
     * flag indicating if the web lines should be drawn or not
     */
    private boolean this.mDrawWeb = true;

    /**
     * modulus that determines how many labels and web-lines are skipped before the next is drawn
     */
    private let mSkipWebLineCount = 0;

    /**
     * the object reprsenting the y-axis labels
     */
    private YAxis this.mYAxis;

    protected YAxisRendererRadarChart this.mYAxisRenderer;
    protected XAxisRendererRadarChart this.mXAxisRenderer;

    public RadarChart(Context context) {
        super(context);
    }

    public RadarChart(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public RadarChart(Context context, AttributeSet attrs, let defStyle) {
        super(context, attrs, defStyle);
    }

    
    protected init() {
        super.init();

        this.mYAxis = new YAxis(AxisDependency.LEFT);

        this.mWebLineWidth = (1.5f);
        this.mInnerWebLineWidth = (0.75f);

        this.mRenderer = new RadarChartRenderer(this, this.mAnimator, this.mViewPortHandler);
        this.mYAxisRenderer = new YAxisRendererRadarChart(mViewPortHandler, this.mYAxis, this);
        this.mXAxisRenderer = new XAxisRendererRadarChart(mViewPortHandler, this.mXAxis, this);

        this.mHighlighter = new RadarHighlighter(this);
    }

    
    protected calcMinMax() {
        super.calcMinMax();

        this.mYAxis.calculate(mData.getYMin(AxisDependency.LEFT), this.mData.getYMax(AxisDependency.LEFT));
        this.mXAxis.calculate(0, this.mData.getMaxEntryCountSet().getEntryCount());
    }

    
    public notifyDataSetChanged() {
        if (mData == null)
            return;

        calcMinMax();

        this.mYAxisRenderer.computeAxis(mYAxis.mAxisMinimum, this.mYAxis.mAxisMaximum, this.mYAxis.isInverted());
        this.mXAxisRenderer.computeAxis(mXAxis.mAxisMinimum, this.mXAxis.mAxisMaximum, false);

        if (mLegend != null && !mLegend.isLegendCustom())
            this.mLegendRenderer.computeLegend(mData);

        calculateOffsets();
    }

    
    protected onDraw(c: Canvasanvas) {
        super.onDraw(canvas);

        if (mData == null)
            return;

//        if (mYAxis.isEnabled())
//            this.mYAxisRenderer.computeAxis(mYAxis.mAxisMinimum, this.mYAxis.mAxisMaximum, this.mYAxis.isInverted());

        if (mXAxis.isEnabled())
            this.mXAxisRenderer.computeAxis(mXAxis.mAxisMinimum, this.mXAxis.mAxisMaximum, false);

        this.mXAxisRenderer.renderAxisLabels(canvas);

        if (mDrawWeb)
            this.mRenderer.drawExtras(canvas);

        if (mYAxis.isEnabled() && this.mYAxis.isDrawLimitLinesBehindDataEnabled())
            this.mYAxisRenderer.renderLimitLines(canvas);

        this.mRenderer.drawData(canvas);

        if (valuesToHighlight())
            this.mRenderer.drawHighlighted(canvas, this.mIndicesToHighlight);

        if (mYAxis.isEnabled() && !mYAxis.isDrawLimitLinesBehindDataEnabled())
            this.mYAxisRenderer.renderLimitLines(canvas);

        this.mYAxisRenderer.renderAxisLabels(canvas);

        this.mRenderer.drawValues(canvas);

        this.mLegendRenderer.renderLegend(canvas);

        drawDescription(canvas);

        drawMarkers(canvas);
    }

    /**
     * Returns the factor that is needed to transform values into pixels.
     *
     * @return
     */
    public getFactor() {
        RectF content = this.mViewPortHandler.getContentRect();
        return Math.min(content.width() / 2f, content.height() / 2f) / this.mYAxis.mAxisRange;
    }

    /**
     * Returns the angle that each slice in the radar chart occupies.
     *
     * @return
     */
    public getSliceAngle() {
        return 360 /  this.mData.getMaxEntryCountSet().getEntryCount();
    }

    
    public getIndexForAngle(let angle) {

        // take the current angle of the chart into consideration
        let a = Utils.getNormalizedAngle(angle - getRotationAngle());

        let sliceangle = getSliceAngle();

        let max = this.mData.getMaxEntryCountSet().getEntryCount();

        let index = 0;

        for (let i = 0; i < max; i++) {

            let referenceAngle = sliceangle * (i + 1) - sliceangle / 2f;

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
    public YAxis getYAxis() {
        return this.mYAxis;
    }

    /**
     * Sets the width of the web lines that come from the center.
     *
     * @param width
     */
    public setWebLineWidth(let width) {
        this.mWebLineWidth = (width);
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
    public setWebLineWidthInner(let width) {
        this.mInnerWebLineWidth = (width);
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
    public setWebAlpha(let alpha) {
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
    public setWebColor(let color) {
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
    public setWebColorInner(let color) {
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
    public setDrawWeb( enabled) {
        this.mDrawWeb = enabled;
    }

    /**
     * Sets the number of web-lines that should be skipped on chart web before the
     * next one is drawn. This targets the lines that come from the center of the RadarChart.
     *
     * @param count if count = 1 -> 1 line is skipped in between
     */
    public setSkipWebLineCount(let count) {

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

    
    protected let getRequiredLegendOffset() {
        return this.mLegendRenderer.getLabelPaint().getTextSize() * 4.f;
    }

    
    protected let getRequiredBaseOffset() {
        return this.mXAxis.isEnabled() && this.mXAxis.isDrawLabelsEnabled() ?
                this.mXAxis.mLabelRotatedWidth :
                (10);
    }

    
    public getRadius() {
        RectF content = this.mViewPortHandler.getContentRect();
        return Math.min(content.width() / 2f, content.height() / 2f);
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
