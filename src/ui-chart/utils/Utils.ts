import {
    TypedArray,
    arrayToNativeArray as arrayToNativeArrayFn,
    createArrayBuffer as createArrayBufferFn,
    createArrayBufferOrNativeArray as createArrayBufferOrNativeArrayFn,
    createNativeArray as createNativeArrayFn,
    nativeArrayToArray as nativeArrayToArrayFn,
    pointsFromBuffer as pointsFromBufferFn,
    supportsDirectArrayBuffers as supportsDirectArrayBuffersFn
} from '@nativescript-community/arraybuffers';
import { Align, Canvas, FontMetrics, LayoutAlignment, Matrix, Paint, Path, Rect, RectF, StaticLayout, Style } from '@nativescript-community/ui-canvas';
import { ImageSource, ObservableArray, Trace } from '@nativescript/core';
import { Screen } from '@nativescript/core/platform';
import { DefaultValueFormatter } from '../formatter/DefaultValueFormatter';
import { ValueFormatter } from '../formatter/ValueFormatter';
import { MPPointF } from './MPPointF';
import { MPSize } from './MPSize';

export const ChartTraceCategory = 'NativescriptChart';

export enum CLogTypes {
    log = Trace.messageType.log,
    info = Trace.messageType.info,
    warning = Trace.messageType.warn,
    error = Trace.messageType.error
}

export const CLog = (type: CLogTypes, ...args) => {
    Trace.write(args.map((a) => (a && typeof a === 'object' ? JSON.stringify(a) : a)).join(' '), ChartTraceCategory, type);
};

let SDK_INT = -1;
function getSDK() {
    if (SDK_INT === -1) {
        SDK_INT = android.os.Build.VERSION.SDK_INT;
    }
    return SDK_INT;
}
/**
 * Utilities class that has some helper methods. Needs to be initialized by
 * calling Utils.init(...) before usage. Inside the Chart.init() method, this is
 * done, if the Utils are used before that, Utils.init(...) needs to be called
 * manually.
 *

 */
export namespace Utils {
    // const mainScreen = screen.mainScreen;
    export const density = Screen.mainScreen.scale;
    //    const mMetrics;
    // const mMinimumFlingVelocity = 50;
    // const mMaximumFlingVelocity = 8000;
    // const DOUBLE_EPSILON = Number.EPSILON;

    export const DEG2RAD = Math.PI / 180.0;
    export const RAD2DEG = 180.0 / Math.PI;
    export const NUMBER_EPSILON = Number.EPSILON;

    const mDrawTextRectBuffer = new Rect(0, 0, 0, 0);
    const mCalcTextHeightRect = new Rect(0, 0, 0, 0);
    const mFontMetricsBuffer = new FontMetrics();
    const mCalcTextSizeRect = new Rect(0, 0, 0, 0);

    const mDefaultValueFormatter: ValueFormatter = generateDefaultValueFormatter();

