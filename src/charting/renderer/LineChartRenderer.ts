import { Canvas, Direction, FillType, LinearGradient, Matrix, Paint, Path, Style, TileMode, TypedArray, createImage, releaseImage } from '@nativescript-community/ui-canvas';
import { Color, ImageSource, Screen, profile } from '@nativescript/core';
import { ChartAnimator } from '../animation/ChartAnimator';
import { LineChart } from '../charts';
import { Rounding } from '../data/DataSet';
import { LineDataSet, Mode } from '../data/LineDataSet';
import { Highlight } from '../highlight/Highlight';
import { ILineDataSet } from '../interfaces/datasets/ILineDataSet';
import { ColorTemplate } from '../utils/ColorTemplate';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { LineRadarRenderer } from './LineRadarRenderer';

interface XYPoint {
    x: number;
    y: number;
}
function distanceBetweenPoints(pt1: XYPoint, pt2: XYPoint) {
    return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
}
function almostEquals(x, y, epsilon) {
    return Math.abs(x - y) < epsilon;
}
function _isPointInArea(point: XYPoint, area, margin = 0.5) {
    // margin - default is to match rounded decimals

    return point && point.x > area.left - margin && point.x < area.right + margin && point.y > area.top - margin && point.y < area.bottom + margin;
}
export function splineCurve(firstPoint: XYPoint, middlePoint: XYPoint, afterPoint: XYPoint, tension: number) {
    // Props to Rob Spencer at scaled innovation for his post on splining between points
    // http://scaledinnovation.com/analytics/splines/aboutSplines.html

    // This function must also respect "skipped" points

    const previous = firstPoint;
    const current = middlePoint;
    const next = afterPoint;
    const d01 = distanceBetweenPoints(current, previous);
    const d12 = distanceBetweenPoints(next, current);

    let s01 = d01 / (d01 + d12);
    let s12 = d12 / (d01 + d12);

    // If all points are the same, s01 & s02 will be inf
    s01 = isNaN(s01) ? 0 : s01;
    s12 = isNaN(s12) ? 0 : s12;

    const fa = tension * s01; // scaling factor for triangle Ta
    const fb = tension * s12;

    return {
        previous: {
            x: current.x - fa * (next.x - previous.x),
            y: current.y - fa * (next.y - previous.y)
        },
        next: {
            x: current.x + fb * (next.x - previous.x),
            y: current.y + fb * (next.y - previous.y)
        }
    };
}
function getXYValue(dataSet, index) {
    const yKey = dataSet.yProperty;
    const entry = dataSet.getEntryForIndex(index);
    if (entry[yKey] === undefined || entry[yKey] === null) {
        return null;
    }
    return { x: dataSet.getEntryXValue(entry, index), y: entry[yKey] };
}

// fix drawing "too" thin paths on iOS

export class DataSetImageCache {
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
        const scale = set.circleHighRes ? Screen.mainScreen.scale : 1;

