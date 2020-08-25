import { BarLineScatterCandleBubbleRenderer } from './BarLineScatterCandleBubbleRenderer';
import { ChartAnimator } from '../animation/ChartAnimator';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ILineScatterCandleRadarDataSet } from '../interfaces/datasets/ILineScatterCandleRadarDataSet';
import { Path, Canvas } from 'nativescript-canvas';
import { profile } from '@nativescript/core/profiling';

/**
 * Created by Philipp Jahoda on 11/07/15.
 */
export abstract class LineScatterCandleRadarRenderer extends BarLineScatterCandleBubbleRenderer {
    /**
     * path that is used for drawing highlight-lines (drawLines(...) cannot be used because of dashes)
     */
    private mHighlightLinePath = new Path();

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
        // set color and stroke-width
        this.mHighlightPaint.setColor(set.getHighLightColor());
        this.mHighlightPaint.setStrokeWidth(set.getHighlightLineWidth());

        // draw highlighted lines (if enabled)
        this.mHighlightPaint.setPathEffect(set.getDashPathEffectHighlight());

        // draw vertical highlight lines
        if (set.isVerticalHighlightIndicatorEnabled()) {
            // create vertical path
            this.mHighlightLinePath.reset();
            this.mHighlightLinePath.moveTo(x, this.mViewPortHandler.contentTop());
            this.mHighlightLinePath.lineTo(x, this.mViewPortHandler.contentBottom());

            c.drawPath(this.mHighlightLinePath, this.mHighlightPaint);
        }

        // draw horizontal highlight lines
        if (set.isHorizontalHighlightIndicatorEnabled()) {
            // create horizontal path
            this.mHighlightLinePath.reset();
            this.mHighlightLinePath.moveTo(this.mViewPortHandler.contentLeft(), y);
            this.mHighlightLinePath.lineTo(this.mViewPortHandler.contentRight(), y);

            c.drawPath(this.mHighlightLinePath, this.mHighlightPaint);
        }
    }
}
