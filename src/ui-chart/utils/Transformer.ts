import { Matrix, Path, Rect } from '@nativescript-community/ui-canvas';
import { TypedArray } from '@nativescript-community/arraybuffers';
import { BubbleDataSet } from '../data/BubbleDataSet';
import { CandleDataSet } from '../data/CandleDataSet';
import { CandleEntry } from '../data/CandleEntry';
import { Entry } from '../data/Entry';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { Utils } from './Utils';
import { ViewPortHandler } from './ViewPortHandler';

/**
 * Transformer class that contains all matrices and is responsible for
 * transforming values into pixels on the screen and backwards.
 *

 */
export class Transformer {
    /**
     * matrix to map the values to the screen pixels
     */
    protected mMatrixValueToPx: Matrix = new Matrix();

    /**
     * matrix for handling the different offsets of the chart
     */
    protected mMatrixOffset: Matrix = new Matrix();

    protected mViewPortHandler: ViewPortHandler;

    protected mValuePointsForGenerateTransformedValuesScatter: TypedArray;
    protected mValuePointsForGenerateTransformedValuesCandle: TypedArray;
    protected mValuePointsForGenerateTransformedValues: TypedArray;
    protected mValuePointsForGenerateTransformedValuesBubble: TypedArray;

    private mMBuffer1 = new Matrix();
    private mMBuffer2 = new Matrix();

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
        let scaleX = this.mViewPortHandler.contentRect.width() / deltaX;
        let scaleY = this.mViewPortHandler.contentRect.height() / deltaY;
        if (!Number.isFinite(scaleX) || isNaN(scaleX)) {
            scaleX = 0;
        }
        if (!Number.isFinite(scaleY) || isNaN(scaleY)) {
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

        if (!inverted) this.mMatrixOffset.postTranslate(this.mViewPortHandler.offsetLeft, this.mViewPortHandler.chartHeight - this.mViewPortHandler.offsetBottom);
        else {
            this.mMatrixOffset.setTranslate(this.mViewPortHandler.offsetLeft, -this.mViewPortHandler.offsetTop);
            this.mMatrixOffset.postScale(1.0, -1.0);
        }
    }

    /**
     * Transforms an List of Entry into a let array containing the x and
     * y values transformed with all matrices for the SCATTERCHART.
     *
     * @param data
     * @return
     */
    public generateTransformedValuesScatter(dataSet: IDataSet<Entry>, phaseX, phaseY, from, to) {
        const count = ((to - from) * phaseX + 1) * 2;

        if (!this.mValuePointsForGenerateTransformedValuesScatter || this.mValuePointsForGenerateTransformedValuesScatter.length !== count) {
            this.mValuePointsForGenerateTransformedValuesScatter = Utils.createArrayBuffer(count);
        }
        const valuePoints = this.mValuePointsForGenerateTransformedValuesScatter;

        const yKey = dataSet.yProperty;
        for (let j = 0; j < count; j += 2) {
            const index = j / 2 + from;
            const e = dataSet.getEntryForIndex(index);

            if (e != null) {
                valuePoints[j] = dataSet.getEntryXValue(e, index);
                valuePoints[j + 1] = e[yKey] * phaseY;
            } else {
                valuePoints[j] = 0;
                valuePoints[j + 1] = 0;
            }
        }

        const points = Utils.pointsFromBuffer(valuePoints);
        this.mapPoints(this.getValueToPixelMatrix(), points);

        return { points, count };
    }

    /**
     * Transforms an List of Entry into a float array containing the x and
     * y values transformed with all matrices for the BUBBLECHART.
     *
     * @param data
     * @return
     */
    public generateTransformedValuesBubble(dataSet: BubbleDataSet, phaseY, from, to) {
        const count = (to - from + 1) * 2; // (int) Math.ceil((to - from) * phaseX) * 2;

        if (!this.mValuePointsForGenerateTransformedValuesScatter || this.mValuePointsForGenerateTransformedValuesBubble.length !== count) {
            this.mValuePointsForGenerateTransformedValuesBubble = Utils.createArrayBuffer(count);
        }
        const valuePoints = this.mValuePointsForGenerateTransformedValuesBubble;
        const yKey = dataSet.yProperty;
        for (let j = 0; j < count; j += 2) {
            const index = j / 2 + from;
            const e = dataSet.getEntryForIndex(index);

            if (e != null) {
                valuePoints[j] = dataSet.getEntryXValue(e, index);
                valuePoints[j + 1] = e[yKey] * phaseY;
            } else {
                valuePoints[j] = 0;
                valuePoints[j + 1] = 0;
            }
        }
        const points = Utils.pointsFromBuffer(valuePoints);
        this.mapPoints(this.getValueToPixelMatrix(), points);

        return { points, count };
    }

