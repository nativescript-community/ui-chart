import { Highlight } from './Highlight';

/**
 * Created by philipp on 10/06/16.
 */
export interface IHighlighter {
    /**
     * Returns a Highlight object corresponding to the given x- and y- touch positions in pixels.
     *
     * @param x
     * @param y
     * @return
     */
    getHighlight(x, y): Highlight;
    getHighlightsAtXValue(xVal, x?, y?): Highlight[];
}
