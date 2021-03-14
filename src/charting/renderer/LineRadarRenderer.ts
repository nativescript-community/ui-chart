import { Canvas, Paint, Path, Rect, Style } from '@nativescript-community/ui-canvas';
import { Color, ImageSource, profile } from '@nativescript/core';
import { ChartAnimator } from '../animation/ChartAnimator';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { LineScatterCandleRadarRenderer } from './LineScatterCandleRadarRenderer';

// export const SCALE_FACTOR = 1;

/**
 * Created by Philipp Jahoda on 25/01/16.
 */
export abstract class LineRadarRenderer extends LineScatterCandleRadarRenderer {
    constructor(animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
    }

    /**
     * Draws the provided path in filled mode with the provided drawable.
     *
     * @param c
     * @param filledPath
     * @param drawable
     */
    @profile
    protected drawFilledPathBitmap(c: Canvas, filledPath: Path, drawable: ImageSource, shader) {
        if (this.clipPathSupported()) {
            const save = c.save();
            // c.scale(1, 1/SCALE_FACTOR, 0, this.mViewPortHandler.contentBottom())
            c.clipPath(filledPath);

            // drawable.setBounds(this.mViewPortHandler.contentLeft(), this.mViewPortHandler.contentTop(), this.mViewPortHandler.contentRight(), this.mViewPortHandler.contentBottom());
            // drawable.draw(c);
            c.drawBitmap(
                drawable,
                new Rect(0, 0, drawable.width, drawable.height),
                new Rect(this.mViewPortHandler.contentLeft(), this.mViewPortHandler.contentTop(), this.mViewPortHandler.contentRight(), this.mViewPortHandler.contentBottom()),
                null
            );

            c.restoreToCount(save);
        } else {
            throw new Error('Fill-drawables not (yet) supported below API level 18 ');
        }
    }

    @profile
    drawPath(canvas: Canvas, path: Path, paint: Paint) {
        canvas.drawPath(path, paint);
    }

    /**
     * Draws the provided path in filled mode with the provided color and alpha.
     * Special thanks to Angelo Suzuki (https://github.com/tinsukE) for this.
     *
     * @param c
     * @param filledPath
     * @param fillColor
     * @param fillAlpha
     */
    @profile
    protected drawFilledPath(c: Canvas, filledPath: Path, fillColor: Color | string, fillAlpha: number = 255, shader?) {
        let color = fillColor;
        if (fillAlpha < 255) {
            fillColor = fillColor instanceof Color ? fillColor : new Color(fillColor);
            color = new Color(fillAlpha, fillColor.r, fillColor.g, fillColor.b);
        }
        const renderPaint = this.renderPaint;

        // save
        const previous = renderPaint.getStyle();
        const previousColor = renderPaint.getColor();
        const previousShader = renderPaint.getShader();

        renderPaint.setStyle(Style.FILL);

        renderPaint.setColor(color);
        if (shader) {
            renderPaint.setShader(shader);
        }

        if (this.clipPathSupported()) {
            const save = c.save();
            c.clipPath(filledPath);
            c.drawPaint(renderPaint);
            c.restoreToCount(save);
        } else {
            this.drawPath(c, filledPath, renderPaint);
        }
        // restore
        renderPaint.setColor(previousColor);
        renderPaint.setShader(previousShader);
        renderPaint.setStyle(previous);
    }

    /**
     * Clip path with hardware acceleration only working properly on API level 18 and above.
     *
     * @return
     */
    private clipPathSupported() {
        return Utils.clipPathSupported();
        // return Utils.getSDKInt() >= 18;
    }
}
