import { AxisBase } from '../components/AxisBase';

/**
 * Created by Philipp Jahoda on 20/09/15.
 * Custom formatter interface that allows formatting of
 * axis labels before they are being drawn.
 *
 *  Extend {@link ValueFormatter} instead
 */
export interface IAxisValueFormatter {
    /**
     * Called when a value from an axis is to be formatted
     * before being drawn. For performance reasons, avoid excessive calculations
     * and memory allocations inside this method.
     *
     * @param value the value to be formatted
     * @param axis  the axis the value belongs to
     * @param viewPortHandler  the viewPortHandler
     * @return
     *
     *  Extend {@link ValueFormatter} and use {@link ValueFormatter#getAxisLabel(float, AxisBase)}
     */
    getAxisLabel(value, axis: AxisBase): string;
}
