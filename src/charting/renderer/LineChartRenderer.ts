import { LineRadarRenderer } from './LineRadarRenderer';
import { LineDataProvider } from '../interfaces/dataprovider/LineDataProvider';
import { Direction, Paint, Canvas, Path, Style, createImage, releaseImage } from 'nativescript-canvas';
import { ImageSource } from '@nativescript/core/image-source/image-source';
import { ChartAnimator } from '../animation/ChartAnimator';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ILineDataSet } from '../interfaces/datasets/ILineDataSet';
import { LineDataSet, Mode } from '../data/LineDataSet';
import { Utils } from '../utils/Utils';
import { ColorTemplate } from '../utils/ColorTemplate';
import { Highlight } from '../highlight/Highlight';
import { XBounds } from './BarLineScatterCandleBubbleRenderer';
import { Transformer } from '../utils/Transformer';
import { profile } from '@nativescript/core/profiling/profiling';

export class DataSetImageCache {
    private mCirclePathBuffer = new Path();

    private circleBitmaps: any[];

    /**
     * Sets up the cache, returns true if a change of cache was required.
     *
     * @param set
     * @return
     */
    protected init(set: ILineDataSet) {
        let size = set.getCircleColorCount();
        let changeRequired = false;

        if (this.circleBitmaps == null) {
            this.circleBitmaps = [];
            changeRequired = true;
        } else if (this.circleBitmaps.length != size) {
            this.circleBitmaps = [];
            changeRequired = true;
        }

        return changeRequired;
    }

    /**
     * Fills the cache with bitmaps for the given dataset.
     *
     * @param set
     * @param drawCircleHole
     * @param drawTransparentCircleHole
     */
    @profile
    protected fill(set: ILineDataSet, mRenderPaint, mCirclePaintInner, drawCircleHole: boolean, drawTransparentCircleHole: boolean) {
        let colorCount = set.getCircleColorCount();
        let circleRadius = set.getCircleRadius();
        let circleHoleRadius = set.getCircleHoleRadius();

        for (let i = 0; i < colorCount; i++) {
            // Bitmap.Config conf = Bitmap.Config.ARGB_4444;
            const circleBitmap = createImage({ width: circleRadius * 2.1, height: circleRadius * 2.1 });

            let canvas = new Canvas(circleBitmap);
            mRenderPaint.setColor(set.getCircleColor(i));

            if (drawTransparentCircleHole) {
                // Begin path for circle with hole
                this.mCirclePathBuffer.reset();

                this.mCirclePathBuffer.addCircle(circleRadius, circleRadius, circleRadius, Direction.CW);

                // Cut hole in path
                this.mCirclePathBuffer.addCircle(circleRadius, circleRadius, circleHoleRadius, Direction.CCW);

                // Fill in-between
                canvas.drawPath(this.mCirclePathBuffer, mRenderPaint);
            } else {
                canvas.drawCircle(circleRadius, circleRadius, circleRadius, mRenderPaint);

                if (drawCircleHole) {
                    canvas.drawCircle(circleRadius, circleRadius, circleHoleRadius, mCirclePaintInner);
                }
            }
            this.circleBitmaps[i] = canvas.getImage();
        }
    }

    /**
     * Returns the cached Bitmap at the given index.
     *
     * @param index
     * @return
     */
    protected getBitmap(index) {
        return this.circleBitmaps[index % this.circleBitmaps.length];
    }
}

export class LineChartRenderer extends LineRadarRenderer {
    protected mChart: LineDataProvider;

    /**
     * palet for the inner circle of the value indicators
     */
    protected mCirclePaintInner: Paint;

    /**
     * Bitmap object used for drawing the paths (otherwise they are too long if
     * rendered directly on the canvas)
     */
    protected mDrawBitmap: WeakRef<ImageSource>;

    /**
     * on this canvas, the paths are rendered, it is initialized with the
     * pathBitmap
     */
    protected mBitmapCanvas: Canvas;

    /**
     * the bitmap configuration to be used
     */
    protected mBitmapConfig = android.graphics.Bitmap.Config.ARGB_8888;

