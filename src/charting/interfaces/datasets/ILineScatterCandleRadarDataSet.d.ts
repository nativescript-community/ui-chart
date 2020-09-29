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
    isVerticalHighlightIndicatorEnabled();

    /**
     * Returns true if vertical highlight indicator lines are enabled (drawn)
     * @return
     */
    isHorizontalHighlightIndicatorEnabled();

    /**
     * Returns the line-width in which highlight lines are to be drawn.
     * @return
     */
    getHighlightLineWidth();

    /**
     * Returns the DashPathEffect that is used for highlighting.
     * @return
     */
    getDashPathEffectHighlight();
}
