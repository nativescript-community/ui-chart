import { Entry } from './Entry';

/**

 */
export interface BarEntry extends Entry {
    isStacked?: boolean;
    yVals?: number[];
    positiveSum?: number;
    negativeSum?: number;
    ranges?: [number, number][];
}