    protected cubicPath = new Path();
    protected cubicFillPath = new Path();
    protected linearPath = new Path();
    protected linearFillPath = new Path();

    constructor(chart: LineDataProvider, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;

        this.mCirclePaintInner = new Paint();
        this.mCirclePaintInner.setAntiAlias(true);
        this.mCirclePaintInner.setStyle(Style.FILL);
        this.mCirclePaintInner.setColor('white');
    }

    public initBuffers() {}

    @profile
    public drawData(c: Canvas) {
        let width = this.mViewPortHandler.getChartWidth();
        let height = this.mViewPortHandler.getChartHeight();

        let drawBitmap = this.mDrawBitmap == null ? null : this.mDrawBitmap.get();

        if (drawBitmap == null || drawBitmap.width != width || drawBitmap.height != height) {
            if (width > 0 && height > 0) {
                // ImageSource.from
                drawBitmap = createImage({ width, height, config: this.mBitmapConfig });
                this.mDrawBitmap = new WeakRef(drawBitmap);
                this.mBitmapCanvas = new Canvas(drawBitmap);
            } else return;
        }

        // drawBitmap.eraseColor(Color.TRANSPARENT);

        const lineData = this.mChart.getLineData();

        for (let set of lineData.getDataSets()) {
            if (set.isVisible()) this.drawDataSet(c, set);
        }

        c.drawBitmap(drawBitmap, 0, 0, this.mRenderPaint);
    }

    @profile
    protected drawDataSet(c: Canvas, dataSet: ILineDataSet) {
        if (dataSet.getEntryCount() < 1) return;

        this.mRenderPaint.setStrokeWidth(dataSet.getLineWidth());
        this.mRenderPaint.setPathEffect(dataSet.getDashPathEffect());

        switch (dataSet.getMode()) {
            default:
            case Mode.LINEAR:
            case Mode.STEPPED:
                this.drawLinear(c, dataSet);
                break;

            case Mode.CUBIC_BEZIER:
                this.drawCubicBezier(dataSet);
                break;

            case Mode.HORIZONTAL_BEZIER:
                this.drawHorizontalBezier(dataSet);
                break;
        }

        this.mRenderPaint.setPathEffect(null);
    }

    @profile
    protected drawHorizontalBezier(dataSet: ILineDataSet) {
        let phaseY = this.mAnimator.getPhaseY();
        const xKey = dataSet.xProperty;
        const yKey = dataSet.yProperty;

        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

        this.cubicPath.reset();

        if (this.mXBounds.range >= 1) {
            let prev = dataSet.getEntryForIndex(this.mXBounds.min);
            let cur = prev;

            // let the spline start
            this.cubicPath.moveTo(cur[xKey], cur[yKey] * phaseY);

            for (let j = this.mXBounds.min + 1; j <= this.mXBounds.range + this.mXBounds.min; j++) {
                prev = cur;
                cur = dataSet.getEntryForIndex(j);

                let cpx = prev[xKey] + (cur[xKey] - prev[xKey]) / 2.0;

                this.cubicPath.cubicTo(cpx, prev[yKey] * phaseY, cpx, cur[yKey] * phaseY, cur[xKey], cur[yKey] * phaseY);
            }
        }

        // if filled is enabled, close the path
        if (dataSet.isDrawFilledEnabled()) {
            this.cubicFillPath.reset();
            this.cubicFillPath.addPath(this.cubicPath);
            // create a new path, this is bad for performance
            this.drawCubicFill(this.mBitmapCanvas, dataSet, this.cubicFillPath, trans, this.mXBounds);
        }

        this.mRenderPaint.setColor(dataSet.getColor());

        this.mRenderPaint.setStyle(Style.STROKE);

        trans.pathValueToPixel(this.cubicPath);

        this.mBitmapCanvas.drawPath(this.cubicPath, this.mRenderPaint);

        this.mRenderPaint.setPathEffect(null);
    }

