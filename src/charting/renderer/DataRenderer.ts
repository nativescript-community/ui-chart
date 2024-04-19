import { Canvas, Paint } from '@nativescript-community/ui-canvas';
import Shape from '@nativescript-community/ui-canvas/shapes/shape';
import { Color, ImageSource } from '@nativescript/core';
import { ChartAnimator } from '../animation/ChartAnimator';
import { Chart } from '../charts/Chart';
import { DataSet } from '../data/DataSet';
import { Highlight } from '../highlight/Highlight';
import { ChartInterface } from '../interfaces/dataprovider/ChartInterface';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Renderer } from './Renderer';

export interface BaseCustomRenderer {
    drawIcon?<T>(c: Canvas, chart: Chart<any, any, any>, dataSet: DataSet<any>, dataSetIndex: number, entry: T, entryIndex: number, icon: ImageSource | Shape, x: number, y: number): unknown;
    drawValue?: <T>(
        c: Canvas,
        chart: Chart<any, any, any>,
        dataSet: DataSet<any>,
        dataSetIndex: number,
        entry: T,
        entryIndex: number,
        valueText: string,
        x: number,
        y: number,
        color: string | Color,
        paint: Paint
    ) => void;
}

/**
 * Superclass of all render classes for the different data types (line, bar, ...).
 *

 */
export abstract class DataRenderer extends Renderer {
    /**
     * the animator object used to perform animations on the chart data
     */
    animator: ChartAnimator;

    /**
     * main palet object used for rendering
     */
    protected mRenderPaint: Paint;

    /**
     * palet used for highlighting values
     */
    protected mHighlightPaint: Paint;

    /**
     * palet object for drawing values (text representing values of chart
     * entries)
     */
    protected mValuePaint: Paint;

    constructor(animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(viewPortHandler);
        this.animator = animator;
    }

    public initBuffers() {}

    public get renderPaint() {
        if (!this.mRenderPaint) {
            this.mRenderPaint = Utils.getTemplatePaint('black-fill');
        }
        return this.mRenderPaint;
    }

    public get highlightPaint() {
        if (!this.mHighlightPaint) {
            this.mHighlightPaint = Utils.getTemplatePaint('black-stroke');
            this.mHighlightPaint.setStrokeWidth(2);
            this.mHighlightPaint.setColor('#FFBB73');
        }
        return this.mHighlightPaint;
    }

    public get valuePaint() {
        if (!this.mValuePaint) {
            this.mValuePaint = Utils.getTemplatePaint('value');
        }
        return this.mValuePaint;
    }

    protected isDrawingValuesAllowed(chart: ChartInterface) {
        return chart.data.entryCount < chart.maxVisibleValueCount * this.mViewPortHandler.getScaleX();
    }

    /**
     * Applies the required styling (provided by the DataSet) to the value-paint
     * object.
     *
     * @param set
     */
    protected applyValueTextStyle(set: IDataSet<any>) {
        const typeface = set.valueTypeface;
        if (typeface) {
            this.valuePaint.setTypeface(typeface);
        }
        this.valuePaint.setTextSize(set.valueTextSize);
    }

    /**
     * Draws the actual data in form of lines, bars, ... depending on Renderer subclass.
     *
     * @param c
     */
    public abstract drawData(c: Canvas);

    /**
     * Loops over all Entrys and draws their values.
     *
     * @param c
     */
    public abstract drawValues(c: Canvas);

    /**
     * Draws the value of the given entry by using the provided IValueFormatter.
     *
     * @param c         canvas
     * @param entryIndex label to draw
     * @param entry label to draw
     * @param valueText label to draw
     * @param x         position
     * @param y         position
     * @param color
     * @param paint
     */
    public drawValue<T>(
        c: Canvas,
        chart: Chart<any, any, any>,
        dataSet: DataSet<any>,
        dataSetIndex: number,
        entry: T,
        entryIndex,
        valueText: string,
        x: number,
        y: number,
        color: string | Color,
        paint: Paint,
        customRender?: BaseCustomRenderer
    ) {
        if (valueText) {
            if (customRender && customRender.drawValue) {
                customRender.drawValue<T>(c, chart, dataSet, dataSetIndex, entry, entryIndex, valueText, x, y, color, paint);
            } else {
                paint.setColor(color);
                c.drawText(valueText, x, y, paint);
            }
        }
    }
    /**
     * Draws the icons of the given entry
     *
     * @param canvas         canvas
     * @param icon icon to draw
     * @param chart icon to draw
     * @param x         position
     * @param y         position
     * @param color
     * @param paint
     */
    public drawIcon<T>(
        canvas: Canvas,
        chart: Chart<any, any, any>,
        dataSet: DataSet<any>,
        dataSetIndex: number,
        entry: T,
        entryIndex: number,
        icon: ImageSource | Shape,
        x: number,
        y: number,
        customRender?: BaseCustomRenderer
    ) {
        if (icon) {
            if (customRender && customRender.drawIcon) {
                customRender.drawIcon<T>(canvas, chart, dataSet, dataSetIndex, entry, entryIndex, icon, x, y);
            } else {
                if (icon instanceof Shape) {
                    const availableWidth = canvas.getWidth();
                    const availableHeight = canvas.getHeight();
                    const width = icon.getWidth(availableWidth, availableHeight);
                    const height = icon.getHeight(availableWidth, availableHeight);
                    canvas.save();
                    canvas.translate(x - width / 2, y - height / 2);
                    icon.drawMyShapeOnCanvas(canvas, chart, availableWidth, availableHeight);
                    canvas.restore();
                } else {
                    const drawOffsetX = x - icon.width / 2;
                    const drawOffsetY = y - icon.height / 2;
                    canvas.drawBitmap(__ANDROID__ ? icon.android : icon, drawOffsetX, drawOffsetY, null);
                }
            }
        }
    }

    /**
     * Draws any kind of additional information (e.g. line-circles).
     *
     * @param c
     */
    public abstract drawExtras(c: Canvas);

    /**
     * Draws all highlight indicators for the values that are currently highlighted.
     *
     * @param c
     * @param indices the highlighted values
     * @param actualDraw whether to draw or not
     */
    public abstract drawHighlighted(c: Canvas, indices: Highlight[], actualDraw?: boolean);
}
