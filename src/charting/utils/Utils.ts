import { screen } from '@nativescript/core/platform';
import { Paint, Rect, Canvas, StaticLayout, FontMetrics, Align } from 'nativescript-canvas';
import { ValueFormatter } from '../formatter/ValueFormatter';
import { DefaultValueFormatter } from '../formatter/DefaultValueFormatter';
import { profile } from '@nativescript/core/profiling/profiling';
import { isAndroid } from '@nativescript/core/platform';

export type FloatArray = Float32Array | Float64Array;
export let FloatConstructor: typeof Float32Array | typeof Float64Array;
if (isAndroid) {
    FloatConstructor = Float32Array;
} else {
    FloatConstructor = interop.sizeof(interop.types.id) === 4 ? Float32Array : Float64Array;
}

/**
 * Utilities class that has some helper methods. Needs to be initialized by
 * calling Utils.init(...) before usage. Inside the Chart.init() method, this is
 * done, if the Utils are used before that, Utils.init(...) needs to be called
 * manually.
 *
 * @author Philipp Jahoda
 */
export namespace Utils {
    // const mainScreen = screen.mainScreen;
    export const density = screen.mainScreen.scale;
    //    const mMetrics;
    // const mMinimumFlingVelocity = 50;
    // const mMaximumFlingVelocity = 8000;
    const DEG2RAD = Math.PI / 180.0;

    // const DOUBLE_EPSILON = Number.EPSILON;

    // const FLOAT_EPSILON = Number.EPSILON;

    /**
     * initialize method, called inside the Chart.init() method.
     *
     * @param context
     */
    export function init(context) {
        if (context == null) {
            // noinspection deprecation
            // this.mMinimumFlingVelocity = android.view.ViewConfiguration.getMinimumFlingVelocity();
            // noinspection deprecation
            // this.mMaximumFlingVelocity = android.view.ViewConfiguration.getMaximumFlingVelocity();

            console.error('MPChartLib-Utils', 'Utils.init(...) PROVIDED CONTEXT OBJECT IS NULL');
        } else {
            // const viewConfiguration = android.view.ViewConfiguration.get(context);
            // this.mMinimumFlingVelocity = viewConfiguration.getScaledMinimumFlingVelocity();
            // this.mMaximumFlingVelocity = viewConfiguration.getScaledMaximumFlingVelocity();
            // Resources res = context.getResources();
            // this.mMetrics = res.getDisplayMetrics();
        }
    }

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

