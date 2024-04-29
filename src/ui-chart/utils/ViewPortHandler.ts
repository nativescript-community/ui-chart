import { TypedArray } from '@nativescript-community/arraybuffers';
import { Trace } from '@nativescript/core';
import { CanvasView, Matrix, Rect, RectF } from '@nativescript-community/ui-canvas';
import { CLog, CLogTypes, Utils } from './Utils';

const EPSILON = 0.0001;
const LOG_TAG = 'ViewPortHandler';

/**
 * Class that contains information about the charts current viewport settings, including offsets, scale & translation
 * levels, ...
 *

 */
export class ViewPortHandler {
    /**
     * matrix used for touch events
     */
    public mMatrixTouch = new Matrix();

    /**
     * this rectangle defines the area in which graph values can be drawn
     */
    readonly contentRect = new RectF(0, 0, 0, 0);
    readonly chartRect = new RectF(0, 0, 0, 0);

    chartWidth = 0;
    chartHeight = 0;

    /**
     * buffer for storing the 9 matrix values of a 3x3 matrix
     */
    protected mMatrixBuffer: number[] | TypedArray;

    /**
     * minimum scale value on the y-axis
     */
    private mMinScaleY = 1;

    /**
     * maximum scale value on the y-axis
     */
    private mMaxScaleY = Infinity;

    /**
     * minimum scale value on the x-axis
     */
    private mMinScaleX = 1;

    /**
     * maximum scale value on the x-axis
     */
    private mMaxScaleX = Infinity;

    /**
     * contains the current scale factor of the x-axis
     */
    private mScaleX = 1;

    /**
     * contains the current scale factor of the y-axis
     */
    private mScaleY = 1;

    /**
     * current translation (drag distance) on the x-axis
     */
    private mTransX = 0;

    /**
     * current translation (drag distance) on the y-axis
     */
    private mTransY = 0;

    /**
     * offset that allows the chart to be dragged over its bounds on the x-axis
     */
    private mTransOffsetX = 0;

    /**
     * offset that allows the chart to be dragged over its bounds on the x-axis
     */
    private mTransOffsetY = 0;

    /**
     * Sets the width and height of the chart.
     *
     * @param width
     * @param height
     */
    public setChartDimens(width, height) {
        const offsetLeft = this.offsetLeft;
        const offsetTop = this.offsetTop;
        const offsetRight = this.offsetRight;
        const offsetBottom = this.offsetBottom;

        this.chartHeight = Math.round(height);
        this.chartWidth = Math.round(width);
        this.chartRect.set(0, 0, this.chartWidth, this.chartHeight);
        this.restrainViewPort(offsetLeft, offsetTop, offsetRight, offsetBottom);
    }

    public get hasChartDimens() {
        if (this.chartHeight > 0 && this.chartWidth > 0) return true;
        else return false;
    }

    public restrainViewPort(offsetLeft, offsetTop, offsetRight, offsetBottom) {
        this.contentRect.set(offsetLeft, offsetTop, this.chartWidth - offsetRight, this.chartHeight - offsetBottom);
    }

    public get offsetLeft() {
        return this.contentRect.left;
    }

    public get offsetRight() {
        return this.chartWidth - this.contentRect.right;
    }

    public get offsetTop() {
        return this.contentRect.top;
    }

    public get offsetBottom() {
        return this.chartHeight - this.contentRect.bottom;
    }

    public get contentTop() {
        return this.contentRect.top;
    }

    public get contentLeft() {
        return this.contentRect.left;
    }

    public get contentRight() {
        return this.contentRect.right;
    }

    public get contentBottom() {
        return this.contentRect.bottom;
    }

    public get contentCenter() {
        return { x: this.contentRect.centerX(), y: this.contentRect.centerY() };
    }

    /**
     * Returns the smallest extension of the content rect (width or height).
     */
    public get smallestContentExtension() {
        return Math.min(this.contentRect.width(), this.contentRect.height());
    }

