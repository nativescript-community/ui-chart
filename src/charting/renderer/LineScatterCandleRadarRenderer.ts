import { BarLineScatterCandleBubbleRenderer } from './BarLineScatterCandleBubbleRenderer';
import { ChartAnimator } from '../animation/ChartAnimator';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ILineScatterCandleRadarDataSet } from '../interfaces/datasets/ILineScatterCandleRadarDataSet';
import { Canvas, Path } from '@nativescript-community/ui-canvas';
import { profile } from '@nativescript/core';

/**
 * Created by Philipp Jahoda on 11/07/15.
 */
export abstract class LineScatterCandleRadarRenderer extends BarLineScatterCandleBubbleRenderer {
    /**
     * path that is used for drawing highlight-lines (drawLines(...) cannot be used because of dashes)
     */
    private mHighlightLinePath: Path;
    protected get highlightLinePath() {
        if (!this.mHighlightLinePath) {
            this.mHighlightLinePath = new Path();
        }
        return this.mHighlightLinePath;
    }

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
        paint.setColor(set.getHighLightColor());
        paint.setStrokeWidth(set.getHighlightLineWidth());

        // draw highlighted lines (if enabled)
        paint.setPathEffect(set.getDashPathEffectHighlight());
        const path = this.highlightLinePath;
        // draw vertical highlight lines
        if (set.isVerticalHighlightIndicatorEnabled()) {
            // create vertical path
            path.reset();
            path.moveTo(x, this.mViewPortHandler.contentTop());
            path.lineTo(x, this.mViewPortHandler.contentBottom());

            c.drawPath(path, paint);
        }

        // draw horizontal highlight lines
        if (set.isHorizontalHighlightIndicatorEnabled()) {
            // create horizontal path
            path.reset();
            path.moveTo(this.mViewPortHandler.contentLeft(), y);
            path.lineTo(this.mViewPortHandler.contentRight(), y);

            c.drawPath(path, paint);
        }
    }
}
