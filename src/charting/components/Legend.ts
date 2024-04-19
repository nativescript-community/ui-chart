import { ComponentBase } from './ComponentBase';
import { LegendEntry } from './LegendEntry';
import { Utils } from '../utils/Utils';
import { DashPathEffect, Paint } from '@nativescript-community/ui-canvas';
import { ColorTemplate } from '../utils/ColorTemplate';

export enum LegendForm {
    /**
     * Avoid drawing a form
     */
    NONE,

    /**
     * Do not draw the a form, but leave space for it
     */
    EMPTY,

    /**
     * Use default (default dataset's form to the legend's form)
     */
    DEFAULT,

    /**
     * Draw a square
     */
    SQUARE,

    /**
     * Draw a circle
     */
    CIRCLE,

    /**
     * Draw a horizontal line
     */
    LINE
}

export enum LegendHorizontalAlignment {
    LEFT,
    CENTER,
    RIGHT
}

export enum LegendVerticalAlignment {
    TOP,
    CENTER,
    BOTTOM
}

export enum LegendOrientation {
    HORIZONTAL,
    VERTICAL
}

export enum LegendDirection {
    LEFT_TO_RIGHT,
    RIGHT_TO_LEFT
}
/**
 * Class representing the legend of the chart. The legend will contain one entry
 * per color and DataSet. Multiple colors in one DataSet are grouped together.
 * The legend object is NOT available before setting data to the chart.
 *

 */
export class Legend extends ComponentBase {
    /**
     * The legend entries array
     */
    entries: LegendEntry[] = [];

    /**
     * Entries that will be appended to the end of the auto calculated entries after calculating the legend.
     * (if the legend has already been calculated, you will need to call notifyDataSetChanged() to let the changes take effect)
     */
    extraEntries: LegendEntry[];

    /**
     * Are the legend labels/colors a custom value or auto calculated? If false,
     * then it's auto, if true, then custom. default false (automatic legend)
     */
    mIsLegendCustom = false;

    horizontalAlignment = LegendHorizontalAlignment.LEFT;
    verticalAlignment = LegendVerticalAlignment.BOTTOM;
    orientation = LegendOrientation.HORIZONTAL;
    drawInside = false;

    /**
     * the text direction for the legend
     */
    direction = LegendDirection.LEFT_TO_RIGHT;

    /**
     * the shape/form the legend colors are drawn in
     */
    form = LegendForm.SQUARE;

    /**
     * the size of the legend forms/shapes
     */
    formSize = 8;

    /**
     * the size of the legend forms/shapes
     */
    formLineWidth = 3;

    /**
     * Line dash path effect used for shapes that consist of lines.
     */
    formLineDashEffect: DashPathEffect = null;

    /**
     * the space between the legend entries on a horizontal axis, default 6f
     */
    xEntrySpace = 6;

    /**
     * the space between the legend entries on a vertical axis, default 5f
     */
    yEntrySpace = 0;

    /**
     * the space between the legend entries on a vertical axis, default 2f
     * private float this.mYEntrySpace = 2f; /** the space between the form and the
     * actual label/text
     */
    formToTextSpace = 5;

    /**
     * the space that should be left between stacked forms
     */
    stackSpace = 3;

    /**
     * The maximum relative size out of the whole chart view. / If the legend is
     * to the right/left of the chart, then this affects the width of the
     * legend. / If the legend is to the top/bottom of the chart, then this
     * affects the height of the legend. / If the legend is the center of the
     * piechart, then this defines the size of the rectangular bounds out of the
     * size of the "hole". / default: 0.95f (95%)
     */
    maxSizePercent = 0.95;

    /**
     * Constructor. Provide entries for the legend.
     *
     * @param entries
     */
    constructor(entries?: LegendEntry[]) {
        super();
        this.enabled = false;
        this.textSize = 10;
        this.xOffset = 5;
        this.yOffset = 5;
        if (entries) {
            this.entries = entries;
        }
    }

    /**
     * returns the maximum length in pixels across all legend labels + formsize
     * + formtotextspace
     *
     * @param p the paint object used for rendering the text
     * @return
     */
    public getMaximumEntryWidth(p: Paint) {
        let max = 0;
        let maxFormSize = 0;
        const formToTextSpace = this.formToTextSpace;

        for (const entry of this.entries) {
            const formSize = isNaN(entry.formSize) ? this.formSize : entry.formSize;
            if (formSize > maxFormSize) maxFormSize = formSize;

            const label = entry.label;
            if (label == null) continue;

            const length = Utils.calcTextWidth(p, label);

            if (length > max) max = length;
        }

        return max + maxFormSize + formToTextSpace;
    }

