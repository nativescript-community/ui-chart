import { CanvasView, Matrix, Rect, RectF } from '@nativescript-community/ui-canvas';
import { Utils } from './Utils';

/**
 * Class that contains information about the charts current viewport settings, including offsets, scale & translation
 * levels, ...
 *
 * @author Philipp Jahoda
 */
export class ViewPortHandler {
    /**
     * matrix used for touch events
     */
    public mMatrixTouch = new Matrix();

    /**
     * this rectangle defines the area in which graph values can be drawn
     */
    protected mContentRect = new RectF(0.0, 0.0, 0.0, 0.0);

    protected mChartWidth = 0;
    protected mChartHeight = 0;

    /**
     * buffer for storing the 9 matrix values of a 3x3 matrix
     */
    protected matrixBuffer = Utils.createNativeArray(9);

    /**
     * buffer for storing the 9 matrix values of a 3x3 matrix regarding fit screen
     */
    protected valsBufferForFitScreen = Utils.createNativeArray(9);

    protected mCenterViewPortMatrixBuffer = new Matrix();

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
        const offsetLeft = this.offsetLeft();
        const offsetTop = this.offsetTop();
        const offsetRight = this.offsetRight();
        const offsetBottom = this.offsetBottom();

        this.mChartHeight = Math.round(height);
        this.mChartWidth = Math.round(width);
        this.restrainViewPort(offsetLeft, offsetTop, offsetRight, offsetBottom);
    }

    public hasChartDimens() {
        if (this.mChartHeight > 0 && this.mChartWidth > 0) return true;
        else return false;
    }

    public restrainViewPort(offsetLeft, offsetTop, offsetRight, offsetBottom) {
        this.mContentRect.set(offsetLeft, offsetTop, this.mChartWidth - offsetRight, this.mChartHeight - offsetBottom);
    }

    public offsetLeft() {
        return this.mContentRect.left;
    }

    public offsetRight() {
        return this.mChartWidth - this.mContentRect.right;
    }

    public offsetTop() {
        return this.mContentRect.top;
    }

    public offsetBottom() {
        return this.mChartHeight - this.mContentRect.bottom;
    }

    public contentTop() {
        return this.mContentRect.top;
    }

    public contentLeft() {
        return this.mContentRect.left;
    }

    public contentRight() {
        return this.mContentRect.right;
    }

    public contentBottom() {
        return this.mContentRect.bottom;
    }

    public contentWidth() {
        return this.mContentRect.width();
    }

    public contentHeight() {
        return this.mContentRect.height();
    }

    public getContentRect() {
        return this.mContentRect;
    }

    public getContentCenter() {
        return { x: this.mContentRect.centerX(), y: this.mContentRect.centerY() };
    }

    public getChartHeight() {
        return this.mChartHeight;
    }

    public getChartWidth() {
        return this.mChartWidth;
    }

    /**
     * Returns the smallest extension of the content rect (width or height).
     *
     * @return
     */
    public getSmallestContentExtension() {
        return Math.min(this.mContentRect.width(), this.mContentRect.height());
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
        outputMatrix.postScale(1.0, 1.0, 0.0, 0.0);
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

        const vals = this.valsBufferForFitScreen;
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
            outputMatrix = new Matrix();
        }
        outputMatrix.reset();
        outputMatrix.set(this.mMatrixTouch);
        const x = transformedPts[0] - this.offsetLeft();
        const y = transformedPts[1] - this.offsetTop();
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
    public centerViewPort(transformedPts, view: CanvasView) {
        const save = this.mCenterViewPortMatrixBuffer;
        save.reset();
        save.set(this.mMatrixTouch);

        const x = transformedPts[0] - this.offsetLeft();
        const y = transformedPts[1] - this.offsetTop();

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
        this.mMatrixTouch.set(newMatrix);

        // make sure scale and translation are within their bounds
        this.limitTransAndScale(this.mMatrixTouch, this.mContentRect);

        if (invalidate) chart.invalidate();

        newMatrix.set(this.mMatrixTouch);
        return newMatrix;
    }

    /**
     * limits the maximum scale and X translation of the given matrix
     *
     * @param matrix
     */
    public limitTransAndScale(matrix: Matrix, content: Rect) {
        // TODO: native buffer to be optimized (or rewrite matrix!)
        matrix.getValues(this.matrixBuffer);

        const curTransX = this.matrixBuffer[Matrix.MTRANS_X];
        const curScaleX = this.matrixBuffer[Matrix.MSCALE_X];

        const curTransY = this.matrixBuffer[Matrix.MTRANS_Y];
        const curScaleY = this.matrixBuffer[Matrix.MSCALE_Y];

        // min scale-x is 1
        this.mScaleX = Math.min(Math.max(this.mMinScaleX, curScaleX), this.mMaxScaleX);

        // min scale-y is 1
        this.mScaleY = Math.min(Math.max(this.mMinScaleY, curScaleY), this.mMaxScaleY);

        let width = 0;
        let height = 0;

        if (content != null) {
            width = content.width();
            height = content.height();
        }

        const maxTransX = -width * (this.mScaleX - 1);
        this.mTransX = Math.min(Math.max(curTransX, maxTransX - this.mTransOffsetX), this.mTransOffsetX);

        const maxTransY = height * (this.mScaleY - 1);
        this.mTransY = Math.max(Math.min(curTransY, maxTransY + this.mTransOffsetY), -this.mTransOffsetY);

        this.matrixBuffer[Matrix.MTRANS_X] = this.mTransX;
        this.matrixBuffer[Matrix.MSCALE_X] = this.mScaleX;

        this.matrixBuffer[Matrix.MTRANS_Y] = this.mTransY;
        this.matrixBuffer[Matrix.MSCALE_Y] = this.mScaleY;

        matrix.setValues(this.matrixBuffer);
    }

    /**
     * Sets the minimum scale factor for the x-axis
     *
     * @param xScale
     */
    public setMinimumScaleX(xScale) {
        if (xScale < 1) xScale = 1;

        this.mMinScaleX = xScale;

        this.limitTransAndScale(this.mMatrixTouch, this.mContentRect);
    }

    /**
     * Sets the maximum scale factor for the x-axis
     *
     * @param xScale
     */
    public setMaximumScaleX(xScale) {
        if (xScale === 0) xScale = Infinity;

        this.mMaxScaleX = xScale;

        this.limitTransAndScale(this.mMatrixTouch, this.mContentRect);
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

        this.limitTransAndScale(this.mMatrixTouch, this.mContentRect);
    }

    /**
     * Sets the minimum scale factor for the y-axis
     *
     * @param yScale
     */
    public setMinimumScaleY(yScale) {
        if (yScale < 1) yScale = 1;

        this.mMinScaleY = yScale;

        this.limitTransAndScale(this.mMatrixTouch, this.mContentRect);
    }

    /**
     * Sets the maximum scale factor for the y-axis
     *
     * @param yScale
     */
    public setMaximumScaleY(yScale) {
        if (yScale === 0) yScale = Infinity;

        this.mMaxScaleY = yScale;

        this.limitTransAndScale(this.mMatrixTouch, this.mContentRect);
    }

    public setMinMaxScaleY(minScaleY, maxScaleY) {
        if (minScaleY < 1) minScaleY = 1;

        if (maxScaleY === 0) maxScaleY = Infinity;

        this.mMinScaleY = minScaleY;
        this.mMaxScaleY = maxScaleY;

        this.limitTransAndScale(this.mMatrixTouch, this.mContentRect);
    }

    /**
     * Returns the charts-touch matrix used for translation and scale on touch.
     *
     * @return
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
        return this.mContentRect.left <= x + 1;
    }

    public isInBoundsRight(x) {
        x = (x * 100) / 100;
        return this.mContentRect.right >= x - 1;
    }

    public isInBoundsTop(y) {
        return this.mContentRect.top <= y;
    }

    public isInBoundsBottom(y) {
        y = (y * 100) / 100;
        return this.mContentRect.bottom >= y;
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
     *
     * @return
     */
    public getTransX() {
        return this.mTransX;
    }

    /**
     * Returns the translation (drag / pan) distance on the y-axis
     *
     * @return
     */
    public getTransY() {
        return this.mTransY;
    }

    /**
     * if the chart is fully zoomed out, return true
     *
     * @return
     */
    public isFullyZoomedOut() {
        return this.isFullyZoomedOutX() && this.isFullyZoomedOutY();
    }

    /**
     * Returns true if the chart is fully zoomed out on it's y-axis (vertical).
     *
     * @return
     */
    public isFullyZoomedOutY() {
        return !(this.mScaleY > this.mMinScaleY || this.mMinScaleY > 1);
    }

    /**
     * Returns true if the chart is fully zoomed out on it's x-axis
     * (horizontal).
     *
     * @return
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
        this.mTransOffsetX = Utils.convertDpToPixel(offset);
    }

    /**
     * Set an offset in dp that allows the user to drag the chart over it's
     * bounds on the y-axis.
     *
     * @param offset
     */
    public setDragOffsetY(offset) {
        this.mTransOffsetY = Utils.convertDpToPixel(offset);
    }

    /**
     * Returns true if both drag offsets (x and y) are zero or smaller.
     *
     * @return
     */
    public hasNoDragOffset() {
        return this.mTransOffsetX <= 0 && this.mTransOffsetY <= 0;
    }

    /**
     * Returns true if the chart is not yet fully zoomed out on the x-axis
     *
     * @return
     */
    public canZoomOutMoreX() {
        return this.mScaleX > this.mMinScaleX;
    }

    /**
     * Returns true if the chart is not yet fully zoomed in on the x-axis
     *
     * @return
     */
    public canZoomInMoreX() {
        return this.mScaleX < this.mMaxScaleX;
    }

    /**
     * Returns true if the chart is not yet fully zoomed out on the y-axis
     *
     * @return
     */
    public canZoomOutMoreY() {
        return this.mScaleY > this.mMinScaleY;
    }

    /**
     * Returns true if the chart is not yet fully zoomed in on the y-axis
     *
     * @return
     */
    public canZoomInMoreY() {
        return this.mScaleY < this.mMaxScaleY;
    }
}
