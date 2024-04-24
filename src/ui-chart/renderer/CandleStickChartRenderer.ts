import { Canvas, Style } from '@nativescript-community/ui-canvas';
import { TypedArray } from '@nativescript-community/arraybuffers';
import { ChartAnimator } from '../animation/ChartAnimator';
import { CandleStickChart } from '..';
import { CandleDataSet } from '../data/CandleDataSet';
import { CandleEntry } from '../data/CandleEntry';
import { Highlight } from '../highlight/Highlight';
import { ColorTemplate } from '../utils/ColorTemplate';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { LineScatterCandleRadarRenderer } from './LineScatterCandleRadarRenderer';

export class CandleStickChartRenderer extends LineScatterCandleRadarRenderer {
    mChart: CandleStickChart;
    mShadowBuffer: TypedArray;

    constructor(chart: CandleStickChart, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;
    }

    public drawData(c: Canvas) {
        const candleData = this.mChart.candleData;

        for (const set of candleData.dataSets) {
            if (set.visible) {
                this.drawDataSet(c, set);
            }
        }
    }

    protected drawDataSet(c: Canvas, dataSet: CandleDataSet) {
        const trans = this.mChart.getTransformer(dataSet.axisDependency);

        const phaseY = this.animator.phaseY;
        const barSpace = dataSet.barSpace;
        const showCandleBar = dataSet.showCandleBar;

        this.mXBounds.set(this.mChart, dataSet, this.animator);

        const renderPaint = this.renderPaint;
        renderPaint.setStrokeWidth(dataSet.shadowWidth);
        const xKey = dataSet.xProperty;
        // draw the body
        const customRender = this.mChart.customRenderer;
        for (let j = this.mXBounds.min; j <= this.mXBounds.range + this.mXBounds.min; j++) {
            // get the entry
            const e = dataSet.getEntryForIndex(j);

            if (!e) continue;

            const xPos = dataSet.getEntryXValue(e, j);

            const open = e[dataSet.openProperty] || 0;
            const close = e[dataSet.closeProperty] || 0;
            const high = e[dataSet.highProperty] || 0;
            const low = e[dataSet.lowProperty] || 0;

            if (showCandleBar) {
                // calculate the shadow
                if (!this.mShadowBuffer) {
                    this.mShadowBuffer = Utils.createArrayBuffer(8);
                }
                const shadowBuffers = this.mShadowBuffer;
                shadowBuffers[0] = xPos;
                shadowBuffers[2] = xPos;
                shadowBuffers[4] = xPos;
                shadowBuffers[6] = xPos;

                if (open > close) {
                    shadowBuffers[1] = high * phaseY;
                    shadowBuffers[3] = open * phaseY;
                    shadowBuffers[5] = low * phaseY;
                    shadowBuffers[7] = close * phaseY;
                } else if (open < close) {
                    shadowBuffers[1] = high * phaseY;
                    shadowBuffers[3] = close * phaseY;
                    shadowBuffers[5] = low * phaseY;
                    shadowBuffers[7] = open * phaseY;
                } else {
                    shadowBuffers[1] = high * phaseY;
                    shadowBuffers[3] = open * phaseY;
                    shadowBuffers[5] = low * phaseY;
                    shadowBuffers[7] = shadowBuffers[3];
                }

                trans.pointValuesToPixel(shadowBuffers);

                // draw the shadows

                if (dataSet.shadowColorSameAsCandle) {
                    if (open > close) {
                        renderPaint.setColor(!dataSet.decreasingColor || dataSet.decreasingColor === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.decreasingColor);
                    } else if (open < close) renderPaint.setColor(dataSet.increasingColor === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.increasingColor);
                    else renderPaint.setColor(dataSet.neutralColor === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.neutralColor);
                } else {
                    renderPaint.setColor(dataSet.shadowColor === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.shadowColor);
                }

                renderPaint.setStyle(Style.STROKE);

                const linePath = Utils.getTempPath();
                const points = Utils.pointsFromBuffer(shadowBuffers);
                if (__ANDROID__ && Utils.supportsDirectArrayBuffers()) {
                    linePath['setLinesBuffer'](points);
                } else {
                    linePath.setLines(points as number[]);
                }
                if (customRender?.drawShadows) {
                    customRender.drawShadows(c, e, linePath, renderPaint);
                } else {
                    c.drawPath(linePath, renderPaint);
                }

                // calculate the body
                const bodyBuffers = Utils.getTempArray(4);

                bodyBuffers[0] = xPos - 0.5 + barSpace;
                bodyBuffers[1] = close * phaseY;
                bodyBuffers[2] = xPos + 0.5 - barSpace;
                bodyBuffers[3] = open * phaseY;

                trans.pointValuesToPixel(bodyBuffers);

                // draw body differently for increasing and decreasing entry
                if (open > close) {
                    // decreasing

                    if (dataSet.decreasingColor === ColorTemplate.COLOR_NONE) {
                        renderPaint.setColor(dataSet.getColor(j));
                    } else {
                        renderPaint.setColor(dataSet.decreasingColor);
                    }

                    renderPaint.setStyle(dataSet.decreasingPaintStyle);

                    if (customRender && customRender.drawOpened) {
                        customRender.drawOpened(c, e, bodyBuffers[0], bodyBuffers[3], bodyBuffers[2], bodyBuffers[1], renderPaint);
                    } else {
                        c.drawRect(bodyBuffers[0], bodyBuffers[3], bodyBuffers[2], bodyBuffers[1], renderPaint);
                    }
                } else if (open < close) {
                    if (dataSet.increasingColor === ColorTemplate.COLOR_NONE) {
                        renderPaint.setColor(dataSet.getColor(j));
                    } else {
                        renderPaint.setColor(dataSet.increasingColor);
                    }

                    renderPaint.setStyle(dataSet.increasingPaintStyle);

                    if (customRender && customRender.drawClosed) {
                        customRender.drawClosed(c, e, bodyBuffers[0], bodyBuffers[1], bodyBuffers[2], bodyBuffers[3], renderPaint);
                    } else {
                        c.drawRect(bodyBuffers[0], bodyBuffers[1], bodyBuffers[2], bodyBuffers[3], renderPaint);
                    }
                } else {
                    // equal values

                    if (dataSet.neutralColor === ColorTemplate.COLOR_NONE) {
                        renderPaint.setColor(dataSet.getColor(j));
                    } else {
                        renderPaint.setColor(dataSet.neutralColor);
                    }
                    if (customRender && customRender.drawEqual) {
                        customRender.drawEqual(c, e, bodyBuffers[0], bodyBuffers[1], bodyBuffers[2], bodyBuffers[3], renderPaint);
                    } else {
                        c.drawLine(bodyBuffers[0], bodyBuffers[1], bodyBuffers[2], bodyBuffers[3], renderPaint);
                    }
                }
            } else {
                const rangeBuffers = Utils.getTempArray(4, false, false);
                const openBuffers = Utils.getTempArray(4, false, false, '1');
                const closeBuffers = Utils.getTempArray(4, false, false, '2');
                rangeBuffers[0] = xPos;
                rangeBuffers[1] = high * phaseY;
                rangeBuffers[2] = xPos;
                rangeBuffers[3] = low * phaseY;

                openBuffers[0] = xPos - 0.5 + barSpace;
                openBuffers[1] = open * phaseY;
                openBuffers[2] = xPos;
                openBuffers[3] = open * phaseY;

                closeBuffers[0] = xPos + 0.5 - barSpace;
                closeBuffers[1] = close * phaseY;
                closeBuffers[2] = xPos;
                closeBuffers[3] = close * phaseY;

                trans.pointValuesToPixel(rangeBuffers);
                trans.pointValuesToPixel(openBuffers);
                trans.pointValuesToPixel(closeBuffers);

                // draw the ranges
                let barColor;

                if (open > close) barColor = dataSet.decreasingColor === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.decreasingColor;
                else if (open < close) barColor = dataSet.increasingColor === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.increasingColor;
                else barColor = dataSet.neutralColor === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.neutralColor;

                renderPaint.setColor(barColor);

                if (customRender && customRender.drawLines) {
                    customRender.drawLines(c, e, rangeBuffers, openBuffers, closeBuffers, renderPaint);
                } else {
                    c.drawLines(Utils.pointsFromBuffer(rangeBuffers, false, false) as number[], renderPaint);
                    c.drawLines(Utils.pointsFromBuffer(openBuffers, false, false) as number[], renderPaint);
                    c.drawLines(Utils.pointsFromBuffer(closeBuffers, false, false) as number[], renderPaint);
                }
            }
        }
    }

