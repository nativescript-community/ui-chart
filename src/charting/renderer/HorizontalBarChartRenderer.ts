import { BarChartRenderer } from './BarChartRenderer';
import { ChartAnimator } from '../animation/ChartAnimator';
import { HorizontalBarBuffer } from '../buffer/HorizontalBarBuffer';
import { BarChart } from '../charts/BarChart';
import { Highlight } from '../highlight/Highlight';
import { ChartInterface } from '../interfaces/dataprovider/ChartInterface';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Align, Canvas, RectF } from '@nativescript-community/ui-canvas';
import { getEntryXValue } from '../data/BaseEntry';

export class HorizontalBarChartRenderer extends BarChartRenderer {
    constructor(chart: BarChart, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(chart, animator, viewPortHandler);
        this.mValuePaint.setTextAlign(Align.LEFT);
    }

    public initBuffers() {
        const barData = this.mChart.getBarData();
        this.mBarBuffers = [] as HorizontalBarBuffer[];

        for (let i = 0; i < barData.getDataSetCount(); i++) {
            const set = barData.getDataSetByIndex(i);
            this.mBarBuffers.push(new HorizontalBarBuffer(set.getEntryCount() * 4 * (set.isStacked() ? set.getStackSize() : 1), barData.getDataSetCount(), set.isStacked()));
        }
    }