        for (let i = 0; i < colorCount; i++) {
            const canvas = new Canvas(Math.round(circleRadius * 2 * scale), Math.round(circleRadius * 2 * scale));
            canvas.scale(scale, scale);
            renderPaint.setColor(set.getCircleColor(i));

            if (drawTransparentCircleHole) {
                const circlePathBuffer = Utils.getTempPath();
                // Begin path for circle with hole
                circlePathBuffer.reset();
                // const oldType = circlePathBuffer.getFillType();
                circlePathBuffer.setFillType(FillType.EVEN_ODD);
                circlePathBuffer.addCircle(circleRadius, circleRadius, circleRadius, Direction.CW);

                // Cut hole in path
                circlePathBuffer.addCircle(circleRadius, circleRadius, circleHoleRadius, Direction.CCW);

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

    private mLineBuffer: TypedArray;

    protected static mFillPath: Path;
    protected get fillPath() {
        if (!LineChartRenderer.mFillPath) {
            LineChartRenderer.mFillPath = new Path();
        }
        return LineChartRenderer.mFillPath;
    }

    /**
     * cache for the circle bitmaps of all datasets
     */
    private mImageCaches = new Map<ILineDataSet, DataSetImageCache>();

    constructor(chart: LineChart, animator: ChartAnimator, viewPortHandler: ViewPortHandler) {
        super(animator, viewPortHandler);
        this.mChart = chart;
        // if (global.isAndroid) {
        //     this.mBitmapConfig = android.graphics.Bitmap.Config.ARGB_8888;
        // }
    }

    get circlePaintInner() {
        if (!this.mCirclePaintInner) {
            this.mCirclePaintInner = Utils.getTemplatePaint('white-fill');
        }
        return this.mCirclePaintInner;
    }

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

    @profile
    protected drawDataSet(c: Canvas, dataSet: LineDataSet): boolean {
        if (dataSet.getEntryCount() < 1) return false;
        const renderPaint = this.renderPaint;
        renderPaint.setStrokeWidth(dataSet.getLineWidth());
        renderPaint.setPathEffect(dataSet.getDashPathEffect());
        renderPaint.setColor(dataSet.getColor());
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
            const yKey = dataSet.yProperty;

            const firstIndex = Math.max(0, this.mXBounds.min);
            // let firstIndex = this.mXBounds.min + 1;
            const lastIndex = this.mXBounds.min + this.mXBounds.range;
            let prev = dataSet.getEntryForIndex(firstIndex);
            let prevXVal = dataSet.getEntryXValue(prev, firstIndex);
            let cur = prev;
            let curXVal = prevXVal;
            const float32arr = this.mLineBuffer;
            let index = 0;
            float32arr[index++] = prevXVal;
            float32arr[index++] = cur[yKey] * phaseY;
            // let the spline start

            for (let j = firstIndex + 1; j <= lastIndex; j++) {
                const newEntry = dataSet.getEntryForIndex(j);
                if (newEntry[yKey] === undefined || newEntry[yKey] === null) {
                    continue;
                }
                prev = cur;
                prevXVal = curXVal;
                cur = newEntry;
                curXVal = dataSet.getEntryXValue(cur, j);
                const cpx = prevXVal + (curXVal - prevXVal) / 2.0;

                float32arr[index++] = cpx;
                float32arr[index++] = prev[yKey] * phaseY;
                float32arr[index++] = cpx;
                float32arr[index++] = cur[yKey] * phaseY;
                float32arr[index++] = curXVal;
                float32arr[index++] = cur[yKey] * phaseY;
            }
            const points = Utils.pointsFromBuffer(float32arr);
            if (global.isAndroid && Utils.supportsDirectArrayBuffers()) {
                outputPath['setCubicLinesBuffer'](points, 0, index);
            } else {
                outputPath.setCubicLines(points as number[], 0, index);
            }
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

            // Take an extra polet from the left, and an extra from the right.
            // That's because we need 4 points for a cubic bezier (cubic=4), otherwise we get lines moving and doing weird stuff on the edges of the chart.
            // So in the starting `prev` and `cur`, go -2, -1
            // And in the `lastIndex`, add +1

            const firstIndex = Math.max(0, this.mXBounds.min);
            // let firstIndex = this.mXBounds.min + 1;
            const lastIndex = this.mXBounds.min + this.mXBounds.range;

            const float32arr = this.mLineBuffer;
            let index = 0;
            let nextIndex = -1;
            let next: XYPoint;
            let controlPoints;
            let point: XYPoint;
            let prev: XYPoint;
            let prevControlPoints;
            for (let j = firstIndex; j <= lastIndex; j++) {
                point = getXYValue(dataSet, j);
                if (!point) {
                    if (j === 0) {
                        return [];
                    }
                    continue;
                }
                if (!prev) {
                    prev = point;
                }
                nextIndex = j + 1 < dataSet.getEntryCount() ? j + 1 : j;
                next = getXYValue(dataSet, nextIndex);
                if (!next) {
                    continue;
                }
                controlPoints = splineCurve(prev, point, next, intensity);
                if (j === 0) {
                    float32arr[index++] = point.x;
                    float32arr[index++] = point.y * phaseY;
                } else {
                    float32arr[index++] = prevControlPoints.next.x;
                    float32arr[index++] = prevControlPoints.next.y * phaseY;
                    float32arr[index++] = controlPoints.previous.x;
                    float32arr[index++] = controlPoints.previous.y * phaseY;
                    float32arr[index++] = point.x;
                    float32arr[index++] = point.y * phaseY;
                }

                prevControlPoints = controlPoints;
                prev = point;
            }
            const points = Utils.pointsFromBuffer(float32arr);
            if (global.isAndroid && Utils.supportsDirectArrayBuffers()) {
                outputPath['setCubicLinesBuffer'](points, 0, index);
            } else {
                outputPath.setCubicLines(points as number[], 0, index);
            }
            return [points, index];
        } else {
            outputPath.reset();
            return [];
        }
    }

    @profile
    generateLinearPath(dataSet: ILineDataSet, outputPath: Path) {
        if (this.mXBounds.range >= 1) {
            const isDrawSteppedEnabled = dataSet.getMode() === Mode.STEPPED;
            const entryCount = dataSet.getEntryCount();
            const pointsPerEntryPair = isDrawSteppedEnabled ? 4 : 2;
            if (!this.mLineBuffer || this.mLineBuffer.length < Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2) {
                this.mLineBuffer = Utils.createArrayBuffer(Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2);
            }
            const phaseY = this.mAnimator.getPhaseY();
            const yKey = dataSet.yProperty;

            // const filled = outputPath;
            // outputPath.reset();

            const firstIndex = Math.max(0, this.mXBounds.min);
            const lastIndex = this.mXBounds.min + this.mXBounds.range;
            const entry = dataSet.getEntryForIndex(firstIndex);
            const entryXVal = dataSet.getEntryXValue(entry, firstIndex);

            const float32arr = this.mLineBuffer;
            float32arr[0] = entryXVal;
            float32arr[1] = entry[yKey] * phaseY;
            let index = 2;
            // create a new path
            let currentEntry = null;
            let currentEntryXVal;
            let currentEntryYVal;
            let previousEntryYVal;
            // doing the if test outside is much much faster on big data
            if (isDrawSteppedEnabled) {
                for (let x = firstIndex + 1; x <= lastIndex; x++) {
                    currentEntry = dataSet.getEntryForIndex(x);
                    currentEntryXVal = dataSet.getEntryXValue(currentEntry, x);
                    currentEntryYVal = currentEntry[yKey];
                    if (currentEntryYVal === undefined || currentEntryYVal === null) {
                        continue;
                    }
                    float32arr[index++] = currentEntryXVal;
                    float32arr[index++] = previousEntryYVal * phaseY;
                    float32arr[index++] = currentEntryXVal;
                    float32arr[index++] = currentEntryYVal * phaseY;

                    previousEntryYVal = currentEntryYVal;
                }
            } else {
                for (let x = firstIndex + 1; x <= lastIndex; x++) {
                    currentEntry = dataSet.getEntryForIndex(x);
                    currentEntryXVal = dataSet.getEntryXValue(currentEntry, x);
                    currentEntryYVal = currentEntry[yKey];
                    if (currentEntryYVal === undefined || currentEntryYVal === null) {
                        continue;
                    }
                    float32arr[index++] = currentEntryXVal;
                    float32arr[index++] = currentEntryYVal * phaseY;

                    previousEntryYVal = currentEntryYVal;
                }
            }
            const points = Utils.pointsFromBuffer(float32arr);
            if (global.isAndroid && Utils.supportsDirectArrayBuffers()) {
                outputPath['setLinesBuffer'](points, 0, index);
            } else {
                outputPath.setLines(points as number[], 0, index);
            }
            return [points, index];
        } else {
            outputPath.reset();
            return [];
        }
    }

    getMultiColorsShader(colors: { color: string | Color; [k: string]: any }[], points, trans: Transformer, dataSet: LineDataSet) {
        const nbColors = colors.length;
        const xKey = dataSet.xProperty;
        if (nbColors > 0) {
            trans.pointValuesToPixel(points);
            const shaderColors = [];
            const positions = [];
            const firstIndex = Math.max(0, this.mXBounds.min);
            const range = this.mXBounds.range;
            const lastIndex = firstIndex + range;
            const width = this.mViewPortHandler.getChartWidth();
            const chartRect = this.mViewPortHandler.getChartRect();
            let lastColor;

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
                        colorIndex = dataSet.getEntryIndexForXValue(dataSet.getEntryXValue(entry, colorIndex), NaN, Rounding.CLOSEST);
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
                        shaderColors.push(lastColor);
                        positions.push(1);
                    }
                    break;
                }
                const posX = Math.floor(points[(colorIndex - firstIndex) * 2]);
                const pos = (posX - chartRect.left) / width;
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
            }
            if (shaderColors.length === 0) {
                shaderColors.push(colors[0].color);
                positions.push(0);
            }
            if (shaderColors.length === 1) {
                shaderColors.push(colors[0].color);
                positions.push(1);
            }
            return new LinearGradient(0, 0, width, 0, shaderColors, positions, TileMode.CLAMP);
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
        const linePath = Utils.getTempPath();

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

