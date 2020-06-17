import { LineRadarRenderer } from './LineRadarRenderer';
import { LineDataProvider } from '../interfaces/dataprovider/LineDataProvider';
import { Direction, Paint, Canvas, Path, Style, createImage, releaseImage, FillType, Matrix } from 'nativescript-canvas';
import { ImageSource } from '@nativescript/core/image-source/image-source';
import { ChartAnimator } from '../animation/ChartAnimator';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ILineDataSet } from '../interfaces/datasets/ILineDataSet';
import { LineDataSet, Mode } from '../data/LineDataSet';
import { Utils, FloatArray } from '../utils/Utils';
import { ColorTemplate } from '../utils/ColorTemplate';
import { Highlight } from '../highlight/Highlight';
import { XBounds } from './BarLineScatterCandleBubbleRenderer';
import { Transformer } from '../utils/Transformer';
import { profile } from '@nativescript/core/profiling/profiling';
import { isAndroid } from '@nativescript/core/platform';

// fix drawing "too" thin paths on iOS

export class DataSetImageCache {
    private mCirclePathBuffer = new Path();

    private circleBitmaps: any[];

    /**
     * Sets up the cache, returns true if a change of cache was required.
     *
     * @param set
     * @return
     */
    init(set: ILineDataSet) {
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
    fill(set: ILineDataSet, mRenderPaint, mCirclePaintInner, drawCircleHole: boolean, drawTransparentCircleHole: boolean) {
        let colorCount = set.getCircleColorCount();
        let circleRadius = set.getCircleRadius();
        let circleHoleRadius = set.getCircleHoleRadius();

        for (let i = 0; i < colorCount; i++) {
            const circleBitmap = createImage({ width: circleRadius * 2.1, height: circleRadius * 2.1, scale: Utils.density });

            let canvas = new Canvas(circleBitmap);
            mRenderPaint.setColor(set.getCircleColor(i));

            if (drawTransparentCircleHole) {
                // Begin path for circle with hole
                this.mCirclePathBuffer.reset();
                const oldType = this.mCirclePathBuffer.getFillType();
                this.mCirclePathBuffer.setFillType(FillType.EVEN_ODD);
                this.mCirclePathBuffer.addCircle(circleRadius, circleRadius, circleRadius, Direction.CW);

                // Cut hole in path
                this.mCirclePathBuffer.addCircle(circleRadius, circleRadius, circleHoleRadius, Direction.CW);

                // Fill in-between
                canvas.drawPath(this.mCirclePathBuffer, mRenderPaint);
                this.mCirclePathBuffer.setFillType(oldType);
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
    getBitmap(index) {
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
    protected mBitmapConfig;

    // protected cubicPath = new Path();
    // protected cubicFillPath = new Path();
    protected linePath = new Path();
    protected fillPath = new Path();

    constructor(chart: LineDataProvider, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;
        if (isAndroid) {
            this.mBitmapConfig = android.graphics.Bitmap.Config.ARGB_8888;
        }

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
                this.mBitmapCanvas = new Canvas(width, height);
                drawBitmap = this.mBitmapCanvas.getImage();
                this.mDrawBitmap = new WeakRef(drawBitmap);
            } else return;
        } else {
            this.mBitmapCanvas.clear();
        }

        const lineData = this.mChart.getLineData();
        let needsBitmapDrawing = false;
        for (let set of lineData.getVisibleDataSets()) {
            needsBitmapDrawing = this.drawDataSet(c, set) || needsBitmapDrawing;
        }
        if (needsBitmapDrawing) {
            c.drawBitmap(drawBitmap, 0, 0, this.mRenderPaint);
        }
    }

    protected drawDataSet(c: Canvas, dataSet: ILineDataSet): boolean {
        if (dataSet.getEntryCount() < 1) return false;
        this.mRenderPaint.setStrokeWidth(dataSet.getLineWidth());
        this.mRenderPaint.setPathEffect(dataSet.getDashPathEffect());
        this.mRenderPaint.setColor(dataSet.getColor());
        this.mRenderPaint.setStyle(Style.STROKE);

        const scaleX = this.mViewPortHandler.getScaleX();
        dataSet.applyFiltering(scaleX);

        let result = false;
        switch (dataSet.getMode()) {
            default:
            case Mode.LINEAR:
            case Mode.STEPPED:
                result = this.drawLinear(c, dataSet);
                break;

            case Mode.CUBIC_BEZIER:
                result = this.drawCubicBezier(c, dataSet);
                break;

            case Mode.HORIZONTAL_BEZIER:
                result = this.drawHorizontalBezier(c, dataSet);
                break;
        }

        this.mRenderPaint.setPathEffect(null);
        return result;
    }

    @profile
    generateHorizontalBezierPath(dataSet: ILineDataSet, outputPath: Path) {
        if (this.mXBounds.range >= 1) {
            let pointsPerEntryPair = 6;
            let entryCount = dataSet.getEntryCount();
            if (!this.mLineBuffer || this.mLineBuffer.length < Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2) {
                this.mLineBuffer = Utils.createArrayBuffer(Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2);
            }

            let phaseY = this.mAnimator.getPhaseY();
            const xKey = dataSet.xProperty;
            const yKey = dataSet.yProperty;
            let prev = dataSet.getEntryForIndex(this.mXBounds.min);
            let cur = prev;
            var float32arr = this.mLineBuffer;
            float32arr[0] = cur[xKey];
            float32arr[1] = cur[yKey] * phaseY;

            let firstIndex = Math.max(0, this.mXBounds.min);
            // let firstIndex = this.mXBounds.min + 1;
            let lastIndex = this.mXBounds.min + this.mXBounds.range;
            // let the spline start
            // this.cubicPath.moveTo(cur[xKey], cur[yKey] * phaseY);
            let index = 2;

            for (let j = firstIndex + 1; j <= lastIndex; j++) {
                const newEntry = dataSet.getEntryForIndex(j);
                if (newEntry[yKey] === undefined || newEntry[yKey] === null) {
                    continue;
                }
                prev = cur;
                cur = dataSet.getEntryForIndex(j);

                let cpx = prev[xKey] + (cur[xKey] - prev[xKey]) / 2.0;

                float32arr[index++] = cpx;
                float32arr[index++] = prev[yKey] * phaseY;
                float32arr[index++] = cpx;
                float32arr[index++] = cur[yKey] * phaseY;
                float32arr[index++] = cur[xKey];
                float32arr[index++] = cur[yKey] * phaseY;
                // this.cubicPath.cubicTo(cpx, prev[yKey] * phaseY, cpx, cur[yKey] * phaseY, cur[xKey], cur[yKey] * phaseY);
            }
            const points = Utils.pointsFromBuffer(float32arr);
            outputPath.setCubicLines(points, 0, index);
            return [points, index];
        } else {
            outputPath.reset();
            return [];
        }
    }
    @profile
    generateCubicPath(dataSet: ILineDataSet, outputPath: Path) {
        if (this.mXBounds.range >= 1) {
            let pointsPerEntryPair = 6;
            let entryCount = dataSet.getEntryCount();
            if (!this.mLineBuffer || this.mLineBuffer.length < Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2) {
                this.mLineBuffer = Utils.createArrayBuffer(Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2);
            }
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

            let firstIndex = Math.max(0, this.mXBounds.min);
            // let firstIndex = this.mXBounds.min + 1;
            let lastIndex = this.mXBounds.min + this.mXBounds.range;

            let prevPrev;
            let prev = dataSet.getEntryForIndex(Math.max(firstIndex - 2, 0));
            let cur = dataSet.getEntryForIndex(Math.max(firstIndex - 1, 0));
            let next = cur;
            let nextIndex = -1;

            if (cur == null) return [];

            var float32arr = this.mLineBuffer;
            float32arr[0] = cur[xKey];
            float32arr[1] = cur[yKey] * phaseY;
            // let the spline start
            // outputPath.moveTo(cur[xKey], cur[yKey] * phaseY);
            let index = 2;
            for (let j = firstIndex + 1; j <= lastIndex; j++) {
                const newEntry = dataSet.getEntryForIndex(j);
                if (newEntry[yKey] === undefined || newEntry[yKey] === null) {
                    continue;
                }
                prevPrev = prev;
                prev = cur;
                cur = nextIndex == j ? next : newEntry;

                nextIndex = j + 1 < dataSet.getEntryCount() ? j + 1 : j;
                next = dataSet.getEntryForIndex(nextIndex);
                if (next[yKey] === undefined || next[yKey] === null) {
                    continue;
                }
                prevDx = (cur[xKey] - prevPrev[xKey]) * intensity;
                prevDy = (cur[yKey] - prevPrev[yKey]) * intensity;
                curDx = (next[xKey] - prev[xKey]) * intensity;
                curDy = (next[yKey] - prev[yKey]) * intensity;

                float32arr[index++] = prev[xKey] + prevDx;
                float32arr[index++] = (prev[yKey] + prevDy) * phaseY;
                float32arr[index++] = cur[xKey] - curDx;
                float32arr[index++] = (cur[yKey] - curDy) * phaseY;
                float32arr[index++] = cur[xKey];
                float32arr[index++] = cur[yKey] * phaseY;
                // outputPath.cubicTo(prev[xKey] + prevDx, (prev[yKey] + prevDy) * phaseY, cur[xKey] - curDx, (cur[yKey] - curDy) * phaseY, cur[xKey], cur[yKey] * phaseY);
            }
            const points = Utils.pointsFromBuffer(float32arr);
            // console.log('generateCubicPath', index, points.length);
            outputPath.setCubicLines(points, 0, index);
            return [points, index];
        } else {
            outputPath.reset();
            return [];
        }
    }

    generateLinearPath(dataSet: ILineDataSet, outputPath: Path) {
        if (this.mXBounds.range >= 1) {
            const isDrawSteppedEnabled = dataSet.getMode() == Mode.STEPPED;
            let entryCount = dataSet.getEntryCount();
            let pointsPerEntryPair = isDrawSteppedEnabled ? 4 : 2;
            if (!this.mLineBuffer || this.mLineBuffer.length < Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2) {
                this.mLineBuffer = Utils.createArrayBuffer(Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2);
            }
            const phaseY = this.mAnimator.getPhaseY();
            const xKey = dataSet.xProperty;
            const yKey = dataSet.yProperty;

            // const filled = outputPath;
            // outputPath.reset();

            let firstIndex = Math.max(0, this.mXBounds.min);
            let lastIndex = this.mXBounds.min + this.mXBounds.range;
            const entry = dataSet.getEntryForIndex(firstIndex);

            // outputPath.moveTo(entry[xKey], entry[yKey] * phaseY);
            var float32arr = this.mLineBuffer;
            float32arr[0] = entry[xKey];
            float32arr[1] = entry[yKey] * phaseY;
            let index = 2;
            // create a new path
            let currentEntry = null;
            let previousEntry = entry;
            for (let x = firstIndex + 1; x <= lastIndex; x++) {
                currentEntry = dataSet.getEntryForIndex(x);
                if (currentEntry[yKey] === undefined || currentEntry[yKey] === null) {
                    continue;
                }

                if (isDrawSteppedEnabled) {
                    float32arr[index++] = currentEntry[xKey];
                    float32arr[index++] = previousEntry[yKey] * phaseY;
                    // outputPath.lineTo(currentEntry[xKey], previousEntry[yKey] * phaseY);
                }

                float32arr[index++] = currentEntry[xKey];
                float32arr[index++] = currentEntry[yKey] * phaseY;
                // outputPath.lineTo(currentEntry[xKey], currentEntry[yKey] * phaseY);

                previousEntry = currentEntry;
            }
            const points = Utils.pointsFromBuffer(float32arr);
            // console.log('generateLinearPath', index, points.length);
            // if (isAndroid) {
            outputPath.setLines(points, 0, index);
            // }
            return [points, index];
        } else {
            outputPath.reset();
            return [];
        }
    }

    @profile
    protected drawCubicBezier(c: Canvas, dataSet: ILineDataSet) {
        let result = false;
        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

        this.generateCubicPath(dataSet, this.linePath);

        // if filled is enabled, close the path
        if (dataSet.isDrawFilledEnabled()) {
            this.fillPath.reset();
            this.fillPath.addPath(this.linePath);

            this.drawFill(c, dataSet, this.fillPath, trans, this.mXBounds);
            // result = true;
        }

        if (dataSet.getLineWidth() > 0) {
            trans.pathValueToPixel(this.linePath);
            this.drawPath(c, this.linePath, this.mRenderPaint);
        }

        return result;
    }

    @profile
    protected drawHorizontalBezier(c: Canvas, dataSet: ILineDataSet) {
        let result = false;
        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

        this.generateHorizontalBezierPath(dataSet, this.linePath);

        // if filled is enabled, close the path
        if (dataSet.isDrawFilledEnabled()) {
            this.fillPath.reset();
            this.fillPath.addPath(this.linePath);

            this.drawFill(c, dataSet, this.fillPath, trans, this.mXBounds);
            // result = true;
        }

        if (dataSet.getLineWidth() > 0) {
            trans.pathValueToPixel(this.linePath);
            this.drawPath(c, this.linePath, this.mRenderPaint);
        }

        return result;
    }

    @profile
    protected drawLinear(c: Canvas, dataSet: ILineDataSet) {
        let result = false;
        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

        const res = this.generateLinearPath(dataSet, this.linePath);

        const colors = dataSet.getColors();
        const nbColors = colors.length;
        // if filled is enabled, close the path
        if (dataSet.isDrawFilledEnabled()) {
            this.fillPath.reset();
            this.fillPath.addPath(this.linePath);

            this.drawFill(c, dataSet, this.fillPath, trans, this.mXBounds);
            // result = true;
        }

        // if (isAndroid || dataSet.isDashedLineEnabled()) {
        if (dataSet.getLineWidth() > 0) {
            if (nbColors === 1) {
                trans.pathValueToPixel(this.linePath);
                this.drawPath(c, this.linePath, this.mRenderPaint);
            } else {
                    const xKey = dataSet.xProperty;
                    const points = res[0];
                    let lastIndex = 0;
                    trans.pointValuesToPixel(points);
                    for (let index = 0; index < nbColors; index++) {
                        const color = colors[index];
                        let colorIndex = color[xKey] as number;
                        this.mRenderPaint.setColor(color.color);
                        this.linePath.setLines(points, lastIndex*2, (colorIndex - lastIndex + 1)*2);
                        this.drawPath(c, this.linePath, this.mRenderPaint);
                        lastIndex = colorIndex;
                    }
                }
        }
        // } else {
        //     const points = res[0];
        //     const length = res[1];
        //     this.drawLines(c, points, 0, length, this.mRenderPaint, trans.getValueToPixelMatrix());
        // }

        return result;
    }

    @profile
    drawLines(canvas: Canvas, points: number[], offest, length, paint: Paint, matrix?: Matrix) {
        if (matrix) {
            canvas.drawLines(points, offest, length, paint, matrix);
        } else {
            canvas.drawLines(points, offest, length, paint);
        }
    }

    protected drawFill(c: Canvas, dataSet: ILineDataSet, spline: Path, trans: Transformer, bounds: XBounds) {
        const xKey = dataSet.xProperty;
        let fillMin = dataSet.getFillFormatter().getFillLinePosition(dataSet, this.mChart);

        spline.lineTo(dataSet.getEntryForIndex(bounds.min + bounds.range)[xKey], fillMin);
        spline.lineTo(dataSet.getEntryForIndex(bounds.min)[xKey], fillMin);
        spline.close();

        trans.pathValueToPixel(spline);

        const drawable = dataSet.getFillDrawable();
        if (drawable != null) {
            this.drawFilledPathBitmap(c, spline, drawable, dataSet.getFillShader());
        } else {
            this.drawFilledPath(c, spline, dataSet.getFillColor(), dataSet.getFillAlpha(), dataSet.getFillShader());
        }
    }

    private mLineBuffer: number[];

    @profile
    public drawValuesForDataset(c: Canvas, dataSet: LineDataSet, dataSetIndex: number) {
        const yKey = dataSet.yProperty;
        // apply the text-styling defined by the DataSet
        this.applyValueTextStyle(dataSet);

        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        // make sure the values do not interfear with the circles
        let valOffset = dataSet.getCircleRadius() * 1.75;

        if (!dataSet.isDrawCirclesEnabled()) valOffset = valOffset / 2;

        this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

        const { points, count } = trans.generateTransformedValues(dataSet, this.mAnimator.getPhaseX(), this.mAnimator.getPhaseY(), this.mXBounds.min, this.mXBounds.max);
        const formatter = dataSet.getValueFormatter();

        const iconsOffset = dataSet.getIconsOffset();
        const valuesOffset = dataSet.getValuesOffset();
        const drawIcons = dataSet.isDrawIconsEnabled();
        const drawValues = dataSet.isDrawValuesEnabled();
        const length = count;
        const dataSetCount = dataSet.getEntryCount();
        for (let j = 0; j < length; j += 2) {
            let x = points[j];
            let y = points[j + 1];

            if (!this.mViewPortHandler.isInBoundsRight(x)) break;

            if (!this.mViewPortHandler.isInBoundsLeft(x) || !this.mViewPortHandler.isInBoundsY(y)) continue;

            const index = j / 2 + this.mXBounds.min;
            let entry = dataSet.getEntryForIndex(index);
            if (!entry) continue;

            if (drawValues) {
                // console.log('drawValue', entry[yKey], entry, index, dataSetCount);
                this.drawValue(
                    c,
                    formatter.getFormattedValue(entry[yKey], entry, index, dataSetCount, dataSetIndex, this.mViewPortHandler),
                    valuesOffset.x + x,
                    valuesOffset.y + y - valOffset,
                    dataSet.getValueTextColor(j / 2)
                );
            }

            if (drawIcons && entry.icon != null) {
                let icon = entry.icon;

                Utils.drawImage(c, icon, x + iconsOffset.x, y + iconsOffset.y, icon.getIntrinsicWidth(), icon.getIntrinsicHeight());
            }
        }
    }

    public drawValues(c: Canvas) {
        if (this.isDrawingValuesAllowed(this.mChart)) {
            const dataSets = this.mChart.getLineData().getDataSets();

            for (let i = 0; i < dataSets.length; i++) {
                const dataSet = dataSets[i];

                if (!this.shouldDrawValues(dataSet) || dataSet.getEntryCount() < 1) continue;
                this.drawValuesForDataset(c, dataSet, i);
            }
        }
    }

    public drawValue(c: Canvas, valueText, x, y, color) {
        if (valueText) {
            this.mValuePaint.setColor(color);
            c.drawText(valueText, x, y, this.mValuePaint);
        }
    }

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
    private mCirclesBuffer = Utils.createNativeArray(2);

    @profile
    protected drawCirclesForDataset(c: Canvas, dataSet: LineDataSet) {
        this.mCirclePaintInner.setColor(dataSet.getCircleHoleColor());
        let phaseY = this.mAnimator.getPhaseY();

        const xKey = dataSet.xProperty;
        const yKey = dataSet.yProperty;
        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

        let circleRadius = dataSet.getCircleRadius();
        let circleHoleRadius = dataSet.getCircleHoleRadius();
        let drawCircleHole = dataSet.isDrawCircleHoleEnabled() && circleHoleRadius < circleRadius && circleHoleRadius > 0;
        let drawTransparentCircleHole = drawCircleHole && dataSet.getCircleHoleColor() == ColorTemplate.COLOR_NONE;

        let imageCache: DataSetImageCache;

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

    protected drawCircles(c: Canvas) {
        this.mRenderPaint.setStyle(Style.FILL);

        this.mCirclesBuffer[0] = 0;
        this.mCirclesBuffer[1] = 0;

        const dataSets = this.mChart.getLineData().getVisibleDataSets();

        for (let i = 0; i < dataSets.length; i++) {
            const dataSet = dataSets[i];

            if (!dataSet.isDrawCirclesEnabled() || dataSet.getEntryCount() == 0) continue;
            this.drawCirclesForDataset(c, dataSet);
        }
    }

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