    /**
     * ################ ################ ################ ################
     */
    /** CODE BELOW THIS RELATED TO SCALING AND GESTURES */

    /**
     * Zooms in by 1.4f, x and y are the coordinates (in pixels) of the zoom
     * center.
     *
     * @param x
     * @param y
     */
    public zoomIn(x, y, outputMatrix) {
        if (!outputMatrix) {
            outputMatrix = new Matrix();
        }
        outputMatrix.reset();
        outputMatrix.set(this.mMatrixTouch);
        outputMatrix.postScale(1.4, 1.4, x, y);
        return outputMatrix;
    }

    public zoomOut(x, y, outputMatrix) {
        if (!outputMatrix) {
            outputMatrix = new Matrix();
        }
        outputMatrix.reset();
        outputMatrix.set(this.mMatrixTouch);
        outputMatrix.postScale(0.7, 0.7, x, y);
        return outputMatrix;
    }

    /**
     * Zooms out to original size.
     * @param outputMatrix
     */
    public resetZoom(outputMatrix) {
        outputMatrix.reset();
        outputMatrix.set(this.mMatrixTouch);
        outputMatrix.postScale(1, 1, 0, 0);
    }

    /**
     * Post-scales by the specified scale factors.
     *
     * @param scaleX
     * @param scaleY
     * @return
     */
    public zoom(scaleX, scaleY, outputMatrix) {
        if (!outputMatrix) {
            outputMatrix = new Matrix();
        }
        outputMatrix.reset();
        outputMatrix.set(this.mMatrixTouch);
        outputMatrix.postScale(scaleX, scaleY);
        return outputMatrix;
    }

    /**
     * Post-scales by the specified scale factors. x and y is pivot.
     *
     * @param scaleX
     * @param scaleY
     * @param x
     * @param y
     * @return
     */
    public zoomAtPosition(scaleX, scaleY, x, y, outputMatrix: Matrix) {
        if (!outputMatrix) {
            outputMatrix = new Matrix();
        }
        outputMatrix.reset();
        outputMatrix.set(this.mMatrixTouch);
        outputMatrix.postScale(scaleX, scaleY, x, y);
        return outputMatrix;
    }

    /**
     * Sets the scale factor to the specified values.
     *
     * @param scaleX
     * @param scaleY
     * @return
     */
    public setZoom(scaleX, scaleY, outputMatrix) {
        if (!outputMatrix) {
            outputMatrix = new Matrix();
        }
        outputMatrix.reset();
        outputMatrix.set(this.mMatrixTouch);
        outputMatrix.setScale(scaleX, scaleY);
        return outputMatrix;
    }

    /**
     * Sets the scale factor to the specified values. x and y is pivot.
     *
     * @param scaleX
     * @param scaleY
     * @param x
     * @param y
     * @return
     */
    public setZoomAtPosition(scaleX, scaleY, x, y) {
        const save = new Matrix();
        save.set(this.mMatrixTouch);

        save.setScale(scaleX, scaleY, x, y);

        return save;
    }

    /**
     * Resets all zooming and dragging and makes the chart fit exactly it's
     * bounds.  Output Matrix is available for those who wish to cache the object.
     */
    public fitScreen(outputMatrix?) {
        if (!outputMatrix) {
            outputMatrix = new Matrix();
        }
        this.mMinScaleX = 1;
        this.mMinScaleY = 1;

        outputMatrix.set(this.mMatrixTouch);

        const vals = Utils.getTempArray(9);
        for (let i = 0; i < 9; i++) {
            vals[i] = 0;
        }

        outputMatrix.getValues(vals);

        // reset all translations and scaling
        vals[Matrix.MTRANS_X] = 0;
        vals[Matrix.MTRANS_Y] = 0;
        vals[Matrix.MSCALE_X] = 1;
        vals[Matrix.MSCALE_Y] = 1;

        outputMatrix.setValues(vals);
        return outputMatrix;
    }

