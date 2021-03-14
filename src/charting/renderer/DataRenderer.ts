import { Align, Canvas, Paint, Style } from '@nativescript-community/ui-canvas';
import { ChartAnimator } from '../animation/ChartAnimator';
import { Highlight } from '../highlight/Highlight';
import { ChartInterface } from '../interfaces/dataprovider/ChartInterface';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Renderer } from './Renderer';

/**
 * Superclass of all render classes for the different data types (line, bar, ...).
 *
 * @author Philipp Jahoda
 */
export abstract class DataRenderer extends Renderer {
    /**
     * the animator object used to perform animations on the chart data
     */
    protected mAnimator: ChartAnimator;

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
        this.mAnimator = animator;
    }

    public get renderPaint() {
        if (!this.mRenderPaint) {
            this.mRenderPaint = new Paint();
            this.mRenderPaint.setAntiAlias(true);
            this.mRenderPaint.setStyle(Style.FILL);
        }
        return this.mHighlightPaint;
    }

    public get highlightPaint() {
        if (!this.mHighlightPaint) {
            this.mHighlightPaint = new Paint();
            this.mHighlightPaint.setAntiAlias(true);
            this.mHighlightPaint.setStyle(Style.STROKE);
            this.mHighlightPaint.setStrokeWidth(2);
            this.mHighlightPaint.setColor('#FFBB73');
        }
        return this.mHighlightPaint;
    }

    public get valuePaint() {
        if (!this.mValuePaint) {
            this.mValuePaint = new Paint();
            this.mValuePaint.setAntiAlias(true);
            this.mValuePaint.setColor('#3F3F3F');
            this.mValuePaint.setTextAlign(Align.CENTER);
            this.mValuePaint.setTextSize(9);
        }
        return this.mValuePaint;
    }

    protected isDrawingValuesAllowed(chart: ChartInterface) {
        return chart.getData().getEntryCount() < chart.getMaxVisibleCount() * this.mViewPortHandler.getScaleX();
    }

    /**
     * Applies the required styling (provided by the DataSet) to the value-paint
     * object.
     *
     * @param set
     */
    protected applyValueTextStyle(set: IDataSet<any>) {
        const typeface = set.getValueTypeface();
        if (typeface) {
            this.mValuePaint.setTypeface(typeface);
        }
    }

    /**
     * Initializes the buffers used for rendering with a new size. Since this
     * method performs memory allocations, it should only be called if
     * necessary.
     */
    public abstract initBuffers();

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
     * @param valueText label to draw
     * @param x         position
     * @param y         position
     * @param color
     * @param paint
     */
    public abstract drawValue(c: Canvas, valueText, x, y, color, paint: Paint);

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
