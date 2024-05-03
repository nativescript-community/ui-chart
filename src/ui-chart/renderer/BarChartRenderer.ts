import { Canvas, Paint, RectF } from '@nativescript-community/ui-canvas';
import { TypedArray } from '@nativescript-community/arraybuffers';
import { profile } from '@nativescript/core';
import { ChartAnimator } from '../animation/ChartAnimator';
import { BarBuffer } from '../buffer/BarBuffer';
import { BarChart } from '../charts/BarChart';
import { Entry } from '../data/Entry';
import { Highlight } from '../highlight/Highlight';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { BarLineScatterCandleBubbleRenderer } from './BarLineScatterCandleBubbleRenderer';

export class BarChartRenderer extends BarLineScatterCandleBubbleRenderer {
    public mChart: BarChart;

    protected mBarBuffers: BarBuffer[];

    protected mTransformedBuffer: TypedArray;

    /**
     * palet for the bar shadow
     */
    protected mShadowPaint: Paint;

    /**
     * palet for the bar border
     */
    protected mBarBorderPaint: Paint;

    constructor(chart: BarChart, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;
    }

    public get highlightPaint() {
        if (!this.mHighlightPaint) {
            this.mHighlightPaint = Utils.getTemplatePaint('black-fill');
            // set alpha after color
            this.mHighlightPaint.setAlpha(120);
        }
        return this.mHighlightPaint;
    }
    public get barBorderPaint() {
        if (!this.mBarBorderPaint) {
            this.mBarBorderPaint = Utils.getTemplatePaint('black-stroke');
        }
        return this.mBarBorderPaint;
    }
    public get shadowPaint() {
        if (!this.mShadowPaint) {
            this.mShadowPaint = Utils.getTemplatePaint('black-fill');
        }
        return this.mShadowPaint;
    }

    public initBuffers() {
        const barData = this.mChart.barData;
        this.mBarBuffers = [];

        for (let i = 0; i < barData.dataSetCount; i++) {
            const set = barData.getDataSetByIndex(i);
            this.mBarBuffers.push(new BarBuffer(set.entryCount * 4 * (set.stacked ? set.stackSize : 1), barData.dataSetCount, set.stacked));
        }
    }

    public drawData(c: Canvas) {
        const barData = this.mChart.barData;

        for (let i = 0; i < barData.dataSetCount; i++) {
            const set = barData.getDataSetByIndex(i);
            if (set.visible) {
                this.drawDataSet(c, set, i);
            }
        }
    }

