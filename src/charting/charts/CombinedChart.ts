import { Canvas } from '@nativescript-community/ui-canvas';
import { BarLineScatterCandleBubbleDataSet } from '../data/BarLineScatterCandleBubbleDataSet';
import { CombinedData } from '../data/CombinedData';
import { Entry } from '../data/Entry';
import { CombinedHighlighter } from '../highlight/CombinedHighlighter';
import { CombinedDataProvider } from '../interfaces/dataprovider/CombinedDataProvider';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { BarLineChartBase } from './BarLineChartBase';
import { CombinedChartRenderer } from '../renderer/CombinedChartRenderer';
import { CustomRenderer as BBCustomRenderer } from './BubbleChart';
import { CustomRenderer as CSCustomRenderer } from './CandleStickChart';
import { CustomRenderer as BCustomRenderer } from './BarChart';
import { CustomRenderer as LCustomRenderer } from './LineChart';
import { CustomRenderer as SCustomRenderer } from './ScatterChart';

export type CustomRenderer = BBCustomRenderer & CSCustomRenderer & BCustomRenderer & LCustomRenderer & SCustomRenderer;

/**
 * enum that allows to specify the order in which the different data objects
 * for the combined-chart are drawn
 */
export enum DrawOrder {
    BAR,
    BUBBLE,
    LINE,
    CANDLE,
    SCATTER
}
/**
 * This chart class allows the combination of lines, bars, scatter and candle
 * data all displayed in one chart area.
 *

 */
export class CombinedChart extends BarLineChartBase<Entry, BarLineScatterCandleBubbleDataSet<Entry>, CombinedData> implements CombinedDataProvider {
    renderer: CombinedChartRenderer;
    /**
     * if set to true, all values are drawn above their bars, instead of below
     * their top
     */
    drawValueAboveBarEnabled = true;

    /**
     * flag that indicates whether the highlight should be full-bar oriented, or single-value?
     */
    highlightFullBarEnabled: boolean;

    /**
     * if set to true, a grey area is drawn behind each bar that indicates the
     * maximum value
     */
    drawBarShadowEnabled: boolean;

    /**
     * Sets the order in which the provided data objects should be drawn. The
     * earlier you place them in the provided array, the further they will be in
     * the background. e.g. if you provide new DrawOrer[] { DrawOrder.BAR,
     * DrawOrder.LINE }, the bars will be drawn behind the lines.
     */
    drawOrder: DrawOrder[];

    protected init() {
        super.init();

        // Default values are not ready here yet
        this.drawOrder = [DrawOrder.BAR, DrawOrder.BUBBLE, DrawOrder.LINE, DrawOrder.CANDLE, DrawOrder.SCATTER];

        this.highlighter = new CombinedHighlighter(this, this);

        // Old default behaviour
        this.highlightFullBarEnabled = true;

        this.renderer = new CombinedChartRenderer(this, this.animator, this.viewPortHandler);
    }

    public get combinedData() {
        return this.mData;
    }

    public set data(data: CombinedData) {
        super.data = data;
        // we need to reset highlighter here because it checks for barData
        // to create BarHighligther
        this.highlighter = new CombinedHighlighter(this, this);
        this.renderer.createRenderers();
        // if (this.viewPortHandler.hasChartDimens) {
        this.renderer.initBuffers();
        // }
    }
    get data() {
        return this.mData;
    }

    /**
     * Returns the Highlight object (contains x-index and DataSet index) of the selected value at the given touch
     * point
     * inside the CombinedChart.
     *
     * @param x
     * @param y
     * @return
     */
    public getHighlightByTouchPoint(x, y) {
        if (this.mData == null) {
            console.error("Can't select by touch. No data set.");
            return null;
        } else {
            const h = this.highlighter.getHighlight(x, y);
            if (h == null || !this.highlightFullBarEnabled) return h;

            // For isHighlightFullBarEnabled, remove stackIndex
            return Object.assign({}, h, {});
        }
    }

    public get lineData() {
        return this.data?.lineData;
    }

    public get barData() {
        return this.data?.barData;
    }

    public get scatterData() {
        return this.data?.scatterData;
    }

    public get candleData() {
        return this.data?.candleData;
    }

    public get bubbleData() {
        return this.data?.bubbleData;
    }

    /**
     * draws all MarkerViews on the highlighted positions
     */
    protected drawMarkers(c: Canvas) {
        // if there is no marker view or drawing marker is disabled
        if (this.marker == null || !this.drawMarkersEnabled || !this.hasValuesToHighlight) return;

        for (let i = 0; i < this.indicesToHighlight.length; i++) {
            const highlight = this.indicesToHighlight[i];

            const set: IDataSet<Entry> = this.mData.getDataSetByHighlight(highlight);

            const e = this.mData.getEntryForHighlight(highlight);
            if (e == null) continue;

            const entryIndex = set.getEntryIndex(e);

            // make sure entry not null
            if (entryIndex > set.entryCount * this.animator.phaseX) continue;

            const pos = this.getMarkerPosition(highlight);

            // check bounds
            if (!this.viewPortHandler.isInBounds(pos[0], pos[1])) continue;

            // callbacks to update the content
            this.marker.refreshContent(e, highlight);

            // draw the marker
            this.marker.draw(c, pos[0], pos[1]);
        }
    }

    customRenderer: CustomRenderer;
}
