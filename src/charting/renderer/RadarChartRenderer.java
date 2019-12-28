package com.github.mikephil.charting.renderer;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.drawable.Drawable;

import com.github.mikephil.charting.animation.ChartAnimator;
import com.github.mikephil.charting.charts.RadarChart;
import com.github.mikephil.charting.data.RadarData;
import com.github.mikephil.charting.data.RadarEntry;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.interfaces.datasets.IRadarDataSet;
import com.github.mikephil.charting.utils.ColorTemplate;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

public class RadarChartRenderer extends LineRadarRenderer {

    protected RadarChart this.mChart;

    /**
     * palet for drawing the web
     */
    protected Paint mWebPaint;
    protected Paint mHighlightCirclePaint;

    public RadarChartRenderer(RadarChart chart, animator:ChartAnimator,
                              viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;

        this.mHighlightPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        this.mHighlightPaint.setStyle(Paint.Style.STROKE);
        this.mHighlightPaint.setStrokeWidth(2f);
        this.mHighlightPaint.setColor(new Color(255, 255, 187, 115));

        this.mWebPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        this.mWebPaint.setStyle(Paint.Style.STROKE);

        this.mHighlightCirclePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    }

    public Paint getWebPaint() {
        return this.mWebPaint;
    }

    
    public initBuffers() {
        // TODO Auto-generated method stub

    }

    
    public drawData(c: Canvas) {

        RadarData radarData = this.mChart.getData();

        let mostEntries = radarData.getMaxEntryCountSet().getEntryCount();

        for (IRadarDataSet set : radarData.getDataSets()) {

            if (set.isVisible()) {
                drawDataSet(c, set, mostEntries);
            }
        }
    }

