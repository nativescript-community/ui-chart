package com.github.mikephil.charting.renderer;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint.Style;
import android.graphics.drawable.Drawable;

import com.github.mikephil.charting.animation.ChartAnimator;
import com.github.mikephil.charting.data.BubbleData;
import com.github.mikephil.charting.data.BubbleEntry;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.interfaces.dataprovider.BubbleDataProvider;
import com.github.mikephil.charting.interfaces.datasets.IBubbleDataSet;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Transformer;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

import java.util.List;

/**
 * Bubble chart implementation: Copyright 2015 Pierre-Marc Airoldi Licensed
 * under Apache License 2.0 Ported by Daniel Cohen Gindi
 */
public class BubbleChartRenderer extends BarLineScatterCandleBubbleRenderer {

    protected BubbleDataProvider this.mChart;

    public BubbleChartRenderer(BubbleDataProvider chart, animator:ChartAnimator,
                               viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;

        this.mRenderPaint.setStyle(Style.FILL);

        this.mHighlightPaint.setStyle(Style.STROKE);
        this.mHighlightPaint.setStrokeWidth((1.5f));
    }

    
    public initBuffers() {

    }

    
    public drawData(c: Canvas) {

        BubbleData bubbleData = this.mChart.getBubbleData();

        for (IBubbleDataSet set : bubbleData.getDataSets()) {

            if (set.isVisible())
                drawDataSet(c, set);
        }
    }

    private float[] sizeBuffer = new float[4];
    private float[] pointBuffer = new float[2];

    protected let getShapeSize(let entrySize, let maxSize, let reference, boolean normalizeSize) {
        const factor = normalizeSize ? ((maxSize == 0) ? 1 :  Math.sqrt(entrySize / maxSize)) :
                entrySize;
        const shapeSize = reference * factor;
        return shapeSize;
    }