    /**
     * Post-translates to the specified points.  Output matrix allows for caching objects.
     *
     * @param transformedPts
     * @return
     */
    public translate(transformedPts, outputMatrix?) {
        if (!outputMatrix) {
            outputMatrix = Utils.getTempMatrix();
        }
        outputMatrix.reset();
        outputMatrix.set(this.mMatrixTouch);
        const x = transformedPts[0] - this.offsetLeft;
        const y = transformedPts[1] - this.offsetTop;
        outputMatrix.postTranslate(-x, -y);
        return outputMatrix;
    }

    /**
     * Centers the viewport around the specified position (x-index and y-value)
     * in the chart. Centering the viewport outside the bounds of the chart is
     * not possible. Makes most sense in combination with the
     * setScaleMinima(...) method.
     *
     * @param transformedPts the position to center view viewport to
     * @param view
     * @return save
     */
    public centerViewPort(transformedPts: number[] | TypedArray, view: CanvasView) {
        const save = Utils.getTempMatrix();
        save.reset();
        save.set(this.mMatrixTouch);

        const x = transformedPts[0] - this.offsetLeft;
        const y = transformedPts[1] - this.offsetTop;

        save.postTranslate(-x, -y);

        this.refresh(save, view, true);
    }

    /**
     * call this method to refresh the graph with a given matrix
     *
     * @param newMatrix
     * @return
     */
    public refresh(newMatrix: Matrix, chart: CanvasView, invalidate) {
        if (Trace.isEnabled()) {
            CLog(CLogTypes.info, LOG_TAG, 'refresh:', newMatrix);
        }
        this.mMatrixTouch.set(newMatrix);

        // make sure scale and translation are within their bounds
        this.limitTransAndScale(this.mMatrixTouch, this.contentRect);

        if (invalidate) chart.invalidate();

        newMatrix.set(this.mMatrixTouch);
        return newMatrix;
    }

    public setScale(scaleX, scaleY) {
        if (!this.mMatrixBuffer) {
            this.mMatrixBuffer = Utils.createArrayBuffer(9);
        }
        const matrixBuffer = this.mMatrixBuffer;
        this.mMatrixTouch.getValues(matrixBuffer);
        const curTransX = matrixBuffer[Matrix.MTRANS_X];

        const curTransY = matrixBuffer[Matrix.MTRANS_Y];

        // min scale-x is 1
        this.mScaleX = Math.min(Math.max(this.mMinScaleX, scaleX), this.mMaxScaleX);

        // min scale-y is 1
        this.mScaleY = Math.min(Math.max(this.mMinScaleY, scaleY), this.mMaxScaleY);

        let width = 0;
        let height = 0;

        if (this.contentRect) {
            width = this.contentRect.width();
            height = this.contentRect.height();
        }

        const maxTransX = -width * (this.mScaleX - 1);
        this.mTransX = Math.min(Math.max(curTransX, maxTransX - this.mTransOffsetX), this.mTransOffsetX);

        const maxTransY = height * (this.mScaleY - 1);
        this.mTransY = Math.max(Math.min(curTransY, maxTransY + this.mTransOffsetY), -this.mTransOffsetY);

        matrixBuffer[Matrix.MTRANS_X] = this.mTransX;
        matrixBuffer[Matrix.MSCALE_X] = this.mScaleX;

        matrixBuffer[Matrix.MTRANS_Y] = this.mTransY;
        matrixBuffer[Matrix.MSCALE_Y] = this.mScaleY;
        this.mMatrixTouch.setValues(matrixBuffer);
    }

    get scaleX() {
        const matrixBuffer = this.mMatrixBuffer;
        this.mMatrixTouch.getValues(matrixBuffer);
        return matrixBuffer[Matrix.MSCALE_X];
    }

    get scaleY() {
        const matrixBuffer = this.mMatrixBuffer;
        this.mMatrixTouch.getValues(matrixBuffer);
        return matrixBuffer[Matrix.MSCALE_Y];
    }

