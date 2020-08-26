import { Renderer } from './Renderer';
import { Align, Canvas, FontMetrics, Paint, Path, Style } from 'nativescript-canvas';
import { Legend, LegendDirection, LegendForm, LegendHorizontalAlignment, LegendOrientation, LegendVerticalAlignment } from '../components/Legend';
import { BarDataSet } from '../data/BarDataSet';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Utils } from '../utils/Utils';
import { ChartData } from '../data/ChartData';
import { LegendEntry } from '../components/LegendEntry';
import { ColorTemplate } from '../utils/ColorTemplate';
import { PieDataSet } from '../data/PieDataSet';
import { CandleDataSet } from '../data/CandleDataSet';
import { profile } from '@nativescript/core/profiling';
import { IDataSet } from '../interfaces/datasets/IDataSet';

export class LegendRenderer extends Renderer {
    /**
     * palet for the legend labels
     */
    protected mLegendLabelPaint: Paint;

    /**
     * palet used for the legend forms
     */
    protected mLegendFormPaint: Paint;

    /**
     * the legend object this renderer renders
     */
    protected mLegend: Legend;

    constructor(viewPortHandler: ViewPortHandler, legend: Legend) {
        super(viewPortHandler);

        this.mLegend = legend;

        this.mLegendLabelPaint = new Paint();
        this.mLegendLabelPaint.setTextSize(9);
        this.mLegendLabelPaint.setAntiAlias(true);
        this.mLegendLabelPaint.setTextAlign(Align.LEFT);

        this.mLegendFormPaint = new Paint();
        this.mLegendFormPaint.setAntiAlias(true);
        this.mLegendFormPaint.setStyle(Style.FILL);
    }

    /**
     * Returns the Paint object used for drawing the Legend labels.
     *
     * @return
     */
    public getLabelPaint() {
        return this.mLegendLabelPaint;
    }

    /**
     * Returns the Paint object used for drawing the Legend forms.
     *
     * @return
     */
    public getFormPaint() {
        return this.mLegendFormPaint;
    }

    protected computedEntries: LegendEntry[] = [];

    /**
     * Prepares the legend and calculates all needed forms, labels and colors.
     *
     * @param data
     */
    public computeLegend(data: ChartData<any, IDataSet<any>>) {
        if (!this.mLegend.isLegendCustom()) {
            this.computedEntries = [];

            // loop for building up the colors and labels used in the legend
            for (let i = 0; i < data.getDataSetCount(); i++) {
                const dataSet = data.getDataSetByIndex(i);

                const clrs = dataSet.getColors();
                const entryCount = dataSet.getEntryCount();

                // if we have a barchart with stacked bars
                if (dataSet instanceof BarDataSet && dataSet.isStacked()) {
                    const bds = dataSet;
                    const sLabels = bds.getStackLabels();

                    for (let j = 0; j < clrs.length && j < bds.getStackSize(); j++) {
                        this.computedEntries.push(
                            new LegendEntry(sLabels[j % sLabels.length], dataSet.getForm(), dataSet.getFormSize(), dataSet.getFormLineWidth(), dataSet.getFormLineDashEffect(), clrs[j])
                        );
                    }

                    if (bds.getLabel() != null) {
                        // add the legend description label
                        this.computedEntries.push(new LegendEntry(dataSet.getLabel(), LegendForm.NONE, NaN, NaN, null, ColorTemplate.COLOR_NONE));
                    }
                } else if (dataSet instanceof PieDataSet) {
                    const pds = dataSet;

                    for (let j = 0; j < clrs.length && j < entryCount; j++) {
                        this.computedEntries.push(
                            new LegendEntry(pds.getEntryForIndex(j).label, dataSet.getForm(), dataSet.getFormSize(), dataSet.getFormLineWidth(), dataSet.getFormLineDashEffect(), clrs[j])
                        );
                    }

                    if (pds.getLabel() != null) {
                        // add the legend description label
                        this.computedEntries.push(new LegendEntry(dataSet.getLabel(), LegendForm.NONE, NaN, NaN, null, ColorTemplate.COLOR_NONE));
                    }
                } else if (dataSet instanceof CandleDataSet && dataSet.getDecreasingColor() !== ColorTemplate.COLOR_NONE) {
                    const decreasingColor = dataSet.getDecreasingColor();
                    const increasingColor = dataSet.getIncreasingColor();

                    this.computedEntries.push(new LegendEntry(null, dataSet.getForm(), dataSet.getFormSize(), dataSet.getFormLineWidth(), dataSet.getFormLineDashEffect(), decreasingColor));

                    this.computedEntries.push(
                        new LegendEntry(dataSet.getLabel(), dataSet.getForm(), dataSet.getFormSize(), dataSet.getFormLineWidth(), dataSet.getFormLineDashEffect(), increasingColor)
                    );
                } else {
                    // all others

                    for (let j = 0; j < clrs.length && j < entryCount; j++) {
                        let label;

                        // if multiple colors are set for a DataSet, group them
                        if (j < clrs.length - 1 && j < entryCount - 1) {
                            label = null;
                        } else {
                            // add label to the last entry
                            label = data.getDataSetByIndex(i).getLabel();
                        }

                        this.computedEntries.push(new LegendEntry(label, dataSet.getForm(), dataSet.getFormSize(), dataSet.getFormLineWidth(), dataSet.getFormLineDashEffect(), clrs[j]));
                    }
                }
            }

            if (this.mLegend.getExtraEntries() != null) {
                Array.prototype.push.apply(this.computedEntries, this.mLegend.getExtraEntries());
                // Collections.addAll(computedEntries, this.mLegend.getExtraEntries());
            }

            this.mLegend.setEntries(this.computedEntries);
        }

        const tf = this.mLegend.getTypeface();

        if (tf != null) this.mLegendLabelPaint.setTypeface(tf);

        this.mLegendLabelPaint.setTextSize(this.mLegend.getTextSize());
        this.mLegendLabelPaint.setColor(this.mLegend.getTextColor());

        // calculate all dimensions of the this.mLegend
        this.mLegend.calculateDimensions(this.mLegendLabelPaint, this.mViewPortHandler);
    }

