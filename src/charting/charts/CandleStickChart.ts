import { CandleData } from '../data/CandleData';
import { CandleEntry } from '../data/CandleEntry';
import { CandleDataProvider } from '../interfaces/dataprovider/CandleDataProvider';
import { ICandleDataSet } from '../interfaces/datasets/ICandleDataSet';
import { BarLineChartBase } from './BarLineChartBase';

/**
 * Financial chart type that draws candle-sticks (OHCL chart).
 *
 * @author Philipp Jahoda
 */
export class CandleStickChart extends BarLineChartBase<CandleEntry, ICandleDataSet, CandleData> implements CandleDataProvider {
    protected init() {
        super.init();

        this.mRenderer = new CandleStickChartRenderer(this, this.mAnimator, this.mViewPortHandler);

        this.getXAxis().setSpaceMin(0.5);
        this.getXAxis().setSpaceMax(0.5);
    }

    public getCandleData() {
        return this.mData;
    }
}
