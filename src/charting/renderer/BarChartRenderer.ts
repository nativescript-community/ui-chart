import { BarLineScatterCandleBubbleRenderer } from './BarLineScatterCandleBubbleRenderer';
import { ChartAnimator } from '../animation/ChartAnimator';
import { BarBuffer } from '../buffer/BarBuffer';
import { BarChart } from '../charts/BarChart';
import { Highlight } from '../highlight/Highlight';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Canvas, Paint, RectF, Style } from '@nativescript-community/ui-canvas';
import { profile } from '@nativescript/core';
import { getEntryXValue } from '../data/BaseEntry';
import { Entry } from '../data/Entry';

export class BarChartRenderer extends BarLineScatterCandleBubbleRenderer {
    public mChart: BarChart;

    protected mBarBuffers: BarBuffer[];

    /**
     * palet for the bar shadow
     */
    protected mShadowPaint: Paint;

    /**
     * palet for the bar border
     */
    protected mBarBorderPaint: Paint;

    protected mBarRect = new RectF(0, 0, 0, 0);
    protected mBarShadowRectBuffer = new RectF(0, 0, 0, 0);

    constructor(chart: BarChart, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;

        this.mHighlightPaint = new Paint();
        this.mHighlightPaint.setAntiAlias(true);
        this.mHighlightPaint.setStyle(Style.FILL);
        this.mHighlightPaint.setColor('black');
        // set alpha after color
        this.mHighlightPaint.setAlpha(120);

        this.mShadowPaint = new Paint();
        this.mShadowPaint.setAntiAlias(true);
        this.mShadowPaint.setStyle(Style.FILL);

        this.mBarBorderPaint = new Paint();
        this.mBarBorderPaint.setAntiAlias(true);
        this.mBarBorderPaint.setStyle(Style.STROKE);
    }

    public initBuffers() {
        const barData = this.mChart.getBarData();
        this.mBarBuffers = [];

        for (let i = 0; i < barData.getDataSetCount(); i++) {
            const set = barData.getDataSetByIndex(i);
            this.mBarBuffers.push(new BarBuffer(set.getEntryCount() * 4 * (set.isStacked() ? set.getStackSize() : 1), barData.getDataSetCount(), set.isStacked()));
        }
    }

    @profile
    public drawData(c: Canvas) {
        const barData = this.mChart.getBarData();

        for (let i = 0; i < barData.getDataSetCount(); i++) {
            const set = barData.getDataSetByIndex(i);
            if (set.isVisible()) {
                this.drawDataSet(c, set, i);
            }
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

                this.mBarShadowRectBuffer.left = x - barWidthHalf;
                this.mBarShadowRectBuffer.right = x + barWidthHalf;

                trans.rectValueToPixel(this.mBarShadowRectBuffer);

                if (!this.mViewPortHandler.isInBoundsLeft(this.mBarShadowRectBuffer.right)) {
                    continue;
                }

                if (!this.mViewPortHandler.isInBoundsRight(this.mBarShadowRectBuffer.left)) {
                    break;
                }

                this.mBarShadowRectBuffer.top = this.mViewPortHandler.contentTop();
                this.mBarShadowRectBuffer.bottom = this.mViewPortHandler.contentBottom();

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

        for (let j = 0; j < buffer.size(); j += 4) {
            if (!this.mViewPortHandler.isInBoundsLeft(buffer.buffer[j + 2])) {
                continue;
            }

            if (!this.mViewPortHandler.isInBoundsRight(buffer.buffer[j])) {
                break;
            }

            if (!isSingleColor) {
                // Set the color for the currently drawn value. If the index
                // is out of bounds, reuse colors.
                this.mRenderPaint.setColor(dataSet.getColor(j / 4));
            }

            c.drawRect(buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2], buffer.buffer[j + 3], this.mRenderPaint);

            if (drawBorder) {
                c.drawRect(buffer.buffer[j], buffer.buffer[j + 1], buffer.buffer[j + 2], buffer.buffer[j + 3], this.mBarBorderPaint);
            }
        }

        return true;
    }

    protected prepareBarHighlight(x: number, y1: number, y2: number, barWidthHalf: number, trans: Transformer) {
        const left = x - barWidthHalf;
        const right = x + barWidthHalf;
        const top = y1;
        const bottom = y2;

        this.mBarRect.set(left, top, right, bottom);
        trans.rectToPixelPhase(this.mBarRect, this.mAnimator.getPhaseY());
    }

