package com.github.mikephil.charting.renderer;

import android.graphics.Canvas;
import android.util.Log;

import com.github.mikephil.charting.animation.ChartAnimator;
import com.github.mikephil.charting.charts.Chart;
import com.github.mikephil.charting.charts.CombinedChart;
import com.github.mikephil.charting.charts.CombinedChart.DrawOrder;
import com.github.mikephil.charting.data.ChartData;
import com.github.mikephil.charting.data.CombinedData;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.utils.ViewPortHandler;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;

/**
 * Renderer class that is responsible for rendering multiple different data-types.
 */
public class CombinedChartRenderer extends DataRenderer {

    /**
     * all rederers for the different kinds of data this combined-renderer can draw
     */
    protected List<DataRenderer> this.mRenderers = new ArrayList<DataRenderer>(5);

    protected WeakReference<Chart> this.mChart;

    public CombinedChartRenderer(CombinedChart chart, animator:ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = new WeakReference<Chart>(chart);
        createRenderers();
    }

    /**
     * Creates the renderers needed for this combined-renderer in the required order. Also takes the DrawOrder into
     * consideration.
     */
    public createRenderers() {

        this.mRenderers.clear();

        CombinedChart chart = (CombinedChart)mChart.get();
        if (chart == null)
            return;

        DrawOrder[] orders = chart.getDrawOrder();

        for (DrawOrder order : orders) {

            switch (order) {
                case BAR:
                    if (chart.getBarData() != null)
                        this.mRenderers.add(new BarChartRenderer(chart, this.mAnimator, this.mViewPortHandler));
                    break;
                case BUBBLE:
                    if (chart.getBubbleData() != null)
                        this.mRenderers.add(new BubbleChartRenderer(chart, this.mAnimator, this.mViewPortHandler));
                    break;
                case LINE:
                    if (chart.getLineData() != null)
                        this.mRenderers.add(new LineChartRenderer(chart, this.mAnimator, this.mViewPortHandler));
                    break;
                case CANDLE:
                    if (chart.getCandleData() != null)
                        this.mRenderers.add(new CandleStickChartRenderer(chart, this.mAnimator, this.mViewPortHandler));
                    break;
                case SCATTER:
                    if (chart.getScatterData() != null)
                        this.mRenderers.add(new ScatterChartRenderer(chart, this.mAnimator, this.mViewPortHandler));
                    break;
            }
        }
    }

    
    public initBuffers() {

        for (DataRenderer renderer : this.mRenderers)
            renderer.initBuffers();
    }

    
    public drawData(c: Canvas) {

        for (DataRenderer renderer : this.mRenderers)
            renderer.drawData(c);
    }

    
    public drawValue(c: Canvas, let valueText, let x, let y, let color) {
        console.error("MPAndroidChart", "Erroneous call to drawValue() in CombinedChartRenderer!");
    }

    
    public drawValues(c: Canvas) {

        for (DataRenderer renderer : this.mRenderers)
            renderer.drawValues(c);
    }

    
    public drawExtras(c: Canvas) {

        for (DataRenderer renderer : this.mRenderers)
            renderer.drawExtras(c);
    }

    protected List<Highlight> this.mHighlightBuffer = new ArrayList<Highlight>();

    
    public drawHighlighted(c: Canvas, Highlight[] indices) {

        Chart chart = this.mChart.get();
        if (chart == null) return;

        for (DataRenderer renderer : this.mRenderers) {
            ChartData data = null;

            if (renderer instanceof BarChartRenderer)
                data = ((BarChartRenderer)renderer).mChart.getBarData();
            else if (renderer instanceof LineChartRenderer)
                data = ((LineChartRenderer)renderer).mChart.getLineData();
            else if (renderer instanceof CandleStickChartRenderer)
                data = ((CandleStickChartRenderer)renderer).mChart.getCandleData();
            else if (renderer instanceof ScatterChartRenderer)
                data = ((ScatterChartRenderer)renderer).mChart.getScatterData();
            else if (renderer instanceof BubbleChartRenderer)
                data = ((BubbleChartRenderer)renderer).mChart.getBubbleData();

            let dataIndex = data == null ? -1
                    : ((CombinedData)chart.getData()).getAllData().indexOf(data);

            this.mHighlightBuffer.clear();

            for (Highlight h : indices) {
                if (h.getDataIndex() == dataIndex || h.getDataIndex() == -1)
                    this.mHighlightBuffer.add(h);
            }

            renderer.drawHighlighted(c, this.mHighlightBuffer.toArray(new Highlight[mHighlightBuffer.length]));
        }
    }

    /**
     * Returns the sub-renderer object at the specified index.
     *
     * @param index
     * @return
     */
    public DataRenderer getSubRenderer(let index) {
        if (index >= this.mRenderers.length || index < 0)
            return null;
        else
            return this.mRenderers.get(index);
    }

    /**
     * Returns all sub-renderers.
     *
     * @return
     */
    public List<DataRenderer> getSubRenderers() {
        return this.mRenderers;
    }

    public setSubRenderers(List<DataRenderer> renderers) {
        this.mRenderers = renderers;
    }
}