    @profile
    generateCubicPath(dataSet: ILineDataSet, outputPath: Path) {
        outputPath.reset();

        if (this.mXBounds.range >= 1) {
            let phaseY = this.mAnimator.getPhaseY();
            const xKey = dataSet.xProperty;
            const yKey = dataSet.yProperty;
            let intensity = dataSet.getCubicIntensity();
            let prevDx = 0;
            let prevDy = 0;
            let curDx = 0;
            let curDy = 0;

            // Take an extra polet from the left, and an extra from the right.
            // That's because we need 4 points for a cubic bezier (cubic=4), otherwise we get lines moving and doing weird stuff on the edges of the chart.
            // So in the starting `prev` and `cur`, go -2, -1
            // And in the `lastIndex`, add +1

            let firstIndex = this.mXBounds.min + 1;
            let lastIndex = this.mXBounds.min + this.mXBounds.range;

            let prevPrev;
            let prev = dataSet.getEntryForIndex(Math.max(firstIndex - 2, 0));
            let cur = dataSet.getEntryForIndex(Math.max(firstIndex - 1, 0));
            let next = cur;
            let nextIndex = -1;

            if (cur == null) return;

            // let the spline start
            outputPath.moveTo(cur[xKey], cur[yKey] * phaseY);

            for (let j = firstIndex; j <= lastIndex; j++) {
                prevPrev = prev;
                prev = cur;
                cur = nextIndex == j ? next : dataSet.getEntryForIndex(j);

                nextIndex = j + 1 < dataSet.getEntryCount() ? j + 1 : j;
                next = dataSet.getEntryForIndex(nextIndex);

                prevDx = (cur[xKey] - prevPrev[xKey]) * intensity;
                prevDy = (cur[yKey] - prevPrev[yKey]) * intensity;
                curDx = (next[xKey] - prev[xKey]) * intensity;
                curDy = (next[yKey] - prev[yKey]) * intensity;

                outputPath.cubicTo(prev[xKey] + prevDx, (prev[yKey] + prevDy) * phaseY, cur[xKey] - curDx, (cur[yKey] - curDy) * phaseY, cur[xKey], cur[yKey] * phaseY);
            }
        }
    }
    @profile
    generateLinearPath(dataSet: ILineDataSet, outputPath: Path) {
        outputPath.reset();

        if (this.mXBounds.range >= 1) {
            const phaseY = this.mAnimator.getPhaseY();
            const isDrawSteppedEnabled = dataSet.getMode() == Mode.STEPPED;
            const xKey = dataSet.xProperty;
            const yKey = dataSet.yProperty;

            // const filled = outputPath;
            outputPath.reset();

            let firstIndex = this.mXBounds.min + 1;
            let lastIndex = this.mXBounds.min + this.mXBounds.range;
            const entry = dataSet.getEntryForIndex(firstIndex);

            // filled.moveTo(entry[xKey], fillMin);
            outputPath.moveTo(entry[xKey], entry[yKey] * phaseY);

            // create a new path
            let currentEntry = null;
            let previousEntry = entry;
            for (let x = firstIndex; x <= lastIndex; x++) {
                currentEntry = dataSet.getEntryForIndex(x);
                if (!currentEntry[yKey]) {
                    continue;
                }

                if (isDrawSteppedEnabled) {
                    outputPath.lineTo(currentEntry[xKey], previousEntry[yKey] * phaseY);
                }

                outputPath.lineTo(currentEntry[xKey], currentEntry[yKey] * phaseY);

                previousEntry = currentEntry;
            }
        }
    }

