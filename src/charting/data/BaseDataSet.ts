import { Entry } from './Entry';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { LegendForm } from '../components/Legend';
import { AxisDependency } from '../components/YAxis';
import { ValueFormatter } from '../formatter/ValueFormatter';
import { GradientColor } from '../model/GradientColor';
import { Color } from '@nativescript/core/color';
import { Utils } from '../utils/Utils';
import { Rounding } from './DataSet';

/**
 * Created by Philipp Jahoda on 21/10/15.
 * This is the base dataset of all DataSets. It's purpose is to implement critical methods
 * provided by the IDataSet interface.
 */
export abstract class BaseDataSet<T extends Entry> implements IDataSet<T> {
    abstract getYMin(): number;
    abstract getYMax(): number;
    abstract getXMin(): number;
    abstract getXMax(): number;
    abstract calcMinMaxYRange(fromX: number, toX: number);
    abstract getEntriesForXValue(xValue: number): T[];
    abstract getEntriesAndIndexesForXValue(xValue: number): { entry: T; index: number }[];
    abstract getEntryIndexForXValue(xValue: number, closestToY: number, rounding?: Rounding): number;
    abstract getEntryIndex(e: T): number;
    abstract addEntry(e: T): boolean;
    abstract addEntryOrdered(e: T);
    abstract clear();
    abstract getEntryCount(): number;
    abstract getEntryForIndex(index: number): T;
    abstract getEntryForXValue(xValue: number, closestToY: number, rounding?: Rounding): T;
    abstract getEntryAndIndexForXValue(xValue: number, closestToY: number, rounding?: Rounding): { entry: T; index: number };
    abstract calcMinMax();

    /**
     * property to access the "x" value of an entry for this set
     *
     */
    xProperty: string = 'x';
    /**
     * property to access the "y" value of an entry for this set
     *
     */
    yProperty: string = 'y';

    /**
     * List representing all colors that are used for this DataSet
     */
    protected mColors: (string | Color)[] = null;

    private mColorDefault = '#8CEAFF';

    protected mGradientColor = null;

    protected mGradientColors: GradientColor[] = null;

    /**
     * List representing all colors that are used for drawing the actual values for this DataSet
     */
    protected mValueColors: (string | Color)[] = null;

    /**
     * label that describes the DataSet or the data the DataSet represents
     */
    private mLabel = 'DataSet';

    /**
     * this specifies which axis this DataSet should be plotted against
     */
    protected mAxisDependency = AxisDependency.LEFT;

    /**
     * if true, value highlightning is enabled
     */
    protected mHighlightEnabled = true;

    /**
     * custom formatter that is used instead of the auto-formatter if set
     */
    protected mValueFormatter: ValueFormatter;

    /**
     * the typeface used for the value text
     */
    protected mValueTypeface;

    private mForm = LegendForm.DEFAULT;
    private mFormSize = NaN;
    private mFormLineWidth = NaN;
    private mFormLineDashEffect = null;

    /**
     * if true, y-values are drawn on the chart
     */
    protected mDrawValues = false;

    /**
     * the offset for drawing values (in dp)
     */
    protected mValuesOffset = { x: 0, y: 0 };

    /**
     * if true, y-icons are drawn on the chart
     */
    protected mDrawIcons = false;

    /**
     * the offset for drawing icons (in dp)
     */
    protected mIconsOffset = { x: 0, y: 0 };

    /**
     * the size of the value-text labels
     */
    protected mValueTextSize = 13;

    /**
     * flag that indicates if the DataSet is visible or not
     */
    protected mVisible = true;

    /**
     * Constructor with label.
     *
     * @param label
     */
    constructor(label, xProperty?, yProperty?) {
        this.mColors = [];
        this.mValueColors = [];
        this.xProperty = xProperty;
        if (yProperty) {
            this.yProperty = yProperty;
        }

        this.mValueColors.push('black');
        this.mLabel = label;
    }

    /**
     * Use this method to tell the data set that the underlying data has changed.
     */
    public notifyDataSetChanged() {
        this.calcMinMax();
    }

    /**
     * ###### ###### COLOR GETTING RELATED METHODS ##### ######
     */

    public getColors(): (string | Color)[] {
        if (this.mColors.length === 0) {
            return [this.mColorDefault];
        }
        return this.mColors;
    }

    public getValueColors() {
        return this.mValueColors;
    }

    public getColor(index = 0) {
        if (this.mColors.length === 0) {
            return this.mColorDefault;
        }
        return this.mColors[Math.floor(index) % this.mColors.length];
    }

    public getGradientColors() {
        return this.mGradientColors;
    }

    public getGradientColor(index?: number) {
        if (!this.mGradientColors || index === undefined) {
            return this.mGradientColor;
        }
        return this.mGradientColors[index % this.mGradientColors.length];
    }

    // /**
    //  * Sets the colors that should be used fore this DataSet. Colors are reused
    //  * as soon as the number of Entries the DataSet represents is higher than
    //  * the size of the colors array. If you are using colors from the resources,
    //  * make sure that the colors are already prepared (by calling
    //  * getResources().getColor(...)) before adding them to the DataSet.
    //  *
    //  * @param colors
    //  */
    // public  setColors(...colors :number[]) {
    //     this.mColors = ColorTemplate.createColors(colors);
    // }

    /**
     * Adds a new color to the colors array of the DataSet.
     *
     * @param color
     */
    public addColor(value: string | Color) {
        if (this.mColors == null) this.mColors = [];
        this.mColors.push(value);
    }

