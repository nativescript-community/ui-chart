package com.github.mikephil.charting.renderer.scatter;

import android.graphics.Canvas;
import android.graphics.Paint;

import com.github.mikephil.charting.interfaces.datasets.IScatterDataSet;
import com.github.mikephil.charting.utils.ColorTemplate;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

/**
 * Created by wajdic on 15/06/2016.
 * Created at Time 09:08
 */
public class SquareShapeRenderer implements IShapeRenderer
{


    
    public renderShape(c: Canvas, IScatterDataSet dataSet, viewPortHandler: ViewPortHandler,
                            let posX, let posY, Paint renderPaint) {

        const shapeSize = dataSet.getScatterShapeSize();
        const shapeHalf = shapeSize / 2f;
        const shapeHoleSizeHalf = Utils.convertDpToPixel(dataSet.getScatterShapeHoleRadius());
        const shapeHoleSize = shapeHoleSizeHalf * 2.f;
        const shapeStrokeSize = (shapeSize - shapeHoleSize) / 2.f;
        const shapeStrokeSizeHalf = shapeStrokeSize / 2.f;

        const shapeHoleColor = dataSet.getScatterShapeHoleColor();

        if (shapeSize > 0.0) {
            renderPaint.setStyle(Paint.Style.STROKE);
            renderPaint.setStrokeWidth(shapeStrokeSize);

            c.drawRect(posX - shapeHoleSizeHalf - shapeStrokeSizeHalf,
                    posY - shapeHoleSizeHalf - shapeStrokeSizeHalf,
                    posX + shapeHoleSizeHalf + shapeStrokeSizeHalf,
                    posY + shapeHoleSizeHalf + shapeStrokeSizeHalf,
                    renderPaint);

            if (shapeHoleColor != ColorTemplate.COLOR_NONE) {
                renderPaint.setStyle(Paint.Style.FILL);

                renderPaint.setColor(shapeHoleColor);
                c.drawRect(posX - shapeHoleSizeHalf,
                        posY - shapeHoleSizeHalf,
                        posX + shapeHoleSizeHalf,
                        posY + shapeHoleSizeHalf,
                        renderPaint);
            }

        } else {
            renderPaint.setStyle(Paint.Style.FILL);

            c.drawRect(posX - shapeHalf,
                    posY - shapeHalf,
                    posX + shapeHalf,
                    posY + shapeHalf,
                    renderPaint);
        }
    }
}
