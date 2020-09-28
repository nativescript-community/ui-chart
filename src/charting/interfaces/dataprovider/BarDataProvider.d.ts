import { BarLineScatterCandleBubbleDataProvider } from './BarLineScatterCandleBubbleDataProvider';
import { BarData } from '../../data/BarData';

export interface BarDataProvider extends BarLineScatterCandleBubbleDataProvider {
    getBarData(): BarData;
    isDrawBarShadowEnabled(): boolean;
    isDrawValueAboveBarEnabled(): boolean;
    isHighlightFullBarEnabled(): boolean;
}