    @profile
    protected drawCubicBezier(dataSet: ILineDataSet) {
        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

        this.generateCubicPath(dataSet, this.cubicPath);

        // if filled is enabled, close the path
        if (dataSet.isDrawFilledEnabled()) {
            this.cubicFillPath.reset();
            this.cubicFillPath.addPath(this.cubicPath);

            this.drawCubicFill(this.mBitmapCanvas, dataSet, this.cubicFillPath, trans, this.mXBounds);
        }

        this.mRenderPaint.setColor(dataSet.getColor());

        this.mRenderPaint.setStyle(Style.STROKE);

        trans.pathValueToPixel(this.cubicPath);

        this.mBitmapCanvas.drawPath(this.cubicPath, this.mRenderPaint);

        this.mRenderPaint.setPathEffect(null);
    }
    @profile
    protected drawLinear(c: Canvas, dataSet: ILineDataSet) {
        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

        this.generateLinearPath(dataSet, this.linearPath);
            //     // if the data-set is dashed, draw on bitmap-canvas
            let canvas:Canvas = null;
        if (dataSet.isDashedLineEnabled()) {
            canvas = this.mBitmapCanvas;
        } else {
            canvas = c;
        }

        // if filled is enabled, close the path
        if (dataSet.isDrawFilledEnabled()) {
            this.linearFillPath.reset();
            this.linearFillPath.addPath(this.linearPath);

            this.drawLinearFill(this.mBitmapCanvas, dataSet, this.linearFillPath, trans, this.mXBounds);
        }

        this.mRenderPaint.setColor(dataSet.getColor());

        this.mRenderPaint.setStyle(Style.STROKE);

        trans.pathValueToPixel(this.linearPath);

        canvas.drawPath(this.linearPath, this.mRenderPaint);

        this.mRenderPaint.setPathEffect(null);
    }

    @profile
    protected drawCubicFill(c: Canvas, dataSet: ILineDataSet, spline: Path, trans: Transformer, bounds: XBounds) {
        const xKey = dataSet.xProperty;
        let fillMin = dataSet.getFillFormatter().getFillLinePosition(dataSet, this.mChart);

        spline.lineTo(dataSet.getEntryForIndex(bounds.min + bounds.range)[xKey], fillMin);
        spline.lineTo(dataSet.getEntryForIndex(bounds.min)[xKey], fillMin);
        spline.close();

        trans.pathValueToPixel(spline);

        const drawable = dataSet.getFillDrawable();
        if (drawable != null) {
            this.drawFilledPathBitmap(c, spline, drawable);
        } else {
            this.drawFilledPath(c, spline, dataSet.getFillColor(), dataSet.getFillAlpha());
        }
    }
    @profile
    protected drawLinearFill(c: Canvas, dataSet: ILineDataSet, spline: Path, trans: Transformer, bounds: XBounds) {
        const xKey = dataSet.xProperty;
        let fillMin = dataSet.getFillFormatter().getFillLinePosition(dataSet, this.mChart);

        spline.lineTo(dataSet.getEntryForIndex(bounds.min + bounds.range)[xKey], fillMin);
        spline.lineTo(dataSet.getEntryForIndex(bounds.min)[xKey], fillMin);
        spline.close();

        trans.pathValueToPixel(spline);

        const drawable = dataSet.getFillDrawable();
        if (drawable != null) {
            this.drawFilledPathBitmap(c, spline, drawable);
        } else {
            this.drawFilledPath(c, spline, dataSet.getFillColor(), dataSet.getFillAlpha());
        }
    }

    // private mLineBuffer: number[] = Array.create('float', 4);

    /**
     * Draws a normal line.
     *
     * @param c
     * @param dataSet
     */
    // @profile
    // protected drawLinear(c: Canvas, dataSet: ILineDataSet) {
    //     const startTime = Date.now();
    //     let entryCount = dataSet.getEntryCount();
    //     const xKey = dataSet.xProperty;
    //     const yKey = dataSet.yProperty;

    //     const isDrawSteppedEnabled = dataSet.getMode() == Mode.STEPPED;
    //     let pointsPerEntryPair = isDrawSteppedEnabled ? 4 : 2;

    //     const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

    //     let phaseY = this.mAnimator.getPhaseY();

    //     this.mRenderPaint.setStyle(Style.STROKE);
    //     this.linearPath.reset();

    //     let canvas: Canvas = null;

    //     // if the data-set is dashed, draw on bitmap-canvas
    //     if (dataSet.isDashedLineEnabled()) {
    //         canvas = this.mBitmapCanvas;
    //     } else {
    //         canvas = c;
    //     }

