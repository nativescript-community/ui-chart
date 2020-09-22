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
    LINE,
}

export enum LegendHorizontalAlignment {
    LEFT,
    CENTER,
    RIGHT,
}

export enum LegendVerticalAlignment {
    TOP,
    CENTER,
    BOTTOM,
}

export enum LegendOrientation {
    HORIZONTAL,
    VERTICAL,
}

export enum LegendDirection {
    LEFT_TO_RIGHT,
    RIGHT_TO_LEFT,
}
/**
 * Class representing the legend of the chart. The legend will contain one entry
 * per color and DataSet. Multiple colors in one DataSet are grouped together.
 * The legend object is NOT available before setting data to the chart.
 *
 * @author Philipp Jahoda
 */
export class Legend extends ComponentBase {
    /**
     * The legend entries array
     */
    private mEntries: LegendEntry[] = [];

    /**
     * Entries that will be appended to the end of the auto calculated entries after calculating the legend.
     * (if the legend has already been calculated, you will need to call notifyDataSetChanged() to let the changes take effect)
     */
    private mExtraEntries: LegendEntry[];

    /**
     * Are the legend labels/colors a custom value or auto calculated? If false,
     * then it's auto, if true, then custom. default false (automatic legend)
     */
    private mIsLegendCustom = false;

    private mHorizontalAlignment = LegendHorizontalAlignment.LEFT;
    private mVerticalAlignment = LegendVerticalAlignment.BOTTOM;
    private mOrientation = LegendOrientation.HORIZONTAL;
    private mDrawInside = false;

    /**
     * the text direction for the legend
     */
    private mDirection = LegendDirection.LEFT_TO_RIGHT;

    /**
     * the shape/form the legend colors are drawn in
     */
    private mShape = LegendForm.SQUARE;

    /**
     * the size of the legend forms/shapes
     */
    private mFormSize = 8;

    /**
     * the size of the legend forms/shapes
     */
    private mFormLineWidth = 3;

    /**
     * Line dash path effect used for shapes that consist of lines.
     */
    private mFormLineDashEffect: DashPathEffect = null;

    /**
     * the space between the legend entries on a horizontal axis, default 6f
     */
    private mXEntrySpace = 6;

    /**
     * the space between the legend entries on a vertical axis, default 5f
     */
    private mYEntrySpace = 0;

    /**
     * the space between the legend entries on a vertical axis, default 2f
     * private float this.mYEntrySpace = 2f; /** the space between the form and the
     * actual label/text
     */
    private mFormToTextSpace = 5;

    /**
     * the space that should be left between stacked forms
     */
    private mStackSpace = 3;

    /**
     * the maximum relative size out of the whole chart view in percent
     */
    private mMaxSizePercent = 0.95;

    /**
     * Constructor. Provide entries for the legend.
     *
     * @param entries
     */
    constructor(entries?: LegendEntry[]) {
        super();
        this.mTextSize = 10;
        this.mXOffset = 5;
        this.mYOffset = 3;
        if (entries) {
            this.mEntries = entries;
        }
    }

    /**
     * This method sets the automatically computed colors for the legend. Use setCustom(...) to set custom colors.
     *
     * @param entries
     */
    public setEntries(entries: LegendEntry[]) {
        this.mEntries = entries;
    }

