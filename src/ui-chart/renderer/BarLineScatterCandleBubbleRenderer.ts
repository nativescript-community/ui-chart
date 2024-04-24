import { ChartAnimator } from '../animation/ChartAnimator';
import { BarLineScatterCandleBubbleDataSet } from '../data/BarLineScatterCandleBubbleDataSet';
import { Rounding } from '../data/DataSet';
import { Entry } from '../data/Entry';
import { BarLineScatterCandleBubbleDataProvider } from '../interfaces/dataprovider/BarLineScatterCandleBubbleDataProvider';
import { IBarLineScatterCandleBubbleDataSet } from '../interfaces/datasets/IBarLineScatterCandleBubbleDataSet';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { DataRenderer } from './DataRenderer';

/**
 * Class representing the bounds of the current viewport in terms of indices in the values array of a DataSet.
 */
export class XBounds {
    /**
     * minimum visible entry index
     */
    public min: number;

    /**
     * maximum visible entry index
     */
    public max: number;

    /**
     * range of visible entry indices
     */
    public range: number;

    /**
     * Calculates the minimum and maximum x values as well as the range between them.
     *
     * @param chart
     * @param dataSet
     */
    public set<T extends Entry>(chart: BarLineScatterCandleBubbleDataProvider, dataSet: BarLineScatterCandleBubbleDataSet<T>, animator: ChartAnimator) {
        const phaseX = Math.max(0, Math.min(1, animator.phaseX));
        const low = chart.lowestVisibleX;
        const high = chart.highestVisibleX;

        const entryFrom = dataSet.getEntryForXValue(low, NaN, Rounding.DOWN);
        const entryTo = dataSet.getEntryForXValue(high, NaN, Rounding.UP);
        this.min = entryFrom ? dataSet.getEntryIndex(entryFrom) : 0;
        this.max = entryTo ? dataSet.getEntryIndex(entryTo) : 0;

        this.range = (this.max - this.min) * phaseX;
    }
}
/**
 * Created by Philipp Jahoda on 09/06/16.
 */
export abstract class BarLineScatterCandleBubbleRenderer extends DataRenderer {
    /**
     * buffer for storing the current minimum and maximum visible x
     */
    protected mXBounds = new XBounds();

    constructor(animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
    }

    /**
     * Returns true if the DataSet values should be drawn, false if not.
     *
     * @param set
     * @return
     */
    protected shouldDrawValues(set: IDataSet<any>) {
        return set.visible && (set.drawValuesEnabled || set.drawIconsEnabled);
    }

    /**
     * Checks if the provided entry object is in bounds for drawing considering the current animation phase.
     *
     * @param e
     * @param set
     * @return
     */
    protected isInBoundsX(e: Entry, set: IBarLineScatterCandleBubbleDataSet<any>) {
        if (!e) return false;

        const entryIndex = set.getEntryIndex(e);

        if (!e || entryIndex >= set.entryCount * this.animator.phaseY) {
            return false;
        } else {
            return true;
        }
    }
}