    //     this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

    //     // if drawing filled is enabled
    //     if (dataSet.isDrawFilledEnabled() && entryCount > 0) {
    //         this.drawLinearFill(c, dataSet, trans, this.mXBounds);
    //     }
    //     // more than 1 color
    //     if (dataSet.getColors().length > 1) {
    //         if (this.mLineBuffer.length <= pointsPerEntryPair * 2) {
    //             this.mLineBuffer = [];
    //             // this.mLineBuffer = Array.create('float', pointsPerEntryPair * 4);
    //         }

    //         for (let j = this.mXBounds.min; j <= this.mXBounds.range + this.mXBounds.min; j++) {
    //             let e = dataSet.getEntryForIndex(j);
    //             if (e == null) continue;

    //             this.mLineBuffer[0] = e[xKey];
    //             this.mLineBuffer[1] = e[yKey] * phaseY;

    //             if (j < this.mXBounds.max) {
    //                 e = dataSet.getEntryForIndex(j + 1);

    //                 if (e == null || !e[yKey]) break;

    //                 if (isDrawSteppedEnabled) {
    //                     this.mLineBuffer[2] = e[xKey];
    //                     this.mLineBuffer[3] = this.mLineBuffer[1];
    //                     this.mLineBuffer[4] = this.mLineBuffer[2];
    //                     this.mLineBuffer[5] = this.mLineBuffer[3];
    //                     this.mLineBuffer[6] = e[xKey];
    //                     this.mLineBuffer[7] = e[yKey] * phaseY;
    //                 } else {
    //                     this.mLineBuffer[2] = e[xKey];
    //                     this.mLineBuffer[3] = e[yKey] * phaseY;
    //                 }
    //             } else {
    //                 this.mLineBuffer[2] = this.mLineBuffer[0];
    //                 this.mLineBuffer[3] = this.mLineBuffer[1];
    //             }

    //             trans.pointValuesToPixel(this.mLineBuffer);

    //             if (!this.mViewPortHandler.isInBoundsRight(this.mLineBuffer[0])) break;

    //             // make sure the lines don't do shitty things outside
    //             // bounds
    //             if (
    //                 !this.mViewPortHandler.isInBoundsLeft(this.mLineBuffer[2]) ||
    //                 (!this.mViewPortHandler.isInBoundsTop(this.mLineBuffer[1]) && !this.mViewPortHandler.isInBoundsBottom(this.mLineBuffer[3]))
    //             )
    //                 continue;

    //             // get the color that is set for this line-segment
    //             this.mRenderPaint.setColor(dataSet.getColor(j));

    //             canvas.drawLines(this.mLineBuffer, 0, pointsPerEntryPair * 2, this.mRenderPaint);
    //         }
    //     } else {
    //         // only one color per dataset

    //         if (this.mLineBuffer.length < Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2) {
    //             // this.mLineBuffer = Array.create('float', Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 4);
    //             this.mLineBuffer = [];
    //         }

    //         let e1, e2;

    //         e1 = dataSet.getEntryForIndex(this.mXBounds.min);

    //         if (e1 != null) {
    //             let j = 0;
    //             for (let x = this.mXBounds.min; x <= this.mXBounds.range + this.mXBounds.min; x++) {
    //                 e1 = dataSet.getEntryForIndex(x == 0 ? 0 : x - 1);
    //                 e2 = dataSet.getEntryForIndex(x);

    //                 if (e1 == null || e2 == null || !e1[yKey] || !e2[yKey]) continue;

    //                 // console.log('test', j, x, xKey, yKey, e1[xKey], e1[yKey]);

    //                 this.mLineBuffer[j++] = e1[xKey];
    //                 this.mLineBuffer[j++] = (e1[yKey] || 0) * phaseY;

    //                 if (isDrawSteppedEnabled) {
    //                     this.mLineBuffer[j++] = e2[xKey];
    //                     this.mLineBuffer[j++] = e1[yKey] * phaseY;
    //                     this.mLineBuffer[j++] = e2[xKey];
    //                     this.mLineBuffer[j++] = e1[yKey] * phaseY;
    //                 }

