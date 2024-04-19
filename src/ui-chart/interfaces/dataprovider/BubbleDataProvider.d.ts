import { BubbleData } from '../../data/BubbleData';
import { BarLineScatterCandleBubbleDataProvider } from './BarLineScatterCandleBubbleDataProvider';

export interface BubbleDataProvider extends BarLineScatterCandleBubbleDataProvider {
    bubbleData: BubbleData;
}
