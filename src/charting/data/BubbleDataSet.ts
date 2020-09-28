import { IBubbleDataSet } from '../interfaces/datasets/IBubbleDataSet';
import { BarLineScatterCandleBubbleDataSet } from './BarLineScatterCandleBubbleDataSet';
import { BubbleEntry } from './BubbleEntry';

export class BubbleDataSet extends BarLineScatterCandleBubbleDataSet<BubbleEntry> implements IBubbleDataSet {
    mMaxSize: number;
    mNormalizeSize = true;

    mHighlightCircleWidth = 2.5;

    public setHighlightCircleWidth(width: number) {
        this.mHighlightCircleWidth = width;
    }

    public getHighlightCircleWidth() {
        return this.mHighlightCircleWidth;
    }

    calcMinMaxForEntry(e: BubbleEntry, index?: number) {
        super.calcMinMaxForEntry(e, index);

        const size = e.size;

        if (size > this.mMaxSize) {
            this.mMaxSize = size;
        }
    }

    public getMaxSize() {
        return this.mMaxSize;
    }

    public isNormalizeSizeEnabled() {
        return this.mNormalizeSize;
    }

    public setNormalizeSizeEnabled(normalizeSize) {
        this.mNormalizeSize = normalizeSize;
    }
}