    protected drawDataSet(c: Canvas, dataSet: IBarDataSet, index: number): boolean {
        const xKey = dataSet.xProperty;
        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        this.mBarBorderPaint.setColor(dataSet.getBarBorderColor());
        this.mBarBorderPaint.setStrokeWidth(dataSet.getBarBorderWidth());

        const drawBorder = dataSet.getBarBorderWidth() > 0;

        const phaseX = this.mAnimator.getPhaseX();
        const phaseY = this.mAnimator.getPhaseY();

        // draw the bar shadow before the values
        if (this.mChart.isDrawBarShadowEnabled()) {
            this.mShadowPaint.setColor(dataSet.getBarShadowColor());

            const barData = this.mChart.getBarData();

            const barWidth = barData.getBarWidth();
            const barWidthHalf = barWidth / 2;
            let x;

            for (let i = 0, count = Math.min(Math.ceil(dataSet.getEntryCount() * phaseX), dataSet.getEntryCount()); i < count; i++) {
                const e = dataSet.getEntryForIndex(i);
                x = getEntryXValue(e, xKey, i);

                this.mBarShadowRectBuffer.top = x - barWidthHalf;
                this.mBarShadowRectBuffer.bottom = x + barWidthHalf;

                trans.rectValueToPixel(this.mBarShadowRectBuffer);

                if (!this.mViewPortHandler.isInBoundsTop(this.mBarShadowRectBuffer.bottom)) {
                    continue;
                }

                if (!this.mViewPortHandler.isInBoundsBottom(this.mBarShadowRectBuffer.top)) {
                    break;
                }

                this.mBarShadowRectBuffer.left = this.mViewPortHandler.contentLeft();
                this.mBarShadowRectBuffer.right = this.mViewPortHandler.contentRight();

                c.drawRect(this.mBarShadowRectBuffer, this.mShadowPaint);
            }
        }

        // initialize the buffer
        const buffer = this.mBarBuffers[index];
        buffer.setPhases(phaseX, phaseY);
        buffer.setDataSet(index);
        buffer.setInverted(this.mChart.isInverted(dataSet.getAxisDependency()));
        buffer.setBarWidth(this.mChart.getBarData().getBarWidth());
        buffer.setYAxisMin(this.mChart.getAxis(dataSet.getAxisDependency()).getAxisMinimum());
        buffer.setYAxisMax(this.mChart.getAxis(dataSet.getAxisDependency()).getAxisMaximum());

        buffer.feed(dataSet);

        trans.pointValuesToPixel(buffer.buffer);

        const isSingleColor = dataSet.getColors().length === 1;
        const isInverted = this.mChart.isInverted(dataSet.getAxisDependency());

        if (isSingleColor) {
            this.mRenderPaint.setColor(dataSet.getColor());
        }

        const customRender = this.mChart.getCustomRenderer();
        for (let j = 0, pos = 0; j < buffer.size(); j += 4, pos++) {
            if (!this.mViewPortHandler.isInBoundsTop(buffer.buffer[j + 3])) {
                break;
            }

            if (!this.mViewPortHandler.isInBoundsBottom(buffer.buffer[j + 1])) {
                continue;
            }
            if (!isSingleColor) {
                // Set the color for the currently drawn value. If the index
                // is out of bounds, reuse colors.
                this.mRenderPaint.setColor(dataSet.getColor(j / 4));
            }
            if (customRender && customRender.drawBar) {
                const e = dataSet.getEntryForIndex(j / 4);
                customRender.drawBar(c, e, dataSet, buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2], buffer.buffer[j + 3], this.mRenderPaint);
            } else {
                c.drawRect(buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2], buffer.buffer[j + 3], this.mRenderPaint);

                if (drawBorder) {
                    c.drawRect(buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2], buffer.buffer[j + 3], this.mBarBorderPaint);
                }
            }
        }

        return true;
    }

    public drawValues(c: Canvas) {
        // if values are drawn
        if (this.isDrawingValuesAllowed(this.mChart)) {
            const dataSets = this.mChart.getBarData().getDataSets();

            const valueOffsetPlus = 5;
            let posOffset = 0;
            let negOffset = 0;
            const drawValueAboveBar = this.mChart.isDrawValueAboveBarEnabled();

            for (let i = 0; i < this.mChart.getBarData().getDataSetCount(); i++) {
                const dataSet = dataSets[i];
                if (!this.shouldDrawValues(dataSet)) {
                    continue;
                }

                const yKey = dataSet.yProperty;
                const isInverted = this.mChart.isInverted(dataSet.getAxisDependency());

                // apply the text-styling defined by the DataSet
                this.applyValueTextStyle(dataSet);
                const halfTextHeight = Utils.calcTextHeight(this.mValuePaint, '10') / 2;

                const formatter = dataSet.getValueFormatter();

                // get the buffer
                const buffer = this.mBarBuffers[i];

                const phaseY = this.mAnimator.getPhaseY();

                const iconsOffset = dataSet.getIconsOffset();

                // if only single values are drawn (sum)
                if (!dataSet.isStacked()) {
                    for (let j = 0; j < buffer.size() * this.mAnimator.getPhaseX(); j += 4) {
                        const y = (buffer.buffer[j + 1] + buffer.buffer[j + 3]) / 2;

                        if (!this.mViewPortHandler.isInBoundsTop(buffer.buffer[j + 1])) {
                            break;
                        }

                        const entry = dataSet.getEntryForIndex(j / 4);
                        const val = entry[yKey];

                        if (!this.mViewPortHandler.isInBoundsX(buffer.buffer[j + (val >= 0 ? 0 : 2)])) {
                            continue;
                        }

                        if (!this.mViewPortHandler.isInBoundsBottom(buffer.buffer[j + 1])) {
                            continue;
                        }

                        const formattedValue = formatter.getBarLabel(val, entry);

                        // calculate the correct offset depending on the draw position of the value
                        const valueTextWidth = Utils.calcTextWidth(this.mValuePaint, formattedValue);
                        posOffset = drawValueAboveBar ? valueOffsetPlus : -(valueTextWidth + valueOffsetPlus);
                        negOffset = drawValueAboveBar ? -(valueTextWidth + valueOffsetPlus) : valueOffsetPlus;

                        if (isInverted) {
                            posOffset = -posOffset - valueTextWidth;
                            negOffset = -negOffset - valueTextWidth;
                        }

                        if (dataSet.isDrawValuesEnabled()) {
                            this.drawValue(c, formattedValue, val >= 0 ? buffer.buffer[j + 2] + posOffset : buffer.buffer[j + 0] + negOffset, y + halfTextHeight, dataSet.getValueTextColor(j / 2));
                        }

                        if (entry.icon != null && dataSet.isDrawIconsEnabled()) {
                            const icon = entry.icon;

                            let px = val >= 0 ? buffer.buffer[j + 2] + posOffset : buffer.buffer[j + 0] + negOffset;
                            let py = y;

                            px += iconsOffset.x;
                            py += iconsOffset.y;

                            Utils.drawImage(c, icon, px, py);
                        }
                    }
                    // if each value of a potential stack should be drawn
                } else {
                    const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

                    let bufferIndex = 0;
                    let index = 0;

                    while (index < dataSet.getEntryCount() * this.mAnimator.getPhaseX()) {
                        const entry = dataSet.getEntryForIndex(index);

                        const vals = entry.yVals;
                        const color = dataSet.getValueTextColor(index);

                        // we still draw stacked bars, but there is one
                        // non-stacked
                        // in between
                        if (vals == null) {
                            if (!this.mViewPortHandler.isInBoundsTop(buffer.buffer[bufferIndex + 1])) {
                                break;
                            }

                            if (!this.mViewPortHandler.isInBoundsX(buffer.buffer[bufferIndex + (entry[yKey] >= 0 ? 0 : 2)])) {
                                continue;
                            }

                            if (!this.mViewPortHandler.isInBoundsBottom(buffer.buffer[bufferIndex + 1])) {
                                continue;
                            }

                            const formattedValue = formatter.getBarLabel(entry[yKey], entry);

                            // calculate the correct offset depending on the draw position of the value
                            const valueTextWidth = Utils.calcTextWidth(this.mValuePaint, formattedValue);
                            posOffset = drawValueAboveBar ? valueOffsetPlus : -(valueTextWidth + valueOffsetPlus);
                            negOffset = drawValueAboveBar ? -(valueTextWidth + valueOffsetPlus) : valueOffsetPlus;

                            if (isInverted) {
                                posOffset = -posOffset - valueTextWidth;
                                negOffset = -negOffset - valueTextWidth;
                            }

                            if (dataSet.isDrawValuesEnabled()) {
                                this.drawValue(
                                    c,
                                    formattedValue,
                                    entry[yKey] >= 0 ? buffer.buffer[bufferIndex + 2] + posOffset : buffer.buffer[bufferIndex + 0] + negOffset,
                                    buffer.buffer[bufferIndex + 1] + halfTextHeight,
                                    color
                                );
                            }

                            if (entry.icon != null && dataSet.isDrawIconsEnabled()) {
                                const icon = entry.icon;

                                let px = entry[yKey] >= 0 ? buffer.buffer[bufferIndex + 2] + posOffset : buffer.buffer[bufferIndex + 0] + negOffset;
                                let py = buffer.buffer[bufferIndex + 1];

                                px += iconsOffset.x;
                                py += iconsOffset.y;

                                Utils.drawImage(c, icon, px, py);
                            }
                            // draw stack values
                        } else {
                            const transformed = Utils.createNativeArray(vals.length * 2);

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

                            trans.pointValuesToPixel(transformed);

                            for (let k = 0; k < transformed.length; k += 2) {
                                const val = vals[k / 2];
                                const formattedValue = formatter.getBarStackedLabel(val, entry);

                                // calculate the correct offset depending on the draw position of the value
                                const valueTextWidth = Utils.calcTextWidth(this.mValuePaint, formattedValue);
                                posOffset = drawValueAboveBar ? valueOffsetPlus : -(valueTextWidth + valueOffsetPlus);
                                negOffset = drawValueAboveBar ? -(valueTextWidth + valueOffsetPlus) : valueOffsetPlus;

                                if (isInverted) {
                                    posOffset = -posOffset - valueTextWidth;
                                    negOffset = -negOffset - valueTextWidth;
                                }

                                const drawBelow = (val === 0 && negY === 0 && posY > 0) || val < 0;
                                const x = transformed[k] + (drawBelow ? negOffset : posOffset);
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

                                if (dataSet.isDrawValuesEnabled()) {
                                    this.drawValue(c, formattedValue, x, y + halfTextHeight, color);
                                }

                                if (entry.icon != null && dataSet.isDrawIconsEnabled()) {
                                    const icon = entry.icon;
                                    Utils.drawImage(c, icon, x + iconsOffset.x, y + iconsOffset.y);
                                }
                            }
                        }

                        bufferIndex = vals == null ? bufferIndex + 4 : bufferIndex + 4 * vals.length;
                        index++;
                    }
                }
            }
        }
    }

    public drawValue(c: Canvas, valueText, x, y, color) {
        if (valueText) {
            this.mValuePaint.setColor(color);
            c.drawText(valueText, x, y, this.mValuePaint);
        }
    }

    protected prepareBarHighlight(x: number, y1: number, y2: number, barWidthHalf: number, trans: Transformer) {
        const top = x - barWidthHalf;
        const bottom = x + barWidthHalf;
        const left = y1;
        const right = y2;

        this.mBarRect.set(left, top, right, bottom);

        trans.rectToPixelPhaseHorizontal(this.mBarRect, this.mAnimator.getPhaseY());
    }

    /**
     * Sets the drawing position of the highlight object based on the riven bar-rect.
     * @param high
     * @param bar
     */
    protected setHighlightDrawPos(high: Highlight, bar: RectF) {
        high.drawX = bar.centerY();
        high.drawY = bar.right;
    }

    protected isDrawingValuesAllowed(chart: ChartInterface) {
        return chart.getData().getEntryCount() < chart.getMaxVisibleCount() * this.mViewPortHandler.getScaleY();
    }
}
