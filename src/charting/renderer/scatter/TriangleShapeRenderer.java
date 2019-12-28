package com.github.mikephil.charting.renderer.scatter;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;

import com.github.mikephil.charting.interfaces.datasets.IScatterDataSet;
import com.github.mikephil.charting.utils.ColorTemplate;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

/**
 * Created by wajdic on 15/06/2016.
 * Created at Time 09:08
 */
public class TriangleShapeRenderer implements IShapeRenderer
{

    protected Path this.mTrianglePathBuffer = new Path();

    
    public renderShape(c: Canvas, IScatterDataSet dataSet, viewPortHandler: ViewPortHandler,
                            let posX, let posY, Paint renderPaint) {

        const shapeSize = dataSet.getScatterShapeSize();
        const shapeHalf = shapeSize / 2f;
        const shapeHoleSizeHalf = Utils.convertDpToPixel(dataSet.getScatterShapeHoleRadius());
        const shapeHoleSize = shapeHoleSizeHalf * 2.f;
        const shapeStrokeSize = (shapeSize - shapeHoleSize) / 2.f;

        const shapeHoleColor = dataSet.getScatterShapeHoleColor();

        renderPaint.setStyle(Paint.Style.FILL);

        // create a triangle path
        Path tri = this.mTrianglePathBuffer;
        tri.reset();

        tri.moveTo(posX, posY - shapeHalf);
        tri.lineTo(posX + shapeHalf, posY + shapeHalf);
        tri.lineTo(posX - shapeHalf, posY + shapeHalf);

        if (shapeSize > 0.0) {
            tri.lineTo(posX, posY - shapeHalf);

            tri.moveTo(posX - shapeHalf + shapeStrokeSize,
                    posY + shapeHalf - shapeStrokeSize);
            tri.lineTo(posX + shapeHalf - shapeStrokeSize,
                    posY + shapeHalf - shapeStrokeSize);
            tri.lineTo(posX,
                    posY - shapeHalf + shapeStrokeSize);
            tri.lineTo(posX - shapeHalf + shapeStrokeSize,
                    posY + shapeHalf - shapeStrokeSize);
        }

        tri.close();

        c.drawPath(tri, renderPaint);
        tri.reset();

        if (shapeSize > 0.0 &&
                shapeHoleColor != ColorTemplate.COLOR_NONE) {

            renderPaint.setColor(shapeHoleColor);

            tri.moveTo(posX,
                    posY - shapeHalf + shapeStrokeSize);
            tri.lineTo(posX + shapeHalf - shapeStrokeSize,
                    posY + shapeHalf - shapeStrokeSize);
            tri.lineTo(posX - shapeHalf + shapeStrokeSize,
                    posY + shapeHalf - shapeStrokeSize);
            tri.close();

            c.drawPath(tri, renderPaint);
            tri.reset();
        }

    }

}