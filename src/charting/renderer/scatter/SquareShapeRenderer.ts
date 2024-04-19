import { Canvas, Paint, Style } from '@nativescript-community/ui-canvas';
import { IScatterDataSet } from '../../interfaces/datasets/IScatterDataSet';
import { ViewPortHandler } from '../../utils/ViewPortHandler';
import { IShapeRenderer } from './IShapeRenderer';

/**
 * Created by wajdic on 15/06/2016.
 * Created at Time 09:08
 */
export class SquareShapeRenderer implements IShapeRenderer {
    public renderShape(c: Canvas, dataSet: IScatterDataSet, viewPortHandler: ViewPortHandler, posX, posY, renderPaint: Paint) {
        const shapeSize = dataSet.scatterShapeSize;
        const shapeHalf = shapeSize / 2;
        const shapeHoleSizeHalf = dataSet.scatterShapeHoleRadius;
        const shapeHoleSize = shapeHoleSizeHalf * 2;
        const shapeStrokeSize = (shapeSize - shapeHoleSize) / 2;
        const shapeStrokeSizeHalf = shapeStrokeSize / 2;

        const shapeHoleColor = dataSet.scatterShapeHoleColor;
        if (shapeHoleSize > 0.0) {
            renderPaint.setStyle(Style.STROKE);
            renderPaint.setStrokeWidth(shapeStrokeSize);

            c.drawRect(
                posX - shapeHoleSizeHalf - shapeStrokeSizeHalf,
                posY - shapeHoleSizeHalf - shapeStrokeSizeHalf,
                posX + shapeHoleSizeHalf + shapeStrokeSizeHalf,
                posY + shapeHoleSizeHalf + shapeStrokeSizeHalf,
                renderPaint
            );

            if (shapeHoleColor && shapeHoleColor) {
                renderPaint.setStyle(Style.FILL);

                renderPaint.setColor(shapeHoleColor);
                c.drawRect(posX - shapeHoleSizeHalf, posY - shapeHoleSizeHalf, posX + shapeHoleSizeHalf, posY + shapeHoleSizeHalf, renderPaint);
            }
        } else {
            renderPaint.setStyle(Style.FILL);

            c.drawRect(posX - shapeHalf, posY - shapeHalf, posX + shapeHalf, posY + shapeHalf, renderPaint);
        }
    }
}
