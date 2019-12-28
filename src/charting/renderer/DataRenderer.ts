import { Renderer } from './Renderer';
import { Paint, Style, Align, Canvas, Cap, Join } from 'nativescript-canvas';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ChartAnimator } from '../animation/ChartAnimator';
import { Color } from '@nativescript/core/color/color';
import { Utils } from '../utils/Utils';
import { ChartInterface } from '../interfaces/dataprovider/ChartInterface';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { Highlight } from '../highlight/Highlight';

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

    protected mDrawPaint: Paint;

    /**
     * palet object for drawing values (text representing values of chart
     * entries)
     */
    protected mValuePaint: Paint;

    constructor(animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(viewPortHandler);
        this.mAnimator = animator;

        this.mRenderPaint = new Paint();
        this.mRenderPaint.setAntiAlias(true);
        this.mRenderPaint.setStyle(Style.FILL);
        // this.mRenderPaint.setStrokeCap(Cap.ROUND);
        // this.mRenderPaint.setStrokeJoin(Join.ROUND);

        this.mDrawPaint = new Paint();
        this.mDrawPaint.setDither(true);
        this.mValuePaint = new Paint();
        this.mValuePaint.setAntiAlias(true);
        this.mValuePaint.setColor(new Color(255, 63, 63, 63));
        this.mValuePaint.setTextAlign(Align.CENTER);
        this.mValuePaint.setTextSize(Utils.convertDpToPixel(9));

        this.mHighlightPaint = new Paint();
        this.mHighlightPaint.setAntiAlias(true);
        this.mHighlightPaint.setStyle(Style.STROKE);
        this.mHighlightPaint.setStrokeWidth(2);
        this.mHighlightPaint.setColor(new Color(255, 255, 187, 115));
    }

    protected isDrawingValuesAllowed(chart: ChartInterface) {
        return chart.getData().getEntryCount() < chart.getMaxVisibleCount() * this.mViewPortHandler.getScaleX();
    }

    /**
     * Returns the Paint object this renderer uses for drawing the values
     * (value-text).
     *
     * @return
     */
    public getPaintValues() {
        return this.mValuePaint;
    }

    /**
     * Returns the Paint object this renderer uses for drawing highlight
     * indicators.
     *
     * @return
     */
    public getPaintHighlight() {
        return this.mHighlightPaint;
    }

    /**
     * Returns the Paint object used for rendering.
     *
     * @return
     */
    public getPaintRender() {
        return this.mRenderPaint;
    }

    /**
     * Applies the required styling (provided by the DataSet) to the value-paint
     * object.
     *
     * @param set
     */
    protected applyValueTextStyle(set: IDataSet<any>) {
        this.mValuePaint.setTypeface(set.getValueTypeface());
        this.mValuePaint.setTextSize(set.getValueTextSize());
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
     */
    public abstract drawValue(c: Canvas, valueText, x, y, color);

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
     */
    public abstract drawHighlighted(c: Canvas, indices: Highlight[]);
}