    /**
     * limits the maximum scale and X translation of the given matrix
     *
     * @param matrix
     */
    public limitTransAndScale(matrix: Matrix, content: Rect) {
        if (!this.mMatrixBuffer) {
            this.mMatrixBuffer = Utils.createArrayBuffer(9);
        }
        const matrixBuffer = this.mMatrixBuffer;
        matrix.getValues(matrixBuffer);
        const curTransX = matrixBuffer[Matrix.MTRANS_X];
        const curScaleX = matrixBuffer[Matrix.MSCALE_X];

        const curTransY = matrixBuffer[Matrix.MTRANS_Y];
        const curScaleY = matrixBuffer[Matrix.MSCALE_Y];

        // min scale-x is 1
        this.mScaleX = Math.min(Math.max(this.mMinScaleX, curScaleX), this.mMaxScaleX);

        // min scale-y is 1
        this.mScaleY = Math.min(Math.max(this.mMinScaleY, curScaleY), this.mMaxScaleY);

        let width = 0;
        let height = 0;

        if (content) {
            width = content.width();
            height = content.height();
        }

        const maxTransX = -width * (this.mScaleX - 1);
        this.mTransX = Math.min(Math.max(curTransX, maxTransX - this.mTransOffsetX), this.mTransOffsetX);

        const maxTransY = height * (this.mScaleY - 1);
        this.mTransY = Math.max(Math.min(curTransY, maxTransY + this.mTransOffsetY), -this.mTransOffsetY);

        matrixBuffer[Matrix.MTRANS_X] = this.mTransX;
        matrixBuffer[Matrix.MSCALE_X] = this.mScaleX;

        matrixBuffer[Matrix.MTRANS_Y] = this.mTransY;
        matrixBuffer[Matrix.MSCALE_Y] = this.mScaleY;
        matrix.setValues(matrixBuffer);
    }

    /**
     * Sets the minimum scale factor for the x-axis
     *
     * @param xScale
     */
    public setMinimumScaleX(xScale) {
        if (xScale < 1) xScale = 1;

        this.mMinScaleX = xScale;

        this.limitTransAndScale(this.mMatrixTouch, this.contentRect);
    }

    /**
     * Sets the maximum scale factor for the x-axis
     *
     * @param xScale
     */
    public setMaximumScaleX(xScale) {
        if (xScale === 0) xScale = Infinity;

        this.mMaxScaleX = xScale;

        this.limitTransAndScale(this.mMatrixTouch, this.contentRect);
    }

    /**
     * Sets the minimum and maximum scale factors for the x-axis
     *
     * @param minScaleX
     * @param maxScaleX
     */
    public setMinMaxScaleX(minScaleX, maxScaleX) {
        if (minScaleX < 1) minScaleX = 1;

        if (maxScaleX === 0) maxScaleX = Infinity;

        this.mMinScaleX = minScaleX;
        this.mMaxScaleX = maxScaleX;

        this.limitTransAndScale(this.mMatrixTouch, this.contentRect);
    }

    /**
     * Sets the minimum scale factor for the y-axis
     *
     * @param yScale
     */
    public setMinimumScaleY(yScale) {
        if (yScale < 1) yScale = 1;

        this.mMinScaleY = yScale;

        this.limitTransAndScale(this.mMatrixTouch, this.contentRect);
    }

    /**
     * Sets the maximum scale factor for the y-axis
     *
     * @param yScale
     */
    public setMaximumScaleY(yScale) {
        if (yScale === 0) yScale = Infinity;

        this.mMaxScaleY = yScale;

        this.limitTransAndScale(this.mMatrixTouch, this.contentRect);
    }

    public setMinMaxScaleY(minScaleY, maxScaleY) {
        if (minScaleY < 1) minScaleY = 1;

        if (maxScaleY === 0) maxScaleY = Infinity;

        this.mMinScaleY = minScaleY;
        this.mMaxScaleY = maxScaleY;

        this.limitTransAndScale(this.mMatrixTouch, this.contentRect);
    }

