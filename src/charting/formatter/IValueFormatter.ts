import { Entry } from '../data/Entry';

/**
 * Interface to format all values before they are drawn as labels.
 *
 * @author Philipp Jahoda
 *  Extend {@link ValueFormatter} instead
 */
export interface IValueFormatter {
    /**
   * Called when a value (from labels inside the chart) is formatted
   * before being drawn. For performance reasons, avoid excessive calculations
   * and memory allocations inside this method.
   *
   * @param value           the value to be formatted
   * @param entry           the entry the value belongs to - in e.g. BarChart, this is of class BarEntry
   * @param index    index of the drawn value
   * @param count    total number of values drawn (useful to draw first or last)
   * @param dataSetIndex    the index of the DataSet the entry in focus belongs to
   * @param viewPortHandler provides information about the current chart state (scale, translation, ...)
   * @return the formatted label ready for being drawn
   *
   * @deprecated Extend {@link ValueFormatter} and override an appropriate method
   */
    getFormattedValue(
        value: number,
        entry: Entry,
        index,
        count,
        dataSetIndex,
        viewPortHandler
    ): string;
}