        const colors = dataSet.getColors() as any as { color: string | Color; [k: string]: any }[];
        const nbColors = colors.length;
        const renderPaint = this.renderPaint;
        let paintColorsShader;
        if (nbColors > 0) {
            // TODO: we transforms points in there. Could be dangerous if used after
            paintColorsShader = this.getMultiColorsShader(colors, points, trans, dataSet);
        }

        let oldShader;
        if (drawFilled) {
            const useColorsForFill = dataSet.getUseColorsForFill();
            if (paintColorsShader && useColorsForFill) {
                oldShader = renderPaint.getShader();
                renderPaint.setShader(paintColorsShader);
            }
            const fillPath = this.fillPath;
            fillPath.reset();
            fillPath.addPath(linePath);
            const minEntryValue = dataSet.getEntryXValue(dataSet.getEntryForIndex(this.mXBounds.min), this.mXBounds.min);
            const maxEntryValue = dataSet.getEntryXValue(dataSet.getEntryForIndex(this.mXBounds.min + this.mXBounds.range), this.mXBounds.min + this.mXBounds.range);
            this.drawFill(c, dataSet, fillPath, trans, minEntryValue, maxEntryValue);
            if (paintColorsShader && useColorsForFill) {
                renderPaint.setShader(oldShader);
                oldShader = null;
            }
        }

