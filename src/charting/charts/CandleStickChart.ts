import { Canvas, Paint, TypedArray } from '@nativescript-community/ui-canvas';
import { CandleData } from '../data/CandleData';
import { CandleEntry } from '../data/CandleEntry';
import { Highlight } from '../highlight/Highlight';
import { CandleDataProvider } from '../interfaces/dataprovider/CandleDataProvider';
import { ICandleDataSet } from '../interfaces/datasets/ICandleDataSet';
import { CandleStickChartRenderer } from '../renderer/CandleStickChartRenderer';
import { BaseCustomRenderer } from '../renderer/DataRenderer';
import { BarLineChartBase } from './BarLineChartBase';

export interface CustomRenderer extends BaseCustomRenderer {
    drawShadows?: (c: Canvas, e: CandleEntry, lines: number[] | TypedArray, paint: Paint) => void;
    drawOpened?: (c: Canvas, e: CandleEntry, left: number, top: number, right: number, bottom: number, paint: Paint) => void;
    drawClosed?: (c: Canvas, e: CandleEntry, left: number, top: number, right: number, bottom: number, paint: Paint) => void;
    drawEqual?: (c: Canvas, e: CandleEntry, left: number, top: number, right: number, bottom: number, paint: Paint) => void;
    drawLines?: (c: Canvas, e: CandleEntry, range: number[] | TypedArray, open: number[] | TypedArray, close: number[] | TypedArray, paint: Paint) => void;
    drawHighlight?: (c: Canvas, e: Highlight, set: ICandleDataSet, paint: Paint) => void;
}
/**
 * Financial chart type that draws candle-sticks (OHCL chart).
 *

 */
export class CandleStickChart extends BarLineChartBase<CandleEntry, ICandleDataSet, CandleData> implements CandleDataProvider {
    protected mRenderer: CandleStickChartRenderer;
    protected init() {
        super.init();

        this.mRenderer = new CandleStickChartRenderer(this, this.mAnimator, this.mViewPortHandler);

        this.getXAxis().setSpaceMin(0.5);
        this.getXAxis().setSpaceMax(0.5);
    }

    public getCandleData() {
        return this.mData;
    }

    protected mCustomRenderer: CustomRenderer;
    /**
     * set a custom candle renderer
     */
    public setCustomRenderer(renderer: CustomRenderer) {
        this.mCustomRenderer = renderer;
    }
    /**
     * get the custom candle renderer
     */
    public getCustomRenderer() {
        return this.mCustomRenderer;
    }
}