    //                 this.mLineBuffer[j++] = e2[xKey];
    //                 this.mLineBuffer[j++] = e2[yKey] * phaseY;
    //             }

    //             if (j > 0) {
    //                 trans.pointValuesToPixel(this.mLineBuffer);

    //                 let size = Math.max((this.mXBounds.range + 1) * pointsPerEntryPair, pointsPerEntryPair) * 2;

    //                 this.mRenderPaint.setColor(dataSet.getColor());

    //                 // console.log('drawLinear2', this.mLineBuffer.length, size, this.mRenderPaint.getColor(), this.mRenderPaint.getStrokeWidth(), this.mRenderPaint.getStyle());
    //                 canvas.drawLines(this.mLineBuffer, 0, size, this.mRenderPaint);
    //             }
    //         }
    //     }

    //     this.mRenderPaint.setPathEffect(null);
    // }

    // protected mGenerateFilledPathBuffer = new Path();

    /**
     * Draws a filled linear path on the canvas.
     *
     * @param c
     * @param dataSet
     * @param trans
     * @param bounds
     */
    // @profile
    // protected drawLinearFill(c: Canvas, dataSet: ILineDataSet, trans: Transformer, bounds: XBounds) {
    //     const filled = this.mGenerateFilledPathBuffer;

    //     const startingIndex = bounds.min;
    //     const endingIndex = bounds.range + bounds.min;
    //     const indexInterval = 128;

    //     let currentStartIndex = 0;
    //     let currentEndIndex = indexInterval;
    //     let iterations = 0;

    //     // Doing this iteratively in order to avoid OutOfMemory errors that can happen on large bounds sets.
    //     do {
    //         currentStartIndex = startingIndex + iterations * indexInterval;
    //         currentEndIndex = currentStartIndex + indexInterval;
    //         currentEndIndex = currentEndIndex > endingIndex ? endingIndex : currentEndIndex;

    //         if (currentStartIndex <= currentEndIndex) {
    //             this.generateFilledPath(dataSet, currentStartIndex, currentEndIndex, filled);

    //             trans.pathValueToPixel(filled);

    //             const drawable = dataSet.getFillDrawable();
    //             if (drawable != null) {
    //                 this.drawFilledPathBitmap(c, filled, drawable);
    //             } else {
    //                 this.drawFilledPath(c, filled, dataSet.getFillColor(), dataSet.getFillAlpha());
    //             }
    //         }

    //         iterations++;
    //     } while (currentStartIndex <= currentEndIndex);
    // }

    /**
     * Generates a path that is used for filled drawing.
     *
     * @param dataSet    The dataset from which to read the entries.
     * @param startIndex The index from which to start reading the dataset
     * @param endIndex   The index from which to stop reading the dataset
     * @param outputPath The path object that will be assigned the chart data.
     * @return
     */
    @profile
    // private generateFilledPath(dataSet: ILineDataSet, startIndex, endIndex, outputPath: Path) {
    //     const fillMin = dataSet.getFillFormatter().getFillLinePosition(dataSet, this.mChart);
    //     const phaseY = this.mAnimator.getPhaseY();
    //     const isDrawSteppedEnabled = dataSet.getMode() == Mode.STEPPED;
    //     const xKey = dataSet.xProperty;
    //     const yKey = dataSet.yProperty;

    //     const filled = outputPath;
    //     filled.reset();

    //     const entry = dataSet.getEntryForIndex(startIndex);

    //     filled.moveTo(entry[xKey], fillMin);
    //     filled.lineTo(entry[xKey], entry[yKey] * phaseY);

    //     // create a new path
    //     let currentEntry = null;
    //     let previousEntry = entry;
    //     for (let x = startIndex + 1; x <= endIndex; x++) {
    //         currentEntry = dataSet.getEntryForIndex(x);
    //         if (!currentEntry[yKey]) {
    //             continue;
    //         }