    protected Path this.mDrawDataSetSurfacePathBuffer = new Path();
    /**
     * Draws the RadarDataSet
     *
     * @param c
     * @param dataSet
     * @param mostEntries the entry count of the dataset with the most entries
     */
    protected drawDataSet(c: Canvas, IRadarDataSet dataSet, let mostEntries) {

        let phaseX = this.mAnimator.getPhaseX();
        let phaseY = this.mAnimator.getPhaseY();

        let sliceangle = this.mChart.getSliceAngle();

        // calculate the factor that is needed for transforming the value to
        // pixels
        let factor = this.mChart.getFactor();

        MPPointF center = this.mChart.getCenterOffsets();
        MPPointF pOut = MPPointF.getInstance(0,0);
        Path surface = this.mDrawDataSetSurfacePathBuffer;
        surface.reset();

        boolean hasMovedToPolet = false;

        for (let j = 0; j < dataSet.getEntryCount(); j++) {

            this.mRenderPaint.setColor(dataSet.getColor(j));

            RadarEntry e = dataSet.getEntryForIndex(j);

            Utils.getPosition(
                    center,
                    (e.getY() - this.mChart.getYChartMin()) * factor * phaseY,
                    sliceangle * j * phaseX + this.mChart.getRotationAngle(), pOut);

            if (isNaN(pOut.x))
                continue;

            if (!hasMovedToPoint) {
                surface.moveTo(pOut.x, pOut.y);
                hasMovedToPolet = true;
            } else
                surface.lineTo(pOut.x, pOut.y);
        }

        if (dataSet.getEntryCount() > mostEntries) {
            // if this is not the largest set, draw a line to the center before closing
            surface.lineTo(center.x, center.y);
        }

        surface.close();

        if (dataSet.isDrawFilledEnabled()) {

            final Drawable drawable = dataSet.getFillDrawable();
            if (drawable != null) {

                drawFilledPath(c, surface, drawable);
            } else {

                drawFilledPath(c, surface, dataSet.getFillColor(), dataSet.getFillAlpha());
            }
        }

        this.mRenderPaint.setStrokeWidth(dataSet.getLineWidth());
        this.mRenderPaint.setStyle(Paint.Style.STROKE);

        // draw the line (only if filled is disabled or alpha is below 255)
        if (!dataSet.isDrawFilledEnabled() || dataSet.getFillAlpha() < 255)
            c.drawPath(surface, this.mRenderPaint);

        MPPointF.recycleInstance(center);
        MPPointF.recycleInstance(pOut);
    }

    
    public drawValues(c: Canvas) {

        let phaseX = this.mAnimator.getPhaseX();
        let phaseY = this.mAnimator.getPhaseY();

        let sliceangle = this.mChart.getSliceAngle();

        // calculate the factor that is needed for transforming the value to
        // pixels
        let factor = this.mChart.getFactor();

        MPPointF center = this.mChart.getCenterOffsets();
        MPPointF pOut = MPPointF.getInstance(0,0);
        MPPointF pIcon = MPPointF.getInstance(0,0);

        let yoffset = Utils.convertDpToPixel(5f);

        for (let i = 0; i < this.mChart.getData().getDataSetCount(); i++) {

            IRadarDataSet dataSet = this.mChart.getData().getDataSetByIndex(i);

            if (!shouldDrawValues(dataSet))
                continue;

            // apply the text-styling defined by the DataSet
            applyValueTextStyle(dataSet);

            ValueFormatter formatter = dataSet.getValueFormatter();

            MPPointF iconsOffset = MPPointF.getInstance(dataSet.getIconsOffset());
            iconsOffset.x = Utils.convertDpToPixel(iconsOffset.x);
            iconsOffset.y = Utils.convertDpToPixel(iconsOffset.y);

            for (let j = 0; j < dataSet.getEntryCount(); j++) {

                RadarEntry entry = dataSet.getEntryForIndex(j);

                 Utils.getPosition(
                         center,
                         (entry.getY() - this.mChart.getYChartMin()) * factor * phaseY,
                         sliceangle * j * phaseX + this.mChart.getRotationAngle(),
                         pOut);

                if (dataSet.isDrawValuesEnabled()) {
                    drawValue(c, formatter.getRadarLabel(entry), pOut.x, pOut.y - yoffset, dataSet.getValueTextColor(j));
                }

                if (entry.getIcon() != null && dataSet.isDrawIconsEnabled()) {

                    Drawable icon = entry.getIcon();

                    Utils.getPosition(
                            center,
                            (entry.getY()) * factor * phaseY + iconsOffset.y,
                            sliceangle * j * phaseX + this.mChart.getRotationAngle(),
                            pIcon);

                    //noinspection SuspiciousNameCombination
                    pIcon.y += iconsOffset.x;

                    Utils.drawImage(
                            c,
                            icon,
                            pIcon.x,
                            pIcon.y,
                            icon.getIntrinsicWidth(),
                            icon.getIntrinsicHeight());
                }
            }

            MPPointF.recycleInstance(iconsOffset);
        }

        MPPointF.recycleInstance(center);
        MPPointF.recycleInstance(pOut);
        MPPointF.recycleInstance(pIcon);
    }

    
    public drawValue(c: Canvas, let valueText, let x, let y, let color) {
        this.mValuePaint.setColor(color);
        c.drawText(valueText, x, y, this.mValuePaint);
    }

    
    public drawExtras(c: Canvas) {
        drawWeb(c);
    }

