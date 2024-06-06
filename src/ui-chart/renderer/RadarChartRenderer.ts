import { TypedArray } from '@nativescript-community/arraybuffers';
import { Canvas, Direction, Paint, Style } from '@nativescript-community/ui-canvas';
import { Color } from '@nativescript/core';
import { ChartAnimator } from '../animation/ChartAnimator';
import { RadarChart } from '../charts/RadarChart';
import { Highlight } from '../highlight/Highlight';
import { IRadarDataSet } from '../interfaces/datasets/IRadarDataSet';
import { ColorTemplate } from '../utils/ColorTemplate';
import { MPPointF } from '../utils/MPPointF';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { LineRadarRenderer } from './LineRadarRenderer';

export class RadarChartRenderer extends LineRadarRenderer {
    protected mChart: RadarChart;

    /**
     * palet for drawing the web
     */
    protected mWebPaint: Paint;

    private mLineBuffer: TypedArray;

    constructor(chart: RadarChart, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;
    }

    public get highlightPaint() {
        if (!this.mHighlightPaint) {
            this.mHighlightPaint = Utils.getTemplatePaint('black-stroke');
            this.mHighlightPaint.setStrokeWidth(2);
            this.mHighlightPaint.setColor(new Color(255, 255, 187, 115));
        }
        return this.mHighlightPaint;
    }
    public get webPaint() {
        if (!this.mWebPaint) {
            this.mWebPaint = Utils.getTemplatePaint('black-stroke');
        }
        return this.mWebPaint;
    }

    public drawData(c: Canvas) {
        const radarData = this.mChart.data;
        const mostEntries = radarData.maxEntryCountSet.entryCount;

        for (const set of radarData.dataSets) {
            if (set.visible) {
                this.drawDataSet(c, set, mostEntries);
            }
        }
    }

    /**
     * Draws the RadarDataSetF
     *
     * @param c
     * @param dataSet
     * @param mostEntries the entry count of the dataset with the most entries
     */
    protected drawDataSet(c: Canvas, dataSet: IRadarDataSet, mostEntries) {
        const phaseX = this.animator.phaseX;
        const phaseY = this.animator.phaseY;

        const sliceangle = this.mChart.sliceAngle;

        // calculate the factor that is needed for transforming the value to
        // pixels
        const factor = this.mChart.factor;

        const center = this.mChart.centerOffsets;
        const pOut: MPPointF = { x: 0, y: 0 };
        const surface = Utils.getTempPath();
        surface.reset();

        let hasMovedToPoint = false;
        const minVal = this.mChart.yChartMin;
        const angle = this.mChart.rotationAngle;

        const entryCount = dataSet.entryCount;
        if (!this.mLineBuffer || this.mLineBuffer.length < Math.max(entryCount * 2, 2) * 2) {
            this.mLineBuffer = Utils.createArrayBuffer(Math.max(entryCount * 2, 2) * 2);
        }
        const float32arr = this.mLineBuffer;
        let index = 0;
        const yProperty = dataSet.yProperty;
        for (let j = 0; j < dataSet.entryCount; j++) {
            const e = dataSet.getEntryForIndex(j);
            const yVal = e[yProperty];
            if (yVal === undefined || yVal === null) {
                continue;
            }
            Utils.getPosition(center, (yVal - minVal) * factor * phaseY, sliceangle * j * phaseX + angle, pOut);

            if (isNaN(pOut.x)) continue;

            if (!hasMovedToPoint) {
                float32arr[index++] = pOut.x;
                float32arr[index++] = pOut.y;
                hasMovedToPoint = true;
            }

            float32arr[index++] = pOut.x;
            float32arr[index++] = pOut.y;
        }

        if (dataSet.entryCount > mostEntries) {
            // if this is not the largest set, draw a line to the center before closing
            float32arr[index++] = center.x;
            float32arr[index++] = center.y;
        }
        float32arr[index++] = float32arr[0];
        float32arr[index++] = float32arr[1];
        const points = Utils.pointsFromBuffer(float32arr);
        if (__ANDROID__ && Utils.supportsDirectArrayBuffers()) {
            surface['setLinesBuffer'](points, 0, index);
        } else {
            surface.setLines(points as number[], 0, index);
        }

        // surface.close();

        if (dataSet.drawFilledEnabled) {
            const renderPaint = this.renderPaint;
            const previousShader = renderPaint.getShader();
            const shader = dataSet.fillShader;
            if (shader) {
                renderPaint.setShader(shader);
            }
            const drawable = dataSet.fillDrawable;
            if (drawable) {
                this.drawFilledPathBitmap(c, surface, drawable, dataSet.fillShader);
            } else {
                this.drawFilledPath(c, surface, dataSet.fillColor, dataSet.fillAlpha);
            }
            renderPaint.setShader(previousShader);
        }

        // draw the line (only if filled is disabled or alpha is below 255)
        const lineWidth = dataSet.lineWidth;
        if ((!dataSet.drawFilledEnabled || dataSet.fillAlpha < 255) && lineWidth > 0) {
            const renderPaint = this.renderPaint;
            renderPaint.setColor(dataSet.color);
            renderPaint.setStrokeWidth(lineWidth);
            renderPaint.setStyle(Style.STROKE);
            c.drawPath(surface, renderPaint);
        }
        // MPPointF.recycleInstance(center);
        // MPPointF.recycleInstance(pOut);
    }

