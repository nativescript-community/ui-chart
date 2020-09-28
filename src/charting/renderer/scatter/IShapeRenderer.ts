import { Canvas, Paint } from '@nativescript-community/ui-canvas';
import { IScatterDataSet } from '../../interfaces/datasets/IScatterDataSet';
import { ViewPortHandler } from '../../utils/ViewPortHandler';

/**
 * Created by wajdic on 15/06/2016.
 * Created at Time 09:07
 */
export interface IShapeRenderer {
    /**
     * Renders the provided ScatterDataSet with a shape.
     *
     * @param c               Canvas object for drawing the shape
     * @param dataSet         The DataSet to be drawn
     * @param viewPortHandler Contains information about the current state of the view
     * @param posX            Position to draw the shape at
     * @param posY            Position to draw the shape at
     * @param renderPaint     Paint object used for styling and drawing
     */
    renderShape(c: Canvas, dataSet: IScatterDataSet, viewPortHandler: ViewPortHandler, posX, posY, renderPaint: Paint);
}
