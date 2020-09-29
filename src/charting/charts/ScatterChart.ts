import { BarLineChartBase } from './BarLineChartBase';
import { ScatterData } from '../data/ScatterData';
import { ScatterDataProvider } from '../interfaces/dataprovider/ScatterDataProvider';
import { ScatterDataSet } from '../data/ScatterDataSet';
import { Entry } from '../data/Entry';
import { IScatterDataSet } from '../interfaces/datasets/IScatterDataSet';
import { ScatterChartRenderer } from '../renderer/ScatterChartRenderer';

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
    protected init() {
        super.init();

        this.mRenderer = new ScatterChartRenderer(this, this.mAnimator, this.mViewPortHandler);

        this.getXAxis().setSpaceMin(0.5);
        this.getXAxis().setSpaceMax(0.5);
    }

    public getScatterData() {
        return this.mData;
    }

    /**
     * Predefined ScatterShapes that allow the specification of a shape a ScatterDataSet should be drawn with.
     * If a ScatterShape is specified for a ScatterDataSet, the required renderer is set.
     */
}
