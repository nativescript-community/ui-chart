import { IAxisValueFormatter } from './IAxisValueFormatter';
import { IValueFormatter } from './IValueFormatter';
import { AxisBase } from '../components/AxisBase';
import { BarDataSet } from '../data/BarDataSet';
import { BarEntry } from '../data/BarEntry';
import { Entry } from '../data/Entry';
import { PieEntry } from '../data/PieEntry';
import { RadarEntry } from '../data/RadarEntry';
import { BubbleEntry } from '../data/BubbleEntry';
import { CandleEntry } from '../data/CandleEntry';
import { BaseEntry } from '../data/BaseEntry';

/**
 * Class to format all values before they are drawn as labels.
 */
export abstract class ValueFormatter implements IAxisValueFormatter, IValueFormatter {
    /**
     * Called when drawing any label, used to change numbers into formatted strings.
     *
     * @param value float to be formatted
     * @return formatted string label
     */
    public getFormattedValue(value: number, entry?: BaseEntry) {
        return value + '';
    }

    /**
     * Used to draw axis labels, calls {@link #getFormattedValue} by default.
     *
     * @param value float to be formatted
     * @param axis  axis being labeled
     * @return formatted string label
     */
    public getAxisLabel(value: number, axis: AxisBase) {
        return this.getFormattedValue(value);
    }

    /**
     * Used to draw bar labels, calls {@link #getFormattedValue} by default.
     *
     * @param value current value to be formatted
     * @return formatted string label
     */
    public getBarLabel(value, entry: BarEntry) {
        return this.getFormattedValue(value, entry);
    }

    /**
     * Used to draw stacked bar labels, calls {@link #getFormattedValue} by default.
     *
     * @param value        current value to be formatted
     * @param entry stacked entry being labeled, contains all Y values
     * @return formatted string label
     */
    public getBarStackedLabel(value, entry: BarEntry) {
        return this.getFormattedValue(value, entry);
    }

    /**
     * Used to draw line and scatter labels, calls {@link #getFormattedValue} by default.
     *
     * @param entry point being labeled, contains X value
     * @return formatted string label
     */
    public getPointLabel(value, entry: Entry) {
        return this.getFormattedValue(value, entry);
    }

    /**
     * Used to draw pie value labels, calls {@link #getFormattedValue} by default.
     *
     * @param value    float to be formatted, may have been converted to percentage
     * @param entry slice being labeled, contains original, non-percentage Y value
     * @return formatted string label
     */
    public getPieLabel(value, entry: PieEntry) {
        return this.getFormattedValue(value, entry);
    }

    /**
     * Used to draw radar value labels, calls {@link #getFormattedValue} by default.
     *
     * @param entry entry being labeled
     * @return formatted string label
     */
    public getRadarLabel(value, entry: RadarEntry) {
        return this.getFormattedValue(value, entry);
    }

    /**
     * Used to draw bubble size labels, calls {@link #getFormattedValue} by default.
     *
     * @param entry bubble being labeled, also contains X and Y values
     * @return formatted string label
     */
    public getBubbleLabel(value, entry: BubbleEntry) {
        return this.getFormattedValue(value, entry);
    }

    /**
     * Used to draw high labels, calls {@link #getFormattedValue} by default.
     *
     * @param entry candlestick being labeled
     * @return formatted string label
     */
    public getCandleLabel(value, entry: CandleEntry) {
        return this.getFormattedValue(value, entry);
    }
}