    //         if (isDrawSteppedEnabled) {
    //             filled.lineTo(currentEntry[xKey], previousEntry[yKey] * phaseY);
    //         }

    //         filled.lineTo(currentEntry[xKey], currentEntry[yKey] * phaseY);

    //         previousEntry = currentEntry;
    //     }

    //     // close up
    //     if (currentEntry != null) {
    //         filled.lineTo(currentEntry[xKey], fillMin);
    //     }

    //     filled.close();
    // }

    @profile
    public drawValues(c: Canvas) {
        if (this.isDrawingValuesAllowed(this.mChart)) {
            const dataSets = this.mChart.getLineData().getDataSets();

            for (let i = 0; i < dataSets.length; i++) {
                const dataSet = dataSets[i];
                const yKey = dataSet.yProperty;

                if (!this.shouldDrawValues(dataSet) || dataSet.getEntryCount() < 1) continue;

                // apply the text-styling defined by the DataSet
                this.applyValueTextStyle(dataSet);

                const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

                // make sure the values do not interfear with the circles
                let valOffset = dataSet.getCircleRadius() * 1.75;

                if (!dataSet.isDrawCirclesEnabled()) valOffset = valOffset / 2;

                this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

                const positions = trans.generateTransformedValuesLine(dataSet, this.mAnimator.getPhaseX(), this.mAnimator.getPhaseY(), this.mXBounds.min, this.mXBounds.max);
                const formatter = dataSet.getValueFormatter();

                const iconsOffset = Object.assign({}, dataSet.getIconsOffset());
                iconsOffset.x = Utils.convertDpToPixel(iconsOffset.x);
                iconsOffset.y = Utils.convertDpToPixel(iconsOffset.y);

                for (let j = 0; j < positions.length; j += 2) {
                    let x = positions[j];
                    let y = positions[j + 1];

                    if (!this.mViewPortHandler.isInBoundsRight(x)) break;

                    if (!this.mViewPortHandler.isInBoundsLeft(x) || !this.mViewPortHandler.isInBoundsY(y)) continue;

                    let entry = dataSet.getEntryForIndex(j / 2 + this.mXBounds.min);

                    if (dataSet.isDrawValuesEnabled()) {
                        this.drawValue(c, formatter.getFormattedValue(entry[yKey]), x, y - valOffset, dataSet.getValueTextColor(j / 2));
                    }

                    if (entry.icon != null && dataSet.isDrawIconsEnabled()) {
                        let icon = entry.icon;

                        Utils.drawImage(c, icon, x + iconsOffset.x, y + iconsOffset.y, icon.getIntrinsicWidth(), icon.getIntrinsicHeight());
                    }
                }

                // MPPointF.recycleInstance(iconsOffset);
            }
        }
    }

    @profile
    public drawValue(c: Canvas, valueText, x, y, color) {
        this.mValuePaint.setColor(color);
        c.drawText(valueText, x, y, this.mValuePaint);
    }

    @profile
    public drawExtras(c: Canvas) {
        this.drawCircles(c);
    }

    /**
     * cache for the circle bitmaps of all datasets
     */
    private mImageCaches = new Map<ILineDataSet, DataSetImageCache>();

    /**
     * buffer for drawing the circles
     */
    private mCirclesBuffer = Array.create('float', 2);

