import { Color } from '@nativescript/core/color/color';

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
    public static COLOR_NONE = new Color(0x00112233);

    /**
     * this "color" is used for the Legend creation and indicates that the next
     * form should be skipped
     */
    public static COLOR_SKIP = new Color(0x00112234);

    /**
     * THE COLOR THEMES ARE PREDEFINED (predefined color integer arrays), FEEL
     * FREE TO CREATE YOUR OWN WITH AS MANY DIFFERENT COLORS AS YOU WANT
     */
    public static LIBERTY_COLORS = [new Color(255, 207, 248, 246), new Color(255, 148, 212, 212), new Color(255, 136, 180, 187), new Color(255, 118, 174, 175), new Color(255, 42, 109, 130)];
    public static JOYFUL_COLORS = [new Color(255, 217, 80, 138), new Color(255, 254, 149, 7), new Color(255, 254, 247, 120), new Color(255, 106, 167, 134), new Color(255, 53, 194, 209)];
    public static PASTEL_COLORS = [new Color(255, 64, 89, 128), new Color(255, 149, 165, 124), new Color(255, 217, 184, 162), new Color(255, 191, 134, 134), new Color(255, 179, 48, 80)];
    public static COLORFUL_COLORS = [new Color(255, 193, 37, 82), new Color(255, 255, 102, 0), new Color(255, 245, 199, 0), new Color(255, 106, 150, 31), new Color(255, 179, 100, 53)];
    public static VORDIPLOM_COLORS = [new Color(255, 192, 255, 140), new Color(255, 255, 247, 140), new Color(255, 255, 208, 140), new Color(255, 140, 234, 255), new Color(255, 255, 140, 157)];
    public static MATERIAL_COLORS = [new Color('#2ecc71'), new Color('#f1c40f'), new Color('#e74c3c'), new Color('#3498db')];

    /**
     * Returns the Android ICS holo blue light color.
     *
     * @return
     */
    public static getHoloBlue() {
        return new Color(255, 51, 181, 229);
    }

    /**
     * Sets the alpha component of the given color.
     *
     * @param color
     * @param alpha 0 - 255
     * @return
     */
    public static colorWithAlpha(color: Color, alpha) {
        color.a = alpha;
        return color;
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