    /**
     * Transforms an List of Entry into a let array containing the x and
     * y values transformed with all matrices for the BUBBLECHART.
     *
     * @param data
     * @return
     */
    public generateTransformedValues(dataSet: IDataSet<Entry>, phaseX, phaseY, from, to) {
        const count = Math.ceil((to - from) * phaseX + 1) * 2;
        // let count = (to - from + 1) * 2; //  Math.ceil((to - from) * phaseX) * 2;

        if (!this.mValuePointsForGenerateTransformedValues || this.mValuePointsForGenerateTransformedValues.length < count) {
            this.mValuePointsForGenerateTransformedValues = Utils.createArrayBuffer(count);
        }
        // let valuePoints = this.valuePointsForGenerateTransformedValues;
        const valuePoints = this.mValuePointsForGenerateTransformedValues;

        const yKey = dataSet.yProperty;
        for (let j = 0; j < count; j += 2) {
            const index = j / 2 + from;
            const e = dataSet.getEntryForIndex(index);

            if (e) {
                valuePoints[j] = dataSet.getEntryXValue(e, index);
                valuePoints[j + 1] = e[yKey] * phaseY;
            } else {
                valuePoints[j] = 0;
                valuePoints[j + 1] = 0;
            }
        }
        const points = Utils.pointsFromBuffer(valuePoints);
        this.mapPoints(this.getValueToPixelMatrix(), points);

        return { points, count };
    }
    /**
     * Transforms an List of Entry into a let array containing the x and
     * y values transformed with all matrices for the CANDLESTICKCHART.
     *
     * @param data
     * @return
     */
    public generateTransformedValuesCandle(dataSet: CandleDataSet, phaseX, phaseY, from, to) {
        const count = ((to - from) * phaseX + 1) * 2;

        if (!this.mValuePointsForGenerateTransformedValuesCandle || this.mValuePointsForGenerateTransformedValuesCandle.length !== count) {
            this.mValuePointsForGenerateTransformedValuesCandle = Utils.createArrayBuffer(count);
        }
        const valuePoints = this.mValuePointsForGenerateTransformedValuesCandle;

        for (let j = 0, e: CandleEntry, index: number; j < count; j += 2) {
            index = j / 2 + from;
            e = dataSet.getEntryForIndex(index);

            const highProperty = dataSet.highProperty;
            if (e) {
                valuePoints[j] = dataSet.getEntryXValue(e, index);
                valuePoints[j + 1] = e[highProperty] * phaseY;
            } else {
                valuePoints[j] = 0;
                valuePoints[j + 1] = 0;
            }
        }
        const points = Utils.pointsFromBuffer(valuePoints);
        this.mapPoints(this.getValueToPixelMatrix(), points);

        return { points, count };
    }

    /**
     * transform a path with all the given matrices VERY IMPORTANT: keep order
     * to value-touch-offset
     *
     * @param path
     */
    public pathValueToPixel(path: Path) {
        const tmp = this.getValueToPixelMatrix();
        path.transform(tmp);
        // path.transform(this.mMatrixValueToPx);
        // path.transform(this.mViewPortHandler.getMatrixTouch());
        // path.transform(this.mMatrixOffset);
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

    public mapPoints(matrix: Matrix, pts: number[] | TypedArray) {
        if (__ANDROID__ && ArrayBuffer.isView(pts)) {
            matrix['mapPointsBuffer'](pts);
        } else {
            matrix.mapPoints(pts);
        }
    }

    /**
     * Transform an array of points with all matrices. VERY IMPORTANT: Keep
     * matrix order "value-touch-offset" when transforming.
     *
     * @param pts
     */
    public pointValuesToPixel(pts: number[] | TypedArray) {
        // this.mMatrixValueToPx.mapPoints(pts);
        // this.mViewPortHandler.getMatrixTouch().mapPoints(pts);
        // this.mMatrixOffset.mapPoints(pts);
        this.mapPoints(this.getValueToPixelMatrix(), pts);
    }

    /**
     * Transform a rectangle with all matrices.
     *
     * @param r
     */
    public rectValueToPixel(r) {
        // this.mMatrixValueToPx.mapRect(r);
        // this.mViewPortHandler.getMatrixTouch().mapRect(r);
        // this.mMatrixOffset.mapRect(r);

        const tmp = this.getValueToPixelMatrix();
        tmp.mapRect(r);
    }

    /**
     * Transform a rectangle with all matrices with potential animation phases.
     *
     * @param r
     * @param phaseY
     */
    public rectToPixelPhase(r: Rect, phaseY) {
        // multiply the height of the rect with the phase
        if (r.top > 0) {
            r.top = r.bottom + phaseY * (r.top - r.bottom);
        } else {
            r.bottom = r.top + phaseY * (r.bottom - r.top);
        }
        this.rectValueToPixel(r);
    }

    public rectToPixelPhaseHorizontal(r: Rect, phaseY) {
        // multiply the height of the rect with the phase
        if (r.left > 0) {
            r.left = r.right + phaseY * (r.left - r.right);
        } else {
            r.right = r.left + phaseY * (r.right - r.left);
        }
        this.rectValueToPixel(r);
    }

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
        this.rectValueToPixel(r);
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
    public pixelsToValue(pixels) {
        const tmp = this.getPixelToValueMatrix();
        this.mapPoints(tmp, pixels);
    }

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
        const buffer = Utils.getTempArray(2);
        buffer[0] = x;
        buffer[1] = y;

        this.pixelsToValue(buffer);
        outputPoint.x = buffer[0];
        outputPoint.y = buffer[1];
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
        const buffer = Utils.getTempArray(2);
        buffer[0] = x;
        buffer[1] = y;

        this.pointValuesToPixel(buffer);

        const xPx = buffer[0];
        const yPx = buffer[1];

        return { x: xPx, y: yPx };
    }

    public getValueMatrix() {
        return this.mMatrixValueToPx;
    }

    public getOffsetMatrix() {
        return this.mMatrixOffset;
    }

    public getValueToPixelMatrix() {
        this.mMBuffer1.set(this.mMatrixValueToPx);
        this.mMBuffer1.postConcat(this.mViewPortHandler.mMatrixTouch);
        this.mMBuffer1.postConcat(this.mMatrixOffset);
        return this.mMBuffer1;
    }

    public getPixelToValueMatrix() {
        this.getValueToPixelMatrix().invert(this.mMBuffer2);
        return this.mMBuffer2;
    }
}