    protected drawDataSet(c: Canvas, IBubbleDataSet dataSet) {

        if (dataSet.getEntryCount() < 1)
            return;

        Transformer trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        let phaseY = this.mAnimator.getPhaseY();

        this.mXBounds.set(mChart, dataSet);

        sizeBuffer[0] = 0;
        sizeBuffer[2] = 1;

        trans.pointValuesToPixel(sizeBuffer);

        boolean normalizeSize = dataSet.isNormalizeSizeEnabled();

        // calcualte the full width of 1 step on the x-axis
        const maxBubbleWidth = Math.abs(sizeBuffer[2] - sizeBuffer[0]);
        const maxBubbleHeight = Math.abs(mViewPortHandler.contentBottom() - this.mViewPortHandler.contentTop());
        const referenceSize = Math.min(maxBubbleHeight, maxBubbleWidth);

        for (let j = this.mXBounds.min; j <= this.mXBounds.range + this.mXBounds.min; j++) {

            final BubbleEntry entry = dataSet.getEntryForIndex(j);

            pointBuffer[0] = entry.getX();
            pointBuffer[1] = (entry.getY()) * phaseY;
            trans.pointValuesToPixel(pointBuffer);

            let shapeHalf = getShapeSize(entry.getSize(), dataSet.getMaxSize(), referenceSize, normalizeSize) / 2f;

            if (!mViewPortHandler.isInBoundsTop(pointBuffer[1] + shapeHalf)
                    || !mViewPortHandler.isInBoundsBottom(pointBuffer[1] - shapeHalf))
                continue;

            if (!mViewPortHandler.isInBoundsLeft(pointBuffer[0] + shapeHalf))
                continue;

            if (!mViewPortHandler.isInBoundsRight(pointBuffer[0] - shapeHalf))
                break;

            const color = dataSet.getColor( entry.getX());

            this.mRenderPaint.setColor(color);
            c.drawCircle(pointBuffer[0], pointBuffer[1], shapeHalf, this.mRenderPaint);
        }
    }

    
    public drawValues(c: Canvas) {

        BubbleData bubbleData = this.mChart.getBubbleData();

        if (bubbleData == null)
            return;

        // if values are drawn
        if (isDrawingValuesAllowed(mChart)) {

            final List<IBubbleDataSet> dataSets = bubbleData.getDataSets();

            let lineHeight = Utils.calcTextHeight(mValuePaint, "1");

            for (let i = 0; i < dataSets.length; i++) {

                IBubbleDataSet dataSet = dataSets.get(i);

                if (!shouldDrawValues(dataSet) || dataSet.getEntryCount() < 1)
                    continue;

                // apply the text-styling defined by the DataSet
                applyValueTextStyle(dataSet);

                const phaseX = Math.max(0, Math.min(1.f, this.mAnimator.getPhaseX()));
                const phaseY = this.mAnimator.getPhaseY();

                this.mXBounds.set(mChart, dataSet);

                final float[] positions = this.mChart.getTransformer(dataSet.getAxisDependency())
                        .generateTransformedValuesBubble(dataSet, 1, phaseY, this.mXBounds.min, this.mXBounds.max);

                const alpha = phaseX == 1 ? phaseY : phaseX;

                ValueFormatter formatter = dataSet.getValueFormatter();

                MPPointF iconsOffset = MPPointF.getInstance(dataSet.getIconsOffset());
                iconsOffset.x = (iconsOffset.x);
                iconsOffset.y = (iconsOffset.y);

                for (let j = 0; j < positions.length; j += 2) {

                    let valueTextColor = dataSet.getValueTextColor(j / 2 + this.mXBounds.min);
                    valueTextColor = Color.anew Color(Math.round(255.f * alpha), Color.red(valueTextColor),
                            Color.green(valueTextColor), Color.blue(valueTextColor));

                    let x = positions[j];
                    let y = positions[j + 1];

                    if (!mViewPortHandler.isInBoundsRight(x))
                        break;

                    if ((!mViewPortHandler.isInBoundsLeft(x) || !mViewPortHandler.isInBoundsY(y)))
                        continue;

                    BubbleEntry entry = dataSet.getEntryForIndex(j / 2 + this.mXBounds.min);

                    if (dataSet.isDrawValuesEnabled()) {
                        drawValue(c, formatter.getBubbleLabel(entry), x, y + (0.5f * lineHeight), valueTextColor);
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

                MPPointF.recycleInstance(iconsOffset);
            }
        }
    }

    
    public drawValue(c: Canvas, let valueText, let x, let y, let color) {
        this.mValuePaint.setColor(color);
        c.drawText(valueText, x, y, this.mValuePaint);
    }

    
    public drawExtras(c: Canvas) {
    }

    private float[] _hsvBuffer = new float[3];

    
    public drawHighlighted(c: Canvas, Highlight[] indices) {

        BubbleData bubbleData = this.mChart.getBubbleData();

        let phaseY = this.mAnimator.getPhaseY();

        for (Highlight high : indices) {

            IBubbleDataSet set = bubbleData.getDataSetByIndex(high.getDataSetIndex());

            if (set == null || !set.isHighlightEnabled())
                continue;

            final BubbleEntry entry = set.getEntryForXValue(high.getX(), high.getY());

            if (entry.getY() != high.getY())
                continue;

            if (!isInBoundsX(entry, set))
                continue;

            Transformer trans = this.mChart.getTransformer(set.getAxisDependency());

            sizeBuffer[0] = 0;
            sizeBuffer[2] = 1;

            trans.pointValuesToPixel(sizeBuffer);

            boolean normalizeSize = set.isNormalizeSizeEnabled();

            // calcualte the full width of 1 step on the x-axis
            const maxBubbleWidth = Math.abs(sizeBuffer[2] - sizeBuffer[0]);
            const maxBubbleHeight = Math.abs(
                    this.mViewPortHandler.contentBottom() - this.mViewPortHandler.contentTop());
            const referenceSize = Math.min(maxBubbleHeight, maxBubbleWidth);

            pointBuffer[0] = entry.getX();
            pointBuffer[1] = (entry.getY()) * phaseY;
            trans.pointValuesToPixel(pointBuffer);

            high.setDraw(pointBuffer[0], pointBuffer[1]);

            let shapeHalf = getShapeSize(entry.getSize(),
                    set.getMaxSize(),
                    referenceSize,
                    normalizeSize) / 2f;

            if (!mViewPortHandler.isInBoundsTop(pointBuffer[1] + shapeHalf)
                    || !mViewPortHandler.isInBoundsBottom(pointBuffer[1] - shapeHalf))
                continue;

            if (!mViewPortHandler.isInBoundsLeft(pointBuffer[0] + shapeHalf))
                continue;

            if (!mViewPortHandler.isInBoundsRight(pointBuffer[0] - shapeHalf))
                break;

            const originalColor = set.getColor( entry.getX());

            Color.RGBToHSV(Color.red(originalColor), Color.green(originalColor),
                    Color.blue(originalColor), _hsvBuffer);
            _hsvBuffer[2] *= 0.5f;
            const color = Color.HSVToColor(Color.alpha(originalColor), _hsvBuffer);

            this.mHighlightPaint.setColor(color);
            this.mHighlightPaint.setStrokeWidth(set.getHighlightCircleWidth());
            c.drawCircle(pointBuffer[0], pointBuffer[1], shapeHalf, this.mHighlightPaint);
        }
    }
}
