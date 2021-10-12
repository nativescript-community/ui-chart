import { Canvas, Paint, Path } from '@nativescript-community/ui-canvas';
import { Entry } from '../data/Entry';
import { LineData } from '../data/LineData';
import { LineDataSet } from '../data/LineDataSet';
import { Highlight } from '../highlight/Highlight';
import { LineDataProvider } from '../interfaces/dataprovider/LineDataProvider';
import { BaseCustomRenderer } from '../renderer/DataRenderer';
import { LineChartRenderer } from '../renderer/LineChartRenderer';
import { BarLineChartBase } from './BarLineChartBase';

export interface CustomRenderer extends BaseCustomRenderer {
    drawLine?: (c: Canvas, line: Path, paint: Paint) => void;
    drawHighlight?: (c: Canvas, e: Highlight, set: LineDataSet, paint: Paint) => void;
}

export class LineChart extends BarLineChartBase<Entry, LineDataSet, LineData> implements LineDataProvider {
    mRenderer: LineChartRenderer;
    protected init() {
        super.init();

        this.mRenderer = new LineChartRenderer(this, this.mAnimator, this.mViewPortHandler);
    }

    public getLineData() {
        return this.mData;
    }

    _onDetachedFromWindow() {
        // releases the bitmap in the renderer to avoid oom error
        if (this.mRenderer != null && this.mRenderer instanceof LineChartRenderer) {
            this.mRenderer.releaseBitmap();
        }
        // super._onDetachedFromWindow();
    }

    mCustomRenderer: CustomRenderer;
    /**
     * set a custom line renderer
     */
    public setCustomRenderer(renderer: CustomRenderer) {
        this.mCustomRenderer = renderer;
    }
    /**
     * get the custom line renderer
     */
    public getCustomRenderer() {
        return this.mCustomRenderer;
    }
}
