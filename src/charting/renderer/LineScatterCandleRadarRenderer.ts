import { Canvas } from '@nativescript-community/ui-canvas';
import { ChartAnimator } from '../animation/ChartAnimator';
import { ILineScatterCandleRadarDataSet } from '../interfaces/datasets/ILineScatterCandleRadarDataSet';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { BarLineScatterCandleBubbleRenderer } from './BarLineScatterCandleBubbleRenderer';

/**
 * Created by Philipp Jahoda on 11/07/15.
 */
export abstract class LineScatterCandleRadarRenderer extends BarLineScatterCandleBubbleRenderer {
    constructor(animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
    }

    /**
     * Draws vertical & horizontal highlight-lines if enabled.
     *
     * @param c
     * @param x x-position of the highlight line intersection
     * @param y y-position of the highlight line intersection
     * @param set the currently drawn dataset
     */
    protected drawHighlightLines(c: Canvas, x, y, set: ILineScatterCandleRadarDataSet<any>) {
        const paint = this.highlightPaint;
        // set color and stroke-width
        paint.setColor(set.highLightColor);
        paint.setStrokeWidth(set.highlightLineWidth);

        // draw highlighted lines (if enabled)
        paint.setPathEffect(set.highlightDashPathEffect);
        // draw vertical highlight lines
        if (set.drawVerticalHighlightIndicator) {
            const path = Utils.getTempPath();
            // create vertical path
            path.reset();
            path.moveTo(x, this.mViewPortHandler.contentTop);
            path.lineTo(x, this.mViewPortHandler.contentBottom);

            c.drawPath(path, paint);
        }

        // draw horizontal highlight lines
        if (set.drawHorizontalHighlightIndicator) {
            const path = Utils.getTempPath();
            // create horizontal path
            path.reset();
            path.moveTo(this.mViewPortHandler.contentLeft, y);
            path.lineTo(this.mViewPortHandler.contentRight, y);

            c.drawPath(path, paint);
        }
    }
}
