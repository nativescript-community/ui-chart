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

export interface CustomRenderer {
    drawShape: (c: Canvas, e: Entry, dataSet: IScatterDataSet, viewPortHandler: ViewPortHandler, x: number, y: number, paint: Paint) => void;
    drawHighlight: (c: Canvas, e: Highlight, set: IScatterDataSet, paint: Paint) => void;
}

export enum ScatterShape {
    SQUARE = 'SQUARE',
    CIRCLE = 'CIRCLE',
    TRIANGLE = 'TRIANGLE',
    CROSS = 'CROSS',
    X = 'X',
    CHEVRON_UP = 'CHEVRON_UP',
    CHEVRON_DOWN = 'CHEVRON_DOWN',
}
/**
 * The ScatterChart. Draws dots, triangles, squares and custom shapes into the
 * Chart-View. CIRCLE and SCQUARE offer the best performance, TRIANGLE has the
 * worst performance.
 *
 * @author Philipp Jahoda
 */
export class ScatterChart extends BarLineChartBase<Entry, IScatterDataSet, ScatterData> implements ScatterDataProvider {
    mRenderer: ScatterChartRenderer;

    protected init() {
        super.init();

        this.mRenderer = new ScatterChartRenderer(this, this.mAnimator, this.mViewPortHandler);

        this.getXAxis().setSpaceMin(0.5);
        this.getXAxis().setSpaceMax(0.5);
    }

    public getScatterData() {
        return this.mData;
    }

    mCustomRenderer: CustomRenderer;
    /**
     * set a custom line renderer
     */
    public setCustomRenderer(renderer: CustomRenderer) {
        this.mCustomRenderer = renderer;
    }
    /**
     * get the custom line renderer
     */
    public getCustomRenderer() {
        return this.mCustomRenderer;
    }
}
