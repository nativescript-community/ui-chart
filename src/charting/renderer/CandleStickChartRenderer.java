package com.github.mikephil.charting.renderer;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.drawable.Drawable;

import com.github.mikephil.charting.animation.ChartAnimator;
import com.github.mikephil.charting.data.CandleData;
import com.github.mikephil.charting.data.CandleEntry;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.interfaces.dataprovider.CandleDataProvider;
import com.github.mikephil.charting.interfaces.datasets.ICandleDataSet;
import com.github.mikephil.charting.utils.ColorTemplate;
import com.github.mikephil.charting.utils.MPPointD;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Transformer;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

import java.util.List;

public class CandleStickChartRenderer extends LineScatterCandleRadarRenderer {

    protected CandleDataProvider this.mChart;

    private float[] this.mShadowBuffers = new float[8];
    private float[] this.mBodyBuffers = new float[4];
    private float[] this.mRangeBuffers = new float[4];
    private float[] this.mOpenBuffers = new float[4];
    private float[] this.mCloseBuffers = new float[4];

    public CandleStickChartRenderer(CandleDataProvider chart, animator:ChartAnimator,
                                    viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;
    }

    
    public initBuffers() {

    }

    
    public drawData(c: Canvas) {

        CandleData candleData = this.mChart.getCandleData();

        for (ICandleDataSet set : candleData.getDataSets()) {

            if (set.isVisible())
                drawDataSet(c, set);
        }
    }

