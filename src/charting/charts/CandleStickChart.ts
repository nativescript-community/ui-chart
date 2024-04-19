import { Canvas, Paint, Path } from '@nativescript-community/ui-canvas';
import { TypedArray } from '@nativescript-community/arraybuffers';
import { CandleData } from '../data/CandleData';
import { CandleEntry } from '../data/CandleEntry';
import { Highlight } from '../highlight/Highlight';
import { CandleDataProvider } from '../interfaces/dataprovider/CandleDataProvider';
import { ICandleDataSet } from '../interfaces/datasets/ICandleDataSet';
import { CandleStickChartRenderer } from '../renderer/CandleStickChartRenderer';
import { BaseCustomRenderer } from '../renderer/DataRenderer';
import { BarLineChartBase } from './BarLineChartBase';

export interface CustomRenderer extends BaseCustomRenderer {
    drawShadows?: (c: Canvas, e: CandleEntry, line: Path, paint: Paint) => void;
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
    renderer: CandleStickChartRenderer;
    protected init() {
        super.init();

        this.renderer = new CandleStickChartRenderer(this, this.animator, this.viewPortHandler);

        this.xAxis.spaceMin = 0.5;
        this.xAxis.spaceMax = 0.5;
    }

    public get candleData() {
        return this.mData;
    }

    customRenderer: CustomRenderer;
}