    protected drawDataSet(c: Canvas, dataSet: IBarDataSet, index: number): boolean {
        const chart = this.mChart;
        const trans = chart.getTransformer(dataSet.axisDependency);

        const drawBorder = dataSet.barBorderWidth > 0;
        let borderPaint: Paint;
        if (drawBorder) {
            borderPaint = this.barBorderPaint;
            borderPaint.setColor(dataSet.barBorderColor);
            borderPaint.setStrokeWidth(dataSet.barBorderWidth);
        }

        const phaseX = this.animator.phaseX;
        const phaseY = this.animator.phaseY;
        const barData = chart.barData;
        let barWidth = barData.barWidth;
        if (barData.fixedBarScale) {
            const scaleX = chart.viewPortScaleX;
            barWidth /= scaleX;
        }

        // draw the bar shadow before the values
        if (chart.drawBarShadowEnabled) {
            const paint = this.shadowPaint;
            paint.setColor(dataSet.barShadowColor);

            const barWidthHalf = barWidth / 2;
            let x;

            const barShadowRectBuffer = Utils.getTempRectF();
            for (let i = 0, count = Math.min(Math.ceil(dataSet.entryCount * phaseX), dataSet.entryCount); i < count; i++) {
                const e = dataSet.getEntryForIndex(i);
                x = dataSet.getEntryXValue(e, i);
                barShadowRectBuffer.left = x - barWidthHalf;
                barShadowRectBuffer.right = x + barWidthHalf;

                trans.rectValueToPixel(barShadowRectBuffer);

                if (!this.mViewPortHandler.isInBoundsLeft(barShadowRectBuffer.right)) {
                    continue;
                }

                if (!this.mViewPortHandler.isInBoundsRight(barShadowRectBuffer.left)) {
                    break;
                }

                barShadowRectBuffer.top = this.mViewPortHandler.contentTop;
                barShadowRectBuffer.bottom = this.mViewPortHandler.contentBottom;

                c.drawRect(barShadowRectBuffer, paint);
            }
        }

        // initialize the buffer
        const buffer = this.mBarBuffers[index];
        buffer.setPhases(phaseX, phaseY);
        buffer.dataSetIndex = index;
        buffer.inverted = chart.isInverted(dataSet.axisDependency);

        buffer.barWidth = barWidth;
        buffer.yAxisMin = chart.getAxis(dataSet.axisDependency).axisMinimum;
        buffer.yAxisMax = chart.getAxis(dataSet.axisDependency).axisMaximum;

        const barsCount = buffer.feed(dataSet);

        trans.pointValuesToPixel(buffer.buffer);

        const isSingleColor = !dataSet.colors || dataSet.colors.length === 1;
        // const isInverted = chart.isInverted(dataSet.axisDependency);
        const renderPaint = this.renderPaint;
        const previousShader = renderPaint.getShader();
        const shader = dataSet.fillShader;
        if (shader) {
            renderPaint.setShader(shader);
        }
        if (isSingleColor) {
            renderPaint.setColor(dataSet.getColor());
        }

        const customRender = chart.customRenderer;
        for (let j = 0; j < barsCount; j += 1) {
            const left = buffer.buffer[j * 4];
            const top = buffer.buffer[j * 4 + 1];
            const right = buffer.buffer[j * 4 + 2];
            const bottom = buffer.buffer[j * 4 + 3];
            if (!this.mViewPortHandler.isInBoundsLeft(right)) {
                continue;
            }

            if (!this.mViewPortHandler.isInBoundsRight(left)) {
                break;
            }
            if (!isSingleColor) {
                // Set the color for the currently drawn value. If the index
                // is out of bounds, reuse colors.
                renderPaint.setColor(dataSet.getColor(j));
            }
            if (customRender && customRender.drawBar) {
                const e = buffer.entries[j];
                customRender.drawBar(c, e, dataSet, left, top, right, bottom, renderPaint);
            } else {
                c.drawRect(left, top, right, bottom, renderPaint);
                if (drawBorder) {
                    c.drawRect(left, top, right, bottom, borderPaint);
                }
            }
        }
        renderPaint.setShader(previousShader);

        return true;
    }

    protected prepareBarHighlight(x: number, y1: number, y2: number, barWidthHalf: number, trans: Transformer, barRect: RectF) {
        const left = x - barWidthHalf;
        const right = x + barWidthHalf;
        const top = y1;
        const bottom = y2;
        barRect.set(left, top, right, bottom);

        trans.rectToPixelPhase(barRect, this.animator.phaseY);
    }