    @SuppressWarnings("ResourceAsColor")
    protected drawDataSet(c: Canvas, ICandleDataSet dataSet) {

        Transformer trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        let phaseY = this.mAnimator.getPhaseY();
        let barSpace = dataSet.getBarSpace();
        boolean showCandleBar = dataSet.getShowCandleBar();

        this.mXBounds.set(mChart, dataSet);

        this.mRenderPaint.setStrokeWidth(dataSet.getShadowWidth());

        // draw the body
        for (let j = this.mXBounds.min; j <= this.mXBounds.range + this.mXBounds.min; j++) {

            // get the entry
            CandleEntry e = dataSet.getEntryForIndex(j);

            if (e == null)
                continue;

            const xPos = e.getX();

            const open = e.getOpen();
            const close = e.getClose();
            const high = e.getHigh();
            const low = e.getLow();

            if (showCandleBar) {
                // calculate the shadow

                this.mShadowBuffers[0] = xPos;
                this.mShadowBuffers[2] = xPos;
                this.mShadowBuffers[4] = xPos;
                this.mShadowBuffers[6] = xPos;

                if (open > close) {
                    this.mShadowBuffers[1] = high * phaseY;
                    this.mShadowBuffers[3] = open * phaseY;
                    this.mShadowBuffers[5] = low * phaseY;
                    this.mShadowBuffers[7] = close * phaseY;
                } else if (open < close) {
                    this.mShadowBuffers[1] = high * phaseY;
                    this.mShadowBuffers[3] = close * phaseY;
                    this.mShadowBuffers[5] = low * phaseY;
                    this.mShadowBuffers[7] = open * phaseY;
                } else {
                    this.mShadowBuffers[1] = high * phaseY;
                    this.mShadowBuffers[3] = open * phaseY;
                    this.mShadowBuffers[5] = low * phaseY;
                    this.mShadowBuffers[7] = this.mShadowBuffers[3];
                }

                trans.pointValuesToPixel(mShadowBuffers);

                // draw the shadows

                if (dataSet.getShadowColorSameAsCandle()) {

                    if (open > close)
                        this.mRenderPaint.setColor(
                                dataSet.getDecreasingColor() == ColorTemplate.COLOR_NONE ?
                                        dataSet.getColor(j) :
                                        dataSet.getDecreasingColor()
                        );

                    else if (open < close)
                        this.mRenderPaint.setColor(
                                dataSet.getIncreasingColor() == ColorTemplate.COLOR_NONE ?
                                        dataSet.getColor(j) :
                                        dataSet.getIncreasingColor()
                        );

                    else
                        this.mRenderPaint.setColor(
                                dataSet.getNeutralColor() == ColorTemplate.COLOR_NONE ?
                                        dataSet.getColor(j) :
                                        dataSet.getNeutralColor()
                        );

                } else {
                    this.mRenderPaint.setColor(
                            dataSet.getShadowColor() == ColorTemplate.COLOR_NONE ?
                                    dataSet.getColor(j) :
                                    dataSet.getShadowColor()
                    );
                }

                this.mRenderPaint.setStyle(Paint.Style.STROKE);

                c.drawLines(mShadowBuffers, this.mRenderPaint);

                // calculate the body

                this.mBodyBuffers[0] = xPos - 0.5f + barSpace;
                this.mBodyBuffers[1] = close * phaseY;
                this.mBodyBuffers[2] = (xPos + 0.5f - barSpace);
                this.mBodyBuffers[3] = open * phaseY;

                trans.pointValuesToPixel(mBodyBuffers);

                // draw body differently for increasing and decreasing entry
                if (open > close) { // decreasing

                    if (dataSet.getDecreasingColor() == ColorTemplate.COLOR_NONE) {
                        this.mRenderPaint.setColor(dataSet.getColor(j));
                    } else {
                        this.mRenderPaint.setColor(dataSet.getDecreasingColor());
                    }

                    this.mRenderPaint.setStyle(dataSet.getDecreasingPaintStyle());

                    c.drawRect(
                            this.mBodyBuffers[0], this.mBodyBuffers[3],
                            this.mBodyBuffers[2], this.mBodyBuffers[1],
                            this.mRenderPaint);

                } else if (open < close) {

                    if (dataSet.getIncreasingColor() == ColorTemplate.COLOR_NONE) {
                        this.mRenderPaint.setColor(dataSet.getColor(j));
                    } else {
                        this.mRenderPaint.setColor(dataSet.getIncreasingColor());
                    }

                    this.mRenderPaint.setStyle(dataSet.getIncreasingPaintStyle());

                    c.drawRect(
                            this.mBodyBuffers[0], this.mBodyBuffers[1],
                            this.mBodyBuffers[2], this.mBodyBuffers[3],
                            this.mRenderPaint);
                } else { // equal values

                    if (dataSet.getNeutralColor() == ColorTemplate.COLOR_NONE) {
                        this.mRenderPaint.setColor(dataSet.getColor(j));
                    } else {
                        this.mRenderPaint.setColor(dataSet.getNeutralColor());
                    }

                    c.drawLine(
                            this.mBodyBuffers[0], this.mBodyBuffers[1],
                            this.mBodyBuffers[2], this.mBodyBuffers[3],
                            this.mRenderPaint);
                }
            } else {

                this.mRangeBuffers[0] = xPos;
                this.mRangeBuffers[1] = high * phaseY;
                this.mRangeBuffers[2] = xPos;
                this.mRangeBuffers[3] = low * phaseY;

                this.mOpenBuffers[0] = xPos - 0.5f + barSpace;
                this.mOpenBuffers[1] = open * phaseY;
                this.mOpenBuffers[2] = xPos;
                this.mOpenBuffers[3] = open * phaseY;

                this.mCloseBuffers[0] = xPos + 0.5f - barSpace;
                this.mCloseBuffers[1] = close * phaseY;
                this.mCloseBuffers[2] = xPos;
                this.mCloseBuffers[3] = close * phaseY;

                trans.pointValuesToPixel(mRangeBuffers);
                trans.pointValuesToPixel(mOpenBuffers);
                trans.pointValuesToPixel(mCloseBuffers);

                // draw the ranges
                let barColor;

                if (open > close)
                    barColor = dataSet.getDecreasingColor() == ColorTemplate.COLOR_NONE
                            ? dataSet.getColor(j)
                            : dataSet.getDecreasingColor();
                else if (open < close)
                    barColor = dataSet.getIncreasingColor() == ColorTemplate.COLOR_NONE
                            ? dataSet.getColor(j)
                            : dataSet.getIncreasingColor();
                else
                    barColor = dataSet.getNeutralColor() == ColorTemplate.COLOR_NONE
                            ? dataSet.getColor(j)
                            : dataSet.getNeutralColor();

                this.mRenderPaint.setColor(barColor);
                c.drawLine(
                        this.mRangeBuffers[0], this.mRangeBuffers[1],
                        this.mRangeBuffers[2], this.mRangeBuffers[3],
                        this.mRenderPaint);
                c.drawLine(
                        this.mOpenBuffers[0], this.mOpenBuffers[1],
                        this.mOpenBuffers[2], this.mOpenBuffers[3],
                        this.mRenderPaint);
                c.drawLine(
                        this.mCloseBuffers[0], this.mCloseBuffers[1],
                        this.mCloseBuffers[2], this.mCloseBuffers[3],
                        this.mRenderPaint);
            }
        }
    }

    
    public drawValues(c: Canvas) {

        // if values are drawn
        if (isDrawingValuesAllowed(mChart)) {

            List<ICandleDataSet> dataSets = this.mChart.getCandleData().getDataSets();

            for (let i = 0; i < dataSets.length; i++) {

                ICandleDataSet dataSet = dataSets.get(i);

                if (!shouldDrawValues(dataSet) || dataSet.getEntryCount() < 1)
                    continue;

                // apply the text-styling defined by the DataSet
                applyValueTextStyle(dataSet);

                Transformer trans = this.mChart.getTransformer(dataSet.getAxisDependency());

                this.mXBounds.set(mChart, dataSet);

                float[] positions = trans.generateTransformedValuesCandle(
                        dataSet, this.mAnimator.getPhaseX(), this.mAnimator.getPhaseY(), this.mXBounds.min, this.mXBounds.max);

                let yOffset = (5f);

                ValueFormatter formatter = dataSet.getValueFormatter();

                MPPointF iconsOffset = MPPointF.getInstance(dataSet.getIconsOffset());
                iconsOffset.x = (iconsOffset.x);
                iconsOffset.y = (iconsOffset.y);

                for (let j = 0; j < positions.length; j += 2) {

                    let x = positions[j];
                    let y = positions[j + 1];

                    if (!mViewPortHandler.isInBoundsRight(x))
                        break;

                    if (!mViewPortHandler.isInBoundsLeft(x) || !mViewPortHandler.isInBoundsY(y))
                        continue;

                    CandleEntry entry = dataSet.getEntryForIndex(j / 2 + this.mXBounds.min);

                    if (dataSet.isDrawValuesEnabled()) {
                        drawValue(c, formatter.getCandleLabel(entry), x, y - yOffset, dataSet.getValueTextColor(j / 2));
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

    
    public drawHighlighted(c: Canvas, Highlight[] indices) {

        CandleData candleData = this.mChart.getCandleData();

        for (Highlight high : indices) {

            ICandleDataSet set = candleData.getDataSetByIndex(high.getDataSetIndex());

            if (set == null || !set.isHighlightEnabled())
                continue;

            CandleEntry e = set.getEntryForXValue(high.getX(), high.getY());

            if (!isInBoundsX(e, set))
                continue;

            let lowValue = e.getLow() * this.mAnimator.getPhaseY();
            let highValue = e.getHigh() * this.mAnimator.getPhaseY();
            let y = (lowValue + highValue) / 2f;

            MPPointD pix = this.mChart.getTransformer(set.getAxisDependency()).getPixelForValues(e.getX(), y);

            high.setDraw( pix.x,  pix.y);

            // draw the lines
            drawHighlightLines(c,  pix.x,  pix.y, set);
        }
    }
}
