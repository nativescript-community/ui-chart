import { ChartAnimator } from '../animation/ChartAnimator';
import { Chart } from '../charts/Chart';
import { CombinedChart, DrawOrder } from '../charts/CombinedChart';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { DataRenderer } from './DataRenderer';
import { LineChartRenderer } from './LineChartRenderer';
import { BarChartRenderer } from './BarChartRenderer';
import { BubbleChartRenderer } from './BubbleChartRenderer';
import { CandleStickChartRenderer } from './CandleStickChartRenderer';
import { ScatterChartRenderer } from './ScatterChartRenderer';
import { BarLineChartBase } from '../charts/BarLineChartBase';
import { Entry } from '../data/Entry';
import { Canvas } from '@nativescript-community/ui-canvas';
import { Highlight } from '../highlight/Highlight';
import { CombinedData } from '../data/CombinedData';
/**
 * Renderer class that is responsible for rendering multiple different data-types.
 */
export class CombinedChartRenderer extends DataRenderer {
    /**
     * all rederers for the different kinds of data this combined-renderer can draw
     */
    protected mRenderers: DataRenderer[] = new Array(5);

    protected mChart: WeakRef<CombinedChart>;

    constructor(chart: CombinedChart, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = new WeakRef<CombinedChart>(chart);
        this.createRenderers();
    }

    /**
     * Creates the renderers needed for this combined-renderer in the required order. Also takes the DrawOrder into
     * consideration.
     */
    public createRenderers() {
        this.mRenderers = [];

        const chart = this.mChart.get();
        if (chart == null) return;

        const orders = chart.getDrawOrder();

        for (const order of orders) {
            switch (order) {
                case DrawOrder.BAR:
                    if (chart.getBarData() != null) this.mRenderers.push(new BarChartRenderer(chart as any, this.mAnimator, this.mViewPortHandler));
                    break;
                case DrawOrder.BUBBLE:
                    if (chart.getBubbleData() != null) this.mRenderers.push(new BubbleChartRenderer(chart as any, this.mAnimator, this.mViewPortHandler));
                    break;
                case DrawOrder.LINE:
                    if (chart.getLineData() != null) this.mRenderers.push(new LineChartRenderer(chart as any, this.mAnimator, this.mViewPortHandler));
                    break;
                case DrawOrder.CANDLE:
                    if (chart.getCandleData() != null) this.mRenderers.push(new CandleStickChartRenderer(chart as any, this.mAnimator, this.mViewPortHandler));
                    break;
                case DrawOrder.SCATTER:
                    if (chart.getScatterData() != null) this.mRenderers.push(new ScatterChartRenderer(chart as any, this.mAnimator, this.mViewPortHandler));
                    break;
            }
        }
    }

    public initBuffers() {
        for (const renderer of this.mRenderers) renderer.initBuffers();
    }

    public drawData(c: Canvas) {
        for (const renderer of this.mRenderers) renderer.drawData(c);
    }

    public drawValue(c: Canvas, valueText, x, y, color) {
        console.error('MPAndroidChart', 'Erroneous call to drawValue() in CombinedChartRenderer!');
    }

    public drawValues(c: Canvas) {
        for (const renderer of this.mRenderers) renderer.drawValues(c);
    }

    public drawExtras(c: Canvas) {
        for (const renderer of this.mRenderers) renderer.drawExtras(c);
    }

    protected mHighlightBuffer: Highlight[] = [];

    public drawHighlighted(c: Canvas, indices: Highlight[]) {
        const chart = this.mChart.get();
        if (chart == null) return;

        for (const renderer of this.mRenderers) {
            let data = null;

            if (renderer instanceof BarChartRenderer) data = renderer.mChart.getBarData();
            else if (renderer instanceof LineChartRenderer) data = renderer.mChart.getLineData();
            else if (renderer instanceof CandleStickChartRenderer) data = renderer.mChart.getCandleData();
            else if (renderer instanceof ScatterChartRenderer) data = renderer.mChart.getScatterData();
            else if (renderer instanceof BubbleChartRenderer) data = renderer.mChart.getBubbleData();

            const dataIndex = data == null ? -1 : chart.getData().getAllData().indexOf(data);

            this.mHighlightBuffer = [];

            for (const h of indices) {
                if (h.dataIndex === dataIndex || h.dataIndex === -1) this.mHighlightBuffer.push(h);
            }

            renderer.drawHighlighted(c, this.mHighlightBuffer);
        }
    }

    /**
     * Returns the sub-renderer object at the specified index.
     *
     * @param index
     * @return
     */
    public getSubRenderer(index) {
        if (index >= this.mRenderers.length || index < 0) {
            return null;
        } else {
            return this.mRenderers[index];
        }
    }

    /**
     * Returns all sub-renderers.
     *
     * @return
     */
    public getSubRenderers() {
        return this.mRenderers;
    }

    public setSubRenderers(renderers: DataRenderer[]) {
        this.mRenderers = renderers;
    }
}
