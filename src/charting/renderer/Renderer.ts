import { ViewPortHandler } from '../utils/ViewPortHandler';
/**
 * Abstract baseclass of all Renderers.
 *

 */
export abstract class Renderer {
    /**
     * the component that handles the drawing area of the chart and it's offsets
     */
    protected mViewPortHandler: ViewPortHandler;

    constructor(viewPortHandler: ViewPortHandler) {
        this.mViewPortHandler = viewPortHandler;
    }
}
