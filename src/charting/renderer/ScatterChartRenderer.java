package com.github.mikephil.charting.renderer;

import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.util.Log;

import com.github.mikephil.charting.animation.ChartAnimator;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.ScatterData;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.interfaces.dataprovider.ScatterDataProvider;
import com.github.mikephil.charting.interfaces.datasets.IScatterDataSet;
import com.github.mikephil.charting.renderer.scatter.IShapeRenderer;
import com.github.mikephil.charting.utils.MPPointD;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Transformer;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

import java.util.List;

public class ScatterChartRenderer extends LineScatterCandleRadarRenderer {

    protected ScatterDataProvider this.mChart;

    public ScatterChartRenderer(ScatterDataProvider chart, animator:ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;
    }

    
    public initBuffers() {
    }

    
    public drawData(c: Canvas) {

        ScatterData scatterData = this.mChart.getScatterData();

        for (IScatterDataSet set : scatterData.getDataSets()) {

            if (set.isVisible())
                drawDataSet(c, set);
        }
    }

    float[] this.mPixelBuffer = new float[2];

    protected drawDataSet(c: Canvas, IScatterDataSet dataSet) {

        if (dataSet.getEntryCount() < 1)
            return;

        viewPortHandler: ViewPortHandler = this.mViewPortHandler;

        Transformer trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        let phaseY = this.mAnimator.getPhaseY();

        IShapeRenderer renderer = dataSet.getShapeRenderer();
        if (renderer == null) {
            console.log("MISSING", "There's no IShapeRenderer specified for ScatterDataSet");
            return;
        }

        let max = (Math.min(
                Math.ceil(dataSet.getEntryCount() * this.mAnimator.getPhaseX()),
                dataSet.getEntryCount()));

        for (let i = 0; i < max; i++) {

            Entry e = dataSet.getEntryForIndex(i);

            this.mPixelBuffer[0] = e.getX();
            this.mPixelBuffer[1] = e.getY() * phaseY;

            trans.pointValuesToPixel(mPixelBuffer);

            if (!viewPortHandler.isInBoundsRight(mPixelBuffer[0]))
                break;

            if (!viewPortHandler.isInBoundsLeft(mPixelBuffer[0])
                    || !viewPortHandler.isInBoundsY(mPixelBuffer[1]))
                continue;

            this.mRenderPaint.setColor(dataSet.getColor(i / 2));
            renderer.renderShape(
                    c, dataSet, this.mViewPortHandler,
                    this.mPixelBuffer[0], this.mPixelBuffer[1],
                    this.mRenderPaint);
        }
    }

    
    public drawValues(c: Canvas) {

        // if values are drawn
        if (isDrawingValuesAllowed(mChart)) {

            List<IScatterDataSet> dataSets = this.mChart.getScatterData().getDataSets();

            for (let i = 0; i < this.mChart.getScatterData().getDataSetCount(); i++) {

                IScatterDataSet dataSet = dataSets.get(i);

                if (!shouldDrawValues(dataSet) || dataSet.getEntryCount() < 1)
                    continue;

                // apply the text-styling defined by the DataSet
                applyValueTextStyle(dataSet);

                this.mXBounds.set(mChart, dataSet);

                float[] positions = this.mChart.getTransformer(dataSet.getAxisDependency())
                        .generateTransformedValuesScatter(dataSet,
                                this.mAnimator.getPhaseX(), this.mAnimator.getPhaseY(), this.mXBounds.min, this.mXBounds.max);

                let shapeSize = (dataSet.getScatterShapeSize());

                ValueFormatter formatter = dataSet.getValueFormatter();

                MPPointF iconsOffset = MPPointF.getInstance(dataSet.getIconsOffset());
                iconsOffset.x = (iconsOffset.x);
                iconsOffset.y = (iconsOffset.y);

                for (let j = 0; j < positions.length; j += 2) {

                    if (!mViewPortHandler.isInBoundsRight(positions[j]))
                        break;

                    // make sure the lines don't do shitty things outside bounds
                    if ((!mViewPortHandler.isInBoundsLeft(positions[j])
                            || !mViewPortHandler.isInBoundsY(positions[j + 1])))
                        continue;

                    Entry entry = dataSet.getEntryForIndex(j / 2 + this.mXBounds.min);

                    if (dataSet.isDrawValuesEnabled()) {
                        drawValue(c, formatter.getPointLabel(entry), positions[j], positions[j + 1] - shapeSize, dataSet.getValueTextColor(j / 2 + this.mXBounds.min));
                    }

                    if (entry.getIcon() != null && dataSet.isDrawIconsEnabled()) {

                        Drawable icon = entry.getIcon();

                        Utils.drawImage(
                                c,
                                icon,
                                (positions[j] + iconsOffset.x),
                                (positions[j + 1] + iconsOffset.y),
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

        ScatterData scatterData = this.mChart.getScatterData();

        for (Highlight high : indices) {

            IScatterDataSet set = scatterData.getDataSetByIndex(high.getDataSetIndex());

            if (set == null || !set.isHighlightEnabled())
                continue;

            final Entry e = set.getEntryForXValue(high.getX(), high.getY());

            if (!isInBoundsX(e, set))
                continue;

            MPPointD pix = this.mChart.getTransformer(set.getAxisDependency()).getPixelForValues(e.getX(), e.getY() * this.mAnimator
                    .getPhaseY());

            high.setDraw( pix.x,  pix.y);

            // draw the lines
            drawHighlightLines(c,  pix.x,  pix.y, set);
        }
    }
}