    protected legendFontMetrics = new FontMetrics();

    @profile
    public renderLegend(c: Canvas) {
        if (!this.mLegend.isEnabled()) return;

        const tf = this.mLegend.getTypeface();
        if (tf != null) this.mLegendLabelPaint.setTypeface(tf);

        this.mLegendLabelPaint.setTextSize(this.mLegend.getTextSize());
        this.mLegendLabelPaint.setColor(this.mLegend.getTextColor());

        const labelLineHeight = Utils.getLineHeight(this.mLegendLabelPaint, this.legendFontMetrics);
        const labelLineSpacing = Utils.getLineSpacing(this.mLegendLabelPaint, this.legendFontMetrics) + this.mLegend.getYEntrySpace();
        const formYOffset = labelLineHeight - Utils.calcTextHeight(this.mLegendLabelPaint, 'ABC') / 2;

        const entries = this.mLegend.getEntries();

        const formToTextSpace = this.mLegend.getFormToTextSpace();
        const xEntrySpace = this.mLegend.getXEntrySpace();
        const orientation = this.mLegend.getOrientation();
        const horizontalAlignment = this.mLegend.getHorizontalAlignment();
        const verticalAlignment = this.mLegend.getVerticalAlignment();
        const direction = this.mLegend.getDirection();
        const defaultFormSize = this.mLegend.getFormSize();

        // space between the entries
        const stackSpace = this.mLegend.getStackSpace();

        const yoffset = this.mLegend.getYOffset();
        const xoffset = this.mLegend.getXOffset();
        let originPosX = 0;

        switch (horizontalAlignment) {
            case LegendHorizontalAlignment.LEFT:
                if (orientation === LegendOrientation.VERTICAL) originPosX = xoffset;
                else originPosX = this.mViewPortHandler.contentLeft() + xoffset;

                if (direction === LegendDirection.RIGHT_TO_LEFT) originPosX += this.mLegend.mNeededWidth;

                break;

            case LegendHorizontalAlignment.RIGHT:
                if (orientation === LegendOrientation.VERTICAL) originPosX = this.mViewPortHandler.getChartWidth() - xoffset;
                else originPosX = this.mViewPortHandler.contentRight() - xoffset;

                if (direction === LegendDirection.LEFT_TO_RIGHT) originPosX -= this.mLegend.mNeededWidth;

                break;

            case LegendHorizontalAlignment.CENTER:
                if (orientation === LegendOrientation.VERTICAL) originPosX = this.mViewPortHandler.getChartWidth() / 2;
                else originPosX = this.mViewPortHandler.contentLeft() + this.mViewPortHandler.contentWidth() / 2;

                originPosX += direction === LegendDirection.LEFT_TO_RIGHT ? +xoffset : -xoffset;

                // Horizontally layed out legends do the center offset on a line basis,
                // So here we offset the vertical ones only.
                if (orientation === LegendOrientation.VERTICAL) {
                    originPosX += direction === LegendDirection.LEFT_TO_RIGHT ? -this.mLegend.mNeededWidth / 2.0 + xoffset : this.mLegend.mNeededWidth / 2.0 - xoffset;
                }

                break;
        }

        switch (orientation) {
            case LegendOrientation.HORIZONTAL: {
                const calculatedLineSizes = this.mLegend.getCalculatedLineSizes();
                const calculatedLabelSizes = this.mLegend.getCalculatedLabelSizes();
                const calculatedLabelBreakPoints = this.mLegend.getCalculatedLabelBreakPoints();

                let posX = originPosX;
                let posY = 0;

                switch (verticalAlignment) {
                    case LegendVerticalAlignment.TOP:
                        posY = yoffset;
                        break;

                    case LegendVerticalAlignment.BOTTOM:
                        posY = this.mViewPortHandler.getChartHeight() - yoffset - this.mLegend.mNeededHeight;
                        break;

                    case LegendVerticalAlignment.CENTER:
                        posY = (this.mViewPortHandler.getChartHeight() - this.mLegend.mNeededHeight) / 2 + yoffset;
                        break;
                }

                let lineIndex = 0;

                for (let i = 0, count = entries.length; i < count; i++) {
                    const e = entries[i];
                    const drawingForm = e.form !== LegendForm.NONE;
                    const formSize = isNaN(e.formSize) ? defaultFormSize : e.formSize;

                    if (i < calculatedLabelBreakPoints.length && calculatedLabelBreakPoints[i]) {
                        posX = originPosX;
                        posY += labelLineHeight + labelLineSpacing;
                    }

                    if (posX === originPosX && horizontalAlignment === LegendHorizontalAlignment.CENTER && lineIndex < calculatedLineSizes.length) {
                        posX += (direction === LegendDirection.RIGHT_TO_LEFT ? calculatedLineSizes[lineIndex].width : -calculatedLineSizes[lineIndex].width) / 2;
                        lineIndex++;
                    }

                    const isStacked = e.label == null; // grouped forms have null labels

                    if (drawingForm) {
                        if (direction === LegendDirection.RIGHT_TO_LEFT) posX -= formSize;

                        this.drawForm(c, posX, posY + formYOffset, e, this.mLegend);

                        if (direction === LegendDirection.LEFT_TO_RIGHT) posX += formSize;
                    }

                    if (!isStacked) {
                        if (drawingForm) posX += direction === LegendDirection.RIGHT_TO_LEFT ? -formToTextSpace : formToTextSpace;

                        if (direction === LegendDirection.RIGHT_TO_LEFT) posX -= calculatedLabelSizes[i].width;

                        this.drawLabel(c, posX, posY + labelLineHeight, e.label);

                        if (direction === LegendDirection.LEFT_TO_RIGHT) posX += calculatedLabelSizes[i].width;

                        posX += direction === LegendDirection.RIGHT_TO_LEFT ? -xEntrySpace : xEntrySpace;
                    } else posX += direction === LegendDirection.RIGHT_TO_LEFT ? -stackSpace : stackSpace;
                }

                break;
            }

            case LegendOrientation.VERTICAL: {
                // contains the stacked legend size in pixels
                let stack = 0;
                let wasStacked = false;
                let posY = 0;

                switch (verticalAlignment) {
                    case LegendVerticalAlignment.TOP:
                        posY = horizontalAlignment === LegendHorizontalAlignment.CENTER ? 0 : this.mViewPortHandler.contentTop();
                        posY += yoffset;
                        break;

                    case LegendVerticalAlignment.BOTTOM:
                        posY = horizontalAlignment === LegendHorizontalAlignment.CENTER ? this.mViewPortHandler.getChartHeight() : this.mViewPortHandler.contentBottom();
                        posY -= this.mLegend.mNeededHeight + yoffset;
                        break;

                    case LegendVerticalAlignment.CENTER:
                        posY = this.mViewPortHandler.getChartHeight() / 2 - this.mLegend.mNeededHeight / 2 + this.mLegend.getYOffset();
                        break;
                }

                for (let i = 0; i < entries.length; i++) {
                    const e = entries[i];
                    const drawingForm = e.form !== LegendForm.NONE;
                    const formSize = isNaN(e.formSize) ? defaultFormSize : e.formSize;

                    let posX = originPosX;

                    if (drawingForm) {
                        if (direction === LegendDirection.LEFT_TO_RIGHT) posX += stack;
                        else posX -= formSize - stack;

                        this.drawForm(c, posX, posY + formYOffset, e, this.mLegend);

                        if (direction === LegendDirection.LEFT_TO_RIGHT) posX += formSize;
                    }

                    if (e.label != null) {
                        if (drawingForm && !wasStacked) posX += direction === LegendDirection.LEFT_TO_RIGHT ? formToTextSpace : -formToTextSpace;
                        else if (wasStacked) posX = originPosX;

                        if (direction === LegendDirection.RIGHT_TO_LEFT) posX -= Utils.calcTextWidth(this.mLegendLabelPaint, e.label);

                        if (!wasStacked) {
                            this.drawLabel(c, posX, posY + labelLineHeight, e.label);
                        } else {
                            posY += labelLineHeight + labelLineSpacing;
                            this.drawLabel(c, posX, posY + labelLineHeight, e.label);
                        }

                        // make a step down
                        posY += labelLineHeight + labelLineSpacing;
                        stack = 0;
                    } else {
                        stack += formSize + stackSpace;
                        wasStacked = true;
                    }
                }

                break;
            }
        }
    }

