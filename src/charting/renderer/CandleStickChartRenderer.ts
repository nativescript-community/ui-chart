import { ChartAnimator } from '../animation/ChartAnimator';
import { LineScatterCandleRadarRenderer } from './LineScatterCandleRadarRenderer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Canvas, Style } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';
import { IScatterDataSet } from '../interfaces/datasets/IScatterDataSet';
import { getEntryXValue } from '../data/BaseEntry';
import { Highlight } from '../highlight/Highlight';
import { Entry } from '../data/Entry';
import { CandleDataProvider } from '../interfaces/dataprovider/CandleDataProvider';
import { ICandleDataSet } from '../interfaces/datasets/ICandleDataSet';
import { ColorTemplate } from '../utils/ColorTemplate';
import { CandleEntry } from '../data/CandleEntry';
import { CandleDataSet } from '../data/CandleDataSet';

export class CandleStickChartRenderer extends LineScatterCandleRadarRenderer {
    mChart: CandleDataProvider;

    mShadowBuffers = Utils.createNativeArray(8);
    mBodyBuffers = Utils.createNativeArray(4);
    mRangeBuffers = Utils.createNativeArray(4);
    mOpenBuffers = Utils.createNativeArray(4);
    mCloseBuffers = Utils.createNativeArray(4);

    constructor(chart: CandleDataProvider, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;
    }

    public initBuffers() {}

    public drawData(c: Canvas) {
        const candleData = this.mChart.getCandleData();

        for (const set of candleData.getDataSets()) {
            if (set.isVisible()) {
                this.drawDataSet(c, set);
            }
        }
    }

    protected drawDataSet(c: Canvas, dataSet: CandleDataSet) {
        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        const phaseY = this.mAnimator.getPhaseY();
        const barSpace = dataSet.getBarSpace();
        const showCandleBar = dataSet.getShowCandleBar();

        this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

        this.mRenderPaint.setStrokeWidth(dataSet.getShadowWidth());
        const xKey = dataSet.xProperty;
        // draw the body
        for (let j = this.mXBounds.min; j <= this.mXBounds.range + this.mXBounds.min; j++) {
            // get the entry
            const e = dataSet.getEntryForIndex(j);

            if (e == null) continue;

            const xPos = getEntryXValue(e, xKey, j);

            const open = e[dataSet.openProperty] || 0;
            const close = e[dataSet.closeProperty] || 0;
            const high = e[dataSet.highProperty] || 0;
            const low = e[dataSet.lowProperty] || 0;

            if (showCandleBar) {
                // calculate the shadow

                this.mShadowBuffers[0] = xPos;
                this.mShadowBuffers[2] = xPos;
                this.mShadowBuffers[4] = xPos;
                this.mShadowBuffers[6] = xPos;

                if (open > close) {
                    this.mShadowBuffers[1] = high * phaseY;
                    this.mShadowBuffers[3] = open * phaseY;
                    this.mShadowBuffers[5] = low * phaseY;
                    this.mShadowBuffers[7] = close * phaseY;
                } else if (open < close) {
                    this.mShadowBuffers[1] = high * phaseY;
                    this.mShadowBuffers[3] = close * phaseY;
                    this.mShadowBuffers[5] = low * phaseY;
                    this.mShadowBuffers[7] = open * phaseY;
                } else {
                    this.mShadowBuffers[1] = high * phaseY;
                    this.mShadowBuffers[3] = open * phaseY;
                    this.mShadowBuffers[5] = low * phaseY;
                    this.mShadowBuffers[7] = this.mShadowBuffers[3];
                }

                trans.pointValuesToPixel(this.mShadowBuffers);

                // draw the shadows

                if (dataSet.getShadowColorSameAsCandle()) {
                    if (open > close) {
                        this.mRenderPaint.setColor(!dataSet.getDecreasingColor() || dataSet.getDecreasingColor() === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.getDecreasingColor());
                    } else if (open < close) this.mRenderPaint.setColor(dataSet.getIncreasingColor() === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.getIncreasingColor());
                    else this.mRenderPaint.setColor(dataSet.getNeutralColor() === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.getNeutralColor());
                } else {
                    this.mRenderPaint.setColor(dataSet.getShadowColor() === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.getShadowColor());
                }

                this.mRenderPaint.setStyle(Style.STROKE);

                c.drawLines(this.mShadowBuffers, this.mRenderPaint);

                // calculate the body

                this.mBodyBuffers[0] = xPos - 0.5 + barSpace;
                this.mBodyBuffers[1] = close * phaseY;
                this.mBodyBuffers[2] = xPos + 0.5 - barSpace;
                this.mBodyBuffers[3] = open * phaseY;

                trans.pointValuesToPixel(this.mBodyBuffers);

                // draw body differently for increasing and decreasing entry
                if (open > close) {
                    // decreasing

                    if (dataSet.getDecreasingColor() === ColorTemplate.COLOR_NONE) {
                        this.mRenderPaint.setColor(dataSet.getColor(j));
                    } else {
                        this.mRenderPaint.setColor(dataSet.getDecreasingColor());
                    }

                    this.mRenderPaint.setStyle(dataSet.getDecreasingPaintStyle());

                    c.drawRect(this.mBodyBuffers[0], this.mBodyBuffers[3], this.mBodyBuffers[2], this.mBodyBuffers[1], this.mRenderPaint);
                } else if (open < close) {
                    if (dataSet.getIncreasingColor() === ColorTemplate.COLOR_NONE) {
                        this.mRenderPaint.setColor(dataSet.getColor(j));
                    } else {
                        this.mRenderPaint.setColor(dataSet.getIncreasingColor());
                    }

                    this.mRenderPaint.setStyle(dataSet.getIncreasingPaintStyle());

                    c.drawRect(this.mBodyBuffers[0], this.mBodyBuffers[1], this.mBodyBuffers[2], this.mBodyBuffers[3], this.mRenderPaint);
                } else {
                    // equal values

                    if (dataSet.getNeutralColor() === ColorTemplate.COLOR_NONE) {
                        this.mRenderPaint.setColor(dataSet.getColor(j));
                    } else {
                        this.mRenderPaint.setColor(dataSet.getNeutralColor());
                    }

                    c.drawLine(this.mBodyBuffers[0], this.mBodyBuffers[1], this.mBodyBuffers[2], this.mBodyBuffers[3], this.mRenderPaint);
                }
            } else {
                this.mRangeBuffers[0] = xPos;
                this.mRangeBuffers[1] = high * phaseY;
                this.mRangeBuffers[2] = xPos;
                this.mRangeBuffers[3] = low * phaseY;

                this.mOpenBuffers[0] = xPos - 0.5 + barSpace;
                this.mOpenBuffers[1] = open * phaseY;
                this.mOpenBuffers[2] = xPos;
                this.mOpenBuffers[3] = open * phaseY;

                this.mCloseBuffers[0] = xPos + 0.5 - barSpace;
                this.mCloseBuffers[1] = close * phaseY;
                this.mCloseBuffers[2] = xPos;
                this.mCloseBuffers[3] = close * phaseY;

                trans.pointValuesToPixel(this.mRangeBuffers);
                trans.pointValuesToPixel(this.mOpenBuffers);
                trans.pointValuesToPixel(this.mCloseBuffers);

                // draw the ranges
                let barColor;

                if (open > close) barColor = dataSet.getDecreasingColor() === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.getDecreasingColor();
                else if (open < close) barColor = dataSet.getIncreasingColor() === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.getIncreasingColor();
                else barColor = dataSet.getNeutralColor() === ColorTemplate.COLOR_NONE ? dataSet.getColor(j) : dataSet.getNeutralColor();

                this.mRenderPaint.setColor(barColor);
                c.drawLine(this.mRangeBuffers[0], this.mRangeBuffers[1], this.mRangeBuffers[2], this.mRangeBuffers[3], this.mRenderPaint);
                c.drawLine(this.mOpenBuffers[0], this.mOpenBuffers[1], this.mOpenBuffers[2], this.mOpenBuffers[3], this.mRenderPaint);
                c.drawLine(this.mCloseBuffers[0], this.mCloseBuffers[1], this.mCloseBuffers[2], this.mCloseBuffers[3], this.mRenderPaint);
            }
        }
    }

