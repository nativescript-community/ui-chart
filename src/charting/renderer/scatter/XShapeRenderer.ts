import { Canvas, Paint, Style } from '@nativescript-community/ui-canvas';
import { IScatterDataSet } from '../../interfaces/datasets/IScatterDataSet';
import { ColorTemplate } from '../../utils/ColorTemplate';
import { ViewPortHandler } from '../../utils/ViewPortHandler';
import { IShapeRenderer } from './IShapeRenderer';

/**
 * Created by wajdic on 15/06/2016.
 * Created at Time 09:08
 */
export class XShapeRenderer implements IShapeRenderer {
    public renderShape(c: Canvas, dataSet: IScatterDataSet, viewPortHandler: ViewPortHandler, posX, posY, renderPaint: Paint) {
        const shapeHalf = dataSet.getScatterShapeSize() / 2;

        renderPaint.setStyle(Style.STROKE);
        renderPaint.setStrokeWidth(1);

        c.drawLine(posX - shapeHalf, posY - shapeHalf, posX + shapeHalf, posY + shapeHalf, renderPaint);
        c.drawLine(posX + shapeHalf, posY - shapeHalf, posX - shapeHalf, posY + shapeHalf, renderPaint);
    }
}