    public drawValues(c: Canvas) {
        // if values are drawn
        if (this.isDrawingValuesAllowed(this.mChart)) {
            const dataSets = this.mChart.getBarData().getDataSets();

            const valueOffsetPlus = 4.5;
            let posOffset = 0;
            let negOffset = 0;
            const drawValueAboveBar = this.mChart.isDrawValueAboveBarEnabled();

            for (let i = 0; i < this.mChart.getBarData().getDataSetCount(); i++) {
                const dataSet = dataSets[i];
                if (!this.shouldDrawValues(dataSet)) {
                    continue;
                }

                const yKey = dataSet.yProperty;

                // apply the text-styling defined by the DataSet
                this.applyValueTextStyle(dataSet);

                const isInverted = this.mChart.isInverted(dataSet.getAxisDependency());

                // calculate the correct offset depending on the draw position of
                // the value
                const valueTextHeight = Utils.calcTextHeight(this.mValuePaint, '8');
                posOffset = drawValueAboveBar ? -valueOffsetPlus : valueTextHeight + valueOffsetPlus;
                negOffset = drawValueAboveBar ? valueTextHeight + valueOffsetPlus : -valueOffsetPlus;

                if (isInverted) {
                    posOffset = -posOffset - valueTextHeight;
                    negOffset = -negOffset - valueTextHeight;
                }

                // get the buffer
                const buffer = this.mBarBuffers[i];

                const phaseY = this.mAnimator.getPhaseY();
                const formatter = dataSet.getValueFormatter();

                const iconsOffset = dataSet.getIconsOffset();

                // if only single values are drawn (sum)
                if (!dataSet.isStacked()) {
                    for (let j = 0; j < buffer.size() * this.mAnimator.getPhaseX(); j += 4) {
                        const x = (buffer.buffer[j] + buffer.buffer[j + 2]) / 2;

                        if (!this.mViewPortHandler.isInBoundsRight(x)) {
                            break;
                        }

                        const entry = dataSet.getEntryForIndex(j / 4);
                        const val = entry[yKey];

                        if (!this.mViewPortHandler.isInBoundsY(buffer.buffer[j + (val >= 0 ? 1 : 3)]) || !this.mViewPortHandler.isInBoundsLeft(x)) {
                            continue;
                        }

                        if (dataSet.isDrawValuesEnabled()) {
                            this.drawValue(c, formatter.getBarLabel(val, entry), x, val >= 0 ? buffer.buffer[j + 1] + posOffset : buffer.buffer[j + 3] + negOffset, dataSet.getValueTextColor(j / 4));
                        }

                        if (entry.icon != null && dataSet.isDrawIconsEnabled()) {
                            const icon = entry.icon;

                            let px = x;
                            let py = val >= 0 ? buffer.buffer[j + 1] + posOffset : buffer.buffer[j + 3] + negOffset;

                            px += iconsOffset.x;
                            py += iconsOffset.y;

                            Utils.drawImage(c, icon, px, py);
                        }
                    }
                    // if we have stacks
                } else {
                    const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

                    let bufferIndex = 0;
                    let index = 0;

                    while (index < dataSet.getEntryCount() * this.mAnimator.getPhaseX()) {
                        const entry = dataSet.getEntryForIndex(index);

                        const vals = entry.yVals;
                        const x = (buffer.buffer[bufferIndex] + buffer.buffer[bufferIndex + 2]) / 2;

                        const color = dataSet.getValueTextColor(index);

                        // we still draw stacked bars, but there is one
                        // non-stacked
                        // in between
                        if (vals == null) {
                            if (!this.mViewPortHandler.isInBoundsRight(x)) {
                                break;
                            }

                            if (!this.mViewPortHandler.isInBoundsY(buffer.buffer[bufferIndex + (entry[yKey] >= 0 ? 1 : 3)]) || !this.mViewPortHandler.isInBoundsLeft(x)) {
                                continue;
                            }

                            if (dataSet.isDrawValuesEnabled()) {
                                this.drawValue(
                                    c,
                                    formatter.getBarLabel(entry[yKey], entry),
                                    x,
                                    entry[yKey] >= 0 ? buffer.buffer[bufferIndex + 1] + posOffset : buffer.buffer[bufferIndex + 3] + negOffset,
                                    color
                                );
                            }

                            if (entry.icon != null && dataSet.isDrawIconsEnabled()) {
                                const icon = entry.icon;

                                let px = x;
                                let py = entry[yKey] >= 0 ? buffer.buffer[bufferIndex + 1] + posOffset : buffer.buffer[bufferIndex + 3] + negOffset;

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

                                transformed[k + 1] = y * phaseY;
                            }

                            trans.pointValuesToPixel(transformed);

                            for (let k = 0; k < transformed.length; k += 2) {
                                const val = vals[k / 2];
                                const drawBelow = (val === 0 && negY === 0 && posY > 0) || val < 0;
                                const y = transformed[k + 1] + (drawBelow ? negOffset : posOffset);

                                if (!this.mViewPortHandler.isInBoundsRight(x)) {
                                    break;
                                }

                                if (!this.mViewPortHandler.isInBoundsY(y) || !this.mViewPortHandler.isInBoundsLeft(x)) {
                                    continue;
                                }

                                if (dataSet.isDrawValuesEnabled()) {
                                    this.drawValue(c, formatter.getBarStackedLabel(val, entry), x, y, color);
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

    public drawHighlighted(c: Canvas, indices: Highlight[]) {
        const barData = this.mChart.getBarData();
        let entry: Entry, index: number;
        for (let i = 0; i < indices.length; i++) {
            const high = indices[i];
            const set = barData.getDataSetByIndex(high.dataSetIndex);

            if (set === null || !set.isHighlightEnabled()) {
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

            const xKey = set.xProperty;
            const yKey = set.yProperty;
            const trans = this.mChart.getTransformer(set.getAxisDependency());

            this.mHighlightPaint.setColor(set.getHighLightColor());
            this.mHighlightPaint.setAlpha(set.getHighLightAlpha());

            const isStack = high.stackIndex >= 0 && entry.isStacked ? true : false;

            let y1;
            let y2;

            if (isStack) {
                if (this.mChart.isHighlightFullBarEnabled()) {
                    y1 = entry.positiveSum;
                    y2 = -entry.negativeSum;
                } else {
                    const range = entry.ranges[high.stackIndex];
                    y1 = range[0];
                    y2 = range[1];
                }
            } else {
                y1 = entry[yKey];
                y2 = 0;
            }

            this.prepareBarHighlight(getEntryXValue(entry, xKey, index), y1, y2, barData.getBarWidth() / 2, trans);

            this.setHighlightDrawPos(high, this.mBarRect);

            c.drawRect(this.mBarRect, this.mHighlightPaint);
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