    public getEntries() {
        return this.mEntries;
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
        const formToTextSpace = this.mFormToTextSpace;

        for (const entry of this.mEntries) {
            const formSize = isNaN(entry.formSize) ? this.mFormSize : entry.formSize;
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

        for (const entry of this.mEntries) {
            const label = entry.label;
            if (label == null) continue;

            const length = Utils.calcTextHeight(p, label);

            if (length > max) max = length;
        }

        return max;
    }

    public getExtraEntries() {
        return this.mExtraEntries;
    }

    public setExtraEntries(entries) {
        this.mExtraEntries = entries || [];
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

        this.mExtraEntries = entries;
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
        this.mEntries = entries;
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
     * returns the horizontal alignment of the legend
     *
     * @return
     */
    public getHorizontalAlignment() {
        return this.mHorizontalAlignment;
    }

    /**
     * sets the horizontal alignment of the legend
     *
     * @param value
     */
    public setHorizontalAlignment(value) {
        this.mHorizontalAlignment = value;
    }

    /**
     * returns the vertical alignment of the legend
     *
     * @return
     */
    public getVerticalAlignment() {
        return this.mVerticalAlignment;
    }

    /**
     * sets the vertical alignment of the legend
     *
     * @param value
     */
    public setVerticalAlignment(value) {
        this.mVerticalAlignment = value;
    }

    /**
     * returns the orientation of the legend
     *
     * @return
     */
    public getOrientation() {
        return this.mOrientation;
    }

    /**
     * sets the orientation of the legend
     *
     * @param value
     */
    public setOrientation(value) {
        this.mOrientation = value;
    }

    /**
     * returns whether the legend will draw inside the chart or outside
     *
     * @return
     */
    public isDrawInsideEnabled() {
        return this.mDrawInside;
    }

    /**
     * sets whether the legend will draw inside the chart or outside
     *
     * @param value
     */
    public setDrawInside(value) {
        this.mDrawInside = value;
    }

    /**
     * returns the text direction of the legend
     *
     * @return
     */
    public getDirection() {
        return this.mDirection;
    }

    /**
     * sets the text direction of the legend
     *
     * @param pos
     */
    public setDirection(pos) {
        this.mDirection = pos;
    }

    /**
     * returns the current form/shape that is set for the legend
     *
     * @return
     */
    public getForm() {
        return this.mShape;
    }

    /**
     * sets the form/shape of the legend forms
     *
     * @param shape
     */
    public setForm(shape) {
        this.mShape = shape;
    }

    /**
     * sets the size in dp of the legend forms, default 8f
     *
     * @param size
     */
    public setFormSize(size) {
        this.mFormSize = size;
    }

    /**
     * returns the size in dp of the legend forms
     *
     * @return
     */
    public getFormSize() {
        return this.mFormSize;
    }

    /**
     * sets the line width in dp for forms that consist of lines, default 3f
     *
     * @param size
     */
    public setFormLineWidth(size) {
        this.mFormLineWidth = size;
    }

    /**
     * returns the line width in dp for drawing forms that consist of lines
     *
     * @return
     */
    public getFormLineWidth() {
        return this.mFormLineWidth;
    }

    /**
     * Sets the line dash path effect used for shapes that consist of lines.
     *
     * @param dashPathEffect
     */
    public setFormLineDashEffect(dashPathEffect) {
        this.mFormLineDashEffect = dashPathEffect;
    }

    /**
     * @return The line dash path effect used for shapes that consist of lines.
     */
    public getFormLineDashEffect() {
        return this.mFormLineDashEffect;
    }

    /**
     * returns the space between the legend entries on a horizontal axis in
     * pixels
     *
     * @return
     */
    public getXEntrySpace() {
        return this.mXEntrySpace;
    }

    /**
     * sets the space between the legend entries on a horizontal axis in pixels,
     * converts to dp internally
     *
     * @param space
     */
    public setXEntrySpace(space) {
        this.mXEntrySpace = space;
    }

    /**
     * returns the space between the legend entries on a vertical axis in pixels
     *
     * @return
     */
    public getYEntrySpace() {
        return this.mYEntrySpace;
    }

    /**
     * sets the space between the legend entries on a vertical axis in pixels,
     * converts to dp internally
     *
     * @param space
     */
    public setYEntrySpace(space) {
        this.mYEntrySpace = space;
    }

    /**
     * returns the space between the form and the actual label/text
     *
     * @return
     */
    public getFormToTextSpace() {
        return this.mFormToTextSpace;
    }

    /**
     * sets the space between the form and the actual label/text, converts to dp
     * internally
     *
     * @param space
     */
    public setFormToTextSpace(space) {
        this.mFormToTextSpace = space;
    }

    /**
     * returns the space that is left out between stacked forms (with no label)
     *
     * @return
     */
    public getStackSpace() {
        return this.mStackSpace;
    }

    /**
     * sets the space that is left out between stacked forms (with no label)
     *
     * @param space
     */
    public setStackSpace(space) {
        this.mStackSpace = space;
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
     * flag that indicates if word wrapping is enabled
     */
    private mWordWrapEnabled = false;

    /**
     * Should the legend word wrap? / this is currently supported only for:
     * BelowChartLeft, BelowChartRight, BelowChartCenter. / note that word
     * wrapping a legend takes a toll on performance. / you may want to set
     * maxSizePercent when word wrapping, to set the point where the text wraps.
     * / default: false
     *
     * @param enabled
     */
    public setWordWrapEnabled(enabled) {
        this.mWordWrapEnabled = enabled;
    }

    /**
     * If this is set, then word wrapping the legend is enabled. This means the
     * legend will not be cut off if too long.
     *
     * @return
     */
    public isWordWrapEnabled() {
        return this.mWordWrapEnabled;
    }

    /**
     * The maximum relative size out of the whole chart view. / If the legend is
     * to the right/left of the chart, then this affects the width of the
     * legend. / If the legend is to the top/bottom of the chart, then this
     * affects the height of the legend. / If the legend is the center of the
     * piechart, then this defines the size of the rectangular bounds out of the
     * size of the "hole". / default: 0.95f (95%)
     *
     * @return
     */
    public getMaxSizePercent() {
        return this.mMaxSizePercent;
    }

    /**
     * The maximum relative size out of the whole chart view. / If
     * the legend is to the right/left of the chart, then this affects the width
     * of the legend. / If the legend is to the top/bottom of the chart, then
     * this affects the height of the legend. / default: 0.95f (95%)
     *
     * @param maxSize
     */
    public setMaxSizePercent(maxSize) {
        this.mMaxSizePercent = maxSize;
    }

    private mCalculatedLabelSizes = [];
    private mCalculatedLabelBreakPoints = [];
    private mCalculatedLineSizes = [];

    public getCalculatedLabelSizes() {
        return this.mCalculatedLabelSizes;
    }

    public getCalculatedLabelBreakPoints() {
        return this.mCalculatedLabelBreakPoints;
    }

    public getCalculatedLineSizes() {
        return this.mCalculatedLineSizes;
    }

    /**
     * Calculates the dimensions of the Legend. This includes the maximum width
     * and height of a single entry, as well as the total width and height of
     * the Legend.
     *
     * @param labelpaint
     */
    public calculateDimensions(labelpaint: Paint, viewPortHandler) {
        const defaultFormSize = this.mFormSize;
        const stackSpace = this.mStackSpace;
        const formToTextSpace = this.mFormToTextSpace;
        const xEntrySpace = this.mXEntrySpace;
        const yEntrySpace = this.mYEntrySpace;
        const wordWrapEnabled = this.mWordWrapEnabled;
        const entries = this.mEntries;
        const entryCount = entries.length;

        this.mTextWidthMax = this.getMaximumEntryWidth(labelpaint);
        this.mTextHeightMax = this.getMaximumEntryHeight(labelpaint);

        switch (this.mOrientation) {
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
                const contentWidth = viewPortHandler.contentWidth() * this.mMaxSizePercent;

                // Start calculating layout
                let maxLineWidth = 0;
                let currentLineWidth = 0;
                let requiredWidth = 0;
                let stackedStartIndex = -1;

                this.mCalculatedLabelBreakPoints = [];
                this.mCalculatedLabelSizes = [];
                this.mCalculatedLineSizes = [];

                for (let i = 0; i < entryCount; i++) {
                    const e = entries[i];
                    const drawingForm = e.form !== LegendForm.NONE;
                    const formSize = isNaN(e.formSize) ? defaultFormSize : e.formSize;
                    const label = e.label;

                    this.mCalculatedLabelBreakPoints.push(false);

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
                        this.mCalculatedLabelSizes.push(Utils.calcTextSize(labelpaint, label));
                        requiredWidth += drawingForm ? formToTextSpace + formSize : 0;
                        requiredWidth += this.mCalculatedLabelSizes[i].width;
                    } else {
                        this.mCalculatedLabelSizes.push({ x: 0, y: 0 });
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
                            this.mCalculatedLineSizes.push({ x: currentLineWidth, y: labelLineHeight });
                            maxLineWidth = Math.max(maxLineWidth, currentLineWidth);

                            // Start a new line
                            this.mCalculatedLabelBreakPoints[stackedStartIndex > -1 ? stackedStartIndex : i] = true;
                            currentLineWidth = requiredWidth;
                        }

                        if (i === entryCount - 1) {
                            // Add last line size to array
                            this.mCalculatedLineSizes.push({ x: currentLineWidth, y: labelLineHeight });
                            maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
                        }
                    }

                    stackedStartIndex = label != null ? -1 : stackedStartIndex;
                }

                this.mNeededWidth = maxLineWidth;
                this.mNeededHeight = labelLineHeight * this.mCalculatedLineSizes.length + labelLineSpacing * (this.mCalculatedLineSizes.length === 0 ? 0 : this.mCalculatedLineSizes.length - 1);

                break;
            }
        }

        this.mNeededHeight += this.mYOffset;
        this.mNeededWidth += this.mXOffset;
    }
}
