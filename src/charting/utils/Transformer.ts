import { Matrix, Path, Rect } from 'nativescript-canvas';
import { ViewPortHandler } from './ViewPortHandler';
import { Utils } from './Utils';
import { profile } from '@nativescript/core/profiling/profiling';

/**
 * Transformer class that contains all matrices and is responsible for
 * transforming values into pixels on the screen and backwards.
 *
 * @author Philipp Jahoda
 */
export class Transformer {
    /**
     * matrix to map the values to the screen pixels
     */
    protected mMatrixValueToPx = new Matrix();

    /**
     * matrix for handling the different offsets of the chart
     */
    protected mMatrixOffset = new Matrix();

    protected mViewPortHandler: ViewPortHandler;

    constructor(viewPortHandler: ViewPortHandler) {
        this.mViewPortHandler = viewPortHandler;
    }

    /**
     * Prepares the matrix that transforms values to pixels. Calculates the
     * scale factors from the charts size and offsets.
     *
     * @param xChartMin
     * @param deltaX
     * @param deltaY
     * @param yChartMin
     */
    public prepareMatrixValuePx(xChartMin, deltaX, deltaY, yChartMin) {
        let scaleX = this.mViewPortHandler.contentWidth() / deltaX;
        let scaleY = this.mViewPortHandler.contentHeight() / deltaY;
        if (!Number.isFinite(scaleX)) {
            scaleX = 0;
        }
        if (!Number.isFinite(scaleY)) {
            scaleY = 0;
        }

        // setup all matrices
        this.mMatrixValueToPx.reset();
        this.mMatrixValueToPx.postTranslate(-xChartMin, -yChartMin);
        this.mMatrixValueToPx.postScale(scaleX, -scaleY);
    }

    /**
     * Prepares the matrix that contains all offsets.
     *
     * @param inverted
     */
    public prepareMatrixOffset(inverted) {
        this.mMatrixOffset.reset();

        // offset.postTranslate(mOffsetLeft, getHeight() - this.mOffsetBottom);

        if (!inverted) this.mMatrixOffset.postTranslate(this.mViewPortHandler.offsetLeft(), this.mViewPortHandler.getChartHeight() - this.mViewPortHandler.offsetBottom());
        else {
            this.mMatrixOffset.setTranslate(this.mViewPortHandler.offsetLeft(), -this.mViewPortHandler.offsetTop());
            this.mMatrixOffset.postScale(1.0, -1.0);
        }
    }

    protected valuePointsForGenerateTransformedValuesScatter = [];

    /**
     * Transforms an List of Entry into a let array containing the x and
     * y values transformed with all matrices for the SCATTERCHART.
     *
     * @param data
     * @return
     */
    public fgenerateTransformedValuesScatter(data, phaseX, phaseY, from, to) {
        let count = ((to - from) * phaseX + 1) * 2;

        if (this.valuePointsForGenerateTransformedValuesScatter.length != count) {
            this.valuePointsForGenerateTransformedValuesScatter = [];
        }
        const valuePoints = this.valuePointsForGenerateTransformedValuesScatter;

        for (let j = 0; j < count; j += 2) {
            const e = data.getEntryForIndex(j / 2 + from);

            if (e != null) {
                valuePoints[j] = e.getX();
                valuePoints[j + 1] = e.getY() * phaseY;
            } else {
                valuePoints[j] = 0;
                valuePoints[j + 1] = 0;
            }
        }

        this.getValueToPixelMatrix().mapPoints(valuePoints);

        return valuePoints;
    }

    protected valuePointsForGenerateTransformedValuesBubble = [];

    /**
     * Transforms an List of Entry into a let array containing the x and
     * y values transformed with all matrices for the BUBBLECHART.
     *
     * @param data
     * @return
     */
    public generateTransformedValuesBubble(data, phaseY, from, to) {
        let count = (to - from + 1) * 2; //  Math.ceil((to - from) * phaseX) * 2;

        if (this.valuePointsForGenerateTransformedValuesBubble.length != count) {
            this.valuePointsForGenerateTransformedValuesBubble = [];
        }
        let valuePoints = this.valuePointsForGenerateTransformedValuesBubble;

        for (let j = 0; j < count; j += 2) {
            const e = data.getEntryForIndex(j / 2 + from);

            if (e != null) {
                valuePoints[j] = e.getX();
                valuePoints[j + 1] = e.getY() * phaseY;
            } else {
                valuePoints[j] = 0;
                valuePoints[j + 1] = 0;
            }
        }

        this.getValueToPixelMatrix().mapPoints(valuePoints);

        return valuePoints;
    }