    public drawValues(c: Canvas) {
        // if values are drawn
        if (this.isDrawingValuesAllowed(this.mChart)) {
            const dataSets = this.mChart.getCandleData().getDataSets();

            for (let i = 0; i < dataSets.length; i++) {
                const dataSet = dataSets[i];

                if (!this.shouldDrawValues(dataSet) || dataSet.getEntryCount() < 1) continue;

                // apply the text-styling defined by the DataSet
                this.applyValueTextStyle(dataSet);

                const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

                this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

                const positions = trans.generateTransformedValuesCandle(dataSet, this.mAnimator.getPhaseX(), this.mAnimator.getPhaseY(), this.mXBounds.min, this.mXBounds.max);

                const yOffset = 5;

                const formatter = dataSet.getValueFormatter();

                const iconsOffset = dataSet.getIconsOffset();

                for (let j = 0; j < positions.length; j += 2) {
                    const x = positions[j];
                    const y = positions[j + 1];

                    if (!this.mViewPortHandler.isInBoundsRight(x)) break;

                    if (!this.mViewPortHandler.isInBoundsLeft(x) || !this.mViewPortHandler.isInBoundsY(y)) continue;

                    const entry = dataSet.getEntryForIndex(j / 2 + this.mXBounds.min);

                    if (dataSet.isDrawValuesEnabled()) {
                        this.drawValue(c, formatter.getCandleLabel(entry.high, entry), x, y - yOffset, dataSet.getValueTextColor(j / 2));
                    }

                    if (entry.icon && dataSet.isDrawIconsEnabled()) {
                        Utils.drawImage(c, entry.icon, x + iconsOffset.x, y + iconsOffset.y);
                    }
                }
            }
        }
    }

    public drawValue(c: Canvas, valueText, x, y, color) {
        this.mValuePaint.setColor(color);
        c.drawText(valueText, x, y, this.mValuePaint);
    }

    public drawExtras(c: Canvas) {}

    public drawHighlighted(c: Canvas, indices: Highlight[]) {
        const candleData = this.mChart.getCandleData();

        let entry: CandleEntry, index: number;
        for (const high of indices) {
            const set = candleData.getDataSetByIndex(high.dataSetIndex);
            const xKey = set.xProperty;
            const yKey = set.yProperty;

            if (set == null || !set.isHighlightEnabled()) continue;

            if (high.entry) {
                entry = high.entry as CandleEntry;
                index = high.entryIndex;
            } else {
                const r = set.getEntryAndIndexForXValue(high.x, high.y);
                entry = r.entry;
                index = r.index;
            }
            if (!this.isInBoundsX(entry, set)) continue;

            const lowValue = (entry[set.lowProperty] || 0) * this.mAnimator.getPhaseY();
            const highValue = (entry[set.highProperty] || 0) * this.mAnimator.getPhaseY();
            const y = (lowValue + highValue) / 2;

            const pix = this.mChart.getTransformer(set.getAxisDependency()).getPixelForValues(getEntryXValue(entry, xKey, index), y);

            high.drawX = pix.x;
            high.drawY = pix.y;
            // draw the lines
            this.drawHighlightLines(c, pix.x, pix.y, set);
        }
    }
}
