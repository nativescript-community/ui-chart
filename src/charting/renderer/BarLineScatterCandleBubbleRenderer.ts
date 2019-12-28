import { DataRenderer } from './DataRenderer';
import { BarLineScatterCandleBubbleDataProvider } from '../interfaces/dataprovider/BarLineScatterCandleBubbleDataProvider';
import { IBarLineScatterCandleBubbleDataSet } from '../interfaces/datasets/IBarLineScatterCandleBubbleDataSet';
import { Rounding } from '../data/DataSet';
import { ChartAnimator } from '../animation/ChartAnimator';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { Entry } from '../data/Entry';

/**
 * Class representing the bounds of the current viewport in terms of indices in the values array of a DataSet.
 */
export class XBounds {
    /**
     * minimum visible entry index
     */
    public min;

    /**
     * maximum visible entry index
     */
    public max;

    /**
     * range of visible entry indices
     */
    public range;

    /**
     * Calculates the minimum and maximum x values as well as the range between them.
     *
     * @param chart
     * @param dataSet
     */
    public set(chart: BarLineScatterCandleBubbleDataProvider, dataSet: IBarLineScatterCandleBubbleDataSet<any>, animator: ChartAnimator) {
        let phaseX = Math.max(0, Math.min(1, animator.getPhaseX()));

        let low = chart.getLowestVisibleX();
        let high = chart.getHighestVisibleX();

        let entryFrom = dataSet.getEntryForXValue(low, NaN, Rounding.DOWN);
        let entryTo = dataSet.getEntryForXValue(high, NaN, Rounding.UP);
        this.min = entryFrom == null ? 0 : dataSet.getEntryIndex(entryFrom);
        this.max = entryTo == null ? 0 : dataSet.getEntryIndex(entryTo);
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
        return set.isVisible() && (set.isDrawValuesEnabled() || set.isDrawIconsEnabled());
    }

    /**
     * Checks if the provided entry object is in bounds for drawing considering the current animation phase.
     *
     * @param e
     * @param set
     * @return
     */
    protected isInBoundsX(e: Entry, set: IBarLineScatterCandleBubbleDataSet<any>) {
        if (e == null) return false;

        let entryIndex = set.getEntryIndex(e);

        if (e == null || entryIndex >= set.getEntryCount() * this.mAnimator.getPhaseX()) {
            return false;
        } else {
            return true;
        }
    }
}