    protected valuePointsForGenerateTransformedValuesLine = [];

    /**
     * Transforms an List of Entry into a let array containing the x and
     * y values transformed with all matrices for the LINECHART.
     *
     * @param data
     * @return
     */
    public generateTransformedValuesLine(data, phaseX, phaseY, min, max) {
        let count = ((max - min) * phaseX + 1) * 2;

        if (this.valuePointsForGenerateTransformedValuesLine.length != count) {
            this.valuePointsForGenerateTransformedValuesLine = [];
        }
        const valuePoints = this.valuePointsForGenerateTransformedValuesLine;

        for (let j = 0; j < count; j += 2) {
            const e = data.getEntryForIndex(j / 2 + min);

            if (e != null) {
                valuePoints[j] = e.getX();
                valuePoints[j + 1] = e.getY() * phaseY;
            } else {
                valuePoints[j] = 0;
                valuePoints[j + 1] = 0;
            }
        }

        this.getValueToPixelMatrix().mapPoints(valuePoints);

        return valuePoints;
    }

    protected valuePointsForGenerateTransformedValuesCandle = [];

    /**
     * Transforms an List of Entry into a let array containing the x and
     * y values transformed with all matrices for the CANDLESTICKCHART.
     *
     * @param data
     * @return
     */
    public generateTransformedValuesCandle(data, phaseX, phaseY, from, to) {
        let count = ((to - from) * phaseX + 1) * 2;

        if (this.valuePointsForGenerateTransformedValuesCandle.length != count) {
            this.valuePointsForGenerateTransformedValuesCandle = [];
        }
        const valuePoints = this.valuePointsForGenerateTransformedValuesCandle;

        for (let j = 0; j < count; j += 2) {
            const e = data.getEntryForIndex(j / 2 + from);

            if (e != null) {
                valuePoints[j] = e.getX();
                valuePoints[j + 1] = e.getHigh() * phaseY;
            } else {
                valuePoints[j] = 0;
                valuePoints[j + 1] = 0;
            }
        }

        this.getValueToPixelMatrix().mapPoints(valuePoints);

        return valuePoints;
    }

    /**
     * transform a path with all the given matrices VERY IMPORTANT: keep order
     * to value-touch-offset
     *
     * @param path
     */
    @profile
    public pathValueToPixel(path: Path) {
        path.transform(this.mMatrixValueToPx);
        path.transform(this.mViewPortHandler.getMatrixTouch());
        path.transform(this.mMatrixOffset);
    }

    /**
     * Transforms multiple paths will all matrices.
     *
     * @param paths
     */
    public pathValuesToPixel(paths: Path[]) {
        for (let i = 0; i < paths.length; i++) {
            this.pathValueToPixel(paths[i]);
        }
    }

    /**
     * Transform an array of points with all matrices. VERY IMPORTANT: Keep
     * matrix order "value-touch-offset" when transforming.
     *
     * @param pts
     */
    @profile
    public pointValuesToPixel(pts) {
        this.mMatrixValueToPx.mapPoints(pts);
        this.mViewPortHandler.getMatrixTouch().mapPoints(pts);
        this.mMatrixOffset.mapPoints(pts);

    }

    /**
     * Transform a rectangle with all matrices.
     *
     * @param r
     */
    public rectValueToPixel(r) {
        this.mMatrixValueToPx.mapRect(r);
        this.mViewPortHandler.getMatrixTouch().mapRect(r);
        this.mMatrixOffset.mapRect(r);
    }

    /**
     * Transform a rectangle with all matrices with potential animation phases.
     *
     * @param r
     * @param phaseY
     */
    public rectToPixelPhase(r: Rect, phaseY) {
        // multiply the height of the rect with the phase
        r.top *= phaseY;
        r.bottom *= phaseY;

        this.mMatrixValueToPx.mapRect(r);
        this.mViewPortHandler.getMatrixTouch().mapRect(r);
        this.mMatrixOffset.mapRect(r);
    }

    public rectToPixelPhaseHorizontal(r: Rect, phaseY) {
        // multiply the height of the rect with the phase
        r.left *= phaseY;
        r.right *= phaseY;

        this.mMatrixValueToPx.mapRect(r);
        this.mViewPortHandler.getMatrixTouch().mapRect(r);
        this.mMatrixOffset.mapRect(r);
    }

