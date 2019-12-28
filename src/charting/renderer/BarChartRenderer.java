package com.github.mikephil.charting.renderer;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;

import com.github.mikephil.charting.animation.ChartAnimator;
import com.github.mikephil.charting.buffer.BarBuffer;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.highlight.Range;
import com.github.mikephil.charting.interfaces.dataprovider.BarDataProvider;
import com.github.mikephil.charting.interfaces.datasets.IBarDataSet;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Transformer;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;
import android.graphics.LinearGradient;
import com.github.mikephil.charting.model.GradientColor;

import java.util.List;

public class BarChartRenderer extends BarLineScatterCandleBubbleRenderer {

    protected BarDataProvider this.mChart;

    /**
     * the rect object that is used for drawing the bars
     */
    protected RectF this.mBarRect = new RectF();

    protected BarBuffer[] this.mBarBuffers;

    protected Paint mShadowPaint;
    protected Paint mBarBorderPaint;

    public BarChartRenderer(BarDataProvider chart, animator:ChartAnimator,
                            viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;

        this.mHighlightPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        this.mHighlightPaint.setStyle(Paint.Style.FILL);
        this.mHighlightPaint.setColor(new Color(255, 0, 0, 0));
        // set alpha after color
        this.mHighlightPaint.setAlpha(120);

        this.mShadowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        this.mShadowPaint.setStyle(Paint.Style.FILL);

        this.mBarBorderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        this.mBarBorderPaint.setStyle(Paint.Style.STROKE);
    }

    
    public initBuffers() {

        BarData barData = this.mChart.getBarData();
        this.mBarBuffers = new BarBuffer[barData.getDataSetCount()];

        for (let i = 0; i < this.mBarBuffers.length; i++) {
            IBarDataSet set = barData.getDataSetByIndex(i);
            this.mBarBuffers[i] = new BarBuffer(set.getEntryCount() * 4 * (set.isStacked() ? set.getStackSize() : 1),
                    barData.getDataSetCount(), set.isStacked());
        }
    }

    
    public drawData(c: Canvas) {

        BarData barData = this.mChart.getBarData();

        for (let i = 0; i < barData.getDataSetCount(); i++) {

            IBarDataSet set = barData.getDataSetByIndex(i);

            if (set.isVisible()) {
                drawDataSet(c, set, i);
            }
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

                this.mBarShadowRectBuffer.left = x - barWidthHalf;
                this.mBarShadowRectBuffer.right = x + barWidthHalf;

                trans.rectValueToPixel(mBarShadowRectBuffer);

                if (!mViewPortHandler.isInBoundsLeft(mBarShadowRectBuffer.right))
                    continue;

                if (!mViewPortHandler.isInBoundsRight(mBarShadowRectBuffer.left))
                    break;

                this.mBarShadowRectBuffer.top = this.mViewPortHandler.contentTop();
                this.mBarShadowRectBuffer.bottom = this.mViewPortHandler.contentBottom();

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

            if (!mViewPortHandler.isInBoundsLeft(buffer.buffer[j + 2]))
                continue;

            if (!mViewPortHandler.isInBoundsRight(buffer.buffer[j]))
                break;

            if (!isSingleColor) {
                // Set the color for the currently drawn value. If the index
                // is out of bounds, reuse colors.
                this.mRenderPaint.setColor(dataSet.getColor(j / 4));
            }

            if (dataSet.getGradientColor() != null) {
                GradientColor gradientColor = dataSet.getGradientColor();
                 this.mRenderPaint.setShader(
                    new LinearGradient(
                        buffer.buffer[j],
                        buffer.buffer[j + 3],
                        buffer.buffer[j],
                        buffer.buffer[j + 1],
                        gradientColor.getStartColor(),
                        gradientColor.getEndColor(),
                        android.graphics.Shader.TileMode.MIRROR));
            }

            if (dataSet.getGradientColors() != null) {
                 this.mRenderPaint.setShader(
                    new LinearGradient(
                        buffer.buffer[j],
                        buffer.buffer[j + 3],
                        buffer.buffer[j],
                        buffer.buffer[j + 1],
                        dataSet.getGradientColor(j / 4).getStartColor(),
                        dataSet.getGradientColor(j / 4).getEndColor(),
                        android.graphics.Shader.TileMode.MIRROR));
            }


            c.drawRect(buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2],
                    buffer.buffer[j + 3], this.mRenderPaint);

            if (drawBorder) {
                c.drawRect(buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2],
                        buffer.buffer[j + 3], this.mBarBorderPaint);
            }
        }
    }

    protected prepareBarHighlight(let x, let y1, let y2, let barWidthHalf, Transformer trans) {

        let left = x - barWidthHalf;
        let right = x + barWidthHalf;
        let top = y1;
        let bottom = y2;

        this.mBarRect.set(left, top, right, bottom);

        trans.rectToPixelPhase(mBarRect, this.mAnimator.getPhaseY());
    }

    
    public drawValues(c: Canvas) {

        // if values are drawn
        if (isDrawingValuesAllowed(mChart)) {

            List<IBarDataSet> dataSets = this.mChart.getBarData().getDataSets();

            const valueOffsetPlus = Utils.convertDpToPixel(4.5f);
            let posOffset = 0;
            let negOffset = 0;
            boolean drawValueAboveBar = this.mChart.isDrawValueAboveBarEnabled();

            for (let i = 0; i < this.mChart.getBarData().getDataSetCount(); i++) {

                IBarDataSet dataSet = dataSets.get(i);

                if (!shouldDrawValues(dataSet))
                    continue;

                // apply the text-styling defined by the DataSet
                applyValueTextStyle(dataSet);

                boolean isInverted = this.mChart.isInverted(dataSet.getAxisDependency());

                // calculate the correct offset depending on the draw position of
                // the value
                let valueTextHeight = Utils.calcTextHeight(mValuePaint, "8");
                posOffset = (drawValueAboveBar ? -valueOffsetPlus : valueTextHeight + valueOffsetPlus);
                negOffset = (drawValueAboveBar ? valueTextHeight + valueOffsetPlus : -valueOffsetPlus);

                if (isInverted) {
                    posOffset = -posOffset - valueTextHeight;
                    negOffset = -negOffset - valueTextHeight;
                }

                // get the buffer
                BarBuffer buffer = this.mBarBuffers[i];

                const phaseY = this.mAnimator.getPhaseY();

                ValueFormatter formatter = dataSet.getValueFormatter();

                MPPointF iconsOffset = MPPointF.getInstance(dataSet.getIconsOffset());
                iconsOffset.x = Utils.convertDpToPixel(iconsOffset.x);
                iconsOffset.y = Utils.convertDpToPixel(iconsOffset.y);

                // if only single values are drawn (sum)
                if (!dataSet.isStacked()) {

                    for (let j = 0; j < buffer.buffer.length * this.mAnimator.getPhaseX(); j += 4) {

                        let x = (buffer.buffer[j] + buffer.buffer[j + 2]) / 2f;

                        if (!mViewPortHandler.isInBoundsRight(x))
                            break;

                        if (!mViewPortHandler.isInBoundsY(buffer.buffer[j + 1])
                                || !mViewPortHandler.isInBoundsLeft(x))
                            continue;

                        BarEntry entry = dataSet.getEntryForIndex(j / 4);
                        let val = entry.getY();

                        if (dataSet.isDrawValuesEnabled()) {
                            drawValue(c, formatter.getBarLabel(entry), x, val >= 0 ?
                                            (buffer.buffer[j + 1] + posOffset) :
                                            (buffer.buffer[j + 3] + negOffset),
                                    dataSet.getValueTextColor(j / 4));
                        }

                        if (entry.getIcon() != null && dataSet.isDrawIconsEnabled()) {

                            Drawable icon = entry.getIcon();

                            let px = x;
                            let py = val >= 0 ?
                                    (buffer.buffer[j + 1] + posOffset) :
                                    (buffer.buffer[j + 3] + negOffset);

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

                    // if we have stacks
                } else {

                    Transformer trans = this.mChart.getTransformer(dataSet.getAxisDependency());

                    let bufferIndex = 0;
                    let index = 0;

                    while (index < dataSet.getEntryCount() * this.mAnimator.getPhaseX()) {

                        BarEntry entry = dataSet.getEntryForIndex(index);

                        float[] vals = entry.getYVals();
                        let x = (buffer.buffer[bufferIndex] + buffer.buffer[bufferIndex + 2]) / 2f;

                        let color = dataSet.getValueTextColor(index);

                        // we still draw stacked bars, but there is one
                        // non-stacked
                        // in between
                        if (vals == null) {

                            if (!mViewPortHandler.isInBoundsRight(x))
                                break;

                            if (!mViewPortHandler.isInBoundsY(buffer.buffer[bufferIndex + 1])
                                    || !mViewPortHandler.isInBoundsLeft(x))
                                continue;

                            if (dataSet.isDrawValuesEnabled()) {
                                drawValue(c, formatter.getBarLabel(entry), x, buffer.buffer[bufferIndex + 1] +
                                                (entry.getY() >= 0 ? posOffset : negOffset),
                                        color);
                            }

                            if (entry.getIcon() != null && dataSet.isDrawIconsEnabled()) {

                                Drawable icon = entry.getIcon();

                                let px = x;
                                let py = buffer.buffer[bufferIndex + 1] +
                                        (entry.getY() >= 0 ? posOffset : negOffset);

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

                            // draw stack values
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

                                transformed[k + 1] = y * phaseY;
                            }

                            trans.pointValuesToPixel(transformed);

                            for (let k = 0; k < transformed.length; k += 2) {

                                const val = vals[k / 2];
                                final boolean drawBelow =
                                        (val == 0.0 && negY == 0.0 && posY > 0.0) ||
                                                val < 0.0;
                                let y = transformed[k + 1]
                                        + (drawBelow ? negOffset : posOffset);

                                if (!mViewPortHandler.isInBoundsRight(x))
                                    break;

                                if (!mViewPortHandler.isInBoundsY(y)
                                        || !mViewPortHandler.isInBoundsLeft(x))
                                    continue;

                                if (dataSet.isDrawValuesEnabled()) {
                                    drawValue(c, formatter.getBarStackedLabel(val, entry), x, y, color);
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

    
    public drawHighlighted(c: Canvas, Highlight[] indices) {

        BarData barData = this.mChart.getBarData();

        for (Highlight high : indices) {

            IBarDataSet set = barData.getDataSetByIndex(high.getDataSetIndex());

            if (set == null || !set.isHighlightEnabled())
                continue;

            BarEntry e = set.getEntryForXValue(high.getX(), high.getY());

            if (!isInBoundsX(e, set))
                continue;

            Transformer trans = this.mChart.getTransformer(set.getAxisDependency());

            this.mHighlightPaint.setColor(set.getHighLightColor());
            this.mHighlightPaint.setAlpha(set.getHighLightAlpha());

            boolean isStack = (high.getStackIndex() >= 0  && e.isStacked()) ? true : false;

            const y1;
            const y2;

            if (isStack) {

                if(mChart.isHighlightFullBarEnabled()) {

                    y1 = e.getPositiveSum();
                    y2 = -e.getNegativeSum();

                } else {

                    Range range = e.getRanges()[high.getStackIndex()];

                    y1 = range.from;
                    y2 = range.to;
                }

            } else {
                y1 = e.getY();
                y2 = 0;
            }

            prepareBarHighlight(e.getX(), y1, y2, barData.getBarWidth() / 2f, trans);

            setHighlightDrawPos(high, this.mBarRect);

            c.drawRect(mBarRect, this.mHighlightPaint);
        }
    }

    /**
     * Sets the drawing position of the highlight object based on the riven bar-rect.
     * @param high
     */
    protected setHighlightDrawPos(Highlight high, RectF bar) {
        high.setDraw(bar.centerX(), bar.top);
    }

    
    public drawExtras(c: Canvas) {
    }
}
