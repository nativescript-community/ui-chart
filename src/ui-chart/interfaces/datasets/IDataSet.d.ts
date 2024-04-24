import { Color, ObservableArray } from '@nativescript/core';
import { Font } from '@nativescript/core/ui/styling/font';
import { DashPathEffect } from '@nativescript-community/ui-canvas';
import { Entry } from '../../data/Entry';
import { Rounding } from '../../data/DataSet';
import { AxisDependency } from '../../components/YAxis';
import { IValueFormatter } from '../../formatter/IValueFormatter';
import { ValueFormatter } from '../../formatter/ValueFormatter';
import { MPPointF } from '../../utils/MPPointF';
import { LegendForm } from '../../components/Legend';

/**
 * Created by Philipp Jahoda on 21/10/15.
 */
export interface IDataSet<T extends Entry> {
    xProperty: string;
    yProperty: string;
    /** ###### ###### DATA RELATED METHODS ###### ###### */

    /**
     * Initializes DataSet chart data.
     */
    init();

    /**
     * returns the minimum y-value this DataSet holds
     */
    readonly yMin: number;

    /**
     * returns the maximum y-value this DataSet holds
     */
    readonly yMax: number;

    /**
     * returns the minimum x-value this DataSet holds
     */
    readonly xMin: number;

    /**
     * returns the maximum x-value this DataSet holds
     */
    readonly xMax: number;

    /**
     * Returns the number of y-values this DataSet represents -> the size of the y-values array
     * -> yvals.length
     */
    readonly entryCount: number;

    /**getEntryYValue
     *
     * Returns the values that belong to DataSet.
     */
    values: T[] | ObservableArray<T>;

    /**
     * Calculates the minimum and maximum x and y values (mXMin, this.mXMax, this.mYMin, this.mYMax).
     */
    calcMinMax();

    getEntryYValue(e: T): number;

    /**
     * Calculates the min and max y-values from the Entry closest to the given fromX to the Entry closest to the given toX value.
     * This is only needed for the autoScaleMinMax feature.
     *
     * @param fromX
     * @param toX
     */
    calcMinMaxYRange(fromX: number, toX: number);

    /**
     * Returns the first Entry object found at the given x-value with binary
     * search.
     * If the no Entry at the specified x-value is found, this method
     * returns the Entry at the closest x-value according to the rounding.
     * INFORMATION: This method does calculations at runtime. Do
     * not over-use in performance critical situations.
     *
     * @param xValue the x-value
     * @param closestToY If there are multiple y-values for the specified x-value,
     * @param rounding determine whether to round up/down/closest
     *                 if there is no Entry matching the provided x-value
     * @return
     *
     *
     */
    getEntryForXValue(xValue: number, closestToY: number, rounding?: Rounding): T;

    /**
     * Returns the first Entry object found at the given x-value with binary
     * search.
     * If the no Entry at the specified x-value is found, this method
     * returns the Entry at the closest x-value according to the rounding.
     * INFORMATION: This method does calculations at runtime. Do
     * not over-use in performance critical situations.
     *
     * @param xValue the x-value
     * @param closestToY If there are multiple y-values for the specified x-value,
     * @param rounding determine whether to round up/down/closest
     *                 if there is no Entry matching the provided x-value
     * @return
     *
     *
     */
    getEntryAndIndexForXValue(xValue: number, closestToY: number, rounding?: Rounding): { entry: T; index: number };

    /**
     * Returns all Entry objects found at the given x-value with binary
     * search. An empty array if no Entry object at that x-value.
     * INFORMATION: This method does calculations at runtime. Do
     * not over-use in performance critical situations.
     *
     * @param xValue
     * @return
     */
    getEntriesForXValue(xValue: number): T[] | ObservableArray<T>;

    /**
     * Returns all Entry objects found at the given x-value with binary
     * search. An empty array if no Entry object at that x-value.
     * INFORMATION: This method does calculations at runtime. Do
     * not over-use in performance critical situations.
     *
     * @param xValue
     * @return
     */
    getEntriesAndIndexesForXValue(xValue: number): { entry: T; index: number }[];

    /**
     * Returns the Entry object found at the given index (NOT xIndex) in the values array.
     *
     * @param index
     * @return
     */
    getEntryForIndex(index: number): T;

    getEntryXValue(e: BaseEntry, entryIndex: number): number;

    /**
     * Returns the first Entry index found at the given x-value with binary
     * search.
     * If the no Entry at the specified x-value is found, this method
     * returns the Entry at the closest x-value according to the rounding.
     * INFORMATION: This method does calculations at runtime. Do
     * not over-use in performance critical situations.
     *
     * @param xValue the x-value
     * @param closestToY If there are multiple y-values for the specified x-value,
     * @param rounding determine whether to round up/down/closest
     *                 if there is no Entry matching the provided x-value
     * @return
     */
    getEntryIndexForXValue(xValue: number, closestToY: number, rounding: Rounding): number;

    /**
     * Returns the position of the provided entry in the DataSets Entry array.
     * Returns -1 if doesn't exist.
     *
     * @param e
     * @return
     */
    getEntryIndex(e: T): number;

    /**
     * This method returns the actual
     * index in the Entry array of the DataSet for a given xIndex. IMPORTANT: This method does
     * calculations at runtime, do not over-use in performance critical
     * situations.
     *
     * @param xIndex
     * @return
     */
    getIndexInEntries(xIndex: number): number;

