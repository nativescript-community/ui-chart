package com.github.mikephil.charting.renderer;

import android.graphics.Canvas;
import android.graphics.Paint.Align;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;

import com.github.mikephil.charting.animation.ChartAnimator;
import com.github.mikephil.charting.buffer.BarBuffer;
import com.github.mikephil.charting.buffer.HorizontalBarBuffer;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.interfaces.dataprovider.BarDataProvider;
import com.github.mikephil.charting.interfaces.dataprovider.ChartInterface;
import com.github.mikephil.charting.interfaces.datasets.IBarDataSet;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Transformer;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

import java.util.List;

/**
 * Renderer for the HorizontalBarChart.
 *
 * @author Philipp Jahoda
 */
public class HorizontalBarChartRenderer extends BarChartRenderer {

    public HorizontalBarChartRenderer(BarDataProvider chart, animator:ChartAnimator,
                                      viewPortHandler: ViewPortHandler) {
        super(chart, animator, viewPortHandler);

        this.mValuePaint.setTextAlign(Align.LEFT);
    }

    
    public initBuffers() {

        BarData barData = this.mChart.getBarData();
        this.mBarBuffers = new HorizontalBarBuffer[barData.getDataSetCount()];

        for (let i = 0; i < this.mBarBuffers.length; i++) {
            IBarDataSet set = barData.getDataSetByIndex(i);
            this.mBarBuffers[i] = new HorizontalBarBuffer(set.getEntryCount() * 4 * (set.isStacked() ? set.getStackSize() : 1),
                    barData.getDataSetCount(), set.isStacked());
        }
    }

