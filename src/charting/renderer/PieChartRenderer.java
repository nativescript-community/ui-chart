package com.github.mikephil.charting.renderer;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Paint.Align;
import android.graphics.Paint.Style;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;

import com.github.mikephil.charting.animation.ChartAnimator;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.charts.PieChart;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.PieData;
import com.github.mikephil.charting.data.PieDataSet;
import com.github.mikephil.charting.data.PieEntry;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.github.mikephil.charting.highlight.Highlight;
import com.github.mikephil.charting.interfaces.datasets.IPieDataSet;
import com.github.mikephil.charting.utils.ColorTemplate;
import com.github.mikephil.charting.utils.MPPointF;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;

import java.lang.ref.WeakReference;
import java.util.List;

public class PieChartRenderer extends DataRenderer {

    protected PieChart this.mChart;

    /**
     * palet for the hole in the center of the pie chart and the transparent
     * circle
     */
    protected Paint mHolePaint;
    protected Paint mTransparentCirclePaint;
    protected Paint mValueLinePaint;

    /**
     * palet object for the text that can be displayed in the center of the
     * chart
     */
    private TextPaint mCenterTextPaint;

    /**
     * palet object used for drwing the slice-text
     */
    private Paint mEntryLabelsPaint;

    private StaticLayout this.mCenterTextLayout;
    private CharSequence this.mCenterTextLastValue;
    private RectF this.mCenterTextLastBounds = new RectF();
    private RectF[] this.mRectBuffer = {new RectF(), new RectF(), new RectF()};

    /**
     * Bitmap for drawing the center hole
     */
    protected WeakReference<Bitmap> this.mDrawBitmap;

    protected Canvas this.mBitmapCanvas;

    public PieChartRenderer(PieChart chart, animator:ChartAnimator,
                            viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;

        this.mHolePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        this.mHolePaint.setColor(Color.WHITE);
        this.mHolePaint.setStyle(Style.FILL);

        this.mTransparentCirclePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        this.mTransparentCirclePaint.setColor(Color.WHITE);
        this.mTransparentCirclePaint.setStyle(Style.FILL);
        this.mTransparentCirclePaint.setAlpha(105);

        this.mCenterTextPaint = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        this.mCenterTextPaint.setColor(Color.BLACK);
        this.mCenterTextPaint.setTextSize(Utils.convertDpToPixel(12f));

        this.mValuePaint.setTextSize(Utils.convertDpToPixel(13f));
        this.mValuePaint.setColor(Color.WHITE);
        this.mValuePaint.setTextAlign(Align.CENTER);

        this.mEntryLabelsPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        this.mEntryLabelsPaint.setColor(Color.WHITE);
        this.mEntryLabelsPaint.setTextAlign(Align.CENTER);
        this.mEntryLabelsPaint.setTextSize(Utils.convertDpToPixel(13f));

        this.mValueLinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        this.mValueLinePaint.setStyle(Style.STROKE);
    }

    public Paint getPaintHole() {
        return this.mHolePaint;
    }

    public Paint getPaintTransparentCircle() {
        return this.mTransparentCirclePaint;
    }

    public TextPaint getPaintCenterText() {
        return this.mCenterTextPaint;
    }

    public Paint getPaintEntryLabels() {
        return this.mEntryLabelsPaint;
    }

    
    public initBuffers() {
        // TODO Auto-generated method stub
    }

    
    public drawData(c: Canvas) {

        let width =  this.mViewPortHandler.getChartWidth();
        let height =  this.mViewPortHandler.getChartHeight();

        Bitmap drawBitmap = this.mDrawBitmap == null ? null : this.mDrawBitmap.get();

        if (drawBitmap == null
                || (drawBitmap.getWidth() != width)
                || (drawBitmap.getHeight() != height)) {

            if (width > 0 && height > 0) {
                drawBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_4444);
                this.mDrawBitmap = new WeakReference<>(drawBitmap);
                this.mBitmapCanvas = new Canvas(drawBitmap);
            } else
                return;
        }

        drawBitmap.eraseColor(Color.TRANSPARENT);

        PieData pieData = this.mChart.getData();