    /**
     * returns the maximum height in pixels across all legend labels
     *
     * @param p the paint object used for rendering the text
     * @return
     */
    public getMaximumEntryHeight(p: Paint) {
        let max = 0;

        for (const entry of this.entries) {
            const label = entry.label;
            if (label == null) continue;

            const length = Utils.calcTextHeight(p, label);

            if (length > max) max = length;
        }

        return max;
    }

    /**
     * Entries that will be appended to the end of the auto calculated
     *   entries after calculating the legend.
     * (if the legend has already been calculated, you will need to call notifyDataSetChanged()
     *   to let the changes take effect)
     */
    public setExtra(colors, labels) {
        const entries = [];

        for (let i = 0; i < Math.min(colors.length, labels.length); i++) {
            const entry = new LegendEntry(labels[i], colors[i]);
            // entry.formColor = colors[i];
            // entry.label = labels[i];

            if (entry.formColor === ColorTemplate.COLOR_SKIP || entry.formColor == null) entry.form = LegendForm.NONE;
            else if (entry.formColor === ColorTemplate.COLOR_NONE) entry.form = LegendForm.EMPTY;

            entries.push(entry);
        }

        this.extraEntries = entries;
    }

    /**
     * Sets a custom legend's entries array.
     * * A null label will start a group.
     * This will disable the feature that automatically calculates the legend
     *   entries from the datasets.
     * Call resetCustom() to re-enable automatic calculation (and then
     *   notifyDataSetChanged() is needed to auto-calculate the legend again)
     */
    public setCustom(entries) {
        this.entries = entries;
        this.mIsLegendCustom = true;
    }

    /**
     * Calling this will disable the custom legend entries (set by
     * setCustom(...)). Instead, the entries will again be calculated
     * automatically (after notifyDataSetChanged() is called).
     */
    public resetCustom() {
        this.mIsLegendCustom = false;
    }

    /**
     * @return true if a custom legend entries has been set default
     * false (automatic legend)
     */
    public isLegendCustom() {
        return this.mIsLegendCustom;
    }

    /**
     * the total width of the legend (needed width space)
     */
    public mNeededWidth = 0;

    /**
     * the total height of the legend (needed height space)
     */
    public mNeededHeight = 0;

    public mTextHeightMax = 0;

    public mTextWidthMax = 0;

    /**
     * Should the legend word wrap? / this is currently supported only for:
     * BelowChartLeft, BelowChartRight, BelowChartCenter. / note that word
     * wrapping a legend takes a toll on performance. / you may want to set
     * maxSizePercent when word wrapping, to set the point where the text wraps.
     * / default: false
     */
    wordWrapEnabled = false;

    calculatedLabelSizes = [];
    calculatedLabelBreakPoints = [];
    calculatedLineSizes = [];

