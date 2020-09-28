import { BubbleData } from '../data/BubbleData';
import { BubbleEntry } from '../data/BubbleEntry';
import { BubbleDataProvider } from '../interfaces/dataprovider/BubbleDataProvider';
import { IBubbleDataSet } from '../interfaces/datasets/IBubbleDataSet';
import { BubbleChartRenderer } from '../renderer/BubbleChartRenderer';
import { BarLineChartBase } from './BarLineChartBase';

/**
 * The BubbleChart. Draws bubbles. Bubble chart implementation: Copyright 2015
 * Pierre-Marc Airoldi Licensed under Apache License 2.0. In the BubbleChart, it
 * is the area of the bubble, not the radius or diameter of the bubble that
 * conveys the data.
 *
 * @author Philipp Jahoda
 */
export class BubbleChart extends BarLineChartBase<BubbleEntry, IBubbleDataSet, BubbleData> implements BubbleDataProvider {
    protected init() {
        super.init();

        this.mRenderer = new BubbleChartRenderer(this, this.mAnimator, this.mViewPortHandler);
    }

    public getBubbleData() {
        return this.mData;
    }
}