    /**
     * Returns the charts-touch matrix used for translation and scale on touch.
     */
    public getMatrixTouch() {
        return this.mMatrixTouch;
    }

    /**
     * ################ ################ ################ ################
     */
    /**
     * BELOW METHODS FOR BOUNDS CHECK
     */
    public isInBoundsX(x) {
        return this.isInBoundsLeft(x) && this.isInBoundsRight(x);
    }

    public isInBoundsY(y) {
        return this.isInBoundsTop(y) && this.isInBoundsBottom(y);
    }

    public isInBounds(x, y) {
        return this.isInBoundsX(x) && this.isInBoundsY(y);
    }

    public isInBoundsLeft(x) {
        return this.contentRect.left - (x + 1) <= EPSILON;
    }

    public isInBoundsRight(x) {
        x = (x * 100) / 100;
        return this.contentRect.right - (x - 1) >= -EPSILON;
    }

    public isInBoundsTop(y) {
        return this.contentRect.top - y <= EPSILON;
    }

    public isInBoundsBottom(y) {
        y = (y * 100) / 100;
        return this.contentRect.bottom - y >= -EPSILON;
    }

    /**
     * returns the current x-scale factor
     */
    public getScaleX() {
        return this.mScaleX;
    }

    /**
     * returns the current y-scale factor
     */
    public getScaleY() {
        return this.mScaleY;
    }

    public getMinScaleX() {
        return this.mMinScaleX;
    }

    public getMaxScaleX() {
        return this.mMaxScaleX;
    }

    public getMinScaleY() {
        return this.mMinScaleY;
    }

    public getMaxScaleY() {
        return this.mMaxScaleY;
    }

    /**
     * Returns the translation (drag / pan) distance on the x-axis
     */
    public getTransX() {
        return this.mTransX;
    }

    /**
     * Returns the translation (drag / pan) distance on the y-axis
     */
    public getTransY() {
        return this.mTransY;
    }

    /**
     * if the chart is fully zoomed out, return true
     */
    public isFullyZoomedOut() {
        return this.isFullyZoomedOutX() && this.isFullyZoomedOutY();
    }

    /**
     * Returns true if the chart is fully zoomed out on it's y-axis (vertical).
     */
    public isFullyZoomedOutY() {
        return !(this.mScaleY > this.mMinScaleY || this.mMinScaleY > 1);
    }

    /**
     * Returns true if the chart is fully zoomed out on it's x-axis
     * (horizontal).
     */
    public isFullyZoomedOutX() {
        return !(this.mScaleX > this.mMinScaleX || this.mMinScaleX > 1);
    }

    /**
     * Set an offset in dp that allows the user to drag the chart over it's
     * bounds on the x-axis.
     *
     * @param offset
     */
    public setDragOffsetX(offset) {
        this.mTransOffsetX = offset;
    }

    /**
     * Set an offset in dp that allows the user to drag the chart over it's
     * bounds on the y-axis.
     *
     * @param offset
     */
    public setDragOffsetY(offset) {
        this.mTransOffsetY = offset;
    }

    /**
     * Returns true if both drag offsets (x and y) are zero or smaller.
     */
    public hasNoDragOffset() {
        return this.mTransOffsetX === 0 && this.mTransOffsetY === 0;
    }

    /**
     * Returns true if the chart is not yet fully zoomed out on the x-axis
     */
    public canZoomOutMoreX() {
        return this.mScaleX > this.mMinScaleX;
    }

    /**
     * Returns true if the chart is not yet fully zoomed in on the x-axis
     */
    public canZoomInMoreX() {
        return this.mScaleX < this.mMaxScaleX;
    }

    /**
     * Returns true if the chart is not yet fully zoomed out on the y-axis
     */
    public canZoomOutMoreY() {
        return this.mScaleY > this.mMinScaleY;
    }

    /**
     * Returns true if the chart is not yet fully zoomed in on the y-axis
     */
    public canZoomInMoreY() {
        return this.mScaleY < this.mMaxScaleY;
    }
}
