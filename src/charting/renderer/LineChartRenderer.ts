import { Canvas, Direction, FillType, LinearGradient, Matrix, Paint, Path, Style, TileMode, createImage, releaseImage } from '@nativescript-community/ui-canvas';
import { Color, ImageSource, profile } from '@nativescript/core';
import { ChartAnimator } from '../animation/ChartAnimator';
import { LineChart } from '../charts';
import { CustomRenderer } from '../charts/LineChart';
import { getEntryXValue } from '../data/BaseEntry';
import { Rounding } from '../data/DataSet';
import { LineDataSet, Mode } from '../data/LineDataSet';
import { Highlight } from '../highlight/Highlight';
import { ILineDataSet } from '../interfaces/datasets/ILineDataSet';
import { ColorTemplate } from '../utils/ColorTemplate';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { LineRadarRenderer } from './LineRadarRenderer';

// fix drawing "too" thin paths on iOS

export class DataSetImageCache {
    private mCirclePathBuffer: Path;
    protected get circlePathBuffer() {
        if (!this.mCirclePathBuffer) {
            this.mCirclePathBuffer = new Path();
        }
        return this.mCirclePathBuffer;
    }

    private circleBitmaps: any[];

    /**
     * Sets up the cache, returns true if a change of cache was required.
     *
     * @param set
     * @return
     */
    init(set: ILineDataSet) {
        const size = set.getCircleColorCount();
        let changeRequired = false;

        if (this.circleBitmaps == null) {
            this.circleBitmaps = [];
            changeRequired = true;
        } else if (this.circleBitmaps.length !== size) {
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
    fill(set: ILineDataSet, renderPaint: Paint, circlePaintInner: Paint, drawCircleHole: boolean, drawTransparentCircleHole: boolean) {
        const colorCount = set.getCircleColorCount();
        const circleRadius = set.getCircleRadius();
        const circleHoleRadius = set.getCircleHoleRadius();

        for (let i = 0; i < colorCount; i++) {
            const circleBitmap = createImage({ width: circleRadius * 2.1, height: circleRadius * 2.1, scale: 1 });

            const canvas = new Canvas(circleBitmap);
            renderPaint.setColor(set.getCircleColor(i));

            if (drawTransparentCircleHole) {
                const circlePathBuffer = this.circlePathBuffer;
                // Begin path for circle with hole
                circlePathBuffer.reset();
                // const oldType = circlePathBuffer.getFillType();
                circlePathBuffer.setFillType(FillType.EVEN_ODD);
                circlePathBuffer.addCircle(circleRadius, circleRadius, circleRadius, Direction.CW);

                // Cut hole in path
                circlePathBuffer.addCircle(circleRadius, circleRadius, circleHoleRadius, Direction.CW);

                // Fill in-between
                canvas.drawPath(circlePathBuffer, renderPaint);
                // circlePathBuffer.setFillType(oldType);
            } else {
                canvas.drawCircle(circleRadius, circleRadius, circleRadius, renderPaint);

                if (drawCircleHole) {
                    canvas.drawCircle(circleRadius, circleRadius, circleHoleRadius, circlePaintInner);
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
    public mChart: LineChart;

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
    // protected mBitmapConfig;

    // protected cubicPath = new Path();
    // protected cubicFillPath = new Path();
    protected mLinePath: Path;

    protected get linePath() {
        if (!this.mLinePath) {
            this.mLinePath = new Path();
        }
        return this.mLinePath;
    }
    protected mFillPath: Path;
    protected get fillPath() {
        if (!this.mFillPath) {
            this.mFillPath = new Path();
        }
        return this.mFillPath;
    }

    /**
     * cache for the circle bitmaps of all datasets
     */
    private mImageCaches = new Map<ILineDataSet, DataSetImageCache>();

    /**
     * buffer for drawing the circles
     */
    private mCirclesBuffer: [number, number];

    private get circlesBuffer() {
        if (!this.mCirclesBuffer) {
            this.mCirclesBuffer = Utils.createNativeArray(2);
        }
        return this.mCirclesBuffer;
    }

    constructor(chart: LineChart, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;
        // if (global.isAndroid) {
        //     this.mBitmapConfig = android.graphics.Bitmap.Config.ARGB_8888;
        // }
    }

    get circlePaintInner() {
        if (!this.mCirclePaintInner) {
            this.mCirclePaintInner = new Paint();
            this.mCirclePaintInner.setAntiAlias(true);
            this.mCirclePaintInner.setStyle(Style.FILL);
            this.mCirclePaintInner.setColor('white');
        }
        return this.mCirclePaintInner;
    }

    public initBuffers() {}

    @profile
    public drawData(c: Canvas) {
        const width = this.mViewPortHandler.getChartWidth();
        const height = this.mViewPortHandler.getChartHeight();

        let drawBitmap = this.mDrawBitmap == null ? null : this.mDrawBitmap.get();

        if (drawBitmap == null || drawBitmap.width !== width || drawBitmap.height !== height) {
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
        for (const set of lineData.getVisibleDataSets()) {
            needsBitmapDrawing = this.drawDataSet(c, set) || needsBitmapDrawing;
        }
        if (needsBitmapDrawing) {
            const renderPaint = this.renderPaint;
            c.drawBitmap(drawBitmap, 0, 0, renderPaint);
        }
    }

    protected drawDataSet(c: Canvas, dataSet: LineDataSet): boolean {
        if (dataSet.getEntryCount() < 1) return false;
        const renderPaint = this.renderPaint;
        renderPaint.setStrokeWidth(dataSet.getLineWidth());
        renderPaint.setPathEffect(dataSet.getDashPathEffect());
        if (dataSet.getNbColors() === 1) {
            renderPaint.setColor(dataSet.getColor());
        }
        renderPaint.setStyle(Style.STROKE);

        const scaleX = this.mViewPortHandler.getScaleX();
        dataSet.applyFiltering(scaleX);
        const result = this.draw(c, dataSet);
        renderPaint.setPathEffect(null);
        return result;
    }

    @profile
    generateHorizontalBezierPath(dataSet: ILineDataSet, outputPath: Path) {
        if (this.mXBounds.range >= 1) {
            const pointsPerEntryPair = 6;
            const entryCount = dataSet.getEntryCount();
            if (!this.mLineBuffer || this.mLineBuffer.length < Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2) {
                this.mLineBuffer = Utils.createArrayBuffer(Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2);
            }

            const phaseY = this.mAnimator.getPhaseY();
            const xKey = dataSet.xProperty;
            const yKey = dataSet.yProperty;
            let prev = dataSet.getEntryForIndex(this.mXBounds.min);
            let prevXVal = getEntryXValue(prev, xKey, this.mXBounds.min);
            let cur = prev;
            const float32arr = this.mLineBuffer;
            float32arr[0] = prevXVal;
            float32arr[1] = cur[yKey] * phaseY;

            const firstIndex = Math.max(0, this.mXBounds.min);
            // let firstIndex = this.mXBounds.min + 1;
            const lastIndex = this.mXBounds.min + this.mXBounds.range;
            // let the spline start
            let index = 2,
                curXVal;

            for (let j = firstIndex + 1; j <= lastIndex; j++) {
                const newEntry = dataSet.getEntryForIndex(j);
                if (newEntry[yKey] === undefined || newEntry[yKey] === null) {
                    continue;
                }
                prev = cur;
                prevXVal = curXVal;
                cur = dataSet.getEntryForIndex(j);
                curXVal = getEntryXValue(prev, xKey, j);
                const cpx = prevXVal + (curXVal - prevXVal) / 2.0;

                float32arr[index++] = cpx;
                float32arr[index++] = prev[yKey] * phaseY;
                float32arr[index++] = cpx;
                float32arr[index++] = cur[yKey] * phaseY;
                float32arr[index++] = curXVal;
                float32arr[index++] = cur[yKey] * phaseY;
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
            const pointsPerEntryPair = 6;
            const entryCount = dataSet.getEntryCount();
            if (!this.mLineBuffer || this.mLineBuffer.length < Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2) {
                this.mLineBuffer = Utils.createArrayBuffer(Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2);
            }
            const phaseY = this.mAnimator.getPhaseY();
            const xKey = dataSet.xProperty;
            const yKey = dataSet.yProperty;
            const intensity = dataSet.getCubicIntensity();
            let prevDx = 0;
            let prevDy = 0;
            let curDx = 0;
            let curDy = 0;

            // Take an extra polet from the left, and an extra from the right.
            // That's because we need 4 points for a cubic bezier (cubic=4), otherwise we get lines moving and doing weird stuff on the edges of the chart.
            // So in the starting `prev` and `cur`, go -2, -1
            // And in the `lastIndex`, add +1

            const firstIndex = Math.max(0, this.mXBounds.min);
            // let firstIndex = this.mXBounds.min + 1;
            const lastIndex = this.mXBounds.min + this.mXBounds.range;

            let prevPrev;
            let prevPrevXVal;
            let i = Math.max(firstIndex - 2, 0);
            let prev = dataSet.getEntryForIndex(i);
            let prevXVal = getEntryXValue(prev, xKey, i);
            i = Math.max(firstIndex - 1, 0);
            let cur = dataSet.getEntryForIndex(i);
            let curXVal = getEntryXValue(cur, xKey, i);
            let next = cur;
            let nextXVal = curXVal;
            let nextIndex = -1;

            if (cur == null) return [];

            const float32arr = this.mLineBuffer;
            let index = 0;
            float32arr[index++] = curXVal;
            float32arr[index++] = cur[yKey] * phaseY;
            // let the spline start
            for (let j = firstIndex + 1; j <= lastIndex; j++) {
                const newEntry = dataSet.getEntryForIndex(j);
                if (newEntry[yKey] === undefined || newEntry[yKey] === null) {
                    continue;
                }
                prevPrev = prev;
                prevPrevXVal = prevXVal;
                prev = cur;
                prevXVal = curXVal;
                cur = nextIndex === j ? next : newEntry;
                curXVal = nextIndex === j ? nextXVal : getEntryXValue(newEntry, xKey, j);
                nextIndex = j + 1 < dataSet.getEntryCount() ? j + 1 : j;
                next = dataSet.getEntryForIndex(nextIndex);
                nextXVal = getEntryXValue(next, xKey, nextIndex);
                if (next[yKey] === undefined || next[yKey] === null) {
                    continue;
                }
                prevDx = (curXVal - prevPrevXVal) * intensity;
                prevDy = (cur[yKey] - prevPrev[yKey]) * intensity;
                curDx = (nextXVal - prevXVal) * intensity;
                curDy = (next[yKey] - prev[yKey]) * intensity;

                float32arr[index++] = prevXVal + prevDx;
                float32arr[index++] = (prev[yKey] + prevDy) * phaseY;
                float32arr[index++] = curXVal - curDx;
                float32arr[index++] = (cur[yKey] - curDy) * phaseY;
                float32arr[index++] = curXVal;
                float32arr[index++] = cur[yKey] * phaseY;
            }
            const points = Utils.pointsFromBuffer(float32arr);
            outputPath.setCubicLines(points, 0, index);
            return [points, index];
        } else {
            outputPath.reset();
            return [];
        }
    }

    generateLinearPath(dataSet: ILineDataSet, outputPath: Path) {
        if (this.mXBounds.range >= 1) {
            const isDrawSteppedEnabled = dataSet.getMode() === Mode.STEPPED;
            const entryCount = dataSet.getEntryCount();
            const pointsPerEntryPair = isDrawSteppedEnabled ? 4 : 2;
            if (!this.mLineBuffer || this.mLineBuffer.length < Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2) {
                this.mLineBuffer = Utils.createArrayBuffer(Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2);
            }
            const phaseY = this.mAnimator.getPhaseY();
            const xKey = dataSet.xProperty;
            const yKey = dataSet.yProperty;

            // const filled = outputPath;
            // outputPath.reset();

            const firstIndex = Math.max(0, this.mXBounds.min);
            const lastIndex = this.mXBounds.min + this.mXBounds.range;
            const entry = dataSet.getEntryForIndex(firstIndex);
            const entryXVal = getEntryXValue(entry, xKey, firstIndex);

            const float32arr = this.mLineBuffer;
            float32arr[0] = entryXVal;
            float32arr[1] = entry[yKey] * phaseY;
            let index = 2;
            // create a new path
            let currentEntry = null;
            let currentEntryXVal;
            let previousEntry = entry;
            for (let x = firstIndex + 1; x <= lastIndex; x++) {
                currentEntry = dataSet.getEntryForIndex(x);
                currentEntryXVal = getEntryXValue(currentEntry, xKey, x);
                if (currentEntry[yKey] === undefined || currentEntry[yKey] === null) {
                    continue;
                }

                if (isDrawSteppedEnabled) {
                    float32arr[index++] = currentEntryXVal;
                    float32arr[index++] = previousEntry[yKey] * phaseY;
                }

                float32arr[index++] = currentEntryXVal;
                float32arr[index++] = currentEntry[yKey] * phaseY;

                previousEntry = currentEntry;
            }
            const points = Utils.pointsFromBuffer(float32arr);
            outputPath.setLines(points, 0, index);
            return [points, index];
        } else {
            outputPath.reset();
            return [];
        }
    }

    getMultiColorsShader(colors: { color: string | Color; [k: string]: any }[], points, trans: Transformer, dataSet: LineDataSet, renderPaint: Paint) {
        const nbColors = colors.length;
        const xKey = dataSet.xProperty;
        if (nbColors > 1) {
            trans.pointValuesToPixel(points);
            const shaderColors = [];
            const positions = [];
            const firstIndex = Math.max(0, this.mXBounds.min);
            const range = this.mXBounds.range;
            const lastIndex = firstIndex + range;
            const width = this.mViewPortHandler.getChartWidth();
            const chartRect = this.mViewPortHandler.getChartRect();
            let lastColor, lastColorPosX;

            const gradientDelta = 0;
            const posDelta = gradientDelta / width;
            for (let index = 0; index < nbColors; index++) {
                const color = colors[index] as { color: string | Color; [k: string]: any };
                let colorIndex = color[xKey || 'index'] as number;
                // if filtered we need to get the real index
                if ((dataSet as any).isFiltered()) {
                    (dataSet as any).setIgnoreFiltered(true);
                    const entry = dataSet.getEntryForIndex(colorIndex);
                    (dataSet as any).setIgnoreFiltered(false);
                    if (entry !== null) {
                        colorIndex = dataSet.getEntryIndexForXValue(getEntryXValue(entry, xKey, colorIndex), NaN, Rounding.CLOSEST);
                    }
                }
                if (colorIndex < firstIndex) {
                    lastColor = color.color;
                    continue;
                }
                if (colorIndex > lastIndex) {
                    if (shaderColors.length === 0) {
                        shaderColors.push(lastColor);
                        positions.push(0);
                    }
                    break;
                }
                const posX = Math.floor(points[(colorIndex - firstIndex) * 2]);
                const pos = (posX - chartRect.left) / width;
                // if (posX - lastColorPosX < 3) {
                //     // ignore too small
                //     // lastColor = color.color;
                //     shaderColors.pop();
                //     shaderColors.pop();
                //     positions.pop();
                //     positions.pop();
                //     lastColor = shaderColors[shaderColors.length -1];
                //     lastColorPosX = positions[positions.length -1] * width + chartRect.left;
                //     continue;
                // }
                if (lastColor) {
                    if (shaderColors.length === 0) {
                        shaderColors.push(lastColor);
                        positions.push(0);
                    }
                    shaderColors.push(lastColor);
                    positions.push(pos - posDelta);
                }
                shaderColors.push(color.color);
                positions.push(pos + posDelta);
                lastColor = color.color;
                lastColorPosX = posX;
            }
            if (shaderColors.length > 1) {
                return new LinearGradient(0, 0, width, 0, shaderColors, positions, TileMode.CLAMP);
            } else if (shaderColors.length === 1) {
                renderPaint.setColor(shaderColors[0]);
            }
        }
        return null;
    }

    @profile
    protected draw(c: Canvas, dataSet: LineDataSet) {
        const result = false;
        const drawFilled = dataSet.isDrawFilledEnabled();
        const drawLine = dataSet.getLineWidth() > 0;
        if (!drawFilled && !drawLine) {
            return result;
        }
        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());
        const linePath = this.linePath;

        this.mXBounds.set(this.mChart, dataSet, this.mAnimator);
        let points;

        switch (dataSet.getMode()) {
            default:
            case Mode.LINEAR:
            case Mode.STEPPED:
                points = this.generateLinearPath(dataSet, linePath)[0];
                break;

            case Mode.CUBIC_BEZIER:
                points = this.generateCubicPath(dataSet, linePath)[0];
                break;

            case Mode.HORIZONTAL_BEZIER:
                points = this.generateHorizontalBezierPath(dataSet, linePath)[0];
                break;
        }

        if (!points) {
            return result;
        }

        const colors = (dataSet.getColors() as any) as { color: string | Color; [k: string]: any }[];
        const nbColors = colors.length;
        const xKey = dataSet.xProperty;
        const useColorsForFill = dataSet.getUseColorsForFill();
        const renderPaint = this.renderPaint;
        let paintColorsShader;
        if (nbColors > 1) {
            paintColorsShader = this.getMultiColorsShader(colors, points, trans, dataSet, renderPaint);
        }

        let oldShader;
        if (drawFilled) {
            if (paintColorsShader && useColorsForFill) {
                oldShader = renderPaint.getShader();
                renderPaint.setShader(paintColorsShader);
            }
            const fillPath = this.fillPath;
            fillPath.reset();
            fillPath.addPath(linePath);
            const minEntryValue = getEntryXValue(dataSet.getEntryForIndex(this.mXBounds.min), xKey, this.mXBounds.min);
            const maxEntryValue = getEntryXValue(dataSet.getEntryForIndex(this.mXBounds.min + this.mXBounds.range), xKey, this.mXBounds.min + this.mXBounds.range);
            this.drawFill(c, dataSet, fillPath, trans, minEntryValue, maxEntryValue);
            if (paintColorsShader && useColorsForFill) {
                renderPaint.setShader(oldShader);
                oldShader = null;
            }
        }

        if (drawLine) {
            if (paintColorsShader) {
                oldShader = renderPaint.getShader();
                renderPaint.setShader(paintColorsShader);
            }
            // trans.pointValuesToPixel(points);
            // this.drawLines(c, points, 0,index, renderPaint);
            trans.pathValueToPixel(linePath);
            this.drawPath(c, linePath, renderPaint);
            if (paintColorsShader) {
                renderPaint.setShader(oldShader);
                oldShader = null;
            }
        }
        return result;
    }

    @profile
    drawLines(canvas: Canvas, points: number[], offest: number, length: number, paint: Paint, matrix?: Matrix) {
        if (matrix) {
            canvas.drawLines(points, offest, length, paint, matrix);
        } else {
            canvas.drawLines(points, offest, length, paint);
        }
    }

    protected drawFill(c: Canvas, dataSet: ILineDataSet, spline: Path, trans: Transformer, min: number, max: number, color?, fillMin?: number) {
        if (fillMin === undefined) {
            fillMin = dataSet.getFillFormatter().getFillLinePosition(dataSet, this.mChart);
        }
        spline.lineTo(max, fillMin);
        spline.lineTo(min, fillMin);
        spline.close();

        trans && trans.pathValueToPixel(spline);

        const drawable = dataSet.getFillDrawable();
        if (drawable != null) {
            this.drawFilledPathBitmap(c, spline, drawable, dataSet.getFillShader());
        } else {
            this.drawFilledPath(c, spline, color || dataSet.getFillColor(), dataSet.getFillAlpha(), dataSet.getFillShader());
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
        const paint = this.valuePaint;
        const customRender = this.mChart.getCustomRenderer();
        for (let j = 0; j < length; j += 2) {
            const x = points[j];
            const y = points[j + 1];

            if (!this.mViewPortHandler.isInBoundsRight(x)) break;

            if (!this.mViewPortHandler.isInBoundsLeft(x) || !this.mViewPortHandler.isInBoundsY(y)) continue;

            const index = j / 2 + this.mXBounds.min;
            const entry = dataSet.getEntryForIndex(index);
            if (!entry) continue;

            if (drawValues) {
                this.drawValue(c, formatter.getFormattedValue(entry[yKey], entry), valuesOffset.x + x, valuesOffset.y + y - valOffset, dataSet.getValueTextColor(j / 2), paint, customRender);
            }

            if (drawIcons && entry.icon != null) {
                const icon = entry.icon;
                Utils.drawIcon(c, this.mChart, icon, x + iconsOffset.x, y + iconsOffset.y);
            }
        }
    }

    public drawValues(c: Canvas) {
        const data = this.mChart.getLineData();
        const dataSets = data.getDataSets();
        if (!this.isDrawingValuesAllowed(this.mChart) || dataSets.some((d) => d.isDrawValuesEnabled() || d.isDrawIconsEnabled()) === false) {
            return;
        }

        for (let i = 0; i < dataSets.length; i++) {
            const dataSet = dataSets[i];

            if (!this.shouldDrawValues(dataSet) || dataSet.getEntryCount() < 1) continue;
            this.drawValuesForDataset(c, dataSet, i);
        }
    }

    public drawExtras(c: Canvas) {
        this.drawCircles(c);
    }

    @profile
    protected drawCirclesForDataset(c: Canvas, dataSet: LineDataSet) {
        const paint = this.circlePaintInner;
        paint.setColor(dataSet.getCircleHoleColor());
        const phaseY = this.mAnimator.getPhaseY();

        const xKey = dataSet.xProperty;
        const yKey = dataSet.yProperty;
        const trans = this.mChart.getTransformer(dataSet.getAxisDependency());

        this.mXBounds.set(this.mChart, dataSet, this.mAnimator);

        const circleRadius = dataSet.getCircleRadius();
        const circleHoleRadius = dataSet.getCircleHoleRadius();
        const drawCircleHole = dataSet.isDrawCircleHoleEnabled() && circleHoleRadius < circleRadius && circleHoleRadius > 0;
        const drawTransparentCircleHole = drawCircleHole && dataSet.getCircleHoleColor() === ColorTemplate.COLOR_NONE;

        let imageCache: DataSetImageCache;

        if (this.mImageCaches.get(dataSet)) {
            imageCache = this.mImageCaches.get(dataSet);
        } else {
            imageCache = new DataSetImageCache();
            this.mImageCaches.set(dataSet, imageCache);
        }

        const changeRequired = imageCache.init(dataSet);

        // only fill the cache with new bitmaps if a change is required
        if (changeRequired) {
            const renderPaint = this.renderPaint;
            imageCache.fill(dataSet, renderPaint, paint, drawCircleHole, drawTransparentCircleHole);
        }

        const boundsRangeCount = this.mXBounds.range + this.mXBounds.min;
        const circleBuffer = this.circlesBuffer;
        for (let j = this.mXBounds.min; j <= boundsRangeCount; j++) {
            const e = dataSet.getEntryForIndex(j);

            if (e == null) continue;

            circleBuffer[0] = getEntryXValue(e, xKey, j);
            circleBuffer[1] = e[yKey] * phaseY;

            trans.pointValuesToPixel(circleBuffer);
            // native buffer access is slow
            const cx = circleBuffer[0];
            const cy = circleBuffer[1];

            if (!this.mViewPortHandler.isInBoundsRight(cx)) break;

            if (!this.mViewPortHandler.isInBoundsLeft(cx) || !this.mViewPortHandler.isInBoundsY(cy)) continue;

            const circleBitmap = imageCache.getBitmap(j);

            if (circleBitmap != null) {
                c.drawBitmap(circleBitmap, cx - circleRadius, cy - circleRadius, null);
            }
        }
    }

    protected drawCircles(c: Canvas) {
        const dataSets = this.mChart.getLineData().getVisibleDataSets();
        if (dataSets.some((d) => d.isDrawCirclesEnabled()) === false) {
            return;
        }
        const renderPaint = this.renderPaint;
        renderPaint.setStyle(Style.FILL);
        const circleBuffer = this.circlesBuffer;
        circleBuffer[0] = 0;
        circleBuffer[1] = 0;

        for (let i = 0; i < dataSets.length; i++) {
            const dataSet = dataSets[i];

            if (!dataSet.isDrawCirclesEnabled() || dataSet.getEntryCount() === 0) continue;
            this.drawCirclesForDataset(c, dataSet);
        }
    }

    public drawHighlighted(c: Canvas, indices: Highlight[], actualDraw?: boolean) {
        const lineData = this.mChart.getLineData();

        const customRender = this.mChart.getCustomRenderer();
        const paint = this.highlightPaint;
        for (const high of indices) {
            const set = lineData.getDataSetByIndex(high.dataSetIndex);

            if (set == null || !set.isHighlightEnabled()) continue;

            const { entry, index } = lineData.getEntryAndIndexForHighlight(high);
            // let e = set.getEntryForXValue(high.x high.y);

            if (!this.isInBoundsX(entry, set)) continue;

            const xKey = set.xProperty;
            const yKey = set.yProperty;

            const pix = this.mChart.getTransformer(set.getAxisDependency()).getPixelForValues(getEntryXValue(entry, xKey, index), entry[yKey] * this.mAnimator.getPhaseY());

            high.drawX = pix.x;
            high.drawY = pix.y;
            if (!actualDraw) {
                continue;
            }
            if (customRender && customRender.drawHighlight) {
                customRender.drawHighlight(c, high, set, paint);
            } else {
                this.drawHighlightLines(c, pix.x, pix.y, set);
            }
        }
    }

    /**
     * Sets the Bitmap.Config to be used by this renderer.
     * Default: Bitmap.Config.ARGB_8888
     * Use Bitmap.Config.ARGB_4444 to consume less memory.
     *
     * @param config
     */
    // public setBitmapConfig(config) {
    //     this.mBitmapConfig = config;
    //     this.releaseBitmap();
    // }

    /**
     * Returns the Bitmap.Config that is used by this renderer.
     *
     * @return
     */
    // public getBitmapConfig() {
    //     return this.mBitmapConfig;
    // }

    /**
     * Releases the drawing bitmap. This should be called when {@link LineChart#onDetachedFromWindow()}.
     */
    public releaseBitmap() {
        if (this.mBitmapCanvas != null) {
            this.mBitmapCanvas.setBitmap(null);
            this.mBitmapCanvas = null;
        }
        if (this.mDrawBitmap != null) {
            const drawBitmap = this.mDrawBitmap.get();
            if (drawBitmap != null) {
                releaseImage(drawBitmap);
                // drawBitmap.recycle();
            }
            this.mDrawBitmap.clear();
            this.mDrawBitmap = null;
        }
    }
}
