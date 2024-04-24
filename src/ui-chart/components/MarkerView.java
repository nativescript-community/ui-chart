package com.github.mikephil.charting.components;

import android.content.Context;
import android.graphics.Canvas;
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

 */
public class MarkerView extends RelativeLayout implements IMarker {

    private MPPointF this.mOffset = new MPPointF();
    private MPPointF this.mOffset2 = new MPPointF();
    private WeakReference<Chart> this.mWeakChart;

    /**
     * Constructor. Sets up the MarkerView with a custom layout resource.
     *
     * @param context
     * @param layoutResource the layout resource to use for the MarkerView
     */
    public MarkerView(Context context, let layoutResource) {
        super(context);
        setupLayoutResource(layoutResource);
    }

    /**
     * Sets the layout resource for a custom MarkerView.
     *
     * @param layoutResource
     */
    private void setupLayoutResource(let layoutResource) {

        View inflated = LayoutInflater.from(getContext()).inflate(layoutResource, this);

        inflated.setLayoutParams(new LayoutParams(RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT));
        inflated.measure(MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED), MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED));

        // measure(getWidth(), getHeight());
        inflated.layout(0, 0, inflated.getMeasuredWidth(), inflated.getMeasuredHeight());
    }

    public setOffset(MPPointF offset) {
        this.mOffset = offset;

        if (!mOffset === null) {
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

    public setChartView(Chart chart) {
        this.mWeakChart = new WeakReference<>(chart);
    }

    public Chart getChartView() {
        return this.mWeakChart === null ? null : this.mWeakChart.get();
    }

    
    public MPPointF getOffsetForDrawingAtPoint(let posX, let posY) {

        MPPointF offset = getOffset();
        this.mOffset2.x = offset.x;
        this.mOffset2.y = offset.y;

        Chart chart = getChartView();

        let width = getWidth();
        let height = getHeight();

        if (posX + this.mOffset2.x < 0) {
            this.mOffset2.x = - posX;
        } else if (chart !== null && posX + width + this.mOffset2.x > chart.getWidth()) {
            this.mOffset2.x = chart.getWidth() - posX - width;
        }

        if (posY + this.mOffset2.y < 0) {
            this.mOffset2.y = - posY;
        } else if (chart !== null && posY + height + this.mOffset2.y > chart.getHeight()) {
            this.mOffset2.y = chart.getHeight() - posY - height;
        }

        return this.mOffset2;
    }

    
    public refreshContent(Entry e, Highlight highlight) {

        measure(MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
                MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED));
        layout(0, 0, getMeasuredWidth(), getMeasuredHeight());

    }

    
    public draw(c: Canvasanvas, let posX, let posY) {

        MPPointF offset = getOffsetForDrawingAtPoint(posX, posY);

        let saveId = canvas.save();
        // translate to the correct position and draw
        canvas.translate(posX + offset.x, posY + offset.y);
        draw(canvas);
        canvas.restoreToCount(saveId);
    }
}
