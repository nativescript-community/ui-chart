import { Font } from '@nativescript/core/ui/styling/font';

const DEFAULT_FONT = Font.default.withFontSize(10);
/**
 * This class encapsulates everything both Axis, Legend and LimitLines have in common.
 *

 */
export abstract class ComponentBase {
    /**
     * flag that indicates if this axis / legend is enabled or not
     */
    enabled: boolean = true;

    /**
     * the offset in pixels this component has on the x-axis
     */
    xOffset: number = 5;

    /**
     * the offset in pixels this component has on the Y-axis
     */
    yOffset: number = 5;

    /**
     * the typeface used for the labels
     */
    typeface: Font = DEFAULT_FONT;

    /**
     * the text size of the labels
     */
    protected mTextSize: number = 10;

    /**
     * the text color to use for the labels
     */
    textColor: string = 'black';

    public ComponentBase() {}

    /**
     * returns the Typeface used for the labels, returns null if none is set
     *
     * @return {@link Font}
     */
    public get font() {
        return this.typeface;
    }

    /**
     * sets a specific Typeface for the labels
     *
     * @param tf
     */
    public set font(tf: Font) {
        if (tf.fontSize <= 0) {
            tf = tf.withFontSize(this.textSize);
        }
        this.typeface = tf;
    }
    /**
     * sets the size of the label text in density pixels min = 6f, max = 24f, default
     * 10
     *
     * @param size the text size, in DP
     */
    set textSize(size) {
        this.mTextSize = size;
        // this bit is important to make sure we dont create crazy amount of native fonts on render
        this.typeface = this.typeface.withFontSize(size);
    }

    /**
     * returns the text size that is currently set for the labels, in pixels
     */
    get textSize() {
        return this.mTextSize;
    }

    /**
     * Defines if the renderer should ensure we always see the component fully
     */
    public ensureVisible = false;
}
