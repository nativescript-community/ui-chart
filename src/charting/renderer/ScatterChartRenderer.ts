import { ChartAnimator } from '../animation/ChartAnimator';
import { LineScatterCandleRadarRenderer } from './LineScatterCandleRadarRenderer';
import { ScatterDataProvider } from '../interfaces/dataprovider/ScatterDataProvider';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Canvas } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';
import { IScatterDataSet } from '../interfaces/datasets/IScatterDataSet';
import { getEntryXValue } from '../data/BaseEntry';
import { Highlight } from '../highlight/Highlight';
import { Entry } from '../data/Entry';

export class ScatterChartRenderer extends LineScatterCandleRadarRenderer {
    mChart: ScatterDataProvider;
    mPixelBuffer = Utils.createNativeArray(2);

    constructor(chart: ScatterDataProvider, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;
    }

    public initBuffers() {}

    public drawData(c: Canvas) {
        const scatterData = this.mChart.getScatterData();

        for (const set of scatterData.getDataSets()) {
            if (set.isVisible()) {
                this.drawDataSet(c, set);
            }
        }
    }

    protected drawDataSet(c: Canvas, dataSet: IScatterDataSet) {
        if (dataSet.getEntryCount() < 1) return;

        const viewPortHandler = this.mViewPortHandler;

        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        const phaseY = this.mAnimator.getPhaseY();

        const renderer = dataSet.getShapeRenderer();
        if (renderer == null) {
            console.log('MISSING', "There's no IShapeRenderer specified for ScatterDataSet");
            return;
        }

        const max = Math.min(Math.ceil(dataSet.getEntryCount() * this.mAnimator.getPhaseX()), dataSet.getEntryCount());
        const xKey = dataSet.xProperty;
        const yKey = dataSet.yProperty;
        for (let i = 0; i < max; i++) {
            const e = dataSet.getEntryForIndex(i);

            this.mPixelBuffer[0] = getEntryXValue(e, xKey, i);
            this.mPixelBuffer[1] = e[yKey] * phaseY;

            trans.pointValuesToPixel(this.mPixelBuffer);

            if (!viewPortHandler.isInBoundsRight(this.mPixelBuffer[0])) break;

            if (!viewPortHandler.isInBoundsLeft(this.mPixelBuffer[0]) || !viewPortHandler.isInBoundsY(this.mPixelBuffer[1])) continue;

            this.mRenderPaint.setColor(dataSet.getColor(i / 2));
            renderer.renderShape(c, dataSet, this.mViewPortHandler, this.mPixelBuffer[0], this.mPixelBuffer[1], this.mRenderPaint);
        }
    }

    public drawValues(c: Canvas) {
        // if values are drawn
        if (this.isDrawingValuesAllowed(this.mChart)) {
            const dataSets = this.mChart.getScatterData().getDataSets();

            for (let i = 0; i < this.mChart.getScatterData().getDataSetCount(); i++) {
                const dataSet = dataSets[i];
                const yKey = dataSet.yProperty;

                if (!this.shouldDrawValues(dataSet) || dataSet.getEntryCount() < 1) continue;

                // apply the text-styling defined by the DataSet
                this.applyValueTextStyle(dataSet);

                this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

                const positions = this.mChart
                    .getTransformer(dataSet.getAxisDependency())
                    .generateTransformedValuesScatter(dataSet, this.mAnimator.getPhaseX(), this.mAnimator.getPhaseY(), this.mXBounds.min, this.mXBounds.max);

                const shapeSize = dataSet.getScatterShapeSize();

                const formatter = dataSet.getValueFormatter();

                const iconsOffset = dataSet.getIconsOffset();

                for (let j = 0; j < positions.length; j += 2) {
                    if (!this.mViewPortHandler.isInBoundsRight(positions[j])) break;

                    // make sure the lines don't do shitty things outside bounds
                    if (!this.mViewPortHandler.isInBoundsLeft(positions[j]) || !this.mViewPortHandler.isInBoundsY(positions[j + 1])) continue;

                    const entry = dataSet.getEntryForIndex(j / 2 + this.mXBounds.min);

                    if (dataSet.isDrawValuesEnabled()) {
                        this.drawValue(c, formatter.getPointLabel(entry[yKey], entry), positions[j], positions[j + 1] - shapeSize, dataSet.getValueTextColor(j / 2 + this.mXBounds.min));
                    }

                    if (entry.icon && dataSet.isDrawIconsEnabled()) {
                        Utils.drawImage(c, entry.icon, positions[j] + iconsOffset.x, positions[j + 1] + iconsOffset.y);
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
        const scatterData = this.mChart.getScatterData();

        let entry: Entry, index: number;
        for (const high of indices) {
            const set = scatterData.getDataSetByIndex(high.dataSetIndex);
            const xKey = set.xProperty;
            const yKey = set.yProperty;

            if (set == null || !set.isHighlightEnabled()) continue;

            if (high.entry) {
                entry = high.entry;
                index = high.entryIndex;
            } else {
                const r = set.getEntryAndIndexForXValue(high.x, high.y);
                entry = r.entry;
                index = r.index;
            }

            if (!this.isInBoundsX(entry, set)) continue;

            const pix = this.mChart.getTransformer(set.getAxisDependency()).getPixelForValues(getEntryXValue(entry, xKey, index), entry[yKey] * this.mAnimator.getPhaseY());

            high.x = pix.x;
            high.y = pix.y;

            // draw the lines
            this.drawHighlightLines(c, pix.x, pix.y, set);
        }
    }
}
