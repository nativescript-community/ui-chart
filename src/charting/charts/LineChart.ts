import { BarLineChartBase } from './BarLineChartBase';
import { LineData } from '../data/LineData';
import { LineDataProvider } from '../interfaces/dataprovider/LineDataProvider';
import { Entry } from '../data/Entry';
import { LineDataSet } from '../data/LineDataSet';
import { LineChartRenderer } from '../renderer/LineChartRenderer';

export class LineChart extends BarLineChartBase<Entry, LineDataSet, LineData> implements LineDataProvider {
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
}