    public drawValues(c: Canvas) {
        const chart = this.mChart;
        const data = this.mChart.candleData;
        const dataSets = data.dataSets;
        if (!this.isDrawingValuesAllowed(chart) || dataSets.some((d) => d.drawValuesEnabled || d.drawIconsEnabled) === false) {
            return;
        }
        // if values are drawn

        const customRender = chart.customRenderer;
        for (let i = 0; i < dataSets.length; i++) {
            const dataSet = dataSets[i];

            if (!this.shouldDrawValues(dataSet) || dataSet.entryCount < 1) continue;

            // apply the text-styling defined by the DataSet
            this.applyValueTextStyle(dataSet);

            const trans = chart.getTransformer(dataSet.axisDependency);

            this.mXBounds.set(chart, dataSet, this.animator);

            const { points, count } = trans.generateTransformedValuesCandle(dataSet, this.animator.phaseX, this.animator.phaseY, this.mXBounds.min, this.mXBounds.max);

            const yOffset = 5;

            const formatter = dataSet.valueFormatter;

            const iconsOffset = dataSet.iconsOffset;
            const valuesOffset = dataSet.valuesOffset;

            const paint = this.valuePaint;
            for (let j = 0; j < count; j += 2) {
                const x = points[j];
                const y = points[j + 1];

                if (!this.mViewPortHandler.isInBoundsRight(x)) break;

                if (!this.mViewPortHandler.isInBoundsLeft(x) || !this.mViewPortHandler.isInBoundsY(y)) continue;

                const index = j / 2 + this.mXBounds.min;
                const entry = dataSet.getEntryForIndex(index);

                if (dataSet.drawValuesEnabled) {
                    this.drawValue(
                        c,
                        chart,
                        dataSet,
                        i,
                        entry,
                        index,
                        (formatter.getCandleLabel || formatter.getFormattedValue).call(formatter, entry.high, entry),
                        x + valuesOffset.x,
                        y - yOffset + valuesOffset.y,
                        dataSet.getValueTextColor(j / 2),
                        paint,
                        customRender
                    );
                }

                if (dataSet.drawIconsEnabled) {
                    this.drawIcon(c, chart, dataSet, i, entry, index, dataSet.getEntryIcon(entry), x + iconsOffset.x, y + iconsOffset.y, customRender);
                }
            }
        }
    }

