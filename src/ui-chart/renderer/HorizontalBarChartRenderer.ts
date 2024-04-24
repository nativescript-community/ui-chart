import { Align, Canvas, Paint, RectF } from '@nativescript-community/ui-canvas';
import { HorizontalBarBuffer } from '../buffer/HorizontalBarBuffer';
import { Highlight } from '../highlight/Highlight';
import { ChartInterface } from '../interfaces/dataprovider/ChartInterface';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { BarChartRenderer } from './BarChartRenderer';

export class HorizontalBarChartRenderer extends BarChartRenderer {
    public get valuePaint() {
        if (!this.mValuePaint) {
            this.mValuePaint = Utils.getTemplatePaint('value');
            this.mValuePaint.setTextAlign(Align.LEFT);
        }
        return this.mValuePaint;
    }

    public initBuffers() {
        const barData = this.mChart.barData;
        this.mBarBuffers = [] as HorizontalBarBuffer[];

        for (let i = 0; i < barData.dataSetCount; i++) {
            const set = barData.getDataSetByIndex(i);
            this.mBarBuffers.push(new HorizontalBarBuffer(set.entryCount * 4 * (set.stacked ? set.stackSize : 1), barData.dataSetCount, set.stacked));
        }
    }

    protected drawDataSet(c: Canvas, dataSet: IBarDataSet, index: number): boolean {
        const trans = this.mChart.getTransformer(dataSet.axisDependency);

        const drawBorder = dataSet.barBorderWidth > 0;
        let borderPaint: Paint;
        if (drawBorder) {
            borderPaint = this.barBorderPaint;
            borderPaint.setColor(dataSet.barBorderColor());
            borderPaint.setStrokeWidth(dataSet.barBorderWidth);
        }

        const phaseX = this.animator.phaseX;
        const phaseY = this.animator.phaseY;

        // draw the bar shadow before the values
        if (this.mChart.drawBarShadowEnabled) {
            const paint = this.shadowPaint;
            paint.setColor(dataSet.barShadowColor);

            const barData = this.mChart.barData;

            const barWidth = barData.barWidth;
            const barWidthHalf = barWidth / 2;
            let x;

            const barShadowRectBuffer = Utils.getTempRectF();
            for (let i = 0, count = Math.min(Math.ceil(dataSet.entryCount * phaseX), dataSet.entryCount); i < count; i++) {
                const e = dataSet.getEntryForIndex(i);
                x = dataSet.getEntryXValue(e, i);

                barShadowRectBuffer.top = x - barWidthHalf;
                barShadowRectBuffer.bottom = x + barWidthHalf;

                trans.rectValueToPixel(barShadowRectBuffer);

                if (!this.mViewPortHandler.isInBoundsTop(barShadowRectBuffer.bottom)) {
                    continue;
                }

                if (!this.mViewPortHandler.isInBoundsBottom(barShadowRectBuffer.top)) {
                    break;
                }

                barShadowRectBuffer.left = this.mViewPortHandler.contentLeft;
                barShadowRectBuffer.right = this.mViewPortHandler.contentRight;

                c.drawRect(barShadowRectBuffer, paint);
            }
        }

        // initialize the buffer
        const buffer = this.mBarBuffers[index];
        buffer.setPhases(phaseX, phaseY);
        buffer.dataSetIndex = index;
        buffer.inverted = this.mChart.isInverted(dataSet.axisDependency);
        buffer.barWidth = this.mChart.barData.barWidth;
        buffer.yAxisMin = this.mChart.getAxis(dataSet.axisDependency).axisMinimum;
        buffer.yAxisMax = this.mChart.getAxis(dataSet.axisDependency).axisMaximum;

        buffer.feed(dataSet);

        trans.pointValuesToPixel(buffer.buffer);

        const isSingleColor = dataSet.colors.length === 1;
        const renderPaint = this.renderPaint;
        const previousShader = renderPaint.getShader();
        const shader = dataSet.fillShader;
        if (shader) {
            renderPaint.setShader(shader);
        }

        if (isSingleColor) {
            renderPaint.setColor(dataSet.getColor());
        }

        const customRender = this.mChart.customRenderer;
        for (let j = 0, pos = 0; j < buffer.length; j += 4, pos++) {
            if (!this.mViewPortHandler.isInBoundsTop(buffer.buffer[j + 3])) {
                break;
            }

            if (!this.mViewPortHandler.isInBoundsBottom(buffer.buffer[j + 1])) {
                continue;
            }
            if (!isSingleColor) {
                // Set the color for the currently drawn value. If the index
                // is out of bounds, reuse colors.
                renderPaint.setColor(dataSet.getColor(j / 4));
            }
            if (customRender && customRender.drawBar) {
                const e = dataSet.getEntryForIndex(j / 4);
                customRender.drawBar(c, e, dataSet, buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2], buffer.buffer[j + 3], renderPaint);
            } else {
                c.drawRect(buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2], buffer.buffer[j + 3], renderPaint);

                if (drawBorder) {
                    c.drawRect(buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2], buffer.buffer[j + 3], borderPaint);
                }
            }
        }
        renderPaint.setShader(previousShader);

        return true;
    }

    public drawValues(c: Canvas) {
        const chart = this.mChart;
        const data = chart.data;
        const dataSets = data.dataSets;
        if (!this.isDrawingValuesAllowed(chart) || dataSets.some((d) => d.drawValuesEnabled || d.drawIconsEnabled) === false) {
            return;
        }
        // if values are drawn

        const valueOffsetPlus = 5;
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
            const isInverted = chart.isInverted(dataSet.axisDependency);

            // apply the text-styling defined by the DataSet
            this.applyValueTextStyle(dataSet);
            const halfTextHeight = Utils.calcTextHeight(paint, '10') / 2;

            const formatter = dataSet.valueFormatter;

            // get the buffer
            const buffer = this.mBarBuffers[i];

            const phaseY = this.animator.phaseY;

            const iconsOffset = dataSet.iconsOffset;
            const valuesOffset = dataSet.valuesOffset;

            const isDrawValuesEnabled = dataSet.drawValuesEnabled;
            const isDrawIconsEnabled = dataSet.drawIconsEnabled;
            // if only single values are drawn (sum)
            if (!dataSet.stacked) {
                for (let j = 0; j < buffer.length * this.animator.phaseX; j += 4) {
                    const y = (buffer.buffer[j + 1] + buffer.buffer[j + 3]) / 2;

                    if (!this.mViewPortHandler.isInBoundsTop(buffer.buffer[j + 1])) {
                        break;
                    }
                    const index = j / 4;
                    const entry = dataSet.getEntryForIndex(index);
                    const val = entry[yKey];

                    if (!this.mViewPortHandler.isInBoundsX(buffer.buffer[j + (val >= 0 ? 0 : 2)])) {
                        continue;
                    }

                    if (!this.mViewPortHandler.isInBoundsBottom(buffer.buffer[j + 1])) {
                        continue;
                    }

                    const formattedValue = (formatter.getBarLabel || formatter.getFormattedValue).call(formatter, val, entry);

                    // calculate the correct offset depending on the draw position of the value
                    const valueTextWidth = Utils.calcTextWidth(paint, formattedValue);
                    posOffset = drawValueAboveBar ? valueOffsetPlus + valuesOffset.x : -(valueTextWidth + valueOffsetPlus + valuesOffset.x);
                    negOffset = drawValueAboveBar ? -(valueTextWidth + valueOffsetPlus + valuesOffset.x) : valueOffsetPlus + valuesOffset.x;

                    if (isInverted) {
                        posOffset = -posOffset - valueTextWidth;
                        negOffset = -negOffset - valueTextWidth;
                    }

                    if (isDrawValuesEnabled) {
                        this.drawValue(
                            c,
                            chart,
                            dataSet,
                            i,
                            entry,
                            index,
                            formattedValue,
                            val >= 0 ? buffer.buffer[j + 2] + posOffset : buffer.buffer[j + 0] + negOffset,
                            y + valuesOffset.y + halfTextHeight,
                            dataSet.getValueTextColor(j / 2),
                            paint,
                            customRender
                        );
                    }

                    if (dataSet.drawIconsEnabled) {
                        const icon = entry.icon;

                        let px = val >= 0 ? buffer.buffer[j + 2] + posOffset : buffer.buffer[j + 0] + negOffset;
                        let py = y;

                        px += iconsOffset.x;
                        py += iconsOffset.y;

                        this.drawIcon(c, chart, dataSet, i, entry, index, dataSet.getEntryIcon(entry), px, py, customRender);
                    }
                }
                // if each value of a potential stack should be drawn
            } else {
                const trans = chart.getTransformer(dataSet.axisDependency);

                let bufferIndex = 0;
                let index = 0;

                while (index < dataSet.entryCount * this.animator.phaseX) {
                    const entry = dataSet.getEntryForIndex(index);

                    const vals = entry.yVals;
                    const color = dataSet.getValueTextColor(index);

                    // we still draw stacked bars, but there is one
                    // non-stacked
                    // in between
                    if (!vals) {
                        if (!this.mViewPortHandler.isInBoundsTop(buffer.buffer[bufferIndex + 1])) {
                            break;
                        }

                        if (!this.mViewPortHandler.isInBoundsX(buffer.buffer[bufferIndex + (entry[yKey] >= 0 ? 0 : 2)])) {
                            continue;
                        }

                        if (!this.mViewPortHandler.isInBoundsBottom(buffer.buffer[bufferIndex + 1])) {
                            continue;
                        }

                        const formattedValue = (formatter.getBarLabel || formatter.getFormattedValue).call(formatter, entry[yKey], entry);

                        // calculate the correct offset depending on the draw position of the value
                        const valueTextWidth = Utils.calcTextWidth(paint, formattedValue);
                        posOffset = drawValueAboveBar ? valueOffsetPlus : -(valueTextWidth + valueOffsetPlus);
                        negOffset = drawValueAboveBar ? -(valueTextWidth + valueOffsetPlus) : valueOffsetPlus;

                        if (isInverted) {
                            posOffset = -posOffset - valueTextWidth;
                            negOffset = -negOffset - valueTextWidth;
                        }

                        if (isDrawValuesEnabled) {
                            this.drawValue(
                                c,
                                chart,
                                dataSet,
                                i,
                                entry,
                                index,
                                formattedValue,
                                entry[yKey] >= 0 ? buffer.buffer[bufferIndex + 2] + posOffset : buffer.buffer[bufferIndex + 0] + negOffset,
                                buffer.buffer[bufferIndex + 1] + halfTextHeight + valuesOffset.y,
                                color,
                                paint,
                                customRender
                            );
                        }

                        if (isDrawIconsEnabled) {
                            const icon = entry.icon;

                            let px = entry[yKey] >= 0 ? buffer.buffer[bufferIndex + 2] + posOffset : buffer.buffer[bufferIndex + 0] + negOffset;
                            let py = buffer.buffer[bufferIndex + 1];

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

                            transformed[k] = y * phaseY;
                        }

                        const points = Utils.pointsFromBuffer(transformed);
                        trans.pointValuesToPixel(transformed);

                        for (let k = 0; k < points.length; k += 2) {
                            const val = vals[k / 2];
                            const formattedValue = (formatter.getBarStackedLabel || formatter.getFormattedValue).call(formatter, val, entry);

                            // calculate the correct offset depending on the draw position of the value
                            const valueTextWidth = Utils.calcTextWidth(paint, formattedValue);
                            posOffset = drawValueAboveBar ? valueOffsetPlus + valuesOffset.x : -(valueTextWidth + valueOffsetPlus + valuesOffset.x);
                            negOffset = drawValueAboveBar ? -(valueTextWidth + valueOffsetPlus + valuesOffset.x) : valueOffsetPlus + valuesOffset.x;

                            if (isInverted) {
                                posOffset = -posOffset - valueTextWidth;
                                negOffset = -negOffset - valueTextWidth;
                            }

                            const drawBelow = (val === 0 && negY === 0 && posY > 0) || val < 0;
                            const x = points[k] + (drawBelow ? negOffset : posOffset);
                            const y = (buffer.buffer[bufferIndex + 1] + buffer.buffer[bufferIndex + 3]) / 2;

                            if (!this.mViewPortHandler.isInBoundsTop(y)) {
                                break;
                            }

                            if (!this.mViewPortHandler.isInBoundsX(x)) {
                                continue;
                            }

                            if (!this.mViewPortHandler.isInBoundsBottom(y)) {
                                continue;
                            }

                            if (isDrawValuesEnabled) {
                                this.drawValue(c, chart, dataSet, i, entry, index, formattedValue, x, y + halfTextHeight + valuesOffset.y, color, paint, customRender);
                            }

                            if (isDrawIconsEnabled) {
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

    protected prepareBarHighlight(x: number, y1: number, y2: number, barWidthHalf: number, trans: Transformer, barRect: RectF) {
        const top = x - barWidthHalf;
        const bottom = x + barWidthHalf;
        const left = y1;
        const right = y2;

        barRect.set(left, top, right, bottom);

        trans.rectToPixelPhaseHorizontal(barRect, this.animator.phaseY);
    }

    /**
     * Sets the drawing position of the highlight object based on the riven bar-rect.
     * @param high
     * @param bar
     */
    // protected setHighlightDrawPos(high: Highlight, bar: RectF) {
    //     high.drawX = bar.centerY();
    //     high.drawY = bar.right;
    // }

    protected isDrawingValuesAllowed(chart: ChartInterface) {
        return chart.data.entryCount < chart.maxVisibleValueCount * this.mViewPortHandler.getScaleY();
    }
}
