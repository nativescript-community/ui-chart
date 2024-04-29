import { DashPathEffect, Shader } from '@nativescript-community/ui-canvas';
import { ObservableArray, profile } from '@nativescript/core';
import { Color } from '@nativescript/core/color';
import { createLTTB } from 'downsample/methods/LTTB';
import { DefaultFillFormatter } from '../formatter/DefaultFillFormatter';
import { IFillFormatter } from '../formatter/IFillFormatter';
import { ILineDataSet } from '../interfaces/datasets/ILineDataSet';
import { ColorTemplate } from '../utils/ColorTemplate';
import { Entry } from './Entry';
import { LineRadarDataSet } from './LineRadarDataSet';

export enum Mode {
    LINEAR,
    STEPPED,
    CUBIC_BEZIER,
    HORIZONTAL_BEZIER
}

export class LineDataSet extends LineRadarDataSet<Entry> implements ILineDataSet {
    /**
     * Drawing mode for this line dataset
     **/
    mode = Mode.LINEAR;

    /**
     * List representing all colors that are used for the circles
     */
    circleColors: string[] | Color[] = [];

    /**
     * the color of the inner circles
     */
    circleHoleColor = ColorTemplate.COLOR_NONE;

    /**
     * the radius of the circle-shaped value indicators
     */
    circleRadius = 4;

    /**
     * the hole radius of the circle-shaped value indicators
     */
    circleHoleRadius = 2;

    /**
     * sets the intensity of the cubic lines (if enabled). Max = 1 = very cubic,
     * Min = 0.05f = low cubic effect, Default: 0.2f
     */
    cubicIntensity = 0.2;

    /**
     * the path effect of this DataSet that makes dashed lines possible
     */
    dashPathEffect: DashPathEffect = null;

    /**
     * the path effect of this DataSet that makes dashed lines possible
     */
    shader: Shader = null;

    /**
     * formatter for customizing the position of the fill-line
     */
    fillFormatter: IFillFormatter = new DefaultFillFormatter();

    /**
     * if true, drawing circles is enabled
     */
    drawCirclesEnabled = false;

    drawCircleHoleEnabled = true;

    useColorsForFill = false;

    public useColorsForLine = false;

    /**
     * the max number allowed point before filtering. <= O means disabled
     */
    maxFilterNumber = 0;

    constructor(yVals, label, xProperty?, yProperty?) {
        super(yVals, label, xProperty, yProperty);
        this.init();
    }

    public getCircleColor(index) {
        return this.circleColors[Math.floor(index)] || this.getColor();
    }

    /**
     * Sets the colors that should be used for the circles of this DataSet.
     * Colors are reused as soon as the number of Entries the DataSet represents
     * is higher than the size of the colors array. Make sure that the colors
     * are already prepared (by calling getResources().getColor(...)) before
     * adding them to the DataSet.
     *
     * @param colors
     */
    public setCircleColors(colors: string[] | Color[]) {
        this.circleColors = colors;
    }

    /**
     * Sets the one and ONLY color that should be used for this DataSet.
     * Internally, this recreates the colors array and adds the specified color.
     *
     * @param color
     */
    public set circleColor(color) {
        this.circleColors = [color];
    }

    protected mFilteredValues: Entry[] = null;
    protected mFilterFunction;
    public applyFiltering(scaleX: number) {
        if (this.maxFilterNumber > 0 && this.mValues.length / scaleX > this.maxFilterNumber) {
            const filterCount = Math.round(this.maxFilterNumber * scaleX);
            if (!this.mFilteredValues || this.mFilteredValues.length !== filterCount) {
                if (!this.mFilterFunction) {
                    this.mFilterFunction = createLTTB({
                        x: this.xProperty,
                        y: this.yProperty
                    } as any);
                }
                this.mFilteredValues = this.mFilterFunction(this.mValues, filterCount);
            }
        } else if (this.mFilteredValues) {
            this.mFilteredValues = null;
        }
        this.updateGetEntryForIndex();
    }

    mIgnoreFiltered = false;
    protected get internalValues() {
        if (this.mFilteredValues && !this.mIgnoreFiltered) {
            return this.mFilteredValues;
        }
        return this.mValues;
    }
    set ignoreFiltered(value) {
        this.mIgnoreFiltered = value;
        this.updateGetEntryForIndex();
    }
    get ignoreFiltered() {
        return this.mIgnoreFiltered;
    }
    set values(values) {
        this.mFilteredValues = null;
        super.values = values;
    }
    get filtered() {
        return !!this.mFilteredValues;
    }

    /**
     * Property definining wheter circles are drawn in high res.
     * Default true
     */
    circleHighRes = true;

    /**
     * Enables the line to be drawn in dashed mode, e.g. like this
     * "- - - - - -". THIS ONLY WORKS IF HARDWARE-ACCELERATION IS TURNED OFF.
     * Keep in mind that hardware acceleration boosts performance.
     *
     * @param lineLength  the length of the line pieces
     * @param spaceLength the length of space in between the pieces
     * @param phase       offset, in degrees (normally, use 0)
     */
    public enableDashedLine(lineLength, spaceLength, phase) {
        this.dashPathEffect = new DashPathEffect([lineLength, spaceLength], phase);
    }
}
