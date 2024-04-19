import { PathEffect } from '@nativescript-community/ui-canvas';
import { Entry } from '../../data/Entry';
import { IBarLineScatterCandleBubbleDataSet } from './IBarLineScatterCandleBubbleDataSet';

/**
 * Created by Philipp Jahoda on 21/10/15.
 */
export interface ILineScatterCandleRadarDataSet<T extends Entry> extends IBarLineScatterCandleBubbleDataSet<T> {
    /**
     * Returns true if vertical highlight indicator lines are enabled (drawn)
     * @return
     */
    drawVerticalHighlightIndicator: boolea;

    /**
     * Returns true if vertical highlight indicator lines are enabled (drawn)
     * @return
     */
    drawHorizontalHighlightIndicator: boolean;

    /**
     * Returns the line-width in which highlight lines are to be drawn.
     * @return
     */
    highlightLineWidth: number;

    /**
     * Returns the DashPathEffect that is used for highlighting.
     * @return
     */
    highlightDashPathEffect: PathEffect;
}
