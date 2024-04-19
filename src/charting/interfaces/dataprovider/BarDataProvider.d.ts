import { BarLineScatterCandleBubbleDataProvider } from './BarLineScatterCandleBubbleDataProvider';
import { BarData } from '../../data/BarData';

export interface BarDataProvider extends BarLineScatterCandleBubbleDataProvider {
    barData: BarData;
    drawBarShadowEnabled: boolean;
    drawValueAboveBarEnabled: boolean;
    highlightFullBarEnabled: boolean;
}
