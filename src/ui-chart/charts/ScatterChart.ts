import { BarLineChartBase } from './BarLineChartBase';
import { ScatterData } from '../data/ScatterData';
import { ScatterDataProvider } from '../interfaces/dataprovider/ScatterDataProvider';
import { ScatterDataSet } from '../data/ScatterDataSet';
import { Entry } from '../data/Entry';
import { IScatterDataSet } from '../interfaces/datasets/IScatterDataSet';
import { ScatterChartRenderer } from '../renderer/ScatterChartRenderer';
import { Canvas, Paint } from '@nativescript-community/ui-canvas';
import { Highlight } from '../highlight/Highlight';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { BaseCustomRenderer } from '../renderer/DataRenderer';

export interface CustomRenderer extends BaseCustomRenderer {
    drawShape?: (c: Canvas, e: Entry, dataSet: IScatterDataSet, viewPortHandler: ViewPortHandler, x: number, y: number, paint: Paint) => void;
    drawHighlight?: (c: Canvas, e: Highlight, set: IScatterDataSet, paint: Paint) => void;
}

export enum ScatterShape {
    SQUARE = 'SQUARE',
    CIRCLE = 'CIRCLE',
    TRIANGLE = 'TRIANGLE',
    CROSS = 'CROSS',
    X = 'X',
    CHEVRON_UP = 'CHEVRON_UP',
    CHEVRON_DOWN = 'CHEVRON_DOWN'
}
/**
 * The ScatterChart. Draws dots, triangles, squares and custom shapes into the
 * Chart-View. CIRCLE and SCQUARE offer the best performance, TRIANGLE has the
 * worst performance.
 *

 */
export class ScatterChart extends BarLineChartBase<Entry, IScatterDataSet, ScatterData> implements ScatterDataProvider {
    renderer: ScatterChartRenderer;

    protected init() {
        super.init();

        this.renderer = new ScatterChartRenderer(this, this.animator, this.viewPortHandler);

        this.xAxis.spaceMin = 0.5;
        this.xAxis.spaceMax = 0.5;
    }

    public get scatterData() {
        return this.mData;
    }

    customRenderer: CustomRenderer;
}
