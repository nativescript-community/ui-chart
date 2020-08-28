import { IAxisValueFormatter } from './IAxisValueFormatter';
import { IValueFormatter } from './IValueFormatter';
import { BarEntry } from '../data/BarEntry';
import { Entry } from '../data/Entry';
import { AxisBase } from '../components/AxisBase';

/**
 * Class to format all values before they are drawn as labels.
 */
export abstract class ValueFormatter implements IAxisValueFormatter, IValueFormatter{

    // /**
    //  * <b>DO NOT USE</b>, only for backwards compatibility and will be removed in future versions.
    //  *
    //  * @param value the value to be formatted
    //  * @param axis  the axis the value belongs to
    //  * @return formatted string label
    //  */
    // public  getFormattedValue( value,  axis):string {
    //     return this.getFormattedValue(value);
    // }

    // /**
    //  * <b>DO NOT USE</b>, only for backwards compatibility and will be removed in future versions.
    //  * @param value           the value to be formatted
    //  * @param entry           the entry the value belongs to - in e.g. BarChart, this is of class BarEntry
    //  * @param dataSetIndex    the index of the DataSet the entry in focus belongs to
    //  * @param viewPortHandler provides information about the current chart state (scale, translation, ...)
    //  * @return formatted string label
    //  */
    //
    //
    // public String getFormattedValue(value, Entry entry, int dataSetIndex, viewPortHandler: ViewPortHandler) {
    //     return getFormattedValue(value);
    // }

    /**
     * Called when drawing any label, used to change numbers into formatted strings.
     *
     * @param value float to be formatted
     * @return formatted string label
     */
    public  getFormattedValue( value: number) {
        return value +'';
    }

    /**
     * Used to draw axis labels, calls {@link #getFormattedValue} by default.
     *
     * @param value float to be formatted
     * @param axis  axis being labeled
     * @return formatted string label
     */
    public  getAxisLabel( value: number,  axis: AxisBase) {
        return this.getFormattedValue(value);
    }

    /**
     * Used to draw bar labels, calls {@link #getFormattedValue} by default.
     *
     * @param barEntry bar being labeled
     * @return formatted string label
     */
    public getBarLabel( barEntry: BarEntry) {
        return this.getFormattedValue(barEntry.getY());
    }

    /**
     * Used to draw stacked bar labels, calls {@link #getFormattedValue} by default.
     *
     * @param value        current value to be formatted
     * @param stackedEntry stacked entry being labeled, contains all Y values
     * @return formatted string label
     */
    public getBarStackedLabel( value,  stackedEntry: BarEntry) {
        return this.getFormattedValue(value);
    }

    /**
     * Used to draw line and scatter labels, calls {@link #getFormattedValue} by default.
     *
     * @param entry point being labeled, contains X value
     * @return formatted string label
     */
    // public  getPointLabel( entry: Entry) {
    //     return this.getFormattedValue(entry.getY());
    // }

    /**
     * Used to draw pie value labels, calls {@link #getFormattedValue} by default.
     *
     * @param value    float to be formatted, may have been converted to percentage
     * @param pieEntry slice being labeled, contains original, non-percentage Y value
     * @return formatted string label
     */
    // public  getPieLabel( value,  pieEntry: PieEntry) {
    //     return this.getFormattedValue(value);
    // }

    /**
     * Used to draw radar value labels, calls {@link #getFormattedValue} by default.
     *
     * @param radarEntry entry being labeled
     * @return formatted string label
     */
    // public  getRadarLabel( radarEntry: RadarEntry) {
    //     return this.getFormattedValue(radarEntry.getY());
    // }

    /**
     * Used to draw bubble size labels, calls {@link #getFormattedValue} by default.
     *
     * @param bubbleEntry bubble being labeled, also contains X and Y values
     * @return formatted string label
     */
    // public  getBubbleLabel( bubbleEntry: BubbleEntry) {
    //     return this.getFormattedValue(bubbleEntry.getSize());
    // }

    /**
     * Used to draw high labels, calls {@link #getFormattedValue} by default.
     *
     * @param candleEntry candlestick being labeled
     * @return formatted string label
     */
    // public  getCandleLabel( candleEntry: CandleEntry) {
    //     return this.getFormattedValue(candleEntry.getHigh());
    // }

}
