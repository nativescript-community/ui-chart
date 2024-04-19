import { ScatterData } from '../../data/ScatterData';
import { BarLineScatterCandleBubbleDataProvider } from './BarLineScatterCandleBubbleDataProvider';

export interface ScatterDataProvider extends BarLineScatterCandleBubbleDataProvider {
    scatterData: ScatterData;
}