    public drawValues(c: Canvas) {
        const chart = this.mChart;
        const data = chart.data;
        const dataSets = data.dataSets;
        if (dataSets.some((d) => d.drawValuesEnabled || d.drawIconsEnabled) === false) {
            return;
        }
        const phaseX = this.animator.phaseX;
        const phaseY = this.animator.phaseY;

        const sliceangle = chart.sliceAngle;

        // calculate the factor that is needed for transforming the value to
        // pixels
        const factor = chart.factor;

        const center = chart.centerOffsets;
        const pOut: MPPointF = { x: 0, y: 0 };
        const pIcon: MPPointF = { x: 0, y: 0 };

        const yoffset = 5;
        const customRender = chart.customRenderer;
        for (let i = 0; i < data.dataSetCount; i++) {
            const dataSet = data.getDataSetByIndex(i);
            if (!this.shouldDrawValues(dataSet) || dataSet.entryCount < 1) continue;

            const drawValues = dataSet.drawValuesEnabled;
            const drawIcons = dataSet.drawIconsEnabled;
            if (!drawValues && !drawIcons) {
                continue;
            }
            const yProperty = dataSet.yProperty;

            if (!this.shouldDrawValues(dataSet)) continue;

            // apply the text-styling defined by the DataSet
            this.applyValueTextStyle(dataSet);

            const formatter = dataSet.valueFormatter;

            const iconsOffset = dataSet.iconsOffset;
            const valuesOffset = dataSet.valuesOffset;
            const paint = this.valuePaint;
            for (let j = 0; j < dataSet.entryCount; j++) {
                const entry = dataSet.getEntryForIndex(j);
                const yVal = entry[yProperty];
                if (yVal === undefined || yVal === null) {
                    continue;
                }
                Utils.getPosition(center, (yVal - chart.yChartMin) * factor * phaseY, sliceangle * j * phaseX + chart.rotationAngle, pOut);

                if (drawValues) {
                    this.drawValue(
                        c,
                        chart,
                        dataSet,
                        i,
                        entry,
                        j,
                        (formatter.getRadarLabel || formatter.getFormattedValue).call(formatter, yVal, entry),
                        pOut.x + valuesOffset.x,
                        pOut.y + valuesOffset.y - yoffset,
                        dataSet.getValueTextColor(j),
                        paint,
                        customRender
                    );
                }

                if (drawIcons) {
                    Utils.getPosition(center, yVal * factor * phaseY + iconsOffset.y, sliceangle * j * phaseX + chart.rotationAngle, pIcon);

                    //noinspection SuspiciousNameCombination
                    pIcon.y += iconsOffset.x;

                    this.drawIcon(c, chart, dataSet, i, entry, j, dataSet.getEntryIcon(entry), pIcon.x, pIcon.y, customRender);
                }
            }

            // MPPointF.recycleInstance(iconsOffset);
        }

        // MPPointF.recycleInstance(center);
        // MPPointF.recycleInstance(pOut);
        // MPPointF.recycleInstance(pIcon);
    }

    public drawExtras(c: Canvas) {
        this.drawWeb(c);
    }

