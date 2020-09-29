import { CombinedData } from '../../data/CombinedData';
import { BubbleDataProvider } from './BubbleDataProvider';
import { CandleDataProvider } from './CandleDataProvider';
import { LineDataProvider } from './LineDataProvider';
import { ScatterDataProvider } from './ScatterDataProvider';
import { BarDataProvider } from './BarDataProvider';

/**
 * Created by philipp on 11/06/16.
 */
export interface CombinedDataProvider extends LineDataProvider, BarDataProvider, BubbleDataProvider, CandleDataProvider, ScatterDataProvider {
    getCombinedData(): CombinedData;
}