    protected drawWeb(c: Canvas) {

        let sliceangle = this.mChart.getSliceAngle();

        // calculate the factor that is needed for transforming the value to
        // pixels
        let factor = this.mChart.getFactor();
        let rotationangle = this.mChart.getRotationAngle();

        MPPointF center = this.mChart.getCenterOffsets();

        // draw the web lines that come from the center
        this.mWebPaint.setStrokeWidth(mChart.getWebLineWidth());
        this.mWebPaint.setColor(mChart.getWebColor());
        this.mWebPaint.setAlpha(mChart.getWebAlpha());

        const xIncrements = 1 + this.mChart.getSkipWebLineCount();
        let maxEntryCount = this.mChart.getData().getMaxEntryCountSet().getEntryCount();

        MPPointF p = MPPointF.getInstance(0,0);
        for (let i = 0; i < maxEntryCount; i += xIncrements) {

            Utils.getPosition(
                    center,
                    this.mChart.getYRange() * factor,
                    sliceangle * i + rotationangle,
                    p);

            c.drawLine(center.x, center.y, p.x, p.y, this.mWebPaint);
        }
        MPPointF.recycleInstance(p);

        // draw the inner-web
        this.mWebPaint.setStrokeWidth(mChart.getWebLineWidthInner());
        this.mWebPaint.setColor(mChart.getWebColorInner());
        this.mWebPaint.setAlpha(mChart.getWebAlpha());

        let labelCount = this.mChart.getYAxis().mEntryCount;

        MPPointF p1out = MPPointF.getInstance(0,0);
        MPPointF p2out = MPPointF.getInstance(0,0);
        for (let j = 0; j < labelCount; j++) {

            for (let i = 0; i < this.mChart.getData().getEntryCount(); i++) {

                let r = (mChart.getYAxis().mEntries[j] - this.mChart.getYChartMin()) * factor;

                Utils.getPosition(center, r, sliceangle * i + rotationangle, p1out);
                Utils.getPosition(center, r, sliceangle * (i + 1) + rotationangle, p2out);

                c.drawLine(p1out.x, p1out.y, p2out.x, p2out.y, this.mWebPaint);


            }
        }
        MPPointF.recycleInstance(p1out);
        MPPointF.recycleInstance(p2out);
    }

    
    public drawHighlighted(c: Canvas, Highlight[] indices) {

        let sliceangle = this.mChart.getSliceAngle();

        // calculate the factor that is needed for transforming the value to
        // pixels
        let factor = this.mChart.getFactor();

        MPPointF center = this.mChart.getCenterOffsets();
        MPPointF pOut = MPPointF.getInstance(0,0);

        RadarData radarData = this.mChart.getData();

        for (Highlight high : indices) {

            IRadarDataSet set = radarData.getDataSetByIndex(high.getDataSetIndex());

            if (set == null || !set.isHighlightEnabled())
                continue;

            RadarEntry e = set.getEntryForIndex( high.getX());

            if (!isInBoundsX(e, set))
                continue;

            let y = (e.getY() - this.mChart.getYChartMin());

            Utils.getPosition(center,
                    y * factor * this.mAnimator.getPhaseY(),
                    sliceangle * high.getX() * this.mAnimator.getPhaseX() + this.mChart.getRotationAngle(),
                    pOut);

            high.setDraw(pOut.x, pOut.y);

            // draw the lines
            drawHighlightLines(c, pOut.x, pOut.y, set);

            if (set.isDrawHighlightCircleEnabled()) {

                if (!isNaN(pOut.x) && !isNaN(pOut.y)) {

                    let strokeColor = set.getHighlightCircleStrokeColor();
                    if (strokeColor == ColorTemplate.COLOR_NONE) {
                        strokeColor = set.getColor(0);
                    }

                    if (set.getHighlightCircleStrokeAlpha() < 255) {
                        strokeColor = ColorTemplate.colorWithAlpha(strokeColor, set.getHighlightCircleStrokeAlpha());
                    }

                    drawHighlightCircle(c,
                            pOut,
                            set.getHighlightCircleInnerRadius(),
                            set.getHighlightCircleOuterRadius(),
                            set.getHighlightCircleFillColor(),
                            strokeColor,
                            set.getHighlightCircleStrokeWidth());
                }
            }
        }

        MPPointF.recycleInstance(center);
        MPPointF.recycleInstance(pOut);
    }

    protected Path this.mDrawHighlightCirclePathBuffer = new Path();
    public drawHighlightCircle(c: Canvas,
                                    MPPointF point,
                                    let innerRadius,
                                    let outerRadius,
                                    let fillColor,
                                    let strokeColor,
                                    let strokeWidth) {
        c.save();

        outerRadius = Utils.convertDpToPixel(outerRadius);
        innerRadius = Utils.convertDpToPixel(innerRadius);

        if (fillColor != ColorTemplate.COLOR_NONE) {
            Path p = this.mDrawHighlightCirclePathBuffer;
            p.reset();
            p.addCircle(point.x, point.y, outerRadius, Path.Direction.CW);
            if (innerRadius > 0) {
                p.addCircle(point.x, point.y, innerRadius, Path.Direction.CCW);
            }
            this.mHighlightCirclePaint.setColor(fillColor);
            this.mHighlightCirclePaint.setStyle(Paint.Style.FILL);
            c.drawPath(p, this.mHighlightCirclePaint);
        }

        if (strokeColor != ColorTemplate.COLOR_NONE) {
            this.mHighlightCirclePaint.setColor(strokeColor);
            this.mHighlightCirclePaint.setStyle(Paint.Style.STROKE);
            this.mHighlightCirclePaint.setStrokeWidth(Utils.convertDpToPixel(strokeWidth));
            c.drawCircle(point.x, point.y, outerRadius, this.mHighlightCirclePaint);
        }

        c.restore();
    }
}