    public drawValues(c: Canvas) {
        const chart = this.mChart;
        const data = chart.barData;
        const dataSets = data.dataSets;
        if (!this.isDrawingValuesAllowed(chart) || dataSets.some((d) => d.drawValuesEnabled || d.drawIconsEnabled) === false) {
            return;
        }
        // if values are drawn

        const valueOffsetPlus = 4.5;
        let posOffset = 0;
        let negOffset = 0;
        const drawValueAboveBar = chart.drawValueAboveBarEnabled;
        const paint = this.valuePaint;
        const customRender = chart.customRenderer;
        for (let i = 0; i < chart.barData.dataSetCount; i++) {
            const dataSet = dataSets[i];
            if (!this.shouldDrawValues(dataSet)) {
                continue;
            }

            const yKey = dataSet.yProperty;

            // apply the text-styling defined by the DataSet
            this.applyValueTextStyle(dataSet);

            const isInverted = chart.isInverted(dataSet.axisDependency);

            // calculate the correct offset depending on the draw position of
            // the value
            const valueTextHeight = Utils.calcTextHeight(paint, '8');
            const valuesOffset = dataSet.valuesOffset;
            posOffset = drawValueAboveBar ? -(valueOffsetPlus + valuesOffset.y) : valueTextHeight + (valueOffsetPlus + valuesOffset.y);
            negOffset = drawValueAboveBar ? valueTextHeight + (valueOffsetPlus + valuesOffset.y) : -(valueOffsetPlus + valuesOffset.y);

            if (isInverted) {
                posOffset = -posOffset - valueTextHeight;
                negOffset = -negOffset - valueTextHeight;
            }

            // get the buffer
            const buffer = this.mBarBuffers[i];

            const phaseY = this.animator.phaseY;
            const formatter = dataSet.valueFormatter;

            const iconsOffset = dataSet.iconsOffset;

            // if only single values are drawn (sum)

            const isDrawValuesEnabled = dataSet.drawValuesEnabled;
            const isDrawIconsEnabled = dataSet.drawIconsEnabled;
            if (!dataSet.stacked) {
                for (let j = 0; j < buffer.length * this.animator.phaseX; j += 4) {
                    const x = (buffer.buffer[j] + buffer.buffer[j + 2]) / 2;

                    if (!this.mViewPortHandler.isInBoundsRight(x)) {
                        break;
                    }
                    const index = j / 4;
                    const entry = dataSet.getEntryForIndex(index);
                    const val = entry[yKey];

                    if (!this.mViewPortHandler.isInBoundsY(buffer.buffer[j + (val >= 0 ? 1 : 3)]) || !this.mViewPortHandler.isInBoundsLeft(x)) {
                        continue;
                    }

                    if (isDrawValuesEnabled) {
                        this.drawValue(
                            c,
                            chart,
                            dataSet,
                            i,
                            entry,
                            index,
                            (formatter.getBarLabel || formatter.getFormattedValue).call(formatter, val, entry),
                            x + valuesOffset.x,
                            val >= 0 ? buffer.buffer[j + 1] + posOffset : buffer.buffer[j + 3] + negOffset,
                            dataSet.getValueTextColor(index),
                            paint,
                            customRender
                        );
                    }

                    if (isDrawIconsEnabled) {
                        let px = x;
                        let py = val >= 0 ? buffer.buffer[j + 1] + posOffset : buffer.buffer[j + 3] + negOffset;

                        px += iconsOffset.x;
                        py += iconsOffset.y;

                        this.drawIcon(c, chart, dataSet, i, entry, index, dataSet.getEntryIcon(entry), px, py, customRender);
                    }
                }
                // if we have stacks
            } else {
                const trans = chart.getTransformer(dataSet.axisDependency);

                let bufferIndex = 0;
                let index = 0;

                while (index < dataSet.entryCount * this.animator.phaseX) {
                    const entry = dataSet.getEntryForIndex(index);

                    const vals = entry.yVals;
                    const x = (buffer.buffer[bufferIndex] + buffer.buffer[bufferIndex + 2]) / 2;

                    const color = dataSet.getValueTextColor(index);

                    // we still draw stacked bars, but there is one
                    // non-stacked
                    // in between
                    if (!vals) {
                        if (!this.mViewPortHandler.isInBoundsRight(x)) {
                            break;
                        }

                        if (!this.mViewPortHandler.isInBoundsY(buffer.buffer[bufferIndex + (entry[yKey] >= 0 ? 1 : 3)]) || !this.mViewPortHandler.isInBoundsLeft(x)) {
                            continue;
                        }

                        if (isDrawValuesEnabled) {
                            this.drawValue(
                                c,
                                chart,
                                dataSet,
                                i,
                                entry,
                                index,
                                (formatter.getBarLabel || formatter.getFormattedValue).call(formatter, entry[yKey], entry),
                                x,
                                entry[yKey] >= 0 ? buffer.buffer[bufferIndex + 1] + posOffset : buffer.buffer[bufferIndex + 3] + negOffset,
                                color,
                                paint,
                                customRender
                            );
                        }

                        if (isDrawIconsEnabled && entry.icon) {
                            const icon = entry.icon;

                            let px = x;
                            let py = entry[yKey] >= 0 ? buffer.buffer[bufferIndex + 1] + posOffset : buffer.buffer[bufferIndex + 3] + negOffset;

                            px += iconsOffset.x;
                            py += iconsOffset.y;

                            this.drawIcon(c, chart, dataSet, i, entry, index, dataSet.getEntryIcon(entry), px, py, customRender);
                        }
                        // draw stack values
                    } else {
                        if (!this.mTransformedBuffer || this.mTransformedBuffer.length !== vals.length * 2) {
                            this.mTransformedBuffer = Utils.createArrayBuffer(vals.length * 2);
                        }
                        const transformed = this.mTransformedBuffer;

                        let posY = 0;
                        let negY = -entry.negativeSum;

                        for (let k = 0, idx = 0; k < transformed.length; k += 2, idx++) {
                            const value = vals[idx];
                            let y;

                            if (value === 0 && (posY === 0 || negY === 0)) {
                                // Take care of the situation of a 0.0 value, which overlaps a non-zero bar
                                y = value;
                            } else if (value >= 0) {
                                posY += value;
                                y = posY;
                            } else {
                                y = negY;
                                negY -= value;
                            }

                            transformed[k + 1] = y * phaseY;
                        }

                        const points = Utils.pointsFromBuffer(transformed);
                        trans.pointValuesToPixel(points);

                        for (let k = 0; k < points.length; k += 2) {
                            const val = vals[k / 2];
                            const drawBelow = (val === 0 && negY === 0 && posY > 0) || val < 0;
                            const y = points[k + 1] + (drawBelow ? negOffset : posOffset);

                            if (!this.mViewPortHandler.isInBoundsRight(x)) {
                                break;
                            }

                            if (!this.mViewPortHandler.isInBoundsY(y) || !this.mViewPortHandler.isInBoundsLeft(x)) {
                                continue;
                            }

                            if (dataSet.drawValuesEnabled) {
                                this.drawValue(
                                    c,
                                    chart,
                                    dataSet,
                                    i,
                                    entry,
                                    index,
                                    (formatter.getBarStackedLabel || formatter.getFormattedValue).call(formatter, val, entry),
                                    x,
                                    y,
                                    color,
                                    paint,
                                    customRender
                                );
                            }

                            if (dataSet.drawIconsEnabled) {
                                this.drawIcon(c, chart, dataSet, i, entry, index, dataSet.getEntryIcon(entry), x + iconsOffset.x, y + iconsOffset.y, customRender);
                            }
                        }
                    }

                    bufferIndex = !vals ? bufferIndex + 4 : bufferIndex + 4 * vals.length;
                    index++;
                }
            }
        }
    }

