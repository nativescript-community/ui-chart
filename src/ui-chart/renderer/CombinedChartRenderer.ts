import { ChartAnimator } from '../animation/ChartAnimator';
import { CombinedChart, DrawOrder } from '../charts/CombinedChart';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { DataRenderer } from './DataRenderer';
import { LineChartRenderer } from './LineChartRenderer';
import { BarChartRenderer } from './BarChartRenderer';
import { BubbleChartRenderer } from './BubbleChartRenderer';
import { CandleStickChartRenderer } from './CandleStickChartRenderer';
import { ScatterChartRenderer } from './ScatterChartRenderer';
import { Canvas } from '@nativescript-community/ui-canvas';
import { Highlight } from '../highlight/Highlight';
/**
 * Renderer class that is responsible for rendering multiple different data-types.
 */
export class CombinedChartRenderer extends DataRenderer {
    /**
     * all rederers for the different kinds of data this combined-renderer can draw
     */
    renderers: DataRenderer[] = new Array(5);

    protected mChart: WeakRef<CombinedChart>;

    protected mHighlightBuffer: Highlight[] = [];

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
        this.renderers = [];

        const chart = this.mChart.get();
        if (!chart?.data) return;
        const orders = chart.drawOrder;
        if (orders) {
            for (const order of orders) {
                switch (order) {
                    case DrawOrder.BAR:
                        if (chart.barData) {
                            this.renderers.push(new BarChartRenderer(chart as any, this.animator, this.mViewPortHandler));
                        }
                        break;
                    case DrawOrder.BUBBLE:
                        if (chart.bubbleData) {
                            this.renderers.push(new BubbleChartRenderer(chart as any, this.animator, this.mViewPortHandler));
                        }
                        break;
                    case DrawOrder.LINE:
                        if (chart.lineData) {
                            this.renderers.push(new LineChartRenderer(chart as any, this.animator, this.mViewPortHandler));
                        }
                        break;
                    case DrawOrder.CANDLE:
                        if (chart.candleData) {
                            this.renderers.push(new CandleStickChartRenderer(chart as any, this.animator, this.mViewPortHandler));
                        }
                        break;
                    case DrawOrder.SCATTER:
                        if (chart.scatterData) {
                            this.renderers.push(new ScatterChartRenderer(chart as any, this.animator, this.mViewPortHandler));
                        }
                        break;
                }
            }
        }
    }

    public initBuffers() {
        for (const renderer of this.renderers) renderer.initBuffers();
    }

    public drawData(c: Canvas) {
        for (const renderer of this.renderers) renderer.drawData(c);
    }

    public drawValues(c: Canvas) {
        for (const renderer of this.renderers) renderer.drawValues(c);
    }

    public drawExtras(c: Canvas) {
        for (const renderer of this.renderers) renderer.drawExtras(c);
    }

    public drawHighlighted(c: Canvas, indices: Highlight[]) {
        const chart = this.mChart.get();
        if (!chart) return;
        const datas = chart.data.datasArray;

        for (const renderer of this.renderers) {
            let data = null;

            if (renderer instanceof BarChartRenderer) data = renderer.mChart.barData;
            else if (renderer instanceof LineChartRenderer) data = renderer.mChart.lineData;
            else if (renderer instanceof CandleStickChartRenderer) data = renderer.mChart.candleData;
            else if (renderer instanceof ScatterChartRenderer) data = renderer.mChart.scatterData;
            else if (renderer instanceof BubbleChartRenderer) data = renderer.mChart.bubbleData;
            if (!data) {
                continue;
            }
            const dataIndex = datas.indexOf(data);

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
        if (index >= this.renderers.length || index < 0) {
            return null;
        } else {
            return this.renderers[index];
        }
    }

    /**
     * Returns all sub-renderers.
     */
    public getSubRenderers() {
        return this.renderers;
    }

    public setSubRenderers(renderers: DataRenderer[]) {
        this.renderers = renderers;
    }
}
