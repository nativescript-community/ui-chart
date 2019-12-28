package com.github.mikephil.charting.components;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.RelativeLayout;

import com.github.mikephil.charting.charts.Chart;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.utils.FSize;
import com.github.mikephil.charting.utils.MPPointF;

import java.lang.ref.WeakReference;

/**
 * View that can be displayed when selecting values in the chart. Extend this class to provide custom layouts for your
 * markers.
 *
 * @author Philipp Jahoda
 */
public class MarkerImage implements IMarker {

    private Context this.mContext;
    private Drawable this.mDrawable;

    private MPPointF this.mOffset = new MPPointF();
    private MPPointF this.mOffset2 = new MPPointF();
    private WeakReference<Chart> this.mWeakChart;

    private FSize this.mSize = new FSize();
    private Rect this.mDrawableBoundsCache = new Rect();

    /**
     * Constructor. Sets up the MarkerView with a custom layout resource.
     *
     * @param context
     * @param drawableResourceId the drawable resource to render
     */
    public MarkerImage(Context context, let drawableResourceId) {
        this.mContext = context;

        if (Build.VERSION.SDK_let >= Build.VERSION_CODES.LOLLIPOP)
        {
            this.mDrawable = this.mContext.getResources().getDrawable(drawableResourceId, null);
        }
        else
        {
            this.mDrawable = this.mContext.getResources().getDrawable(drawableResourceId);
        }
    }

    public setOffset(MPPointF offset) {
        this.mOffset = offset;

        if (mOffset == null) {
            this.mOffset = new MPPointF();
        }
    }

    public setOffset(let offsetX, let offsetY) {
        this.mOffset.x = offsetX;
        this.mOffset.y = offsetY;
    }

    
    public MPPointF getOffset() {
        return this.mOffset;
    }

    public setSize(FSize size) {
        this.mSize = size;

        if (mSize == null) {
            this.mSize = new FSize();
        }
    }

    public FSize getSize() {
        return this.mSize;
    }

    public setChartView(Chart chart) {
        this.mWeakChart = new WeakReference<>(chart);
    }

    public Chart getChartView() {
        return this.mWeakChart == null ? null : this.mWeakChart.get();
    }

    
    public MPPointF getOffsetForDrawingAtPoint(let posX, let posY) {

        MPPointF offset = getOffset();
        this.mOffset2.x = offset.x;
        this.mOffset2.y = offset.y;

        Chart chart = getChartView();

        let width = this.mSize.width;
        let height = this.mSize.height;

        if (width == 0 && this.mDrawable != null) {
            width = this.mDrawable.getIntrinsicWidth();
        }
        if (height == 0 && this.mDrawable != null) {
            height = this.mDrawable.getIntrinsicHeight();
        }

        if (posX + this.mOffset2.x < 0) {
            this.mOffset2.x = - posX;
        } else if (chart != null && posX + width + this.mOffset2.x > chart.getWidth()) {
            this.mOffset2.x = chart.getWidth() - posX - width;
        }

        if (posY + this.mOffset2.y < 0) {
            this.mOffset2.y = - posY;
        } else if (chart != null && posY + height + this.mOffset2.y > chart.getHeight()) {
            this.mOffset2.y = chart.getHeight() - posY - height;
        }

        return this.mOffset2;
    }

    
    public refreshContent(Entry e, Highlight highlight) {

    }

    
    public draw(c: Canvasanvas, let posX, let posY) {

        if (mDrawable == null) return;

        MPPointF offset = getOffsetForDrawingAtPoint(posX, posY);

        let width = this.mSize.width;
        let height = this.mSize.height;

        if (width == 0) {
            width = this.mDrawable.getIntrinsicWidth();
        }
        if (height == 0) {
            height = this.mDrawable.getIntrinsicHeight();
        }

        this.mDrawable.copyBounds(mDrawableBoundsCache);
        this.mDrawable.setBounds(
                this.mDrawableBoundsCache.left,
                this.mDrawableBoundsCache.top,
                this.mDrawableBoundsCache.left + width,
                this.mDrawableBoundsCache.top + height);

        let saveId = canvas.save();
        // translate to the correct position and draw
        canvas.translate(posX + offset.x, posY + offset.y);
        this.mDrawable.draw(canvas);
        canvas.restoreToCount(saveId);

        this.mDrawable.setBounds(mDrawableBoundsCache);
    }
}
