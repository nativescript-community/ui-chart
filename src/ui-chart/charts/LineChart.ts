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
    renderer: LineChartRenderer;
    protected init() {
        super.init();

        this.renderer = new LineChartRenderer(this, this.animator, this.viewPortHandler);
    }

    public get lineData() {
        return this.mData;
    }

    _onDetachedFromWindow() {
        // releases the bitmap in the renderer to avoid oom error
        if (this.renderer instanceof LineChartRenderer) {
            this.renderer.releaseBitmap();
        }
        // super._onDetachedFromWindow();
    }

    customRenderer: CustomRenderer;
}