    public drawHighlighted(c: Canvas, indices: Highlight[]) {
        const barData = this.mChart.barData;
        let entry: Entry, index: number;
        const barRect = Utils.getTempRectF();
        for (let i = 0; i < indices.length; i++) {
            const high = indices[i];
            const set = barData.getDataSetByIndex(high.dataSetIndex);

            if (!set || !set.highlightEnabled) {
                continue;
            }
            if (high.entry) {
                entry = high.entry;
                index = high.entryIndex;
            } else {
                const r = set.getEntryAndIndexForXValue(high.x, high.y);
                entry = r.entry;
                index = r.index;
            }
            if (!this.isInBoundsX(entry, set)) {
                continue;
            }

            const yKey = set.yProperty;
            const trans = this.mChart.getTransformer(set.axisDependency);

            const paint = this.highlightPaint;
            paint.setColor(set.highlightColor);
            paint.setAlpha(set.highLightAlpha);

            const isStack = high.stackIndex >= 0 && entry.isStacked ? true : false;

            let y1;
            let y2;

            if (isStack) {
                if (this.mChart.highlightFullBarEnabled) {
                    y1 = entry.positiveSum;
                    y2 = -entry.negativeSum;
                } else {
                    const range = entry.ranges[high.stackIndex];
                    y1 = range[0];
                    y2 = range[1];
                }
            } else {
                const minAxisValue = this.mChart.getAxis(set.axisDependency).axisMinimum;
                y1 = entry[yKey];
                y2 = minAxisValue >= 0 ? minAxisValue : 0;
            }
            const x = set.getEntryXValue(entry, index);
            this.prepareBarHighlight(x, y1, y2, barData.barWidth / 2, trans, barRect);

            this.setHighlightDrawPos(high, barRect);
            const customRender = this.mChart.customRenderer;
            if (customRender && customRender.drawHighlight) {
                const rect = barRect;
                customRender.drawHighlight(c, high, rect.left, rect.top, rect.right, rect.bottom, paint);
            } else {
                c.drawRect(barRect, paint);
            }
        }
    }

    /**
     * Sets the drawing position of the highlight object based on the riven bar-rect.
     * @param high
     * @param bar
     */
    protected setHighlightDrawPos(high: Highlight, bar: RectF) {
        high.drawX = bar.centerX();
        high.drawY = bar.top;
    }

    public drawExtras(c: Canvas) {}
}