        if (drawLine) {
            const useColorsForLine = dataSet.useColorsForLine;
            if (paintColorsShader && useColorsForLine) {
                oldShader = renderPaint.getShader();
                renderPaint.setShader(paintColorsShader);
            }
            trans.pathValueToPixel(linePath);
            this.drawPath(c, linePath, renderPaint);
            if (paintColorsShader && useColorsForLine) {
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
        const circleBuffer = Utils.getTempArray(2);
        const destRect = Utils.getTempRectF();
        for (let j = this.mXBounds.min; j <= boundsRangeCount; j++) {
            const e = dataSet.getEntryForIndex(j);

            if (e == null) continue;
            const yVal = e[yKey];
            if (yVal == null || yVal === undefined) continue;
            circleBuffer[0] = dataSet.getEntryXValue(e, j);
            circleBuffer[1] = yVal * phaseY;

            trans.pointValuesToPixel(circleBuffer);
            // native buffer access is slow
            const cx = circleBuffer[0];
            const cy = circleBuffer[1];

            if (!this.mViewPortHandler.isInBoundsRight(cx)) break;

            if (!this.mViewPortHandler.isInBoundsLeft(cx) || !this.mViewPortHandler.isInBoundsY(cy)) continue;

            const circleBitmap = imageCache.getBitmap(j);

            if (circleBitmap != null) {
                destRect.set(cx - circleRadius, cy - circleRadius, cx - circleRadius + 2 * circleRadius, cy - circleRadius + 2 * circleRadius);
                c.drawBitmap(circleBitmap, null, destRect, null);
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
        const circleBuffer = Utils.getTempArray(2);
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

            const yKey = set.yProperty;

            const pix = this.mChart.getTransformer(set.getAxisDependency()).getPixelForValues(set.getEntryXValue(entry, index), entry[yKey] * this.mAnimator.getPhaseY());

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
            }
            this.mDrawBitmap.clear();
            this.mDrawBitmap = null;
        }
    }
}
