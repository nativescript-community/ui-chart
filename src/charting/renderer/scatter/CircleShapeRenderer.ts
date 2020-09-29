import { Canvas, Paint, Style } from '@nativescript-community/ui-canvas';
import { IScatterDataSet } from '../../interfaces/datasets/IScatterDataSet';
import { ColorTemplate } from '../../utils/ColorTemplate';
import { ViewPortHandler } from '../../utils/ViewPortHandler';
import { IShapeRenderer } from './IShapeRenderer';

/**
 * Created by wajdic on 15/06/2016.
 * Created at Time 09:08
 */
export class CircleShapeRenderer implements IShapeRenderer {
    public renderShape(c: Canvas, dataSet: IScatterDataSet, viewPortHandler: ViewPortHandler, posX, posY, renderPaint: Paint) {
        const shapeSize = dataSet.getScatterShapeSize();
        const shapeHalf = shapeSize / 2;
        const shapeHoleSizeHalf = dataSet.getScatterShapeHoleRadius();
        const shapeHoleSize = shapeHoleSizeHalf * 2;
        const shapeStrokeSize = (shapeSize - shapeHoleSize) / 2;
        const shapeStrokeSizeHalf = shapeStrokeSize / 2;

        const shapeHoleColor = dataSet.getScatterShapeHoleColor();

        if (shapeSize > 0.0) {
            renderPaint.setStyle(Style.STROKE);
            renderPaint.setStrokeWidth(shapeStrokeSize);

            c.drawCircle(posX, posY, shapeHoleSizeHalf + shapeStrokeSizeHalf, renderPaint);

            if (shapeHoleColor && shapeHoleColor !== ColorTemplate.COLOR_NONE) {
                renderPaint.setStyle(Style.FILL);

                renderPaint.setColor(shapeHoleColor);
                c.drawCircle(posX, posY, shapeHoleSizeHalf, renderPaint);
            }
        } else {
            renderPaint.setStyle(Style.FILL);

            c.drawCircle(posX, posY, shapeHalf, renderPaint);
        }
    }
}