    private mLineFormPath = new Path();

    /**
     * Draws the Legend-form at the given position with the color at the given
     * index.
     *
     * @param c      canvas to draw with
     * @param x      position
     * @param y      position
     * @param entry  the entry to render
     * @param legend the legend context
     */
    protected drawForm(c: Canvas, x, y, entry: LegendEntry, legend: Legend) {
        if (entry.formColor === ColorTemplate.COLOR_SKIP || entry.formColor === ColorTemplate.COLOR_NONE || entry.formColor === null) return;

        const restoreCount = c.save();

        let form = entry.form;
        if (form === LegendForm.DEFAULT) form = legend.getForm();
        this.mLegendFormPaint.setColor(entry.formColor);

        const formSize = isNaN(entry.formSize) ? legend.getFormSize() : entry.formSize;
        const half = formSize / 2;

        switch (form) {
            case LegendForm.NONE:
                // Do nothing
                break;

            case LegendForm.EMPTY:
                // Do not draw, but keep space for the form
                break;

            case LegendForm.DEFAULT:
            case LegendForm.CIRCLE:
                this.mLegendFormPaint.setStyle(Style.FILL);
                c.drawCircle(x + half, y, half, this.mLegendFormPaint);
                break;

            case LegendForm.SQUARE:
                this.mLegendFormPaint.setStyle(Style.FILL);
                c.drawRect(x, y - half, x + formSize, y + half, this.mLegendFormPaint);
                break;

            case LegendForm.LINE:
                {
                    const formLineWidth = Utils.convertDpToPixel(isNaN(entry.formLineWidth) ? legend.getFormLineWidth() : entry.formLineWidth);
                    const formLineDashEffect = entry.formLineDashEffect == null ? legend.getFormLineDashEffect() : entry.formLineDashEffect;
                    this.mLegendFormPaint.setStyle(Style.STROKE);
                    this.mLegendFormPaint.setStrokeWidth(formLineWidth);
                    this.mLegendFormPaint.setPathEffect(formLineDashEffect);

                    this.mLineFormPath.reset();
                    this.mLineFormPath.moveTo(x, y);
                    this.mLineFormPath.lineTo(x + formSize, y);
                    c.drawPath(this.mLineFormPath, this.mLegendFormPaint);
                }
                break;
        }

        c.restoreToCount(restoreCount);
    }

    /**
     * Draws the provided label at the given position.
     *
     * @param c     canvas to draw with
     * @param x
     * @param y
     * @param label the label to draw
     */
    protected drawLabel(c: Canvas, x, y, label) {
        c.drawText(label, x, y, this.mLegendLabelPaint);
    }
}
