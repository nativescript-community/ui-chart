import { Font, ObservableArray } from '@nativescript/core';
import { Entry } from './Entry';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { LegendForm } from '../components/Legend';
import { AxisDependency } from '../components/YAxis';
import { ValueFormatter } from '../formatter/ValueFormatter';
import { Color } from '@nativescript/core/color';
import { Utils } from '../utils/Utils';
import { Rounding } from './DataSet';

/**
 * Created by Philipp Jahoda on 21/10/15.
 * This is the base dataset of all DataSets. It's purpose is to implement critical methods
 * provided by the IDataSet interface.
 */
export abstract class BaseDataSet<T extends Entry> implements IDataSet<T> {
    abstract init();
    abstract readonly yMin: number;
    abstract readonly yMax: number;
    abstract readonly xMin: number;
    abstract readonly xMax: number;
    abstract calcMinMaxYRange(fromX: number, toX: number);
    abstract getEntriesForXValue(xValue: number): T[] | ObservableArray<T>;
    abstract getEntriesAndIndexesForXValue(xValue: number): { entry: T; index: number }[];
    abstract getEntryIndexForXValue(xValue: number, closestToY: number, rounding?: Rounding): number;
    abstract getEntryYValue(e: T): number;
    abstract getEntryIndex(e: T): number;
    abstract addEntry(e: T): boolean;
    abstract addEntryOrdered(e: T);
    abstract clear();
    abstract readonly entryCount: number;
    abstract values: T[] | ObservableArray<T>;
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
     * property to access the "icon" value of an entry for this set
     *
     */
    iconProperty: string = 'icon';

    /**
     * List representing all colors that are used for this DataSet
     */
    colors: (string | Color)[] = null;
    color: string | Color = '#8CEAFF';

    /**
     * List representing all colors that are used for drawing the actual values for this DataSet
     */
    valueColors: (string | Color)[] = ['black'];

    /**
     * label that describes the DataSet or the data the DataSet represents
     */
    label = 'DataSet';

    /**
     * this specifies which axis this DataSet should be plotted against
     */
    axisDependency = AxisDependency.LEFT;

    /**
     * if true, value highlightning is enabled
     */
    highlightEnabled = true;

    /**
     * custom formatter that is used instead of the auto-formatter if set
     */
    valueFormatter: ValueFormatter = Utils.getDefaultValueFormatter();

    /**
     * the typeface used for the value text
     */
    valueTypeface: Font;

    form = LegendForm.DEFAULT;
    formSize = NaN;
    formLineWidth = NaN;
    formLineDashEffect = null;

    /**
     * if true, y-values are drawn on the chart
     */
    drawValuesEnabled = false;

    /**
     * the offset for drawing values (in dp)
     */
    valuesOffset = { x: 0, y: 0 };

    /**
     * if true, y-icons are drawn on the chart
     */
    drawIconsEnabled = false;

    /**
     * the offset for drawing icons (in dp)
     */
    iconsOffset = { x: 0, y: 0 };

    /**
     * the size of the value-text labels
     */
    valueTextSize = 13;

    /**
     * flag that indicates if the DataSet is visible or not
     */
    visible = true;

    /**
     * Constructor with label.
     *
     * @param label
     */
    constructor(label, xProperty?, yProperty?) {
        // if (xProperty) {
        this.xProperty = xProperty;
        // }
        if (yProperty) {
            this.yProperty = yProperty;
        }

        if (!this.xProperty) {
            this.getEntryXValue = function (e: T, entryIndex: number) {
                return entryIndex;
            };
        } else {
            this.getEntryXValue = (e: T, entryIndex: number) => e[this.xProperty];
        }

        this.label = label;
    }

    public getEntryXValue(e: T, entryIndex: number) {
        return this.xProperty ? e[this.xProperty] : entryIndex;
    }

    public getEntryIcon(e: T) {
        return e[this.iconProperty];
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

    public getColor(index = 0) {
        if (this.colors?.length > 0) {
            return this.colors[Math.floor(index) % this.colors.length];
        }
        return this.color;
    }

    /**
     * Adds a new color to the colors array of the DataSet.
     *
     * @param color
     */
    public addColor(value: string | Color) {
        if (!this.colors) this.colors = [];
        this.colors.push(value);
    }

    /**
     * Sets a color with a specific alpha value.
     *
     * @param color
     * @param alpha from 0-255
     */
    public setColor(color: string | Color, alpha?: number) {
        if (alpha !== undefined) {
            const actColor = color instanceof Color ? color : new Color(color);
            color = new Color(actColor.r, actColor.g, actColor.b, alpha);
        }
        this.color = color;
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
            this.colors = colors;
        } else {
            this.colors = colors.map((c) => new Color(c.r, c.g, c.b, alpha));
        }
    }

    /**
     * Resets all colors of this DataSet and recreates the colors array.
     */
    public resetColors() {
        this.colors = [];
    }

    /**
     * ###### ###### OTHER STYLING RELATED METHODS ##### ######
     */

    public get needsFormatter() {
        return !this.valueFormatter;
    }

    public set valueTextColor(color) {
        this.valueColors = [color];
    }

    public set valueTextColors(colors) {
        this.valueColors = colors;
    }

    public getValueTextColor(index = 0) {
        return this.valueColors[Math.floor(index) % this.valueColors.length];
    }

    /**
     * the shader to be used for filling the line surface
     */
    fillShader;

    /**
     * ###### ###### DATA RELATED METHODS ###### ######
     */
    public getIndexInEntries(xIndex) {
        for (let i = 0; i < this.entryCount; i++) {
            if (xIndex === this.getEntryForIndex(i).x) return i;
        }

        return -1;
    }

    public removeFirst() {
        if (this.entryCount > 0) {
            return this.removeEntryAtIndex(0);
        } else return false;
    }

    public removeLast() {
        if (this.entryCount > 0) {
            return this.removeEntryAtIndex(this.entryCount - 1);
        } else return false;
    }

    public removeEntryByXValue(xValue) {
        const e = this.getEntryForXValue(xValue, NaN);
        return this.removeEntry(e);
    }

    abstract removeEntry(e: T);
    abstract removeEntryAtIndex(index: number);

    public contains(e: T) {
        for (let i = 0; i < this.entryCount; i++) {
            if (e === this.getEntryForIndex(i)) return true;
        }

        return false;
    }
}
