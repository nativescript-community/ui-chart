import { Canvas, Rect } from '@nativescript-community/ui-canvas';
import { ImageSource } from '@nativescript/core';
import { Chart } from '../charts/Chart';
import { Entry } from '../data/Entry';
import { Highlight } from '../highlight/Highlight';
import { MPPointF } from '../utils/MPPointF';
import { IMarker } from './IMarker';

/**
 * View that can be displayed when selecting values in the chart. Extend this class to provide custom layouts for your
 * markers.
 *

 */
class MarkerImage implements IMarker {
    private mOffset: MPPointF = { x: 0, y: 0 };
    private mOffset2: MPPointF = { x: 0, y: 0 };
    private mWeakChart: WeakRef<Chart<any, any, any>>;

    private mSize = { width: 0, height: 0 };
    private mDrawableBoundsCache = new Rect(0, 0, 0, 0);
    imageSource: ImageSource;

    /**
     * Constructor. Sets up the MarkerView with a custom layout resource.
     *
     * @param context
     * @param drawableResourceId the drawable resource to render
     */
    public MarkerImage(imageSource: ImageSource) {
        this.imageSource = imageSource;
        this.mDrawableBoundsCache.set(0, 0, imageSource.width, imageSource.height);
    }

    public set offset(offset: MPPointF) {
        this.mOffset = offset || { x: 0, y: 0 };
    }

    public get offset() {
        return this.mOffset;
    }

    public set size(size) {
        this.mSize = size || { width: 0, height: 0 };
    }

    public get size() {
        return this.mSize;
    }

    public set chartView(chart) {
        this.mWeakChart = new WeakRef(chart);
    }

    public get chartView() {
        return this.mWeakChart?.get();
    }

    public getOffsetForDrawingAtPoint(posX, posY) {
        const offset = this.offset;
        this.mOffset2.x = offset.x;
        this.mOffset2.y = offset.y;

        const chart = this.chartView;

        let width = this.mSize.width;
        let height = this.mSize.height;

        if (width === 0 && this.imageSource) {
            width = this.imageSource.width;
        }
        if (height === 0 && this.imageSource) {
            height = this.imageSource.height;
        }

        if (posX + this.mOffset2.x < 0) {
            this.mOffset2.x = -posX;
        } else if (chart && posX + width + this.mOffset2.x > chart.getMeasuredWidth()) {
            this.mOffset2.x = chart.getMeasuredWidth() - posX - width;
        }

        if (posY + this.mOffset2.y < 0) {
            this.mOffset2.y = -posY;
        } else if (chart && posY + height + this.mOffset2.y > chart.getMeasuredHeight()) {
            this.mOffset2.y = chart.getMeasuredHeight() - posY - height;
        }

        return this.mOffset2;
    }

    refreshContent(e: Entry, highlight: Highlight) {}

    public draw(c: Canvas, posX, posY) {
        if (this.imageSource == null) return;

        const offset = this.getOffsetForDrawingAtPoint(posX, posY);

        let width = this.mSize.width;
        let height = this.mSize.height;

        if (width === 0 && this.imageSource) {
            width = this.imageSource.width;
        }
        if (height === 0 && this.imageSource) {
            height = this.imageSource.height;
        }

        // this.mDrawable.copyBounds(mDrawableBoundsCache);
        // this.mDrawable.setBounds(
        //         this.mDrawableBoundsCache.left,
        //         this.mDrawableBoundsCache.top,
        //         this.mDrawableBoundsCache.left + width,
        //         this.mDrawableBoundsCache.top + height);

        // c.save();
        // translate to the correct position and draw
        // c.translate(posX + offset.x, posY + offset.y);
        c.drawBitmap(this.imageSource, this.mDrawableBoundsCache, new Rect(posX + offset.x, posY + offset.y, posX + offset.x + width, posY + offset.y + height), null);
        // c.restore();

        // this.mDrawable.setBounds(mDrawableBoundsCache);
    }
}
