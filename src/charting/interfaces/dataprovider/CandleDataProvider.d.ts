import { CandleData } from '../../data/CandleData';
import { BarLineScatterCandleBubbleDataProvider } from './BarLineScatterCandleBubbleDataProvider';

export interface CandleDataProvider extends BarLineScatterCandleBubbleDataProvider {
    candleData: CandleData;
}
