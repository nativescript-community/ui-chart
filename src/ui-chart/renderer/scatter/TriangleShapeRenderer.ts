import { Canvas, Paint, Path, Style } from '@nativescript-community/ui-canvas';
import { IScatterDataSet } from '../../interfaces/datasets/IScatterDataSet';
import { ViewPortHandler } from '../../utils/ViewPortHandler';
import { IShapeRenderer } from './IShapeRenderer';

/**
 * Created by wajdic on 15/06/2016.
 * Created at Time 09:08
 */
export class TriangleShapeRenderer implements IShapeRenderer {
    static mTrianglePathBuffer = new Path();

    public renderShape(c: Canvas, dataSet: IScatterDataSet, viewPortHandler: ViewPortHandler, posX, posY, renderPaint: Paint) {
        const shapeSize = dataSet.scatterShapeSize;
        const shapeHalf = shapeSize / 2;
        const shapeHoleSizeHalf = dataSet.scatterShapeHoleRadius;
        const shapeHoleSize = shapeHoleSizeHalf * 2;
        const shapeStrokeSize = (shapeSize - shapeHoleSize) / 2;

        const shapeHoleColor = dataSet.scatterShapeHoleColor;

        renderPaint.setStyle(Style.FILL);

        // create a triangle path
        const tri = TriangleShapeRenderer.mTrianglePathBuffer;
        tri.reset();

        tri.moveTo(posX, posY - shapeHalf);
        tri.lineTo(posX + shapeHalf, posY + shapeHalf);
        tri.lineTo(posX - shapeHalf, posY + shapeHalf);

        if (shapeSize > 0.0) {
            tri.lineTo(posX, posY - shapeHalf);

            tri.moveTo(posX - shapeHalf + shapeStrokeSize, posY + shapeHalf - shapeStrokeSize);
            tri.lineTo(posX + shapeHalf - shapeStrokeSize, posY + shapeHalf - shapeStrokeSize);
            tri.lineTo(posX, posY - shapeHalf + shapeStrokeSize);
            tri.lineTo(posX - shapeHalf + shapeStrokeSize, posY + shapeHalf - shapeStrokeSize);
        }

        tri.close();

        c.drawPath(tri, renderPaint);
        tri.reset();

        if (shapeSize > 0.0 && shapeHoleColor) {
            renderPaint.setColor(shapeHoleColor);

            tri.moveTo(posX, posY - shapeHalf + shapeStrokeSize);
            tri.lineTo(posX + shapeHalf - shapeStrokeSize, posY + shapeHalf - shapeStrokeSize);
            tri.lineTo(posX - shapeHalf + shapeStrokeSize, posY + shapeHalf - shapeStrokeSize);
            tri.close();

            c.drawPath(tri, renderPaint);
            tri.reset();
        }
    }
}