    /**
     * Adds an Entry to the DataSet dynamically.
     * Entries are added to the end of the list.
     * This will also recalculate the current minimum and maximum
     * values of the DataSet and the value-sum.
     *
     * @param e
     */
    addEntry(e: T): boolean;

    /**
     * Adds an Entry to the DataSet dynamically.
     * Entries are added to their appropriate index in the values array respective to their x-position.
     * This will also recalculate the current minimum and maximum
     * values of the DataSet and the value-sum.
     *
     * @param e
     */
    addEntryOrdered(e: T);

    /**
     * Removes the first Entry (at index 0) of this DataSet from the entries array.
     * Returns true if successful, false if not.
     */
    removeFirst(): boolean;

    /**
     * Removes the last Entry (at index size-1) of this DataSet from the entries array.
     * Returns true if successful, false if not.
     */
    removeLast(): boolean;

    /**
     * Removes an Entry from the DataSets entries array. This will also
     * recalculate the current minimum and maximum values of the DataSet and the
     * value-sum. Returns true if an Entry was removed, false if no Entry could
     * be removed.
     *
     * @param e
     */
    removeEntry(e: T): boolean;

    /**
     * Removes the Entry object closest to the given x-value from the DataSet.
     * Returns true if an Entry was removed, false if no Entry could be removed.
     *
     * @param xValue
     */
    removeEntryByXValue(xValue: number): boolean;

    /**
     * Removes the Entry object at the given index in the values array from the DataSet.
     * Returns true if an Entry was removed, false if no Entry could be removed.
     *
     * @param index
     * @return
     */
    removeEntryAtIndex(index: number): boolean;

    /**
     * Checks if this DataSet contains the specified Entry. Returns true if so,
     * false if not. NOTE: Performance is pretty bad on this one, do not
     * over-use in performance critical situations.
     *
     * @param entry
     * @return
     */
    contains(entry: T): boolean;

    /**
     * Removes all values from this DataSet and does all necessary recalculations.
     */
    clear();

    /** ###### ###### STYLING RELATED (& OTHER) METHODS ###### ###### */

    /**
     * the label string that describes the DataSet.
     */
    label: string;

    /**
     * the axis this DataSet should be plotted against.
     */
    axisDependency: AxisDependency;

    /**
     * returns all the colors that are set for this DataSet
     */
    colors: (string | Color)[];
    color: string | Color;

    /**
     * Returns the color at the given index of the DataSet's color array.
     * Performs a IndexOutOfBounds check by modulus.
     *
     * @param index
     * @return
     */
    getColor(index?: number): string | Color;

    /**
     * If set to true, value highlighting is enabled which means that values can
     * be highlighted programmatically or by touch gesture.
     */
    highlightEnabled: boolean;

    /**
     * Sets the formatter to be used for drawing the values inside the chart. If
     * no formatter is set, the chart will automatically determine a reasonable
     * formatting (concerning decimals) for all the values that are drawn inside
     * the chart. Use chart.defaultValueFormatter to use the formatter
     * calculated by the chart.
     */
    valueFormatter: IValueFormatter;

    /**
     * Returns true if the valueFormatter object of this DataSet is null.
     */
    readonly needsFormatter: boolean;

    /**
     * Sets the color the value-labels of this DataSet should have.
     *
     * @param color
     */
    valueTextColor: Color | string;

    /**
     * Sets a list of colors to be used as the colors for the drawn values.
     */
    valueTextColors: (Color | string)[];

    /**
     * Sets a Typeface for the value-labels of this DataSet.
     */
    valueTypeface: Font;

    /**
     * Sets the text-size of the value-labels of this DataSet in dp.
     */
    valueTextSize: number;

    /**
     * The form to draw for this dataset in the legend.
     * <p/>
     * Return `DEFAULT` to use the default legend form.
     */
    form: LegendForm;

    /**
     * The form size to draw for this dataset in the legend.
     * <p/>
     * Return `Float.NaN` to use the default legend form size.
     */
    formSize: number;

    /**
     * The line width for drawing the form of this dataset in the legend
     * <p/>
     * Return `Float.NaN` to use the default legend form line width.
     */
    formLineWidth: number;

    /**
     * The line dash path effect used for shapes that consist of lines.
     * <p/>
     * Return `null` to use the default legend form line dash effect.
     */
    formLineDashEffect: DashPathEffect;

    /**
     * set this to true to draw y-values on the chart.
     *
     * NOTE (for bar and line charts): if `maxVisibleValueCount` is reached, no values will be drawn even
     * if this is enabled
     * @param enabled
     */
    drawValuesEnabled: boolean;

    /**
     * Set this to true to draw y-icons on the chart.
     *
     * NOTE (for bar and line charts): if `maxVisibleValueCount` is reached, no icons will be drawn even
     * if this is enabled
     */

    drawIconsEnabled: boolean;

    /**
     * Offset of icons drawn on the chart.
     *
     * For all charts except Pie and Radar it will be ordinary (x offset,y offset).
     *
     * For Pie and Radar chart it will be (y offset, distance from center offset); so if you want icon to be rendered under value, you should increase X component of CGPoint, and if you want icon to be rendered closet to center, you should decrease height component of CGPoint.
     */
    iconsOffset: MPPointF;

    /**
     * Set the visibility of this DataSet. If not visible, the DataSet will not
     * be drawn to the chart upon refreshing it.
     */
    visible: boolean;

    /**
     * Returns the shader used for filling the area below the line.
     */
    fillShader: any;
}
