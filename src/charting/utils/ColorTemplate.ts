import { Color } from '@nativescript/core/color';

/**
 * Class that holds predefined color integer arrays (e.g.
 * ColorTemplate.VORDIPLOM_COLORS) and convenience methods for loading colors
 * from resources.
 *
 * @author Philipp Jahoda
 */
export class ColorTemplate {
    /**
     * an "invalid" color that indicates that no color is set
     */
    public static COLOR_NONE = new Color(-1);

    /**
     * this "color" is used for the Legend creation and indicates that the next
     * form should be skipped
     */
    public static COLOR_SKIP = new Color(0x00112234);

    /**
     * THE COLOR THEMES ARE PREDEFINED (predefined color integer arrays), FEEL
     * FREE TO CREATE YOUR OWN WITH AS MANY DIFFERENT COLORS AS YOU WANT
     */
    public static LIBERTY_COLORS = ['rgb(207, 248, 246)', 'rgb(148, 212, 212)', 'rgb(136, 180, 187)', 'rgb(118, 174, 175)', 'rgb(42, 109, 130)'];
    public static JOYFUL_COLORS = ['rgb(217, 80, 138)', 'rgb(254, 149, 7)', 'rgb(254, 247, 120)', 'rgb(106, 167, 134)', 'rgb(53, 194, 209)'];
    public static PASTEL_COLORS = ['rgb(64, 89, 128)', 'rgb(149, 165, 124)', 'rgb(217, 184, 162)', 'rgb(191, 134, 134)', 'rgb(179, 48, 80)'];
    public static COLORFUL_COLORS = ['rgb(193, 37, 82)', 'rgb(255, 102, 0)', 'rgb(245, 199, 0)', 'rgb(106, 150, 31)', 'rgb(179, 100, 53)'];
    public static VORDIPLOM_COLORS = ['rgb(192, 255, 140)', 'rgb(255, 247, 140)', 'rgb(255, 208, 140)', 'rgb(140, 234, 255)', 'rgb(255, 140, 157)'];
    public static MATERIAL_COLORS = ['#2ecc71', '#f1c40f', '#e74c3c', '#3498db'];

    /**
     * Returns the Android ICS holo blue light color.
     *
     * @return
     */
    public static getHoloBlue() {
        return 'rgb(51, 181, 229)';
    }

    public static getColorInstance(c: Color | number | string) {
        return c instanceof Color ? c : new Color(c as any);
    }

    /**
     * Sets the alpha component of the given color.
     *
     * @param color
     * @param alpha 0 - 255
     * @return
     */
    public static colorWithAlpha(color: Color, alpha) {
        return new Color(alpha, color.r, color.g, color.b);
    }

    /**
     * turn an array of resource-colors (contains resource-id integers) into an
     * array list of actual color integers
     *
     * @param colors an integer array of resource id's of colors
     * @return
     */
    public static createColors(colors) {
        return colors;
    }
}
