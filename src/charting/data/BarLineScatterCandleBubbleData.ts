import { ChartData } from './ChartData';
import { Entry } from './Entry';
import { IBarLineScatterCandleBubbleDataSet } from '../interfaces/datasets/IBarLineScatterCandleBubbleDataSet';

/**
 * Baseclass for all Line, Bar, Scatter, Candle and Bubble data.
 *

 */
export abstract class BarLineScatterCandleBubbleData<U extends Entry, T extends IBarLineScatterCandleBubbleDataSet<U>> extends ChartData<U, T> {}