    let mCalcTextHeightRect = new Rect(0, 0, 0, 0);
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
        // mCalcTextHeightRect = r;
        return mCalcTextHeightRect.height();
    }

    // let mFontMetrics = null;
    let mFontMetrics = new FontMetrics();

    export function getLineHeight(paint: Paint, fontMetrics = mFontMetrics) {
        paint.getFontMetrics(fontMetrics);
        return fontMetrics.descent - fontMetrics.ascent;
    }

    export function getLineSpacing(paint: Paint, fontMetrics = mFontMetrics) {
        paint.getFontMetrics(fontMetrics);
        return fontMetrics.ascent - fontMetrics.top + fontMetrics.bottom;
    }

    /**
     * Returns a recyclable FSize instance.
     * calculates the approximate size of a text, depending on a demo text
     * avoid repeated calls (e.g. inside drawing methods)
     *
     * @param paint
     * @param demoText
     * @return A Recyclable FSize instance
     */

    let mCalcTextSizeRect = new Rect(0, 0, 0, 0);
    /**
     * calculates the approximate size of a text, depending on a demo text
     * avoid repeated calls (e.g. inside drawing methods)
     *
     * @param paint
     * @param demoText
     * @param outputFSize An output variable, modified by the function.
     */
    export function calcTextSize(paint: Paint, demoText) {
        let r = new Rect(0, 0, 0, 0);
        paint.getTextBounds(demoText, 0, demoText.length, r);
        mCalcTextSizeRect = r;
        return {
            width: r.width(),
            height: r.height()
        };
    }

    /**
     * Math.pow(...) is very expensive, so avoid calling it and create it
     * yourself.
     */
    const POW_10 = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000];

    let mDefaultValueFormatter: ValueFormatter = generateDefaultValueFormatter();

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
        let out = [];

        let neg = false;
        if (number == 0) {
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

        while (lval != 0 || charCount < digitCount + 1) {
            let digit = lval % 10;
            lval = lval / 10;
            out[ind--] = digit + '0';
            charCount++;

            // add decimal point
            if (charCount == digitCount) {
                out[ind--] = ',';
                charCount++;
                decimalPointAdded = true;

                // add thousand separators
            } else if (separateThousands && lval != 0 && charCount > digitCount) {
                if (decimalPointAdded) {
                    if ((charCount - digitCount) % 4 == 0) {
                        out[ind--] = separateChar;
                        charCount++;
                    }
                } else {
                    if ((charCount - digitCount) % 4 == 3) {
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

        let start = out.length - charCount;
        return out.slice(out.length - start).join('');
    }

    /**
     * rounds the given number to the next significant number
     *
     * @param number
     * @return
     */
    export function roundToNextSignificant(number) {
        if (!Number.isFinite(number) || isNaN(number) || number == 0.0) return 0;

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

        if (!Number.isFinite(i)) return 0;

        return Math.ceil(-Math.log10(i)) + 2;
    }

    // /**
    //  * Converts the provided Integer List to an int array.
    //  *
    //  * @param integers
    //  * @return
    //  */
    //export function convertIntegers(integers: number[]) {

    //     const ret = [];

    //     copyIntegers(integers, ret);

    //     return ret;
    // }

    //export function copyIntegers(from: number[],  to){
    //     const count = to.length < from.length ? to.length : from.length;
    //     for(let i = 0 ; i < count ; i++){
    //         to[i] = from.get(i);
    //     }
    // }

    // /**
    //  * Converts the provided String List to a String array.
    //  *
    //  * @param strings
    //  * @return
    //  */
    // function[] convertStrings(List<String> strings) {

    //     String[] ret = new String[strings.length];

    //     for (let i = 0; i < ret.length; i++) {
    //         ret[i] = strings.get(i);
    //     }

    //     return ret;
    // }

    // copyStrings(List<String> from, String[] to){
    //     int count = to.length < from.length ? to.length : from.length;
    //     for(let i = 0 ; i < count ; i++){
    //         to[i] = from.get(i);
    //     }
    // }

    /**
     * Replacement for the Math.nextUp(...) method that is only available in
     * HONEYCOMB and higher. Dat's some seeeeek sheeet.
     *
     * @param d
     * @return
     */
    const EPSILON = Math.pow(2, -52);
    const MAX_VALUE = (2 - EPSILON) * Math.pow(2, 1023);
    const MIN_VALUE = Math.pow(2, -1022);
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
        var y = x * (x < 0 ? 1 - EPSILON / 2 : 1 + EPSILON);
        if (y === x) {
            y = MIN_VALUE * EPSILON > 0 ? x + MIN_VALUE * EPSILON : x + MIN_VALUE;
        }
        if (y === +1 / 0) {
            y = +MAX_VALUE;
        }
        var b = x + (y - x) / 2;
        if (x < b && b < y) {
            y = b;
        }
        var c = (y + x) / 2;
        if (x < c && c < y) {
            y = c;
        }
        return y === 0 ? -0 : y;
    }
    export function toRadians(degrees) {
        var pi = Math.PI;
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

    export function getPosition(center, dist, angle, outputPoint) {
        return {
            x: center.x + dist * Math.cos(toRadians(angle)),
            y: center.y + dist * Math.sin(toRadians(angle))
        };
    }

    // export function velocityTrackerPointerUpCleanUpIfNecessary(ev, tracker) {
    //     // Check the dot product of current velocities.
    //     // If the pointer that left was opposing another velocity vector, clear.
    //     tracker.computeCurrentVelocity(1000, mMaximumFlingVelocity);
    //     const upIndex = ev.getActionIndex();
    //     const id1 = ev.getPointerId(upIndex);
    //     const x1 = tracker.getXVelocity(id1);
    //     const y1 = tracker.getYVelocity(id1);
    //     for (let i = 0, count = ev.getPointerCount(); i < count; i++) {
    //         if (i == upIndex) continue;

    //         const id2 = ev.getPointerId(i);
    //         const x = x1 * tracker.getXVelocity(id2);
    //         const y = y1 * tracker.getYVelocity(id2);

    //         const dot = x + y;
    //         if (dot < 0) {
    //             tracker.clear();
    //             break;
    //         }
    //     }
    // }

    /**
     * Original method view.postInvalidateOnAnimation() only supportd in API >=
     * 16, This is a replica of the code from ViewCompat.
     *
     * @param view
     */

    //    export function ostInvalidateOnAnimation(view) {
    //         if (Build.VERSION.SDK_INT >= 16) view.postInvalidateOnAnimation();
    //         else view.postInvalidateDelayed(10);
    //     }

    // export function getMinimumFlingVelocity() {
    //     return mMinimumFlingVelocity;
    // }

    // export function getMaximumFlingVelocity() {
    //     return mMaximumFlingVelocity;
    // }

    /**
     * returns an angle between 0 < 360 (not less than zero, less than 360)
     */
    export function getNormalizedAngle(angle) {
        while (angle < 0) angle += 360;

        return angle % 360;
    }

    // let mDrawableBoundsCache = new Rect(0,0,0,0);

    export function drawImage(canvas: Canvas, drawable, x, y, width, height) {
        // const drawOffsetx = x - (width / 2);
        // const drawOffsety = y - (height / 2);

        canvas.drawBitmap(drawable, x, y, null);

        // drawable.copyBounds(mDrawableBoundsCache);
        // drawable.setBounds(
        //         this.mDrawableBoundsCache.left,
        //         this.mDrawableBoundsCache.top,
        //         this.mDrawableBoundsCache.left + width,
        //         this.mDrawableBoundsCache.top + width);

        // canvas.save();
        // // translate to the correct position and draw
        // canvas.translate(drawOffsetx, drawOffsety);
        // drawable.draw(canvas);
        // canvas.restore();
    }

    let mDrawTextRectBuffer = new Rect(0, 0, 0, 0);

    export function drawXAxisValue(c: Canvas, text, x, y, paint: Paint, anchor, angleDegrees, lineHeight, fontMetrics: FontMetrics) {
        let drawOffsetX = 0;
        let drawOffsetY = 0;

        // Android sometimes has pre-padding
        // drawOffsetX -= mDrawTextRectBuffer.left;

        // Android does not snap the bounds to line boundaries,
        //  and draws from bottom to top.
        // And we want to normalize it.
        drawOffsetY += -fontMetrics.ascent;

        // To have a consistent point of reference, we always draw left-aligned

        if (angleDegrees != 0) {
            const originalTextAlign = paint.getTextAlign();
            paint.setTextAlign(Align.LEFT);
            // Move the text drawing rect in a way that it always rotates around its center
            drawOffsetX -= mDrawTextRectBuffer.width() * 0.5;
            drawOffsetY -= lineHeight * 0.5;

            let translateX = x;
            let translateY = y;

            // Move the "outer" rect relative to the anchor, assuming its centered
            if (anchor.x != 0.5 || anchor.y != 0.5) {
                paint.getTextBounds(text, 0, text.length, mDrawTextRectBuffer);
                const rotatedSize = getSizeOfRotatedRectangleSizeByDegrees(mDrawTextRectBuffer.width(), lineHeight, angleDegrees);

                translateX -= rotatedSize.width * (anchor.x - 0.5);
                translateY -= rotatedSize.height * (anchor.y - 0.5);
                // FSize.recycleInstance(rotatedSize);
            }

            c.save();
            c.translate(translateX, translateY);
            c.rotate(angleDegrees);

            c.drawText(text, drawOffsetX, drawOffsetY, paint);

            c.restore();
            paint.setTextAlign(originalTextAlign);
        } else {
            if (anchor.x != 0 || anchor.y != 0) {
                // drawOffsetX -= mDrawTextRectBuffer.width() * anchor.x;
                drawOffsetY -= lineHeight * anchor.y;
            }

            drawOffsetX += x;
            drawOffsetY += y;

            c.drawText(text, drawOffsetX, drawOffsetY, paint);
        }
    }

    export function drawMultilineText(c: Canvas, textLayout, x, y, textpaint: Paint, anchor, angleDegrees, lineHeight) {
        let drawOffsetX = 0;
        let drawOffsetY = 0;
        let drawWidth;
        let drawHeight;

        drawWidth = textLayout.getWidth();
        drawHeight = textLayout.getLineCount() * lineHeight;

        // Android sometimes has pre-padding
        drawOffsetX -= mDrawTextRectBuffer.left;

        // Android does not snap the bounds to line boundaries,
        //  and draws from bottom to top.
        // And we want to normalize it.
        drawOffsetY += drawHeight;

        // To have a consistent point of reference, we always draw left-aligned
        // Paint.Align originalTextAlign = paint.getTextAlign();
        // paint.setTextAlign(Paint.Align.LEFT);

        if (angleDegrees != 0) {
            // Move the text drawing rect in a way that it always rotates around its center
            drawOffsetX -= drawWidth * 0.5;
            drawOffsetY -= drawHeight * 0.5;

            let translateX = x;
            let translateY = y;

            // Move the "outer" rect relative to the anchor, assuming its centered
            if (anchor.x != 0.5 || anchor.y != 0.5) {
                const rotatedSize = getSizeOfRotatedRectangleSizeByDegrees(drawWidth, drawHeight, angleDegrees);

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
            if (anchor.x != 0 || anchor.y != 0) {
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

    export function drawMultilineTextConstrained(c: Canvas, text, x, y, paint: Paint, constrainedToSize, anchor, angleDegrees, lineHeight) {
        const textLayout = new StaticLayout(text, paint, Math.max(Math.ceil(constrainedToSize.width), 1), 0 /*Layout.Alignment.ALIGN_NORMAL*/, 1, 0, false);

        drawMultilineText(c, textLayout, x, y, paint, anchor, angleDegrees, lineHeight);
    }

    /**
     * Returns a recyclable FSize instance.
     * Represents size of a rotated rectangle by degrees.
     *
     * @param rectangleSize
     * @param degrees
     * @return A Recyclable FSize instance
     */
    export function getSizeOfRotatedRectangleByDegrees(rectangleSize, degrees) {
        const radians = degrees * DEG2RAD;
        return getSizeOfRotatedRectangleSizeByRadians(rectangleSize.width, rectangleSize.height, radians);
    }

    /**
     * Returns a recyclable FSize instance.
     * Represents size of a rotated rectangle by radians.
     *
     * @param rectangleSize
     * @param radians
     * @return A Recyclable FSize instance
     */
    export function getSizeOfRotatedRectangleByRadians(rectangleSize, radians) {
        return getSizeOfRotatedRectangleSizeByRadians(rectangleSize.width, rectangleSize.height, radians);
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
    export function getSizeOfRotatedRectangleSizeByDegrees(rectangleWidth, rectangleHeight, degrees) {
        const radians = degrees * DEG2RAD;
        return getSizeOfRotatedRectangleSizeByRadians(rectangleWidth, rectangleHeight, radians);
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
    export function getSizeOfRotatedRectangleSizeByRadians(rectangleWidth, rectangleHeight, radians) {
        return {
            width: Math.abs(rectangleWidth * Math.cos(radians)) + Math.abs(rectangleHeight * Math.sin(radians)),
            height: Math.abs(rectangleWidth * Math.sin(radians)) + Math.abs(rectangleHeight * Math.cos(radians))
        };
    }

    //export function getSDKInt() {
    //     return android.os.Build.VERSION.SDK_INT;
    // }

    export function logMethod(target, key, descriptor) {
        // save a reference to the original method this way we keep the values currently in the
        // descriptor and don't overwrite what another decorator might have done to the descriptor.
        if (descriptor === undefined) {
            descriptor = Object.getOwnPropertyDescriptor(target, key);
        }
        var originalMethod = descriptor.value;

        //editing the descriptor/value parameter
        descriptor.value = function() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var a = args
                .map(function(a) {
                    return JSON.stringify(a);
                })
                .join();
            // note usage of originalMethod here
            var result = originalMethod.apply(this, args);
            var r = JSON.stringify(result);
            console.log('Call: ' + key + '(' + a + ') => ' + r);
            return result;
        };

        // return edited descriptor as opposed to overwriting the descriptor
        return descriptor;
    }

    export const createArrayBuffer = profile('createArrayBuffer', function(length: number, force = false): number[] {
        if (isAndroid) {
            var bb = java.nio.ByteBuffer.allocateDirect(length * 4).order(java.nio.ByteOrder.LITTLE_ENDIAN);
            const result = (ArrayBuffer as any).from(bb);
            // result.bb = bb;
            const array = new Float32Array(result);
            return array as any;
        } else {
            // } else if (force) {
            return new FloatConstructor(length) as any;
        }
        // return [];
    });
    export const pointsFromBuffer = profile('pointsFromBuffer', function(float32Array) {
        if (isAndroid) {
            const buffer = float32Array.buffer;
            const length = float32Array.length;
            const testArray = Array.create('float', length);
            // bb.asFloatBuffer().get(testArray);
            ((buffer as any).nativeObject as java.nio.ByteBuffer).asFloatBuffer().get(testArray, 0, length);
            return testArray;
        }
        return float32Array;
    });
    export const nativeArrayToArray = profile('nativeArrayToArray', function(array) {
        if (isAndroid) {
            const result = [];
            for (let index = 0; index < array.length; index++) {
                result[index] = array[index];
            }

            return result as number[];
        }
        return array;
    });
    export function createNativeArray(length) {
        if (isAndroid) {
            return Array.create('float', length);
        }
        return [];
    }
    export function arrayoNativeArray(array: number[]) {
        if (!Array.isArray(array)) {
            return array;
        }
        const length = array.length;
        const nNative = Array.create('float', length);
        for (let i = 0; i < length; i++) {
            nNative[i] = array[i];
        }
        return nNative;
    }

    export function clipPathSupported() {
        if (isAndroid) {
            return android.os.Build.VERSION.SDK_INT >= 18;
        }
        return false;
    }
    export function setHardwareAccelerationEnabled(view: android.view.View, enabled) {
        // console.log('setHardwareAccelerationEnabled', view, enabled);
        if (isAndroid) {
            if (view) {
                if (enabled) view.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
                else view.setLayerType(android.view.View.LAYER_TYPE_SOFTWARE, null);
            }
        }
    }
}