    public drawExtras(c: Canvas) {}

    public drawHighlighted(c: Canvas, indices: Highlight[]) {
        const candleData = this.mChart.candleData;

        let entry: CandleEntry, index: number;
        const customRender = this.mChart.customRenderer;
        const paint = this.highlightPaint;
        for (const high of indices) {
            const set = candleData.getDataSetByIndex(high.dataSetIndex);

            if (!set || !set.highlightEnabled) continue;

            if (high.entry) {
                entry = high.entry as CandleEntry;
                index = high.entryIndex;
            } else {
                const r = set.getEntryAndIndexForXValue(high.x, high.y);
                entry = r.entry;
                index = r.index;
            }
            if (!this.isInBoundsX(entry, set)) continue;

            const lowValue = (entry[set.lowProperty] || 0) * this.animator.phaseY;
            const highValue = (entry[set.highProperty] || 0) * this.animator.phaseY;
            const y = (lowValue + highValue) / 2;

            const pix = this.mChart.getTransformer(set.axisDependency).getPixelForValues(set.getEntryXValue(entry, index), y);

            high.drawX = pix.x;
            high.drawY = pix.y;
            // draw the lines
            if (customRender && customRender.drawHighlight) {
                customRender.drawHighlight(c, high, set, paint);
            } else {
                this.drawHighlightLines(c, high.xPx, high.yPx, set);
            }
        }
    }
}
