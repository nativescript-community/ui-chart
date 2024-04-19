import { Canvas, Paint, Style } from '@nativescript-community/ui-canvas';
import { IScatterDataSet } from '../../interfaces/datasets/IScatterDataSet';
import { ColorTemplate } from '../../utils/ColorTemplate';
import { ViewPortHandler } from '../../utils/ViewPortHandler';
import { IShapeRenderer } from './IShapeRenderer';

/**
 * Created by wajdic on 15/06/2016.
 * Created at Time 09:08
 */
export class ChevronUpShapeRenderer implements IShapeRenderer {
    public renderShape(c: Canvas, dataSet: IScatterDataSet, viewPortHandler: ViewPortHandler, posX, posY, renderPaint: Paint) {
        const shapeHalf = dataSet.scatterShapeSize / 2;

        renderPaint.setStyle(Style.STROKE);
        renderPaint.setStrokeWidth(1);

        c.drawLine(posX, posY - 2 * shapeHalf, posX + 2 * shapeHalf, posY, renderPaint);

        c.drawLine(posX, posY - 2 * shapeHalf, posX - 2 * shapeHalf, posY, renderPaint);
    }
}