    /**
     * Sets the start and end color for gradient color, ONLY color that should be used for this DataSet.
     *
     * @param startColor
     * @param endColor
     */
    public setGradientColor(startColor, endColor) {
        this.mGradientColor = new GradientColor(startColor, endColor);
    }

    /**
     * Sets the start and end color for gradient colors, ONLY color that should be used for this DataSet.
     *
     * @param gradientColors
     */
    public setGradientColors(gradientColors: GradientColor[]) {
        this.mGradientColors = gradientColors;
    }

    /**
     * Sets a color with a specific alpha value.
     *
     * @param color
     * @param alpha from 0-255
     */
    public setColor(color: string | Color, alpha?: number) {
        this.resetColors();
        if (alpha !== undefined) {
            const actColor = color instanceof Color ? color : new Color(color);
            color = new Color(actColor.r, actColor.g, actColor.b, alpha);
        }
        this.mColors.push(color);
    }

    /**
     * Sets colors with a specific alpha value.
     *
     * @param colors
     * @param alpha
     */
    public setColors(colors, alpha?: number) {
        // this.resetColors();
        if (alpha === undefined) {
            this.mColors = colors;
        } else {
            this.mColors = colors.map((c) => new Color(c.r, c.g, c.b, alpha));
        }
    }

    /**
     * Resets all colors of this DataSet and recreates the colors array.
     */
    public resetColors() {
        this.mColors = [];
    }

    /**
     * ###### ###### OTHER STYLING RELATED METHODS ##### ######
     */

    public setLabel(label) {
        this.mLabel = label;
    }

    public getLabel() {
        return this.mLabel;
    }

    public setHighlightEnabled(enabled) {
        this.mHighlightEnabled = enabled;
    }

    public isHighlightEnabled() {
        return this.mHighlightEnabled;
    }

    public setValueFormatter(f: ValueFormatter) {
        if (f == null) return;
        else this.mValueFormatter = f;
    }

    public getValueFormatter() {
        if (this.needsFormatter()) return Utils.getDefaultValueFormatter();
        return this.mValueFormatter;
    }

    public needsFormatter() {
        return this.mValueFormatter == null;
    }

    public setValueTextColor(color) {
        this.mValueColors = [];
        this.mValueColors.push(color);
    }

    public setValueTextColors(colors) {
        this.mValueColors = colors;
    }

    public setValueTypeface(tf) {
        this.mValueTypeface = tf;
    }

    public setValueTextSize(size) {
        this.mValueTextSize = size;
    }

    public getValueTextColor(index = 0) {
        return this.mValueColors[index % this.mValueColors.length];
    }

    public getValueTypeface() {
        return this.mValueTypeface;
    }

    public getValueTextSize() {
        return this.mValueTextSize;
    }

    public setForm(form) {
        this.mForm = form;
    }

    public getForm() {
        return this.mForm;
    }

    public setFormSize(formSize) {
        this.mFormSize = formSize;
    }

    public getFormSize() {
        return this.mFormSize;
    }

    public setFormLineWidth(formLineWidth) {
        this.mFormLineWidth = formLineWidth;
    }

    public getFormLineWidth() {
        return this.mFormLineWidth;
    }

    public setFormLineDashEffect(dashPathEffect) {
        this.mFormLineDashEffect = dashPathEffect;
    }

    public getFormLineDashEffect() {
        return this.mFormLineDashEffect;
    }

    public setDrawValues(enabled) {
        this.mDrawValues = enabled;
    }

    public isDrawValuesEnabled() {
        return this.mDrawValues;
    }

    public getValuesOffset() {
        return this.mValuesOffset;
    }
    public setValuesOffset(offsetDp) {
        this.mValuesOffset.x = offsetDp.x;
        this.mValuesOffset.y = offsetDp.y;
    }

    public setDrawIcons(enabled) {
        this.mDrawIcons = enabled;
    }

    public isDrawIconsEnabled() {
        return this.mDrawIcons;
    }

    public setIconsOffset(offsetDp) {
        this.mIconsOffset.x = offsetDp.x;
        this.mIconsOffset.y = offsetDp.y;
    }

    public getIconsOffset() {
        return this.mIconsOffset;
    }

    public setVisible(visible) {
        this.mVisible = visible;
    }

    public isVisible() {
        return this.mVisible;
    }

    public getAxisDependency() {
        return this.mAxisDependency;
    }

    public setAxisDependency(dependency) {
        this.mAxisDependency = dependency;
    }

    /**
     * ###### ###### DATA RELATED METHODS ###### ######
     */

    public getIndexInEntries(xIndex) {
        for (let i = 0; i < this.getEntryCount(); i++) {
            if (xIndex === this.getEntryForIndex(i).x) return i;
        }

        return -1;
    }

    public removeFirst() {
        if (this.getEntryCount() > 0) {
            const entry = this.getEntryForIndex(0);
            return this.removeEntry(entry);
        } else return false;
    }

    public removeLast() {
        if (this.getEntryCount() > 0) {
            const e = this.getEntryForIndex(this.getEntryCount() - 1);
            return this.removeEntry(e);
        } else return false;
    }

    public removeEntryByXValue(xValue) {
        const e = this.getEntryForXValue(xValue, NaN);
        return this.removeEntry(e);
    }

    public removeEntryAtIndex(index) {
        const e = this.getEntryForIndex(index);
        return this.removeEntry(e);
    }
    abstract removeEntry(e: T);

    public contains(e: T) {
        for (let i = 0; i < this.getEntryCount(); i++) {
            if (e === this.getEntryForIndex(i)) return true;
        }

        return false;
    }
}
