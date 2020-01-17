import { LineScatterCandleRadarRenderer } from './LineScatterCandleRadarRenderer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ChartAnimator } from '../animation/ChartAnimator';
import { Canvas, Path, Style, Paint } from 'nativescript-canvas';
import { Utils } from '../utils/Utils';
import { profile } from '@nativescript/core/profiling/profiling';
import { Color } from '@nativescript/core/color/color';

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
    protected drawFilledPathBitmap(c: Canvas, filledPath: Path, drawable) {
        if (this.clipPathSupported()) {
            let save = c.save();
            // c.scale(1, 1/SCALE_FACTOR, 0, this.mViewPortHandler.contentBottom())
            c.clipPath(filledPath);

            drawable.setBounds(this.mViewPortHandler.contentLeft(), this.mViewPortHandler.contentTop(), this.mViewPortHandler.contentRight(), this.mViewPortHandler.contentBottom());
            drawable.draw(c);

            c.restoreToCount(save);
        } else {
            throw new Error('Fill-drawables not (yet) supported below API level 18 ');
        }
    }

    @profile
    drawPath(canvas: Canvas, path: Path, paint: Paint) {
        canvas.save()
        // canvas.scale(1, 1/SCALE_FACTOR, 0, this.mViewPortHandler.contentBottom())
        canvas.drawPath(path, paint);
        canvas.restore()
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
    protected drawFilledPath(c: Canvas, filledPath: Path, fillColor: Color | string, fillAlpha: number = 1) {
        let color = fillColor;
        if (fillAlpha < 255) {
            fillColor = fillColor instanceof  Color ? fillColor : new Color(fillColor);
            color = new Color(fillAlpha, fillColor.r, fillColor.g, fillColor.b);
        }

        if (this.clipPathSupported()) {
            let save = c.save();
            // c.scale(1, 1/SCALE_FACTOR, 0, this.mViewPortHandler.contentBottom())
            c.clipPath(filledPath);

            c.drawColor(color);
            c.restoreToCount(save);
        } else {
            // save
            const previous = this.mRenderPaint.getStyle();
            let previousColor = this.mRenderPaint.getColor();

            // set
            this.mRenderPaint.setStyle(Style.FILL);
            this.mRenderPaint.setColor(color);
            this.drawPath(c, filledPath, this.mRenderPaint);
            // c.drawPath(filledPath, this.mRenderPaint);

            // restore
            this.mRenderPaint.setColor(previousColor);
            this.mRenderPaint.setStyle(previous);
        }
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
