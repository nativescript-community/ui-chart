import { Canvas, Paint } from '@nativescript-community/ui-canvas';
import { BubbleData } from '../data/BubbleData';
import { BubbleEntry } from '../data/BubbleEntry';
import { Highlight } from '../highlight/Highlight';
import { BubbleDataProvider } from '../interfaces/dataprovider/BubbleDataProvider';
import { IBubbleDataSet } from '../interfaces/datasets/IBubbleDataSet';
import { BubbleChartRenderer } from '../renderer/BubbleChartRenderer';
import { BaseCustomRenderer } from '../renderer/DataRenderer';
import { BarLineChartBase } from './BarLineChartBase';

export interface CustomRenderer extends BaseCustomRenderer {
    drawBubble?: (c: Canvas, e: BubbleEntry, cx: number, cy: number, radius: number, paint: Paint) => void;
    drawHighlight?: (c: Canvas, e: Highlight, cx: number, cy: number, radius: number, paint: Paint) => void;
}

/**
 * The BubbleChart. Draws bubbles. Bubble chart implementation: Copyright 2015
 * Pierre-Marc Airoldi Licensed under Apache License 2.0. In the BubbleChart, it
 * is the area of the bubble, not the radius or diameter of the bubble that
 * conveys the data.
 *

 */
export class BubbleChart extends BarLineChartBase<BubbleEntry, IBubbleDataSet, BubbleData> implements BubbleDataProvider {
    renderer: BubbleChartRenderer;
    protected init() {
        super.init();

        this.renderer = new BubbleChartRenderer(this, this.animator, this.viewPortHandler);
    }

    public get bubbleData() {
        return this.mData;
    }
    customRenderer: CustomRenderer;
}
