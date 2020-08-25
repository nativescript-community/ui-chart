import { LegendForm } from './Legend';
import { DashPathEffect } from 'nativescript-canvas';
import { Color } from '@nativescript/core/color';

export class LegendEntry {
    /**
     *
     * @param label The legend entry text. A `null` label will start a group.
     * @param form The form to draw for this entry.
     * @param formSize Set to NaN to use the legend's default.
     * @param formLineWidth Set to NaN to use the legend's default.
     * @param formLineDashEffect Set to nil to use the legend's default.
     * @param formColor The color for drawing the form.
     */
    constructor(label: string, form: LegendForm, formSize?, formLineWidth?, formLineDashEffect?: DashPathEffect, formColor?:string | number | Color) {
        this.label = label;
        this.form = form;
        this.formSize = formSize;
        this.formLineWidth = formLineWidth;
        this.formLineDashEffect = formLineDashEffect;
        this.formColor = formColor;
    }

    /**
     * The legend entry text.
     * A `null` label will start a group.
     */
    public label: string;

    /**
     * The form to draw for this entry.
     *
     * `NONE` will avoid drawing a form, and any related space.
     * `EMPTY` will avoid drawing a form, but keep its space.
     * `DEFAULT` will use the Legend's default.
     */
    public form = LegendForm.DEFAULT;

    /**
     * Form size will be considered except for when .None is used
     *
     * Set as NaN to use the legend's default
     */
    public formSize = NaN;

    /**
     * Line width used for shapes that consist of lines.
     *
     * Set as NaN to use the legend's default
     */
    public formLineWidth = NaN;

    /**
     * Line dash path effect used for shapes that consist of lines.
     *
     * Set to null to use the legend's default
     */
    public formLineDashEffect: DashPathEffect = null;

    /**
     * The color for drawing the form
     */
    public formColor: string | number | Color = null;
}
