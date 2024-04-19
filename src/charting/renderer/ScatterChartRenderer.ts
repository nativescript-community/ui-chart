import { ChartAnimator } from '../animation/ChartAnimator';
import { LineScatterCandleRadarRenderer } from './LineScatterCandleRadarRenderer';
import { ScatterDataProvider } from '../interfaces/dataprovider/ScatterDataProvider';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Canvas, Paint } from '@nativescript-community/ui-canvas';
import { CLog, CLogTypes, Utils } from '../utils/Utils';
import { IScatterDataSet } from '../interfaces/datasets/IScatterDataSet';
import { Highlight } from '../highlight/Highlight';
import { Entry } from '../data/Entry';
import { ScatterChart } from '..';
import { Trace } from '@nativescript/core';

export class ScatterChartRenderer extends LineScatterCandleRadarRenderer {
    mChart: ScatterChart;

    constructor(chart: ScatterChart, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;
    }

    public drawData(c: Canvas) {
        const scatterData = this.mChart.scatterData;

        for (const set of scatterData.dataSets) {
            if (set.visible) {
                this.drawDataSet(c, set);
            }
        }
    }

    protected drawDataSet(c: Canvas, dataSet: IScatterDataSet) {
        if (dataSet.entryCount < 1) return;

        const viewPortHandler = this.mViewPortHandler;

        const trans = this.mChart.getTransformer(dataSet.axisDependency);

        const phaseY = this.animator.phaseY;

        const renderer = dataSet.shapeRenderer;
        if (renderer == null) {
            if (Trace.isEnabled()) {
                CLog(CLogTypes.warning, "There's no IShapeRenderer specified for ScatterDataSet");
            }
            return;
        }

        const max = Math.min(Math.ceil(dataSet.entryCount * this.animator.phaseX), dataSet.entryCount);
        const yKey = dataSet.yProperty;
        const customRender = this.mChart.customRenderer;
        const renderPaint = this.renderPaint;
        const pixelBuffer = Utils.getTempArray(2);
        const previousShader = renderPaint.getShader();
        const shader = dataSet.fillShader;
        if (shader) {
            renderPaint.setShader(shader);
        }
        for (let i = 0; i < max; i++) {
            const e = dataSet.getEntryForIndex(i);

            pixelBuffer[0] = dataSet.getEntryXValue(e, i);
            pixelBuffer[1] = e[yKey] * phaseY;

            trans.pointValuesToPixel(pixelBuffer);

            if (!viewPortHandler.isInBoundsRight(pixelBuffer[0])) break;

            if (!viewPortHandler.isInBoundsLeft(pixelBuffer[0]) || !viewPortHandler.isInBoundsY(pixelBuffer[1])) continue;

            renderPaint.setColor(dataSet.getColor(i / 2));
            if (customRender && customRender.drawShape) {
                customRender.drawShape(c, e, dataSet, this.mViewPortHandler, pixelBuffer[0], pixelBuffer[1], renderPaint);
            } else {
                renderer.renderShape(c, dataSet, this.mViewPortHandler, pixelBuffer[0], pixelBuffer[1], renderPaint);
            }
        }
        renderPaint.setShader(previousShader);
    }

    public drawValues(c: Canvas) {
        const chart = this.mChart;
        const data = chart.scatterData;
        const dataSets = data.dataSets;
        if (!this.isDrawingValuesAllowed(chart) || dataSets.some((d) => d.drawValuesEnabled || d.drawIconsEnabled) === false) {
            return;
        }
        // if values are drawn

        const customRender = chart.customRenderer;
        for (let i = 0; i < chart.scatterData.dataSetCount; i++) {
            const dataSet = dataSets[i];
            const yKey = dataSet.yProperty;

            if (!this.shouldDrawValues(dataSet) || dataSet.entryCount < 1) continue;

            // apply the text-styling defined by the DataSet
            this.applyValueTextStyle(dataSet);

            this.mXBounds.set(chart, dataSet, this.animator);

            const { points, count } = chart
                .getTransformer(dataSet.axisDependency)
                .generateTransformedValuesScatter(dataSet, this.animator.phaseX, this.animator.phaseY, this.mXBounds.min, this.mXBounds.max);

            const shapeSize = dataSet.scatterShapeSize;

            const formatter = dataSet.valueFormatter;

            const iconsOffset = dataSet.iconsOffset;
            const valuesOffset = dataSet.valuesOffset;
            const drawValues = dataSet.drawValuesEnabled;
            const drawIcons = dataSet.drawIconsEnabled;
            const paint = this.valuePaint;
            for (let j = 0; j < count; j += 2) {
                if (!this.mViewPortHandler.isInBoundsRight(points[j])) break;

                // make sure the lines don't do shitty things outside bounds
                if (!this.mViewPortHandler.isInBoundsLeft(points[j]) || !this.mViewPortHandler.isInBoundsY(points[j + 1])) continue;

                const index = j / 2 + this.mXBounds.min;
                const entry = dataSet.getEntryForIndex(index);

                if (drawValues) {
                    this.drawValue(
                        c,
                        chart,
                        dataSet,
                        i,
                        entry,
                        index,
                        (formatter.getPointLabel || formatter.getFormattedValue).call(formatter, entry[yKey], entry),
                        points[j] + valuesOffset.x,
                        points[j + 1] + valuesOffset.y - shapeSize,
                        dataSet.getValueTextColor(j / 2 + this.mXBounds.min),
                        paint,
                        customRender
                    );
                }

                if (drawIcons) {
                    this.drawIcon(c, chart, dataSet, i, entry, index, dataSet.getEntryIcon(entry), points[j] + iconsOffset.x, points[j + 1] + iconsOffset.y, customRender);
                }
            }
        }
    }

    public drawExtras(c: Canvas) {}

    public drawHighlighted(c: Canvas, indices: Highlight[]) {
        const scatterData = this.mChart.scatterData;

        let entry: Entry, index: number;
        const customRender = this.mChart.customRenderer;
        const paint = this.highlightPaint;
        for (const high of indices) {
            const set = scatterData.getDataSetByIndex(high.dataSetIndex);
            const yKey = set.yProperty;

            if (set == null || !set.highlightEnabled) continue;

            if (high.entry) {
                entry = high.entry;
                index = high.entryIndex;
            } else {
                const r = set.getEntryAndIndexForXValue(high.x, high.y);
                entry = r.entry;
                index = r.index;
            }

            if (!this.isInBoundsX(entry, set)) continue;

            const pix = this.mChart.getTransformer(set.axisDependency).getPixelForValues(set.getEntryXValue(entry, index), entry[yKey] * this.animator.phaseY);

            high.x = pix.x;
            high.y = pix.y;

            if (customRender && customRender.drawHighlight) {
                customRender.drawHighlight(c, high, set, paint);
            } else {
                this.drawHighlightLines(c, pix.x, pix.y, set);
            }
            // draw the lines
            this.drawHighlightLines(c, pix.x, pix.y, set);
        }
    }
}