    protected drawWeb(c: Canvas) {
        const sliceangle = this.mChart.sliceAngle;

        // calculate the factor that is needed for transforming the value to
        // pixels
        const factor = this.mChart.factor;
        const rotationangle = this.mChart.rotationAngle;

        const center = this.mChart.centerOffsets;

        // draw the web lines that come from the center
        const lineWidth = this.mChart.webLineWidth;
        if (lineWidth > 0) {
            const paint = this.webPaint;
            paint.setStrokeWidth(this.mChart.webLineWidth);
            paint.setColor(this.mChart.webColor);
            paint.setAlpha(this.mChart.webAlpha);

            const xIncrements = 1 + this.mChart.skipWebLineCount;
            const maxEntryCount = this.mChart.data.maxEntryCountSet.entryCount;

            const p: MPPointF = { x: 0, y: 0 };
            for (let i = 0; i < maxEntryCount; i += xIncrements) {
                Utils.getPosition(center, this.mChart.yRange * factor, sliceangle * i + rotationangle, p);

                c.drawLine(center.x, center.y, p.x, p.y, paint);
            }
        }

        // MPPointF.recycleInstance(p);

        // draw the inner-web
        const innerWidth = this.mChart.webLineWidthInner;
        if (innerWidth > 0) {
            const paint = this.webPaint;
            paint.setStrokeWidth(this.mChart.webLineWidthInner);
            paint.setColor(this.mChart.webColorInner);
            paint.setAlpha(this.mChart.webAlpha);

            const labelCount = this.mChart.yAxis.mEntryCount;

            const p1out: MPPointF = { x: 0, y: 0 };
            const p2out: MPPointF = { x: 0, y: 0 };
            for (let j = 0; j < labelCount; j++) {
                for (let i = 0; i < this.mChart.data.entryCount; i++) {
                    const r = (this.mChart.yAxis.mEntries[j] - this.mChart.yChartMin) * factor;

                    Utils.getPosition(center, r, sliceangle * i + rotationangle, p1out);
                    Utils.getPosition(center, r, sliceangle * (i + 1) + rotationangle, p2out);

                    c.drawLine(p1out.x, p1out.y, p2out.x, p2out.y, this.mWebPaint);
                }
            }
        }

        // MPPointF.recycleInstance(p1out);
        // MPPointF.recycleInstance(p2out);
    }

    public drawHighlighted(c: Canvas, indices: Highlight[]) {
        const sliceangle = this.mChart.sliceAngle;

        // calculate the factor that is needed for transforming the value to
        // pixels
        const factor = this.mChart.factor;

        const center = this.mChart.centerOffsets;
        const pOut: MPPointF = { x: 0, y: 0 };

        const radarData = this.mChart.data;

        for (const high of indices) {
            const set = radarData.getDataSetByIndex(high.dataSetIndex);
            const yProperty = set.yProperty;

            if (!set || !set.highlightEnabled) continue;

            const e = set.getEntryForIndex(high.x);

            if (!this.isInBoundsX(e, set)) continue;

            const y = e[yProperty] - this.mChart.yChartMin;

            Utils.getPosition(center, y * factor * this.animator.phaseY, sliceangle * high.x * this.animator.phaseX + this.mChart.rotationAngle, pOut);

            high.drawX = pOut.x;
            high.drawY = pOut.y;

            // draw the lines
            this.drawHighlightLines(c, pOut.x, pOut.y, set);

            if (set.drawHighlightCircleEnabled) {
                if (!isNaN(pOut.x) && !isNaN(pOut.y)) {
                    let strokeColor = set.highlightCircleStrokeColor;
                    if (strokeColor === ColorTemplate.COLOR_NONE) {
                        strokeColor = set.getColor(0);
                    }

                    if (set.highlightCircleStrokeAlpha < 255) {
                        strokeColor = ColorTemplate.colorWithAlpha(strokeColor instanceof Color ? strokeColor : new Color(strokeColor), set.highlightCircleStrokeAlpha);
                    }

                    this.drawHighlightCircle(c, pOut, set.highlightCircleInnerRadius, set.highlightCircleOuterRadius, set.highlightCircleFillColor, strokeColor, set.highlightCircleStrokeWidth);
                }
            }
        }

        // MPPointF.recycleInstance(center);
        // MPPointF.recycleInstance(pOut);
    }

    public drawHighlightCircle(c: Canvas, point: MPPointF, innerRadius, outerRadius, fillColor, strokeColor, strokeWidth) {
        c.save();

        const paint = Utils.getTempPaint();
        if (fillColor && fillColor !== ColorTemplate.COLOR_NONE) {
            const p = Utils.getTempPath();
            p.reset();
            p.addCircle(point.x, point.y, outerRadius, Direction.CW);
            if (innerRadius > 0) {
                p.addCircle(point.x, point.y, innerRadius, Direction.CCW);
            }
            paint.setColor(fillColor);
            paint.setStyle(Style.FILL);
            c.drawPath(p, paint);
        }

        if (strokeColor && strokeColor !== ColorTemplate.COLOR_NONE) {
            paint.setColor(strokeColor);
            paint.setStyle(Style.STROKE);
            paint.setStrokeWidth(strokeWidth);
            c.drawCircle(point.x, point.y, outerRadius, paint);
        }

        c.restore();
    }
}