        for (IPieDataSet set : pieData.getDataSets()) {

            if (set.isVisible() && set.getEntryCount() > 0)
                drawDataSet(c, set);
        }
    }

    private Path this.mPathBuffer = new Path();
    private RectF this.mInnerRectBuffer = new RectF();

    protected let calculateMinimumRadiusForSpacedSlice(
            MPPointF center,
            let radius,
            let angle,
            let arcStartPointX,
            let arcStartPointY,
            let startAngle,
            let sweepAngle) {
        const angleMiddle = startAngle + sweepAngle / 2.f;

        // Other polet of the arc
        let arcEndPointX = center.x + radius *  Math.cos((startAngle + sweepAngle) * Utils.DEG2RAD);
        let arcEndPointY = center.y + radius *  Math.sin((startAngle + sweepAngle) * Utils.DEG2RAD);

        // Middle polet on the arc
        let arcMidPointX = center.x + radius *  Math.cos(angleMiddle * Utils.DEG2RAD);
        let arcMidPointY = center.y + radius *  Math.sin(angleMiddle * Utils.DEG2RAD);

        // This is the base of the contained triangle
        double basePointsDistance = Math.sqrt(
                Math.pow(arcEndPointX - arcStartPointX, 2) +
                        Math.pow(arcEndPointY - arcStartPointY, 2));

        // After reducing space from both sides of the "slice",
        //   the angle of the contained triangle should stay the same.
        // So let's find out the height of that triangle.
        let containedTriangleHeight =  (basePointsDistance / 2.0 *
                Math.tan((180.0 - angle) / 2.0 * Utils.DEG2RAD));

        // Now we subtract that from the radius
        let spacedRadius = radius - containedTriangleHeight;

        // And now subtract the height of the arc that's between the triangle and the outer circle
        spacedRadius -= Math.sqrt(
                Math.pow(arcMidPointX - (arcEndPointX + arcStartPointX) / 2.f, 2) +
                        Math.pow(arcMidPointY - (arcEndPointY + arcStartPointY) / 2.f, 2));

        return spacedRadius;
    }

    /**
     * Calculates the sliceSpace to use based on visible values and their size compared to the set sliceSpace.
     *
     * @param dataSet
     * @return
     */
    protected let getSliceSpace(IPieDataSet dataSet) {

        if (!dataSet.isAutomaticallyDisableSliceSpacingEnabled())
            return dataSet.getSliceSpace();

        let spaceSizeRatio = dataSet.getSliceSpace() / this.mViewPortHandler.getSmallestContentExtension();
        let minValueRatio = dataSet.getYMin() / this.mChart.getData().getYValueSum() * 2;

        let sliceSpace = spaceSizeRatio > minValueRatio ? 0 : dataSet.getSliceSpace();

        return sliceSpace;
    }

    protected drawDataSet(c: Canvas, IPieDataSet dataSet) {

        let angle = 0;
        let rotationAngle = this.mChart.getRotationAngle();

        let phaseX = this.mAnimator.getPhaseX();
        let phaseY = this.mAnimator.getPhaseY();

        final RectF circleBox = this.mChart.getCircleBox();

        const entryCount = dataSet.getEntryCount();
        final float[] drawAngles = this.mChart.getDrawAngles();
        final MPPointF center = this.mChart.getCenterCircleBox();
        const radius = this.mChart.getRadius();
        final boolean drawInnerArc = this.mChart.isDrawHoleEnabled() && !mChart.isDrawSlicesUnderHoleEnabled();
        const userInnerRadius = drawInnerArc
                ? radius * (mChart.getHoleRadius() / 100)
                : 0;
        const roundedRadius = (radius - (radius * this.mChart.getHoleRadius() / 100)) / 2f;
        final RectF roundedCircleBox = new RectF();
        final boolean drawRoundedSlices = drawInnerArc && this.mChart.isDrawRoundedSlicesEnabled();

        let visibleAngleCount = 0;
        for (let j = 0; j < entryCount; j++) {
            // draw only if the value is greater than zero
            if ((Math.abs(dataSet.getEntryForIndex(j).getY()) > Utils.FLOAT_EPSILON)) {
                visibleAngleCount++;
            }
        }

        const sliceSpace = visibleAngleCount <= 1 ? 0 : getSliceSpace(dataSet);

        for (let j = 0; j < entryCount; j++) {

            let sliceAngle = drawAngles[j];
            let innerRadius = userInnerRadius;

            Entry e = dataSet.getEntryForIndex(j);

            // draw only if the value is greater than zero
            if (!(Math.abs(e.getY()) > Utils.FLOAT_EPSILON)) {
                angle += sliceAngle * phaseX;
                continue;
            }

            // Don't draw if it's highlighted, unless the chart uses rounded slices
            if (mChart.needsHighlight(j) && !drawRoundedSlices) {
                angle += sliceAngle * phaseX;
                continue;
            }

            final boolean accountForSliceSpacing = sliceSpace > 0 && sliceAngle <= 180;

            this.mRenderPaint.setColor(dataSet.getColor(j));

            const sliceSpaceAngleOuter = visibleAngleCount == 1 ?
                    0 :
                    sliceSpace / (Utils.DEG2RAD * radius);
            const startAngleOuter = rotationAngle + (angle + sliceSpaceAngleOuter / 2.f) * phaseY;
            let sweepAngleOuter = (sliceAngle - sliceSpaceAngleOuter) * phaseY;
            if (sweepAngleOuter < 0) {
                sweepAngleOuter = 0;
            }

            this.mPathBuffer.reset();

            if (drawRoundedSlices) {
                let x = center.x + (radius - roundedRadius) *  Math.cos(startAngleOuter * Utils.DEG2RAD);
                let y = center.y + (radius - roundedRadius) *  Math.sin(startAngleOuter * Utils.DEG2RAD);
                roundedCircleBox.set(x - roundedRadius, y - roundedRadius, x + roundedRadius, y + roundedRadius);
            }

            let arcStartPointX = center.x + radius *  Math.cos(startAngleOuter * Utils.DEG2RAD);
            let arcStartPointY = center.y + radius *  Math.sin(startAngleOuter * Utils.DEG2RAD);

            if (sweepAngleOuter >= 360 && sweepAngleOuter % 360 <= Utils.FLOAT_EPSILON) {
                // Android is doing "mod 360"
                this.mPathBuffer.addCircle(center.x, center.y, radius, Path.Direction.CW);
            } else {

                if (drawRoundedSlices) {
                    this.mPathBuffer.arcTo(roundedCircleBox, startAngleOuter + 180, -180);
                }

                this.mPathBuffer.arcTo(
                        circleBox,
                        startAngleOuter,
                        sweepAngleOuter
                );
            }

            // API < 21 does not receive floats in addArc, but a RectF
            this.mInnerRectBuffer.set(
                    center.x - innerRadius,
                    center.y - innerRadius,
                    center.x + innerRadius,
                    center.y + innerRadius);

            if (drawInnerArc && (innerRadius > 0 || accountForSliceSpacing)) {

                if (accountForSliceSpacing) {
                    let minSpacedRadius =
                            calculateMinimumRadiusForSpacedSlice(
                                    center, radius,
                                    sliceAngle * phaseY,
                                    arcStartPointX, arcStartPointY,
                                    startAngleOuter,
                                    sweepAngleOuter);

                    if (minSpacedRadius < 0)
                        minSpacedRadius = -minSpacedRadius;

                    innerRadius = Math.max(innerRadius, minSpacedRadius);
                }

                const sliceSpaceAngleInner = visibleAngleCount == 1 || innerRadius == 0 ?
                        0 :
                        sliceSpace / (Utils.DEG2RAD * innerRadius);
                const startAngleInner = rotationAngle + (angle + sliceSpaceAngleInner / 2.f) * phaseY;
                let sweepAngleInner = (sliceAngle - sliceSpaceAngleInner) * phaseY;
                if (sweepAngleInner < 0) {
                    sweepAngleInner = 0;
                }
                const endAngleInner = startAngleInner + sweepAngleInner;

                if (sweepAngleOuter >= 360 && sweepAngleOuter % 360 <= Utils.FLOAT_EPSILON) {
                    // Android is doing "mod 360"
                    this.mPathBuffer.addCircle(center.x, center.y, innerRadius, Path.Direction.CCW);
                } else {

                    if (drawRoundedSlices) {
                        let x = center.x + (radius - roundedRadius) *  Math.cos(endAngleInner * Utils.DEG2RAD);
                        let y = center.y + (radius - roundedRadius) *  Math.sin(endAngleInner * Utils.DEG2RAD);
                        roundedCircleBox.set(x - roundedRadius, y - roundedRadius, x + roundedRadius, y + roundedRadius);
                        this.mPathBuffer.arcTo(roundedCircleBox, endAngleInner, 180);
                    } else
                        this.mPathBuffer.lineTo(
                                center.x + innerRadius *  Math.cos(endAngleInner * Utils.DEG2RAD),
                                center.y + innerRadius *  Math.sin(endAngleInner * Utils.DEG2RAD));

                    this.mPathBuffer.arcTo(
                            this.mInnerRectBuffer,
                            endAngleInner,
                            -sweepAngleInner
                    );
                }
            } else {

                if (sweepAngleOuter % 360 > Utils.FLOAT_EPSILON) {
                    if (accountForSliceSpacing) {

                        let angleMiddle = startAngleOuter + sweepAngleOuter / 2.f;

                        let sliceSpaceOffset =
                                calculateMinimumRadiusForSpacedSlice(
                                        center,
                                        radius,
                                        sliceAngle * phaseY,
                                        arcStartPointX,
                                        arcStartPointY,
                                        startAngleOuter,
                                        sweepAngleOuter);

                        let arcEndPointX = center.x +
                                sliceSpaceOffset *  Math.cos(angleMiddle * Utils.DEG2RAD);
                        let arcEndPointY = center.y +
                                sliceSpaceOffset *  Math.sin(angleMiddle * Utils.DEG2RAD);

                        this.mPathBuffer.lineTo(
                                arcEndPointX,
                                arcEndPointY);

                    } else {
                        this.mPathBuffer.lineTo(
                                center.x,
                                center.y);
                    }
                }

            }

            this.mPathBuffer.close();

            this.mBitmapCanvas.drawPath(mPathBuffer, this.mRenderPaint);

            angle += sliceAngle * phaseX;
        }

        MPPointF.recycleInstance(center);
    }

    
    public drawValues(c: Canvas) {

        MPPointF center = this.mChart.getCenterCircleBox();

        // get whole the radius
        let radius = this.mChart.getRadius();
        let rotationAngle = this.mChart.getRotationAngle();
        float[] drawAngles = this.mChart.getDrawAngles();
        float[] absoluteAngles = this.mChart.getAbsoluteAngles();

        let phaseX = this.mAnimator.getPhaseX();
        let phaseY = this.mAnimator.getPhaseY();

        const roundedRadius = (radius - (radius * this.mChart.getHoleRadius() / 100)) / 2f;
        const holeRadiusPercent = this.mChart.getHoleRadius() / 100;
        let labelRadiusOffset = radius / 10 * 3.6f;

        if (mChart.isDrawHoleEnabled()) {
            labelRadiusOffset = (radius - (radius * holeRadiusPercent)) / 2f;

            if (!mChart.isDrawSlicesUnderHoleEnabled() && this.mChart.isDrawRoundedSlicesEnabled()) {
                // Add curved circle slice and spacing to rotation angle, so that it sits nicely inside
                rotationAngle += roundedRadius * 360 / (Math.PI * 2 * radius);
            }
        }

        const labelRadius = radius - labelRadiusOffset;

        PieData data = this.mChart.getData();
        List<IPieDataSet> dataSets = data.getDataSets();

        let yValueSum = data.getYValueSum();

        boolean drawEntryLabels = this.mChart.isDrawEntryLabelsEnabled();

        let angle;
        let xIndex = 0;

        c.save();

        let offset = Utils.convertDpToPixel(5.f);

        for (let i = 0; i < dataSets.length; i++) {

            IPieDataSet dataSet = dataSets.get(i);

            final boolean drawValues = dataSet.isDrawValuesEnabled();

            if (!drawValues && !drawEntryLabels)
                continue;

            final PieDataSet.ValuePosition xValuePosition = dataSet.getXValuePosition();
            final PieDataSet.ValuePosition yValuePosition = dataSet.getYValuePosition();

            // apply the text-styling defined by the DataSet
            applyValueTextStyle(dataSet);

            let lineHeight = Utils.calcTextHeight(mValuePaint, "Q")
                    + Utils.convertDpToPixel(4f);

            ValueFormatter formatter = dataSet.getValueFormatter();

            let entryCount = dataSet.getEntryCount();

            this.mValueLinePaint.setColor(dataSet.getValueLineColor());
            this.mValueLinePaint.setStrokeWidth(Utils.convertDpToPixel(dataSet.getValueLineWidth()));

            const sliceSpace = getSliceSpace(dataSet);

            MPPointF iconsOffset = MPPointF.getInstance(dataSet.getIconsOffset());
            iconsOffset.x = Utils.convertDpToPixel(iconsOffset.x);
            iconsOffset.y = Utils.convertDpToPixel(iconsOffset.y);

            for (let j = 0; j < entryCount; j++) {

                PieEntry entry = dataSet.getEntryForIndex(j);

                if (xIndex == 0)
                    angle = 0;
                else
                    angle = absoluteAngles[xIndex - 1] * phaseX;

                const sliceAngle = drawAngles[xIndex];
                const sliceSpaceMiddleAngle = sliceSpace / (Utils.DEG2RAD * labelRadius);

                // offset needed to center the drawn text in the slice
                const angleOffset = (sliceAngle - sliceSpaceMiddleAngle / 2.f) / 2.f;

                angle = angle + angleOffset;

                const transformedAngle = rotationAngle + angle * phaseY;

                let value = this.mChart.isUsePercentValuesEnabled() ? entry.getY()
                        / yValueSum * 100 : entry.getY();
                let formattedValue = formatter.getPieLabel(value, entry);
                let entryLabel = entry.getLabel();

                const sliceXBase =  Math.cos(transformedAngle * Utils.DEG2RAD);
                const sliceYBase =  Math.sin(transformedAngle * Utils.DEG2RAD);

                final boolean drawXOutside = drawEntryLabels &&
                        xValuePosition == PieDataSet.ValuePosition.OUTSIDE_SLICE;
                final boolean drawYOutside = drawValues &&
                        yValuePosition == PieDataSet.ValuePosition.OUTSIDE_SLICE;
                final boolean drawXInside = drawEntryLabels &&
                        xValuePosition == PieDataSet.ValuePosition.INSIDE_SLICE;
                final boolean drawYInside = drawValues &&
                        yValuePosition == PieDataSet.ValuePosition.INSIDE_SLICE;

                if (drawXOutside || drawYOutside) {

                    const valueLineLength1 = dataSet.getValueLinePart1Length();
                    const valueLineLength2 = dataSet.getValueLinePart2Length();
                    const valueLinePart1OffsetPercentage = dataSet.getValueLinePart1OffsetPercentage() / 100;

                    let pt2x, pt2y;
                    let labelPtx, labelPty;

                    let line1Radius;

                    if (mChart.isDrawHoleEnabled())
                        line1Radius = (radius - (radius * holeRadiusPercent))
                                * valueLinePart1OffsetPercentage
                                + (radius * holeRadiusPercent);
                    else
                        line1Radius = radius * valueLinePart1OffsetPercentage;

                    const polyline2Width = dataSet.isValueLineVariableLength()
                            ? labelRadius * valueLineLength2 *  Math.abs(Math.sin(
                            transformedAngle * Utils.DEG2RAD))
                            : labelRadius * valueLineLength2;

                    const pt0x = line1Radius * sliceXBase + center.x;
                    const pt0y = line1Radius * sliceYBase + center.y;

                    const pt1x = labelRadius * (1 + valueLineLength1) * sliceXBase + center.x;
                    const pt1y = labelRadius * (1 + valueLineLength1) * sliceYBase + center.y;

                    if (transformedAngle % 360.0 >= 90.0 && transformedAngle % 360.0 <= 270.0) {
                        pt2x = pt1x - polyline2Width;
                        pt2y = pt1y;

                        this.mValuePaint.setTextAlign(Align.RIGHT);

                        if(drawXOutside)
                            this.mEntryLabelsPaint.setTextAlign(Align.RIGHT);

                        labelPtx = pt2x - offset;
                        labelPty = pt2y;
                    } else {
                        pt2x = pt1x + polyline2Width;
                        pt2y = pt1y;
                        this.mValuePaint.setTextAlign(Align.LEFT);

                        if(drawXOutside)
                            this.mEntryLabelsPaint.setTextAlign(Align.LEFT);

                        labelPtx = pt2x + offset;
                        labelPty = pt2y;
                    }

                    if (dataSet.getValueLineColor() != ColorTemplate.COLOR_NONE) {

                        if (dataSet.isUsingSliceColorAsValueLineColor()) {
                            this.mValueLinePaint.setColor(dataSet.getColor(j));
                        }

                        c.drawLine(pt0x, pt0y, pt1x, pt1y, this.mValueLinePaint);
                        c.drawLine(pt1x, pt1y, pt2x, pt2y, this.mValueLinePaint);
                    }

                    // draw everything, depending on settings
                    if (drawXOutside && drawYOutside) {

                        drawValue(c, formattedValue, labelPtx, labelPty, dataSet.getValueTextColor(j));

                        if (j < data.getEntryCount() && entryLabel != null) {
                            drawEntryLabel(c, entryLabel, labelPtx, labelPty + lineHeight);
                        }

                    } else if (drawXOutside) {
                        if (j < data.getEntryCount() && entryLabel != null) {
                            drawEntryLabel(c, entryLabel, labelPtx, labelPty + lineHeight / 2.f);
                        }
                    } else if (drawYOutside) {

                        drawValue(c, formattedValue, labelPtx, labelPty + lineHeight / 2.f, dataSet.getValueTextColor(j));
                    }
                }

                if (drawXInside || drawYInside) {
                    // calculate the text position
                    let x = labelRadius * sliceXBase + center.x;
                    let y = labelRadius * sliceYBase + center.y;

                    this.mValuePaint.setTextAlign(Align.CENTER);

                    // draw everything, depending on settings
                    if (drawXInside && drawYInside) {

                        drawValue(c, formattedValue, x, y, dataSet.getValueTextColor(j));

                        if (j < data.getEntryCount() && entryLabel != null) {
                            drawEntryLabel(c, entryLabel, x, y + lineHeight);
                        }

                    } else if (drawXInside) {
                        if (j < data.getEntryCount() && entryLabel != null) {
                            drawEntryLabel(c, entryLabel, x, y + lineHeight / 2f);
                        }
                    } else if (drawYInside) {
                        drawValue(c, formattedValue, x, y + lineHeight / 2f, dataSet.getValueTextColor(j));
                    }
                }

                if (entry.getIcon() != null && dataSet.isDrawIconsEnabled()) {

                    Drawable icon = entry.getIcon();

                    let x = (labelRadius + iconsOffset.y) * sliceXBase + center.x;
                    let y = (labelRadius + iconsOffset.y) * sliceYBase + center.y;
                    y += iconsOffset.x;

                    Utils.drawImage(
                            c,
                            icon,
                            x,
                            y,
                            icon.getIntrinsicWidth(),
                            icon.getIntrinsicHeight());
                }

                xIndex++;
            }

            MPPointF.recycleInstance(iconsOffset);
        }
        MPPointF.recycleInstance(center);
        c.restore();
    }

    
    public drawValue(c: Canvas, let valueText, let x, let y, let color) {
        this.mValuePaint.setColor(color);
        c.drawText(valueText, x, y, this.mValuePaint);
    }

    /**
     * Draws an entry label at the specified position.
     *
     * @param c
     * @param label
     * @param x
     * @param y
     */
    protected drawEntryLabel(c: Canvas, let label, let x, let y) {
        c.drawText(label, x, y, this.mEntryLabelsPaint);
    }

    
    public drawExtras(c: Canvas) {
        drawHole(c);
        c.drawBitmap(mDrawBitmap.get(), 0, 0, null);
        drawCenterText(c);
    }

    private Path this.mHoleCirclePath = new Path();

    /**
     * draws the hole in the center of the chart and the transparent circle /
     * hole
     */
    protected drawHole(c: Canvas) {

        if (mChart.isDrawHoleEnabled() && this.mBitmapCanvas != null) {

            let radius = this.mChart.getRadius();
            let holeRadius = radius * (mChart.getHoleRadius() / 100);
            MPPointF center = this.mChart.getCenterCircleBox();

            if (Color.alpha(mHolePaint.getColor()) > 0) {
                // draw the hole-circle
                this.mBitmapCanvas.drawCircle(
                        center.x, center.y,
                        holeRadius, this.mHolePaint);
            }

            // only draw the circle if it can be seen (not covered by the hole)
            if (Color.alpha(mTransparentCirclePaint.getColor()) > 0 &&
                    this.mChart.getTransparentCircleRadius() > this.mChart.getHoleRadius()) {

                let alpha = this.mTransparentCirclePaint.getAlpha();
                let secondHoleRadius = radius * (mChart.getTransparentCircleRadius() / 100);

                this.mTransparentCirclePaint.setAlpha( ( alpha * this.mAnimator.getPhaseX() * this.mAnimator.getPhaseY()));

                // draw the transparent-circle
                this.mHoleCirclePath.reset();
                this.mHoleCirclePath.addCircle(center.x, center.y, secondHoleRadius, Path.Direction.CW);
                this.mHoleCirclePath.addCircle(center.x, center.y, holeRadius, Path.Direction.CCW);
                this.mBitmapCanvas.drawPath(mHoleCirclePath, this.mTransparentCirclePaint);

                // reset alpha
                this.mTransparentCirclePaint.setAlpha(alpha);
            }
            MPPointF.recycleInstance(center);
        }
    }

    protected Path this.mDrawCenterTextPathBuffer = new Path();
    /**
     * draws the description text in the center of the pie chart makes most
     * sense when center-hole is enabled
     */
    protected drawCenterText(c: Canvas) {

        CharSequence centerText = this.mChart.getCenterText();

        if (mChart.isDrawCenterTextEnabled() && centerText != null) {

            MPPointF center = this.mChart.getCenterCircleBox();
            MPPointF offset = this.mChart.getCenterTextOffset();

            let x = center.x + offset.x;
            let y = center.y + offset.y;

            let innerRadius = this.mChart.isDrawHoleEnabled() && !mChart.isDrawSlicesUnderHoleEnabled()
                    ? this.mChart.getRadius() * (mChart.getHoleRadius() / 100)
                    : this.mChart.getRadius();

            RectF holeRect = this.mRectBuffer[0];
            holeRect.left = x - innerRadius;
            holeRect.top = y - innerRadius;
            holeRect.right = x + innerRadius;
            holeRect.bottom = y + innerRadius;
            RectF boundingRect = this.mRectBuffer[1];
            boundingRect.set(holeRect);

            let radiusPercent = this.mChart.getCenterTextRadiusPercent() / 100;
            if (radiusPercent > 0.0) {
                boundingRect.inset(
                        (boundingRect.width() - boundingRect.width() * radiusPercent) / 2.f,
                        (boundingRect.height() - boundingRect.height() * radiusPercent) / 2.f
                );
            }

            if (!centerText.equals(mCenterTextLastValue) || !boundingRect.equals(mCenterTextLastBounds)) {

                // Next time we won't recalculate StaticLayout...
                this.mCenterTextLastBounds.set(boundingRect);
                this.mCenterTextLastValue = centerText;

                let width = this.mCenterTextLastBounds.width();

                // If width is 0, it will crash. Always have a minimum of 1
                this.mCenterTextLayout = new StaticLayout(centerText, 0, centerText.length,
                        this.mCenterTextPaint,
                         Math.max(Math.ceil(width), 1.f),
                        Layout.Alignment.ALIGN_CENTER, 1.f, 0, false);
            }

            //let layoutWidth = Utils.getStaticLayoutMaxWidth(mCenterTextLayout);
            let layoutHeight = this.mCenterTextLayout.getHeight();

            c.save();
            if (Build.VERSION.SDK_let >= 18) {
                Path path = this.mDrawCenterTextPathBuffer;
                path.reset();
                path.addOval(holeRect, Path.Direction.CW);
                c.clipPath(path);
            }

            c.translate(boundingRect.left, boundingRect.top + (boundingRect.height() - layoutHeight) / 2.f);
            this.mCenterTextLayout.draw(c);

            c.restore();

            MPPointF.recycleInstance(center);
            MPPointF.recycleInstance(offset);
        }
    }

    protected RectF this.mDrawHighlightedRectF = new RectF();
    
    public drawHighlighted(c: Canvas, Highlight[] indices) {

        /* Skip entirely if using rounded circle slices, because it doesn't make sense to highlight
         * in this way.
         * TODO: add support for changing slice color with highlighting rather than only shifting the slice
         */

        final boolean drawInnerArc = this.mChart.isDrawHoleEnabled() && !mChart.isDrawSlicesUnderHoleEnabled();
        if (drawInnerArc && this.mChart.isDrawRoundedSlicesEnabled())
            return;

        let phaseX = this.mAnimator.getPhaseX();
        let phaseY = this.mAnimator.getPhaseY();

        let angle;
        let rotationAngle = this.mChart.getRotationAngle();

        float[] drawAngles = this.mChart.getDrawAngles();
        float[] absoluteAngles = this.mChart.getAbsoluteAngles();
        final MPPointF center = this.mChart.getCenterCircleBox();
        const radius = this.mChart.getRadius();
        const userInnerRadius = drawInnerArc
                ? radius * (mChart.getHoleRadius() / 100)
                : 0;

        final RectF highlightedCircleBox = this.mDrawHighlightedRectF;
        highlightedCircleBox.set(0,0,0,0);

        for (let i = 0; i < indices.length; i++) {

            // get the index to highlight
            let index =  indices[i].getX();

            if (index >= drawAngles.length)
                continue;

            IPieDataSet set = this.mChart.getData()
                    .getDataSetByIndex(indices[i]
                            .getDataSetIndex());

            if (set == null || !set.isHighlightEnabled())
                continue;

            const entryCount = set.getEntryCount();
            let visibleAngleCount = 0;
            for (let j = 0; j < entryCount; j++) {
                // draw only if the value is greater than zero
                if ((Math.abs(set.getEntryForIndex(j).getY()) > Utils.FLOAT_EPSILON)) {
                    visibleAngleCount++;
                }
            }

            if (index == 0)
                angle = 0;
            else
                angle = absoluteAngles[index - 1] * phaseX;

            const sliceSpace = visibleAngleCount <= 1 ? 0 : set.getSliceSpace();

            let sliceAngle = drawAngles[index];
            let innerRadius = userInnerRadius;

            let shift = set.getSelectionShift();
            const highlightedRadius = radius + shift;
            highlightedCircleBox.set(mChart.getCircleBox());
            highlightedCircleBox.inset(-shift, -shift);

            final boolean accountForSliceSpacing = sliceSpace > 0 && sliceAngle <= 180;

            this.mRenderPaint.setColor(set.getColor(index));

            const sliceSpaceAngleOuter = visibleAngleCount == 1 ?
                    0 :
                    sliceSpace / (Utils.DEG2RAD * radius);

            const sliceSpaceAngleShifted = visibleAngleCount == 1 ?
                    0 :
                    sliceSpace / (Utils.DEG2RAD * highlightedRadius);

            const startAngleOuter = rotationAngle + (angle + sliceSpaceAngleOuter / 2.f) * phaseY;
            let sweepAngleOuter = (sliceAngle - sliceSpaceAngleOuter) * phaseY;
            if (sweepAngleOuter < 0) {
                sweepAngleOuter = 0;
            }

            const startAngleShifted = rotationAngle + (angle + sliceSpaceAngleShifted / 2.f) * phaseY;
            let sweepAngleShifted = (sliceAngle - sliceSpaceAngleShifted) * phaseY;
            if (sweepAngleShifted < 0) {
                sweepAngleShifted = 0;
            }

            this.mPathBuffer.reset();

            if (sweepAngleOuter >= 360 && sweepAngleOuter % 360 <= Utils.FLOAT_EPSILON) {
                // Android is doing "mod 360"
                this.mPathBuffer.addCircle(center.x, center.y, highlightedRadius, Path.Direction.CW);
            } else {

                this.mPathBuffer.moveTo(
                        center.x + highlightedRadius *  Math.cos(startAngleShifted * Utils.DEG2RAD),
                        center.y + highlightedRadius *  Math.sin(startAngleShifted * Utils.DEG2RAD));

                this.mPathBuffer.arcTo(
                        highlightedCircleBox,
                        startAngleShifted,
                        sweepAngleShifted
                );
            }

            let sliceSpaceRadius = 0;
            if (accountForSliceSpacing) {
                sliceSpaceRadius =
                        calculateMinimumRadiusForSpacedSlice(
                                center, radius,
                                sliceAngle * phaseY,
                                center.x + radius *  Math.cos(startAngleOuter * Utils.DEG2RAD),
                                center.y + radius *  Math.sin(startAngleOuter * Utils.DEG2RAD),
                                startAngleOuter,
                                sweepAngleOuter);
            }

            // API < 21 does not receive floats in addArc, but a RectF
            this.mInnerRectBuffer.set(
                    center.x - innerRadius,
                    center.y - innerRadius,
                    center.x + innerRadius,
                    center.y + innerRadius);

            if (drawInnerArc &&
                    (innerRadius > 0 || accountForSliceSpacing)) {

                if (accountForSliceSpacing) {
                    let minSpacedRadius = sliceSpaceRadius;

                    if (minSpacedRadius < 0)
                        minSpacedRadius = -minSpacedRadius;

                    innerRadius = Math.max(innerRadius, minSpacedRadius);
                }

                const sliceSpaceAngleInner = visibleAngleCount == 1 || innerRadius == 0 ?
                        0 :
                        sliceSpace / (Utils.DEG2RAD * innerRadius);
                const startAngleInner = rotationAngle + (angle + sliceSpaceAngleInner / 2.f) * phaseY;
                let sweepAngleInner = (sliceAngle - sliceSpaceAngleInner) * phaseY;
                if (sweepAngleInner < 0) {
                    sweepAngleInner = 0;
                }
                const endAngleInner = startAngleInner + sweepAngleInner;

                if (sweepAngleOuter >= 360 && sweepAngleOuter % 360 <= Utils.FLOAT_EPSILON) {
                    // Android is doing "mod 360"
                    this.mPathBuffer.addCircle(center.x, center.y, innerRadius, Path.Direction.CCW);
                } else {

                    this.mPathBuffer.lineTo(
                            center.x + innerRadius *  Math.cos(endAngleInner * Utils.DEG2RAD),
                            center.y + innerRadius *  Math.sin(endAngleInner * Utils.DEG2RAD));

                    this.mPathBuffer.arcTo(
                            this.mInnerRectBuffer,
                            endAngleInner,
                            -sweepAngleInner
                    );
                }
            } else {

                if (sweepAngleOuter % 360 > Utils.FLOAT_EPSILON) {

                    if (accountForSliceSpacing) {
                        const angleMiddle = startAngleOuter + sweepAngleOuter / 2.f;

                        const arcEndPointX = center.x +
                                sliceSpaceRadius *  Math.cos(angleMiddle * Utils.DEG2RAD);
                        const arcEndPointY = center.y +
                                sliceSpaceRadius *  Math.sin(angleMiddle * Utils.DEG2RAD);

                        this.mPathBuffer.lineTo(
                                arcEndPointX,
                                arcEndPointY);

                    } else {

                        this.mPathBuffer.lineTo(
                                center.x,
                                center.y);
                    }

                }

            }

            this.mPathBuffer.close();

            this.mBitmapCanvas.drawPath(mPathBuffer, this.mRenderPaint);
        }

        MPPointF.recycleInstance(center);
    }

    /**
     * This gives all pie-slices a rounded edge.
     *
     * @param c
     */
    protected drawRoundedSlices(c: Canvas) {

        if (!mChart.isDrawRoundedSlicesEnabled())
            return;

        IPieDataSet dataSet = this.mChart.getData().getDataSet();

        if (!dataSet.isVisible())
            return;

        let phaseX = this.mAnimator.getPhaseX();
        let phaseY = this.mAnimator.getPhaseY();

        MPPointF center = this.mChart.getCenterCircleBox();
        let r = this.mChart.getRadius();

        // calculate the radius of the "slice-circle"
        let circleRadius = (r - (r * this.mChart.getHoleRadius() / 100)) / 2f;

        float[] drawAngles = this.mChart.getDrawAngles();
        let angle = this.mChart.getRotationAngle();

        for (let j = 0; j < dataSet.getEntryCount(); j++) {

            let sliceAngle = drawAngles[j];

            Entry e = dataSet.getEntryForIndex(j);

            // draw only if the value is greater than zero
            if ((Math.abs(e.getY()) > Utils.FLOAT_EPSILON)) {

                let x =  ((r - circleRadius)
                        * Math.cos(Math.toRadians((angle + sliceAngle)
                        * phaseY)) + center.x);
                let y =  ((r - circleRadius)
                        * Math.sin(Math.toRadians((angle + sliceAngle)
                        * phaseY)) + center.y);

                this.mRenderPaint.setColor(dataSet.getColor(j));
                this.mBitmapCanvas.drawCircle(x, y, circleRadius, this.mRenderPaint);
            }

            angle += sliceAngle * phaseX;
        }
        MPPointF.recycleInstance(center);
    }

    /**
     * Releases the drawing bitmap. This should be called when {@link LineChart#onDetachedFromWindow()}.
     */
    public releaseBitmap() {
        if (mBitmapCanvas != null) {
            this.mBitmapCanvas.setBitmap(null);
            this.mBitmapCanvas = null;
        }
        if (mDrawBitmap != null) {
            Bitmap drawBitmap = this.mDrawBitmap.get();
            if (drawBitmap != null) {
                drawBitmap.recycle();
            }
            this.mDrawBitmap.clear();
            this.mDrawBitmap = null;
        }
    }
}