    /**
     * Transform a rectangle with all matrices with potential animation phases.
     *
     * @param r
     */
    // public rectValueToPixelHorizontal(r: Rect) {
    //     this.mMatrixValueToPx.mapRect(r);
    //     this.mViewPortHandler.getMatrixTouch().mapRect(r);
    //     this.mMatrixOffset.mapRect(r);
    // }

    /**
     * Transform a rectangle with all matrices with potential animation phases.
     *
     * @param r
     * @param phaseY
     */
    public rectValueToPixelHorizontal(r: Rect, phaseY?) {
        // multiply the height of the rect with the phase
        if (phaseY !== undefined) {
            r.left *= phaseY;
            r.right *= phaseY;
        }

        this.mMatrixValueToPx.mapRect(r);
        this.mViewPortHandler.getMatrixTouch().mapRect(r);
        this.mMatrixOffset.mapRect(r);
    }

    /**
     * transforms multiple rects with all matrices
     *
     * @param rects
     */
    public rectValuesToPixel(rects: Rect[]) {
        const m = this.getValueToPixelMatrix();

        for (let i = 0; i < rects.length; i++) m.mapRect(rects[i]);
    }

    protected mPixelToValueMatrixBuffer = new Matrix();

    /**
     * Transforms the given array of touch positions (pixels) (x, y, x, y, ...)
     * into values on the chart.
     *
     * @param pixels
     */
    public pixelsToValue(pixels: number[]) {
        // const nArray = Utils.arrayoNativeArray(pixels);
        const tmp = this.mPixelToValueMatrixBuffer;
        tmp.reset();
        // invert all matrixes to convert back to the original value
        this.mMatrixOffset.invert(tmp);
        tmp.mapPoints(pixels);

        this.mViewPortHandler.getMatrixTouch().invert(tmp);
        tmp.mapPoints(pixels);

        this.mMatrixValueToPx.invert(tmp);
        tmp.mapPoints(pixels);
        // if (nArray !== pixels) {
        //     for (let index = 0; index < pixels.length; index++) {
        //         pixels[index] = nArray[index];
        //     }
        // }
    }

    /**
     * buffer for performance
     */
    ptsBuffer = Array.create('float', 2);

    /**
     * Returns a recyclable MPPointD instance.
     * returns the x and y values in the chart at the given touch point
     * (encapsulated in a MPPointD). This method transforms pixel coordinates to
     * coordinates / values in the chart. This is the opposite method to
     * getPixelForValues(...).
     *
     * @param x
     * @param y
     * @return
     */

    public getValuesByTouchPoint(x, y, outputPoint?) {
        if (!outputPoint) {
            outputPoint = { x: 0, y: 0 };
        }
        this.ptsBuffer[0] = x;
        this.ptsBuffer[1] = y;

        this.pixelsToValue(this.ptsBuffer);
        outputPoint.x = this.ptsBuffer[0];
        outputPoint.y = this.ptsBuffer[1];
        return outputPoint;
    }

    /**
     * Returns a recyclable MPPointD instance.
     * Returns the x and y coordinates (pixels) for a given x and y value in the chart.
     *
     * @param x
     * @param y
     * @return
     */
    public getPixelForValues(x, y) {
        this.ptsBuffer[0] = x;
        this.ptsBuffer[1] = y;

        this.pointValuesToPixel(this.ptsBuffer);

        const xPx = this.ptsBuffer[0];
        const yPx = this.ptsBuffer[1];

        return { x: xPx, y: yPx };
    }

    public getValueMatrix() {
        return this.mMatrixValueToPx;
    }

    public getOffsetMatrix() {
        return this.mMatrixOffset;
    }

    private mMBuffer1 = new Matrix();

    public getValueToPixelMatrix() {
        this.mMBuffer1.set(this.mMatrixValueToPx);
        this.mMBuffer1.postConcat(this.mViewPortHandler.mMatrixTouch);
        this.mMBuffer1.postConcat(this.mMatrixOffset);
        return this.mMBuffer1;
    }

    private mMBuffer2 = new Matrix();

    public getPixelToValueMatrix() {
        this.getValueToPixelMatrix().invert(this.mMBuffer2);
        return this.mMBuffer2;
    }
}