    /**
     * Math.pow(...) is very expensive, so avoid calling it and create it
     * yourself.
     */
    const POW_10 = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000];

    const EPSILON = Math.pow(2, -52);
    const MAX_VALUE = (2 - EPSILON) * Math.pow(2, 1023);
    const MIN_VALUE = Math.pow(2, -1022);

    /**
     * initialize method, called inside the Chart.init() method.
     *
     * @param context
     */
    export function init() {}

    /**
     * This method converts dp unit to equivalent pixels, depending on device
     * density. NEEDS UTILS TO BE INITIALIZED BEFORE USAGE.
     *
     * @param dp A value in dp (density independent pixels) unit. Which we need
     *           to convert into pixels
     * @return A let value to represent px equivalent to dp depending on
     * device density
     */
    export function convertDpToPixel(dp) {
        return dp * density;
        // return dp;
    }

    /**
     * This method converts device specific pixels to density independent
     * pixels. NEEDS UTILS TO BE INITIALIZED BEFORE USAGE.
     *
     * @param px A value in px (pixels) unit. Which we need to convert into db
     * @return A let value to represent dp equivalent to px value
     */
    export function convertPixelsToDp(px) {
        return px;
        // return px / density;
    }

    /**
     * calculates the approximate width of a text, depending on a demo text
     * avoid repeated calls (e.g. inside drawing methods)
     *
     * @param paint
     * @param demoText
     * @return
     */
    export function calcTextWidth(paint: Paint, demoText: string) {
        return paint.measureText(demoText);
    }

    /**
     * calculates the approximate height of a text, depending on a demo text
     * avoid repeated calls (e.g. inside drawing methods)
     *
     * @param paint
     * @param demoText
     * @return
     */
    export function calcTextHeight(paint: Paint, demoText: string) {
        mCalcTextHeightRect.set(0, 0, 0, 0);
        paint.getTextBounds(demoText, 0, demoText.length, mCalcTextHeightRect);
        return mCalcTextHeightRect.height();
    }
    export function getLineHeightFromMetrics(fontMetrics: FontMetrics) {
        return fontMetrics.descent - fontMetrics.ascent;
    }
    export function getLineHeight(paint: Paint, fontMetrics = mFontMetricsBuffer) {
        paint.getFontMetrics(fontMetrics);
        return getLineHeightFromMetrics(fontMetrics);
    }

    export function getLineSpacingFromMetrics(fontMetrics: FontMetrics) {
        return fontMetrics.ascent - fontMetrics.top + fontMetrics.bottom;
    }
    export function getLineSpacing(paint: Paint, fontMetrics = mFontMetricsBuffer) {
        paint.getFontMetrics(fontMetrics);
        return getLineSpacingFromMetrics(fontMetrics);
    }

    /**
     * calculates the approximate size of a text, depending on a demo text
     * avoid repeated calls (e.g. inside drawing methods)
     *
     * @param paint
     * @param demoText
     * @param outputFSize An output variable, modified by the function.
     */
    export function calcTextSize(paint: Paint, demoText) {
        const r = mCalcTextSizeRect;
        r.set(0, 0, 0, 0);
        paint.getTextBounds(demoText, 0, demoText.length, r);
        return {
            width: r.width(),
            height: r.height()
        };
    }

    export function generateDefaultValueFormatter() {
        return new DefaultValueFormatter(1);
    }

    /// - returns: The default value formatter used for all chart components that needs a default
    export function getDefaultValueFormatter() {
        return mDefaultValueFormatter;
    }

    /**
     * Formats the given number to the given number of decimals, and returns the
     * number as a string, maximum 35 characters.
     *
     * @param number
     * @param digitCount
     * @param separateThousands set this to true to separate thousands values
     * @param separateChar      a caracter to be paced between the "thousands"
     * @return
     */
    export function formatNumber(number, digitCount, separateThousands, separateChar = '.') {
        const out = [];

        let neg = false;
        if (number === 0) {
            return '0';
        }

        let zero = false;
        if (number < 1 && number > -1) {
            zero = true;
        }

        if (number < 0) {
            neg = true;
            number = -number;
        }

        if (digitCount > POW_10.length) {
            digitCount = POW_10.length - 1;
        }

        number *= POW_10[digitCount];
        let lval = Math.round(number);
        let ind = out.length - 1;
        let charCount = 0;
        let decimalPointAdded = false;

        while (lval !== 0 || charCount < digitCount + 1) {
            const digit = lval % 10;
            lval = lval / 10;
            out[ind--] = digit + '0';
            charCount++;

            // add decimal point
            if (charCount === digitCount) {
                out[ind--] = ',';
                charCount++;
                decimalPointAdded = true;

                // add thousand separators
            } else if (separateThousands && lval !== 0 && charCount > digitCount) {
                if (decimalPointAdded) {
                    if ((charCount - digitCount) % 4 === 0) {
                        out[ind--] = separateChar;
                        charCount++;
                    }
                } else {
                    if ((charCount - digitCount) % 4 === 3) {
                        out[ind--] = separateChar;
                        charCount++;
                    }
                }
            }
        }

        // if number around zero (between 1 and -1)
        if (zero) {
            out[ind--] = '0';
            charCount += 1;
        }

        // if the number is negative
        if (neg) {
            out[ind--] = '-';
            charCount += 1;
        }

        const start = out.length - charCount;
        return out.slice(out.length - start).join('');
    }

    /**
     * rounds the given number to the next significant number
     *
     * @param number
     * @return
     */
    export function roundToNextSignificant(number) {
        if (!Number.isFinite(number) || isNaN(number) || number === 0.0) return 0;

        const d = Math.ceil(Math.log10(number < 0 ? -number : number));
        const pw = 1 - d;
        const magnitude = Math.pow(10, pw);
        const shifted = Math.round(number * magnitude);
        return shifted / magnitude;
    }

    /**
     * Returns the appropriate number of decimals to be used for the provided
     * number.
     *
     * @param number
     * @return
     */
    export function getDecimals(number) {
        const i = roundToNextSignificant(number);
        if (!Number.isFinite(i) || i === 0) return 0;
        return Math.ceil(-Math.log10(i)) + 2;
    }

    /**
     * Replacement for the Math.nextUp(...) method that is only available in
     * HONEYCOMB and higher. Dat's some seeeeek sheeet.
     *
     * @param d
     * @return
     */
    export function nextUp(x) {
        if (x !== x) {
            return x;
        }
        if (x === -1 / 0) {
            return -MAX_VALUE;
        }
        if (x === +1 / 0) {
            return +1 / 0;
        }
        if (x === +MAX_VALUE) {
            return +1 / 0;
        }
        let y = x * (x < 0 ? 1 - EPSILON / 2 : 1 + EPSILON);
        if (y === x) {
            y = MIN_VALUE * EPSILON > 0 ? x + MIN_VALUE * EPSILON : x + MIN_VALUE;
        }
        if (y === +1 / 0) {
            y = +MAX_VALUE;
        }
        const b = x + (y - x) / 2;
        if (x < b && b < y) {
            y = b;
        }
        const c = (y + x) / 2;
        if (x < c && c < y) {
            y = c;
        }
        return y === 0 ? -0 : y;
    }
    export function toRadians(degrees) {
        const pi = Math.PI;
        return degrees * (pi / 180);
    }
    /**
     * Returns a recyclable MPPointF instance.
     * Calculates the position around a center point, depending on the distance
     * from the center, and the angle of the position around the center.
     *
     * @param center
     * @param dist
     * @param angle  in degrees, converted to radians internally
     * @return
     */
    export function getPosition(center, dist, angle, outputPoint?) {
        if (outputPoint) {
            outputPoint.x = center.x + dist * Math.cos(toRadians(angle));
            outputPoint.y = center.y + dist * Math.sin(toRadians(angle));
            return outputPoint;
        }
        return {
            x: center.x + dist * Math.cos(toRadians(angle)),
            y: center.y + dist * Math.sin(toRadians(angle))
        };
    }

    /**
     * returns an angle between 0 < 360 (not less than zero, less than 360)
     */
    export function getNormalizedAngle(angle) {
        while (angle < 0) angle += 360;

        return angle % 360;
    }

    // const mDrawableBoundsCache = new Rect(0, 0, 0, 0);

    // export function drawImage(canvas: Canvas, drawable: ImageSource, x, y, width, height) {
    //     const drawOffsetx = x - width / 2;
    //     const drawOffsety = y - height / 2;

    //     drawable.copyBounds(mDrawableBoundsCache);
    //     drawable.setBounds(this.mDrawableBoundsCache.left, this.mDrawableBoundsCache.top, this.mDrawableBoundsCache.left + width, this.mDrawableBoundsCache.top + width);

    //     canvas.save();
    //     // translate to the correct position and draw
    //     canvas.translate(drawOffsetx, drawOffsety);
    //     drawable.draw(canvas);
    //     canvas.restore();
    // }

    export function drawXAxisValue(c: Canvas, text: string, x: number, y: number, paint: Paint, anchor: MPPointF, angleDegrees: number) {
        let drawOffsetX = 0;
        let drawOffsetY = 0;

        // Android does not snap the bounds to line boundaries,
        // and draws from bottom to top.
        // And we want to normalize it.
        drawOffsetY += -mFontMetricsBuffer.ascent;

        if (angleDegrees !== 0) {
            const lineHeight = getLineHeightFromMetrics(mFontMetricsBuffer);
            paint.getTextBounds(text, 0, text.length, mDrawTextRectBuffer);
            // Move the text drawing rect in a way that it always rotates around its center
            drawOffsetX -= mDrawTextRectBuffer.width() * 0.5;
            drawOffsetY -= lineHeight * 0.5;

            let translateX = x;
            let translateY = y;

            // Move the "outer" rect relative to the anchor, assuming its centered
            if (anchor.x !== 0.5 || anchor.y !== 0.5) {
                const rotatedSize = getSizeOfRotatedRectangleByDegrees(mDrawTextRectBuffer.width(), lineHeight, angleDegrees);

                translateX -= rotatedSize.width * (anchor.x - 0.5);
                translateY -= rotatedSize.height * (anchor.y - 0.5);
            }

            c.save();
            c.translate(translateX, translateY);
            c.rotate(angleDegrees);

            c.drawText(text, drawOffsetX, drawOffsetY, paint);

            c.restore();
        } else {
            if (anchor.y !== 0) {
                const lineHeight = getLineHeightFromMetrics(mFontMetricsBuffer);
                drawOffsetY -= lineHeight * anchor.y;
            }
            drawOffsetX += x;
            drawOffsetY += y;
            c.drawText(text, drawOffsetX, drawOffsetY, paint);
        }
        // paint.setTextAlign(originalTextAlign);
    }

    export function drawMultilineText(c: Canvas, textLayout, x: number, y: number, anchor: MPPointF, angleDegrees: number, lineHeight: number) {
        let drawOffsetX = 0;
        let drawOffsetY = 0;

        const drawWidth = textLayout.getWidth();
        const drawHeight = textLayout.getLineCount() * lineHeight;

        // Android sometimes has pre-padding
        drawOffsetX -= mDrawTextRectBuffer.left;

        // Android does not snap the bounds to line boundaries,
        //  and draws from bottom to top.
        // And we want to normalize it.
        drawOffsetY += drawHeight;

        // To have a consistent point of reference, we always draw left-aligned
        // Paint.Align originalTextAlign = paint.getTextAlign();
        // paint.setTextAlign(Paint.Align.LEFT);

        if (angleDegrees !== 0) {
            // Move the text drawing rect in a way that it always rotates around its center
            drawOffsetX -= drawWidth * 0.5;
            drawOffsetY -= drawHeight * 0.5;

            let translateX = x;
            let translateY = y;

            // Move the "outer" rect relative to the anchor, assuming its centered
            if (anchor.x !== 0.5 || anchor.y !== 0.5) {
                const rotatedSize = getSizeOfRotatedRectangleByDegrees(drawWidth, drawHeight, angleDegrees);

                translateX -= rotatedSize.width * (anchor.x - 0.5);
                translateY -= rotatedSize.height * (anchor.y - 0.5);
                // FSize.recycleInstance(rotatedSize);
            }

            c.save();
            c.translate(translateX, translateY);
            c.rotate(angleDegrees);

            c.translate(drawOffsetX, drawOffsetY);
            textLayout.draw(c);

            c.restore();
        } else {
            if (anchor.x !== 0 || anchor.y !== 0) {
                drawOffsetX -= drawWidth * anchor.x;
                drawOffsetY -= drawHeight * anchor.y;
            }

            drawOffsetX += x;
            drawOffsetY += y;

            c.save();

            c.translate(drawOffsetX, drawOffsetY);
            textLayout.draw(c);

            c.restore();
        }

        // paint.setTextAlign(originalTextAlign);
    }

    export function drawMultilineTextConstrained(c: Canvas, text: string, x: number, y: number, paint: Paint, constrainedToSize: MPSize, anchor: MPPointF, angleDegrees: number, lineHeight: number) {
        const textLayout = new StaticLayout(text, paint, Math.max(Math.ceil(constrainedToSize.width), 1), LayoutAlignment.ALIGN_NORMAL, 1, 0, false);

        drawMultilineText(c, textLayout, x, y, anchor, angleDegrees, lineHeight);
    }

    /**
     * Returns a recyclable FSize instance.
     * Represents size of a rotated rectangle by degrees.
     *
     * @param rectangleWidth
     * @param rectangleHeight
     * @param degrees
     * @return A Recyclable FSize instance
     */
    export function getSizeOfRotatedRectangleByDegrees(rectangleWidth, rectangleHeight, degrees) {
        const radians = degrees * DEG2RAD;
        return getSizeOfRotatedRectangleByRadians(rectangleWidth, rectangleHeight, radians);
    }

    /**
     * Returns a recyclable FSize instance.
     * Represents size of a rotated rectangle by radians.
     *
     * @param rectangleWidth
     * @param rectangleHeight
     * @param radians
     * @return A Recyclable FSize instance
     */
    export function getSizeOfRotatedRectangleByRadians(rectangleWidth, rectangleHeight, radians) {
        return {
            width: Math.abs(rectangleWidth * Math.cos(radians)) + Math.abs(rectangleHeight * Math.sin(radians)),
            height: Math.abs(rectangleWidth * Math.sin(radians)) + Math.abs(rectangleHeight * Math.cos(radians))
        };
    }

    export const supportsDirectArrayBuffers = supportsDirectArrayBuffersFn;
    export const createArrayBuffer = createArrayBufferFn;
    export const pointsFromBuffer = pointsFromBufferFn;
    export const createArrayBufferOrNativeArray = createArrayBufferOrNativeArrayFn;
    export const createNativeArray = createNativeArrayFn;
    export const nativeArrayToArray = nativeArrayToArrayFn;
    export const arrayToNativeArray = arrayToNativeArrayFn;

    const mTempArrays: { [k: string]: TypedArray } = {};
    export function getTempArray(length, useInts = false, canReturnBuffer = true, optKey?: string) {
        let key = length + '' + useInts + '' + canReturnBuffer;
        if (optKey) {
            key += optKey;
        }
        if (mTempArrays[key]) {
            return mTempArrays[key];
        }
        const buf = (mTempArrays[key] = createArrayBuffer(length, useInts, canReturnBuffer));
        return buf;
    }

    let mTempRectF: RectF;
    export function getTempRectF() {
        if (!mTempRectF) {
            mTempRectF = new RectF(0, 0, 0, 0);
        }
        return mTempRectF;
    }
    let mTempRect: RectF;
    export function getTempRect() {
        if (!mTempRect) {
            mTempRect = new Rect(0, 0, 0, 0);
        }
        return mTempRect;
    }
    let mTempPath: Path;
    export function getTempPath() {
        if (!mTempPath) {
            mTempPath = new Path();
        }
        return mTempPath;
    }
    let mTempMatrix: Matrix;
    export function getTempMatrix() {
        if (!mTempMatrix) {
            mTempMatrix = new Matrix();
        }
        return mTempMatrix;
    }
    let mTempPaint: Paint;
    export function getTempPaint() {
        if (!mTempPaint) {
            mTempPaint = new Paint();
        }
        return mTempPaint;
    }
    const mTemplatePaints: { [k: string]: Paint } = {};
    export function getTemplatePaint(template: string) {
        const cached = mTemplatePaints[template];
        if (cached) {
            return new Paint(cached);
        }
        let paint: Paint;
        switch (template) {
            case 'black-stroke': {
                paint = new Paint();
                paint.setStyle(Style.STROKE);
                paint.setColor('black');
                paint.setStrokeWidth(1);
                break;
            }
            case 'gray-stroke': {
                paint = getTemplatePaint('black-stroke');
                paint.setColor('gray');
                break;
            }
            case 'white-stroke': {
                paint = getTemplatePaint('black-stroke');
                paint.setColor('white');
                break;
            }
            case 'black-fill': {
                paint = new Paint();
                paint.setColor('black');
                paint.setStyle(Style.FILL);
                break;
            }
            case 'white-fill': {
                paint = getTemplatePaint('black-fill');
                paint.setColor('white');
                break;
            }
            case 'grid': {
                paint = getTemplatePaint('black-stroke');
                this.mGridPaint = new Paint();
                paint.setColor('gray');
                paint.setAlpha(90);
                break;
            }
            case 'value': {
                paint = new Paint();
                paint.setColor('#3F3F3F');
                paint.setTextAlign(Align.CENTER);
                paint.setTextSize(9);
                break;
            }
        }
        mTemplatePaints[template] = paint;
        return new Paint(paint);
    }

    export function clipPathSupported() {
        if (__ANDROID__) {
            return getSDK() >= 18;
        }
        return true;
    }

    /**
     * Calculates the sum across all values of the given array.
     *
     * @param values
     * @return
     */
    export function calcSum(values: number[]) {
        let sum = 0;

        if (!values) {
            return sum;
        }

        for (const f of values) {
            sum += f;
        }

        return sum;
    }

    /**
     * Calculates the sum of positive numbers and negative numbers separately,
     * across all values of the given array.
     *
     * @param values
     * @return
     */
    export function calcPosNegSum(values: number[]) {
        const sums = { pos: 0, neg: 0 };
        if (!values) {
            return sums;
        }

        const sumNeg = 0;
        const sumPos = 0;

        for (const f of values) {
            if (f <= 0) {
                sums.neg += Math.abs(f);
            } else {
                sums.pos += f;
            }
        }

        return sums;
    }

    export function calcSumToIndex(index: number, values: number[], desc: boolean) {
        if (!values) return 0;

        let remainder = 0;
        let lastIndex = values.length - 1;

        while (lastIndex > index && lastIndex >= 0) {
            remainder += values[index];
            lastIndex--;
        }

        return remainder;
    }

    export function getArrayItem(array: any[] | ObservableArray<any>, index: number) {
        return array instanceof ObservableArray ? array.getItem(index) : array[index];
    }
}