    /**
     * Calculates the dimensions of the Legend. This includes the maximum width
     * and height of a single entry, as well as the total width and height of
     * the Legend.
     *
     * @param labelpaint
     */
    public calculateDimensions(labelpaint: Paint, viewPortHandler) {
        const defaultFormSize = this.formSize;
        const stackSpace = this.stackSpace;
        const formToTextSpace = this.formToTextSpace;
        const xEntrySpace = this.xEntrySpace;
        const yEntrySpace = this.yEntrySpace;
        const wordWrapEnabled = this.wordWrapEnabled;
        const entries = this.entries;
        const entryCount = entries.length;

        this.mTextWidthMax = this.getMaximumEntryWidth(labelpaint);
        this.mTextHeightMax = this.getMaximumEntryHeight(labelpaint);

        switch (this.orientation) {
            case LegendOrientation.VERTICAL: {
                let maxWidth = 0,
                    maxHeight = 0,
                    width = 0;
                const labelLineHeight = Utils.getLineHeight(labelpaint);
                let wasStacked = false;

                for (let i = 0; i < entryCount; i++) {
                    const e = entries[i];
                    const drawingForm = e.form !== LegendForm.NONE;
                    const formSize = isNaN(e.formSize) ? defaultFormSize : e.formSize;
                    const label = e.label;

                    if (!wasStacked) width = 0;

                    if (drawingForm) {
                        if (wasStacked) width += stackSpace;
                        width += formSize;
                    }

                    // grouped forms have null labels
                    if (label != null) {
                        // make a step to the left
                        if (drawingForm && !wasStacked) width += formToTextSpace;
                        else if (wasStacked) {
                            maxWidth = Math.max(maxWidth, width);
                            maxHeight += labelLineHeight + yEntrySpace;
                            width = 0;
                            wasStacked = false;
                        }

                        width += Utils.calcTextWidth(labelpaint, label);

                        if (i < entryCount - 1) maxHeight += labelLineHeight + yEntrySpace;
                    } else {
                        wasStacked = true;
                        width += formSize;
                        if (i < entryCount - 1) width += stackSpace;
                    }

                    maxWidth = Math.max(maxWidth, width);
                }

                this.mNeededWidth = maxWidth;
                this.mNeededHeight = maxHeight;

                break;
            }
            case LegendOrientation.HORIZONTAL: {
                const labelLineHeight = Utils.getLineHeight(labelpaint);
                const labelLineSpacing = Utils.getLineSpacing(labelpaint) + yEntrySpace;
                const contentWidth = viewPortHandler.contentRect.width() * this.maxSizePercent;

                // Start calculating layout
                let maxLineWidth = 0;
                let currentLineWidth = 0;
                let requiredWidth = 0;
                let stackedStartIndex = -1;

                this.calculatedLabelBreakPoints = [];
                this.calculatedLabelSizes = [];
                this.calculatedLineSizes = [];

                for (let i = 0; i < entryCount; i++) {
                    const e = entries[i];
                    const drawingForm = e.form !== LegendForm.NONE;
                    const formSize = isNaN(e.formSize) ? defaultFormSize : e.formSize;
                    const label = e.label;

                    this.calculatedLabelBreakPoints.push(false);

                    if (stackedStartIndex === -1) {
                        // we are not stacking, so required width is for this label
                        // only
                        requiredWidth = 0;
                    } else {
                        // add the spacing appropriate for stacked labels/forms
                        requiredWidth += stackSpace;
                    }

                    // grouped forms have null labels
                    if (label != null) {
                        this.calculatedLabelSizes.push(Utils.calcTextSize(labelpaint, label));
                        requiredWidth += drawingForm ? formToTextSpace + formSize : 0;
                        requiredWidth += this.calculatedLabelSizes[i].width;
                    } else {
                        this.calculatedLabelSizes.push({ x: 0, y: 0 });
                        requiredWidth += drawingForm ? formSize : 0;

                        if (stackedStartIndex === -1) {
                            // mark this index as we might want to break here later
                            stackedStartIndex = i;
                        }
                    }

                    if (label != null || i === entryCount - 1) {
                        const requiredSpacing = currentLineWidth === 0 ? 0 : xEntrySpace;

                        if (
                            !wordWrapEnabled || // No word wrapping, it must fit.
                            // The line is empty, it must fit
                            currentLineWidth === 0 ||
                            // It simply fits
                            contentWidth - currentLineWidth >= requiredSpacing + requiredWidth
                        ) {
                            // Expand current line
                            currentLineWidth += requiredSpacing + requiredWidth;
                        } else {
                            // It doesn't fit, we need to wrap a line

                            // Add current line size to array
                            this.calculatedLineSizes.push({ x: currentLineWidth, y: labelLineHeight });
                            maxLineWidth = Math.max(maxLineWidth, currentLineWidth);

                            // Start a new line
                            this.calculatedLabelBreakPoints[stackedStartIndex > -1 ? stackedStartIndex : i] = true;
                            currentLineWidth = requiredWidth;
                        }

                        if (i === entryCount - 1) {
                            // Add last line size to array
                            this.calculatedLineSizes.push({ x: currentLineWidth, y: labelLineHeight });
                            maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
                        }
                    }

                    stackedStartIndex = label != null ? -1 : stackedStartIndex;
                }

                this.mNeededWidth = maxLineWidth;
                this.mNeededHeight = labelLineHeight * this.calculatedLineSizes.length + labelLineSpacing * (this.calculatedLineSizes.length === 0 ? 0 : this.calculatedLineSizes.length - 1);

                break;
            }
        }

        this.mNeededHeight += this.yOffset;
        this.mNeededWidth += this.xOffset;
    }
}