    @profile
    protected drawCircles(c: Canvas) {
        this.mRenderPaint.setStyle(Style.FILL);

        let phaseY = this.mAnimator.getPhaseY();

        this.mCirclesBuffer[0] = 0;
        this.mCirclesBuffer[1] = 0;

        const dataSets = this.mChart.getLineData().getDataSets();

        for (let i = 0; i < dataSets.length; i++) {
            const dataSet = dataSets[i];
            const xKey = dataSet.xProperty;
            const yKey = dataSet.yProperty;

            if (!dataSet.isVisible() || !dataSet.isDrawCirclesEnabled() || dataSet.getEntryCount() == 0) continue;

            this.mCirclePaintInner.setColor(dataSet.getCircleHoleColor());

            const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

            this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

            let circleRadius = dataSet.getCircleRadius();
            let circleHoleRadius = dataSet.getCircleHoleRadius();
            let drawCircleHole = dataSet.isDrawCircleHoleEnabled() && circleHoleRadius < circleRadius && circleHoleRadius > 0;
            let drawTransparentCircleHole = drawCircleHole && dataSet.getCircleHoleColor() == ColorTemplate.COLOR_NONE;

            let imageCache;

            if (this.mImageCaches.get(dataSet)) {
                imageCache = this.mImageCaches.get(dataSet);
            } else {
                imageCache = new DataSetImageCache();
                this.mImageCaches.set(dataSet, imageCache);
            }

            let changeRequired = imageCache.init(dataSet);

            // only fill the cache with new bitmaps if a change is required
            if (changeRequired) {
                imageCache.fill(dataSet, this.mRenderPaint, this.mCirclePaintInner, drawCircleHole, drawTransparentCircleHole);
            }

            let boundsRangeCount = this.mXBounds.range + this.mXBounds.min;

            for (let j = this.mXBounds.min; j <= boundsRangeCount; j++) {
                let e = dataSet.getEntryForIndex(j);

                if (e == null) break;

                this.mCirclesBuffer[0] = e[xKey];
                this.mCirclesBuffer[1] = e[yKey] * phaseY;

                trans.pointValuesToPixel(this.mCirclesBuffer);

                if (!this.mViewPortHandler.isInBoundsRight(this.mCirclesBuffer[0])) break;

                if (!this.mViewPortHandler.isInBoundsLeft(this.mCirclesBuffer[0]) || !this.mViewPortHandler.isInBoundsY(this.mCirclesBuffer[1])) continue;

                let circleBitmap = imageCache.getBitmap(j);

                if (circleBitmap != null) {
                    c.drawBitmap(circleBitmap, this.mCirclesBuffer[0] - circleRadius, this.mCirclesBuffer[1] - circleRadius, null);
                }
            }
        }
    }

    @profile
    public drawHighlighted(c: Canvas, indices: Highlight[]) {
        let lineData = this.mChart.getLineData();

        for (let high of indices) {
            let set = lineData.getDataSetByIndex(high.dataSetIndex);

            if (set == null || !set.isHighlightEnabled()) continue;

            let e = lineData.getEntryForHighlight(high);
            // let e = set.getEntryForXValue(high.x high.y);

            if (!this.isInBoundsX(e, set)) continue;

            const xKey = set.xProperty;
            const yKey = set.yProperty;
            let pix = this.mChart.getTransformer(set.getAxisDependency()).getPixelForValues(e[xKey], e[yKey] * this.mAnimator.getPhaseY());

            high.drawX = pix.x;
            high.drawY = pix.y;
            // high.setDraw( pix.x,  pix.y);

            // draw the lines
            this.drawHighlightLines(c, pix.x, pix.y, set);
        }
    }

    /**
     * Sets the Bitmap.Config to be used by this renderer.
     * Default: Bitmap.Config.ARGB_8888
     * Use Bitmap.Config.ARGB_4444 to consume less memory.
     *
     * @param config
     */
    public setBitmapConfig(config) {
        this.mBitmapConfig = config;
        this.releaseBitmap();
    }

    /**
     * Returns the Bitmap.Config that is used by this renderer.
     *
     * @return
     */
    public getBitmapConfig() {
        return this.mBitmapConfig;
    }

    /**
     * Releases the drawing bitmap. This should be called when {@link LineChart#onDetachedFromWindow()}.
     */
    public releaseBitmap() {
        if (this.mBitmapCanvas != null) {
            this.mBitmapCanvas.setBitmap(null);
            this.mBitmapCanvas = null;
        }
        if (this.mDrawBitmap != null) {
            let drawBitmap = this.mDrawBitmap.get();
            if (drawBitmap != null) {
                releaseImage(drawBitmap);
                // drawBitmap.recycle();
            }
            this.mDrawBitmap.clear();
            this.mDrawBitmap = null;
        }
    }
}
