import { IBubbleDataSet } from '../interfaces/datasets/IBubbleDataSet';
import { BarLineScatterCandleBubbleDataSet } from './BarLineScatterCandleBubbleDataSet';
import { BubbleEntry } from './BubbleEntry';

export class BubbleDataSet extends BarLineScatterCandleBubbleDataSet<BubbleEntry> implements IBubbleDataSet {
    mMaxSize: number;
    normalizeSizeEnabled: boolean;

    highlightCircleWidth = 2.5;

    /**
     * property to access the "high" value of an entry for this set
     *
     */
    sizeProperty: string = 'size';

    constructor(yVals, label, xProperty?, yProperty?, sizeProperty?) {
        super(yVals, label, xProperty, yProperty);
        if (sizeProperty) {
            this.sizeProperty = sizeProperty;
        }
        this.init();
    }

    init() {
        // ! init is called before init of class vars
        this.mMaxSize = -Infinity;
        this.normalizeSizeEnabled = true;
        super.init();
    }
    calcMinMax() {
        super.calcMinMax();
    }
    calcMinMaxForEntry(e: BubbleEntry, index?: number) {
        super.calcMinMaxForEntry(e, index);

        const size = e.size;
        if (size > this.mMaxSize) {
            this.mMaxSize = size;
        }
    }

    public get maxSize() {
        return this.mMaxSize;
    }
}
