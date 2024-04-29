import { TypedArray } from '@nativescript-community/arraybuffers';
import { Canvas, Direction, FillType, LinearGradient, Matrix, Paint, Path, Style, TileMode, createImage, releaseImage } from '@nativescript-community/ui-canvas';
import { Color, ImageSource, Screen, profile } from '@nativescript/core';
import { ChartAnimator } from '../animation/ChartAnimator';
import { LineChart } from '..';
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
    const yVal = entry[yKey];
    if (yVal === undefined || yVal === null) {
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
        const size = set.circleColors.length || 1;
        let changeRequired = false;

        if (!this.circleBitmaps) {
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
        const colorCount = set.circleColors.length || 1;
        const circleRadius = set.circleRadius;
        const circleHoleRadius = set.circleHoleRadius;
        const scale = set.circleHighRes ? Screen.mainScreen.scale : 1;

        for (let i = 0; i < colorCount; i++) {
            const canvas = new Canvas(Math.round(circleRadius * 2 * scale), Math.round(circleRadius * 2 * scale));
            canvas.scale(scale, scale);
            renderPaint.setColor(set.circleColors[i] || set.color);

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
        // if (__ANDROID__) {
        //     this.mBitmapConfig = android.graphics.Bitmap.Config.ARGB_8888;
        // }
    }

    get circlePaintInner() {
        if (!this.mCirclePaintInner) {
            this.mCirclePaintInner = Utils.getTemplatePaint('white-fill');
        }
        return this.mCirclePaintInner;
    }

    public drawData(c: Canvas) {
        const width = this.mViewPortHandler.chartWidth;
        const height = this.mViewPortHandler.chartHeight;

        let drawBitmap = this.mDrawBitmap?.get();

        if (!drawBitmap || drawBitmap.width !== width || drawBitmap.height !== height) {
            if (width > 0 && height > 0) {
                this.mBitmapCanvas = new Canvas(width, height);
                drawBitmap = this.mBitmapCanvas.getImage();
                this.mDrawBitmap = new WeakRef(drawBitmap);
            } else return;
        } else {
            this.mBitmapCanvas.clear();
        }

        const lineData = this.mChart.lineData;
        let needsBitmapDrawing = false;
        for (const set of lineData.visibleDataSets) {
            needsBitmapDrawing = this.drawDataSet(c, set) || needsBitmapDrawing;
        }
        if (needsBitmapDrawing) {
            const renderPaint = this.renderPaint;
            c.drawBitmap(drawBitmap, 0, 0, renderPaint);
        }
    }

    protected drawDataSet(c: Canvas, dataSet: LineDataSet): boolean {
        if (dataSet.entryCount < 1) return false;
        const renderPaint = this.renderPaint;
        renderPaint.setStrokeWidth(dataSet.lineWidth);
        if (dataSet.dashPathEffect) {
            renderPaint.setPathEffect(dataSet.dashPathEffect);
        }
        if (dataSet.shader) {
            renderPaint.setShader(dataSet.shader);
        }
        renderPaint.setColor(dataSet.getColor());
        renderPaint.setStyle(Style.STROKE);

        const scaleX = this.mViewPortHandler.getScaleX();
        dataSet.applyFiltering(scaleX);
        const result = this.draw(c, dataSet);
        if (dataSet.dashPathEffect) {
            renderPaint.setPathEffect(null);
        }
        if (dataSet.shader) {
            renderPaint.setShader(null);
        }
        return result;
    }

    generateHorizontalBezierPath(dataSet: ILineDataSet, outputPath: Path) {
        if (this.mXBounds.range >= 1) {
            const pointsPerEntryPair = 6;
            const entryCount = dataSet.entryCount;
            if (!this.mLineBuffer || this.mLineBuffer.length < Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2) {
                this.mLineBuffer = Utils.createArrayBuffer(Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2);
            }

            const phaseY = this.animator.phaseY;
            const yKey = dataSet.yProperty;

            let firstIndex = Math.max(0, this.mXBounds.min);
            // let firstIndex = this.mXBounds.min + 1;
            const lastIndex = this.mXBounds.min + this.mXBounds.range;
            let prev = dataSet.getEntryForIndex(firstIndex);
            let yVal = prev[yKey];
            while (firstIndex < lastIndex && (yVal === undefined || yVal === null)) {
                firstIndex++;
                prev = dataSet.getEntryForIndex(firstIndex);
                yVal = prev[yKey];
            }
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
                const yVal = newEntry[yKey];
                if (yVal === undefined || yVal === null) {
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
            if (__ANDROID__ && Utils.supportsDirectArrayBuffers()) {
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

    generateCubicPath(dataSet: ILineDataSet, outputPath: Path) {
        if (this.mXBounds.range >= 1) {
            const pointsPerEntryPair = 6;
            const entryCount = dataSet.entryCount;
            if (!this.mLineBuffer || this.mLineBuffer.length < Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2) {
                this.mLineBuffer = Utils.createArrayBuffer(Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2);
            }
            const phaseY = this.animator.phaseY;
            const xKey = dataSet.xProperty;
            const yKey = dataSet.yProperty;
            const intensity = dataSet.cubicIntensity;

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
                    // if (j === 0) {
                    //     return [];
                    // }
                    continue;
                }
                if (!prev) {
                    prev = point;
                }
                nextIndex = j + 1 < dataSet.entryCount ? j + 1 : j;
                next = getXYValue(dataSet, nextIndex);
                if (!next) {
                    continue;
                }
                controlPoints = splineCurve(prev, point, next, intensity);
                if (j === firstIndex) {
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
            if (__ANDROID__ && Utils.supportsDirectArrayBuffers()) {
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

    generateLinearPath(dataSet: ILineDataSet, outputPath: Path) {
        if (this.mXBounds.range >= 1) {
            const isDrawSteppedEnabled = dataSet.mode === Mode.STEPPED;
            const entryCount = dataSet.entryCount;
            const pointsPerEntryPair = isDrawSteppedEnabled ? 4 : 2;
            if (!this.mLineBuffer || this.mLineBuffer.length < Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2) {
                this.mLineBuffer = Utils.createArrayBuffer(Math.max(entryCount * pointsPerEntryPair, pointsPerEntryPair) * 2);
            }
            const phaseX = this.animator.phaseX;
            const phaseY = this.animator.phaseY;
            const yKey = dataSet.yProperty;

            // const filled = outputPath;
            // outputPath.reset();

            let firstIndex = Math.max(0, this.mXBounds.min);
            const lastIndex = this.mXBounds.min + this.mXBounds.range;
            let firstEntry = dataSet.getEntryForIndex(firstIndex);
            let entryXVal = dataSet.getEntryXValue(firstEntry, firstIndex);
            let yVal = firstEntry[yKey];
            while (firstIndex < lastIndex && (yVal === undefined || yVal === null)) {
                firstIndex++;
                firstEntry = dataSet.getEntryForIndex(firstIndex);
                entryXVal = dataSet.getEntryXValue(firstEntry, firstIndex);
                yVal = firstEntry[yKey];
            }
            const float32arr = this.mLineBuffer;
            float32arr[0] = entryXVal;
            float32arr[1] = firstEntry[yKey] * phaseY;
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
            if (__ANDROID__ && Utils.supportsDirectArrayBuffers()) {
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
            const width = this.mViewPortHandler.chartWidth;
            const chartRect = this.mViewPortHandler.chartRect;
            let lastColor;

            const gradientDelta = 0;
            const posDelta = gradientDelta / width;
            for (let index = 0; index < nbColors; index++) {
                const color = colors[index] as { color: string | Color; [k: string]: any };
                let colorIndex = color[xKey || 'index'] as number;
                // if filtered we need to get the real index
                if ((dataSet as any).isFiltered()) {
                    dataSet.ignoreFiltered = true;
                    const entry = dataSet.getEntryForIndex(colorIndex);
                    dataSet.ignoreFiltered = false;
                    if (entry) {
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

    lastLinePath: Path;
    protected draw(c: Canvas, dataSet: LineDataSet) {
        const result = false;
        const drawFilled = dataSet.drawFilledEnabled;
        const drawLine = dataSet.lineWidth > 0;
        if (!drawFilled && !drawLine) {
            return result;
        }
        const trans = this.mChart.getTransformer(dataSet.axisDependency);
        const linePath = Utils.getTempPath();

        this.mXBounds.set(this.mChart, dataSet, this.animator);
        let points;
        switch (dataSet.mode) {
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

        const colors = dataSet.colors || [dataSet.color];
        const nbColors = colors.length;
        const renderPaint = this.renderPaint;
        let paintColorsShader;
        if (nbColors > 1) {
            // TODO: we transforms points in there. Could be dangerous if used after
            paintColorsShader = this.getMultiColorsShader(colors as any, points, trans, dataSet);
        }

        let oldShader;
        if (drawFilled) {
            const useColorsForFill = dataSet.useColorsForFill;
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
            this.lastLinePath = linePath;
            if (paintColorsShader && useColorsForFill) {
                renderPaint.setShader(oldShader);
                oldShader = null;
            }
        }
        const customRender = this.mChart.customRenderer;

        if (drawLine) {
            const useColorsForLine = dataSet.useColorsForLine;
            if (paintColorsShader && useColorsForLine) {
                oldShader = renderPaint.getShader();
                renderPaint.setShader(paintColorsShader);
            }
            trans.pathValueToPixel(linePath);
            if (customRender?.drawLine) {
                customRender.drawLine(c, linePath, renderPaint);
            } else {
                this.drawPath(c, linePath, renderPaint);
            }
            if (paintColorsShader && useColorsForLine) {
                renderPaint.setShader(oldShader);
                oldShader = null;
            }
        }
        return result;
    }

    drawLines(canvas: Canvas, points: number[], offest: number, length: number, paint: Paint, matrix?: Matrix) {
        if (matrix) {
            canvas.drawLines(points, offest, length, paint, matrix);
        } else {
            canvas.drawLines(points, offest, length, paint);
        }
    }

    protected drawFill(c: Canvas, dataSet: ILineDataSet, spline: Path, trans: Transformer, min: number, max: number, color?, fillMin?: number) {
        const fillFormatter = dataSet.fillFormatter;
        if (fillFormatter.getFillLinePath) {
            fillFormatter.getFillLinePath(dataSet, this.mChart, spline, this.lastLinePath);
        } else if (fillMin === undefined) {
            fillMin = fillFormatter.getFillLinePosition(dataSet, this.mChart);
            spline.lineTo(max, fillMin);
            spline.lineTo(min, fillMin);
            spline.close();
        }

        trans && trans.pathValueToPixel(spline);

        const drawable = dataSet.fillDrawable;
        if (drawable) {
            this.drawFilledPathBitmap(c, spline, drawable, dataSet.fillShader);
        } else {
            this.drawFilledPath(c, spline, color || dataSet.fillColor, dataSet.fillAlpha, dataSet.fillShader);
        }
    }

    public drawValuesForDataset(c: Canvas, dataSet: LineDataSet, dataSetIndex: number) {
        const yKey = dataSet.yProperty;
        // apply the text-styling defined by the DataSet
        this.applyValueTextStyle(dataSet);
        const chart = this.mChart;
        const trans = chart.getTransformer(dataSet.axisDependency);

        // make sure the values do not interfear with the circles
        let valOffset = dataSet.circleRadius * 1.75;

        if (!dataSet.drawCirclesEnabled) valOffset = valOffset / 2;

        this.mXBounds.set(chart, dataSet, this.animator);

        const { points, count } = trans.generateTransformedValues(dataSet, this.animator.phaseX, this.animator.phaseY, this.mXBounds.min, this.mXBounds.max);
        const formatter = dataSet.valueFormatter;

        const iconsOffset = dataSet.iconsOffset;
        const valuesOffset = dataSet.valuesOffset;
        const drawIcons = dataSet.drawIconsEnabled;
        const drawValues = dataSet.drawValuesEnabled;
        const length = count;
        const paint = this.valuePaint;
        const customRender = chart.customRenderer;
        for (let j = 0; j < length; j += 2) {
            const x = points[j];
            const y = points[j + 1];

            if (!this.mViewPortHandler.isInBoundsRight(x)) break;

            if (!this.mViewPortHandler.isInBoundsLeft(x) || !this.mViewPortHandler.isInBoundsY(y)) continue;

            const index = j / 2 + this.mXBounds.min;
            const entry = dataSet.getEntryForIndex(index);
            if (!entry) continue;
            const yVal = entry[yKey];
            if (yVal === undefined || yVal === null) {
                continue;
            }
            if (drawValues) {
                this.drawValue(
                    c,
                    chart,
                    dataSet,
                    dataSetIndex,
                    entry,
                    index,
                    formatter.getFormattedValue(yVal, entry),
                    valuesOffset.x + x,
                    valuesOffset.y + y - valOffset,
                    dataSet.getValueTextColor(j / 2),
                    paint,
                    customRender
                );
            }

            if (drawIcons) {
                this.drawIcon(c, chart, dataSet, dataSetIndex, entry, index, dataSet.getEntryIcon(entry), x + iconsOffset.x, y + iconsOffset.y, customRender);
            }
        }
    }

    public drawValues(c: Canvas) {
        const data = this.mChart.lineData;
        const dataSets = data.dataSets;
        if (!this.isDrawingValuesAllowed(this.mChart) || dataSets.some((d) => d.drawValuesEnabled || d.drawIconsEnabled) === false) {
            return;
        }

        for (let i = 0; i < dataSets.length; i++) {
            const dataSet = dataSets[i];

            if (!this.shouldDrawValues(dataSet) || dataSet.entryCount < 1) continue;
            this.drawValuesForDataset(c, dataSet, i);
        }
    }

    public drawExtras(c: Canvas) {
        this.drawCircles(c);
    }

    protected drawCirclesForDataset(c: Canvas, dataSet: LineDataSet) {
        const paint = this.circlePaintInner;
        paint.setColor(dataSet.circleHoleColor);
        const phaseY = this.animator.phaseY;

        const yKey = dataSet.yProperty;
        const trans = this.mChart.getTransformer(dataSet.axisDependency);

        this.mXBounds.set(this.mChart, dataSet, this.animator);

        const circleRadius = dataSet.circleRadius;
        const circleHoleRadius = dataSet.circleHoleRadius;
        const drawCircleHole = dataSet.drawCircleHoleEnabled && circleHoleRadius < circleRadius && circleHoleRadius > 0;
        const drawTransparentCircleHole = drawCircleHole && dataSet.circleHoleColor === ColorTemplate.COLOR_NONE;

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

            if (!e) continue;
            const yVal = e[yKey];
            if (yVal === null || yVal === undefined) continue;
            circleBuffer[0] = dataSet.getEntryXValue(e, j);
            circleBuffer[1] = yVal * phaseY;

            trans.pointValuesToPixel(circleBuffer);
            // native buffer access is slow
            const cx = circleBuffer[0];
            const cy = circleBuffer[1];

            if (!this.mViewPortHandler.isInBoundsRight(cx)) break;

            if (!this.mViewPortHandler.isInBoundsLeft(cx) || !this.mViewPortHandler.isInBoundsY(cy)) continue;

            const circleBitmap = imageCache.getBitmap(j);

            if (circleBitmap) {
                destRect.set(cx - circleRadius, cy - circleRadius, cx - circleRadius + 2 * circleRadius, cy - circleRadius + 2 * circleRadius);
                c.drawBitmap(circleBitmap, null, destRect, null);
            }
        }
    }

    protected drawCircles(c: Canvas) {
        const dataSets = this.mChart.lineData.visibleDataSets;
        if (dataSets.some((d) => d.drawCirclesEnabled) === false) {
            return;
        }
        const renderPaint = this.renderPaint;
        renderPaint.setStyle(Style.FILL);
        const circleBuffer = Utils.getTempArray(2);
        circleBuffer[0] = 0;
        circleBuffer[1] = 0;

        for (let i = 0; i < dataSets.length; i++) {
            const dataSet = dataSets[i];

            if (!dataSet.drawCirclesEnabled || dataSet.entryCount === 0) continue;
            this.drawCirclesForDataset(c, dataSet);
        }
    }

    public drawHighlighted(c: Canvas, indices: Highlight[], actualDraw: boolean = true) {
        const lineData = this.mChart.lineData;

        const customRender = this.mChart.customRenderer;
        const paint = this.highlightPaint;
        for (const high of indices) {
            const set = lineData.getDataSetByIndex(high.dataSetIndex);

            if (!set || !set.highlightEnabled) continue;

            const { entry, index } = lineData.getEntryAndIndexForHighlight(high);
            // let e = set.getEntryForXValue(high.x high.y);

            if (!this.isInBoundsX(entry, set)) continue;

            const yKey = set.yProperty;

            const pix = this.mChart.getTransformer(set.axisDependency).getPixelForValues(set.getEntryXValue(entry, index), entry[yKey] * this.animator.phaseY);

            high.drawX = pix.x;
            high.drawY = pix.y;
            if (!actualDraw) {
                continue;
            }
            if (customRender && customRender.drawHighlight) {
                customRender.drawHighlight(c, high, set, paint);
            } else {
                this.drawHighlightLines(c, high.drawX, high.drawY, set);
            }
        }
    }

    /**
     * Releases the drawing bitmap. This should be called when {@link LineChart#onDetachedFromWindow()}.
     */
    public releaseBitmap() {
        if (this.mBitmapCanvas) {
            this.mBitmapCanvas.setBitmap(null);
            this.mBitmapCanvas = null;
        }
        if (this.mDrawBitmap) {
            const drawBitmap = this.mDrawBitmap.get();
            if (drawBitmap) {
                releaseImage(drawBitmap);
            }
            this.mDrawBitmap = null;
        }
    }
}