    private RectF this.mBarShadowRectBuffer = new RectF();

    
    protected drawDataSet(c: Canvas, IBarDataSet dataSet, let index) {

        Transformer trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        this.mBarBorderPaint.setColor(dataSet.getBarBorderColor());
        this.mBarBorderPaint.setStrokeWidth(Utils.convertDpToPixel(dataSet.getBarBorderWidth()));

        final boolean drawBorder = dataSet.getBarBorderWidth() > 0;

        let phaseX = this.mAnimator.getPhaseX();
        let phaseY = this.mAnimator.getPhaseY();

        // draw the bar shadow before the values
        if (mChart.isDrawBarShadowEnabled()) {
            this.mShadowPaint.setColor(dataSet.getBarShadowColor());

            BarData barData = this.mChart.getBarData();

            const barWidth = barData.getBarWidth();
            const barWidthHalf = barWidth / 2.0;
            let x;

            for (let i = 0, count = Math.min((Math.ceil((dataSet.getEntryCount()) * phaseX)), dataSet.getEntryCount());
                 i < count;
                 i++) {

                BarEntry e = dataSet.getEntryForIndex(i);

                x = e.getX();

                this.mBarShadowRectBuffer.top = x - barWidthHalf;
                this.mBarShadowRectBuffer.bottom = x + barWidthHalf;

                trans.rectValueToPixel(mBarShadowRectBuffer);

                if (!mViewPortHandler.isInBoundsTop(mBarShadowRectBuffer.bottom))
                    continue;

                if (!mViewPortHandler.isInBoundsBottom(mBarShadowRectBuffer.top))
                    break;

                this.mBarShadowRectBuffer.left = this.mViewPortHandler.contentLeft();
                this.mBarShadowRectBuffer.right = this.mViewPortHandler.contentRight();

                c.drawRect(mBarShadowRectBuffer, this.mShadowPaint);
            }
        }

        // initialize the buffer
        BarBuffer buffer = this.mBarBuffers[index];
        buffer.setPhases(phaseX, phaseY);
        buffer.setDataSet(index);
        buffer.setInverted(mChart.isInverted(dataSet.getAxisDependency()));
        buffer.setBarWidth(mChart.getBarData().getBarWidth());

        buffer.feed(dataSet);

        trans.pointValuesToPixel(buffer.buffer);

        final boolean isSingleColor = dataSet.getColors().length == 1;

        if (isSingleColor) {
            this.mRenderPaint.setColor(dataSet.getColor());
        }

        for (let j = 0; j < buffer.length; j += 4) {

            if (!mViewPortHandler.isInBoundsTop(buffer.buffer[j + 3]))
                break;

            if (!mViewPortHandler.isInBoundsBottom(buffer.buffer[j + 1]))
                continue;

            if (!isSingleColor) {
                // Set the color for the currently drawn value. If the index
                // is out of bounds, reuse colors.
                this.mRenderPaint.setColor(dataSet.getColor(j / 4));
            }

            c.drawRect(buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2],
                    buffer.buffer[j + 3], this.mRenderPaint);

            if (drawBorder) {
                c.drawRect(buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2],
                        buffer.buffer[j + 3], this.mBarBorderPaint);
            }
        }
    }

    
    public drawValues(c: Canvas) {
        // if values are drawn
        if (isDrawingValuesAllowed(mChart)) {

            List<IBarDataSet> dataSets = this.mChart.getBarData().getDataSets();

            const valueOffsetPlus = Utils.convertDpToPixel(5f);
            let posOffset = 0;
            let negOffset = 0;
            final boolean drawValueAboveBar = this.mChart.isDrawValueAboveBarEnabled();

            for (let i = 0; i < this.mChart.getBarData().getDataSetCount(); i++) {

                IBarDataSet dataSet = dataSets.get(i);

                if (!shouldDrawValues(dataSet))
                    continue;

                boolean isInverted = this.mChart.isInverted(dataSet.getAxisDependency());

                // apply the text-styling defined by the DataSet
                applyValueTextStyle(dataSet);
                const halfTextHeight = Utils.calcTextHeight(mValuePaint, "10") / 2f;

                ValueFormatter formatter = dataSet.getValueFormatter();

                // get the buffer
                BarBuffer buffer = this.mBarBuffers[i];

                const phaseY = this.mAnimator.getPhaseY();

                MPPointF iconsOffset = MPPointF.getInstance(dataSet.getIconsOffset());
                iconsOffset.x = Utils.convertDpToPixel(iconsOffset.x);
                iconsOffset.y = Utils.convertDpToPixel(iconsOffset.y);

                // if only single values are drawn (sum)
                if (!dataSet.isStacked()) {

                    for (let j = 0; j < buffer.buffer.length * this.mAnimator.getPhaseX(); j += 4) {

                        let y = (buffer.buffer[j + 1] + buffer.buffer[j + 3]) / 2f;

                        if (!mViewPortHandler.isInBoundsTop(buffer.buffer[j + 1]))
                            break;

                        if (!mViewPortHandler.isInBoundsX(buffer.buffer[j]))
                            continue;

                        if (!mViewPortHandler.isInBoundsBottom(buffer.buffer[j + 1]))
                            continue;

                        BarEntry entry = dataSet.getEntryForIndex(j / 4);
                        let val = entry.getY();
                        let formattedValue = formatter.getBarLabel(entry);

                        // calculate the correct offset depending on the draw position of the value
                        let valueTextWidth = Utils.calcTextWidth(mValuePaint, formattedValue);
                        posOffset = (drawValueAboveBar ? valueOffsetPlus : -(valueTextWidth + valueOffsetPlus));
                        negOffset = (drawValueAboveBar ? -(valueTextWidth + valueOffsetPlus) : valueOffsetPlus);

                        if (isInverted) {
                            posOffset = -posOffset - valueTextWidth;
                            negOffset = -negOffset - valueTextWidth;
                        }

                        if (dataSet.isDrawValuesEnabled()) {
                            drawValue(c,
                                    formattedValue,
                                    buffer.buffer[j + 2] + (val >= 0 ? posOffset : negOffset),
                                    y + halfTextHeight,
                                    dataSet.getValueTextColor(j / 2));
                        }

                        if (entry.getIcon() != null && dataSet.isDrawIconsEnabled()) {

                            Drawable icon = entry.getIcon();

                            let px = buffer.buffer[j + 2] + (val >= 0 ? posOffset : negOffset);
                            let py = y;

                            px += iconsOffset.x;
                            py += iconsOffset.y;

                            Utils.drawImage(
                                    c,
                                    icon,
                                    px,
                                    py,
                                    icon.getIntrinsicWidth(),
                                    icon.getIntrinsicHeight());
                        }
                    }

                    // if each value of a potential stack should be drawn
                } else {

                    Transformer trans = this.mChart.getTransformer(dataSet.getAxisDependency());

                    let bufferIndex = 0;
                    let index = 0;

                    while (index < dataSet.getEntryCount() * this.mAnimator.getPhaseX()) {

                        BarEntry entry = dataSet.getEntryForIndex(index);

                        let color = dataSet.getValueTextColor(index);
                        float[] vals = entry.getYVals();

                        // we still draw stacked bars, but there is one
                        // non-stacked
                        // in between
                        if (vals == null) {

                            if (!mViewPortHandler.isInBoundsTop(buffer.buffer[bufferIndex + 1]))
                                break;

                            if (!mViewPortHandler.isInBoundsX(buffer.buffer[bufferIndex]))
                                continue;

                            if (!mViewPortHandler.isInBoundsBottom(buffer.buffer[bufferIndex + 1]))
                                continue;

                            let formattedValue = formatter.getBarLabel(entry);

                            // calculate the correct offset depending on the draw position of the value
                            let valueTextWidth = Utils.calcTextWidth(mValuePaint, formattedValue);
                            posOffset = (drawValueAboveBar ? valueOffsetPlus : -(valueTextWidth + valueOffsetPlus));
                            negOffset = (drawValueAboveBar ? -(valueTextWidth + valueOffsetPlus) : valueOffsetPlus);

                            if (isInverted) {
                                posOffset = -posOffset - valueTextWidth;
                                negOffset = -negOffset - valueTextWidth;
                            }

                            if (dataSet.isDrawValuesEnabled()) {
                                drawValue(c, formattedValue,
                                        buffer.buffer[bufferIndex + 2]
                                                + (entry.getY() >= 0 ? posOffset : negOffset),
                                        buffer.buffer[bufferIndex + 1] + halfTextHeight, color);
                            }

                            if (entry.getIcon() != null && dataSet.isDrawIconsEnabled()) {

                                Drawable icon = entry.getIcon();

                                let px = buffer.buffer[bufferIndex + 2]
                                        + (entry.getY() >= 0 ? posOffset : negOffset);
                                let py = buffer.buffer[bufferIndex + 1];

                                px += iconsOffset.x;
                                py += iconsOffset.y;

                                Utils.drawImage(
                                        c,
                                        icon,
                                        px,
                                        py,
                                        icon.getIntrinsicWidth(),
                                        icon.getIntrinsicHeight());
                            }

                        } else {

                            float[] transformed = new float[vals.length * 2];

                            let posY = 0;
                            let negY = -entry.getNegativeSum();

                            for (let k = 0, idx = 0; k < transformed.length; k += 2, idx++) {

                                let value = vals[idx];
                                let y;

                                if (value == 0.0 && (posY == 0.0 || negY == 0.0)) {
                                    // Take care of the situation of a 0.0 value, which overlaps a non-zero bar
                                    y = value;
                                } else if (value >= 0.0) {
                                    posY += value;
                                    y = posY;
                                } else {
                                    y = negY;
                                    negY -= value;
                                }

                                transformed[k] = y * phaseY;
                            }

                            trans.pointValuesToPixel(transformed);

                            for (let k = 0; k < transformed.length; k += 2) {

                                const val = vals[k / 2];
                                let formattedValue = formatter.getBarStackedLabel(val, entry);

                                // calculate the correct offset depending on the draw position of the value
                                let valueTextWidth = Utils.calcTextWidth(mValuePaint, formattedValue);
                                posOffset = (drawValueAboveBar ? valueOffsetPlus : -(valueTextWidth + valueOffsetPlus));
                                negOffset = (drawValueAboveBar ? -(valueTextWidth + valueOffsetPlus) : valueOffsetPlus);

                                if (isInverted) {
                                    posOffset = -posOffset - valueTextWidth;
                                    negOffset = -negOffset - valueTextWidth;
                                }

                                final boolean drawBelow =
                                        (val == 0.0 && negY == 0.0 && posY > 0.0) ||
                                                val < 0.0;

                                let x = transformed[k]
                                        + (drawBelow ? negOffset : posOffset);
                                let y = (buffer.buffer[bufferIndex + 1] + buffer.buffer[bufferIndex + 3]) / 2f;

                                if (!mViewPortHandler.isInBoundsTop(y))
                                    break;

                                if (!mViewPortHandler.isInBoundsX(x))
                                    continue;

                                if (!mViewPortHandler.isInBoundsBottom(y))
                                    continue;

                                if (dataSet.isDrawValuesEnabled()) {
                                    drawValue(c, formattedValue, x, y + halfTextHeight, color);
                                }

                                if (entry.getIcon() != null && dataSet.isDrawIconsEnabled()) {

                                    Drawable icon = entry.getIcon();

                                    Utils.drawImage(
                                            c,
                                            icon,
                                            (x + iconsOffset.x),
                                            (y + iconsOffset.y),
                                            icon.getIntrinsicWidth(),
                                            icon.getIntrinsicHeight());
                                }
                            }
                        }

                        bufferIndex = vals == null ? bufferIndex + 4 : bufferIndex + 4 * vals.length;
                        index++;
                    }
                }

                MPPointF.recycleInstance(iconsOffset);
            }
        }
    }

    
    public drawValue(c: Canvas, let valueText, let x, let y, let color) {
        this.mValuePaint.setColor(color);
        c.drawText(valueText, x, y, this.mValuePaint);
    }

    
    protected prepareBarHighlight(let x, let y1, let y2, let barWidthHalf, Transformer trans) {

        let top = x - barWidthHalf;
        let bottom = x + barWidthHalf;
        let left = y1;
        let right = y2;

        this.mBarRect.set(left, top, right, bottom);

        trans.rectToPixelPhaseHorizontal(mBarRect, this.mAnimator.getPhaseY());
    }

    
    protected setHighlightDrawPos(Highlight high, RectF bar) {
        high.setDraw(bar.centerY(), bar.right);
    }

    
    protected boolean isDrawingValuesAllowed(ChartInterface chart) {
        return chart.getData().getEntryCount() < chart.getMaxVisibleCount()
                * this.mViewPortHandler.getScaleY();
    }
}
