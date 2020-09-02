import { Entry } from './Entry';

/**
 * @author Philipp Jahoda
 */
export interface BarEntry extends Entry {
	isStacked?: boolean;
	yVals?: number[];
	positiveSum?: number;
	negativeSum?: number;
	ranges?: [number, number][];
}
