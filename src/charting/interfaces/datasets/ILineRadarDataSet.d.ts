import { ILineScatterCandleRadarDataSet } from './ILineScatterCandleRadarDataSet';
import { Entry } from '../../data/Entry';
import { RadarEntry } from '../../data/RadarEntry';
import { ImageSource } from '@nativescript/core';

/**
 * Created by Philipp Jahoda on 21/10/15.
 */
export interface ILineRadarDataSet<T extends Entry> extends ILineScatterCandleRadarDataSet<T> {
    /**
     * Returns the color that is used for filling the line surface area.
     *
     * @return
     */
    getFillColor();

    /**
     * Returns the drawable used for filling the area below the line.
     *
     * @return
     */
    getFillDrawable(): ImageSource;
    /**
     * Returns the shader used for filling the area below the line.
     *
     * @return
     */
    getFillShader();

    /**
     * Returns the alpha value that is used for filling the line surface,
     * default: 85
     *
     * @return
     */
    getFillAlpha();

    /**
     * Returns the stroke-width of the drawn line
     *
     * @return
     */
    getLineWidth();

    /**
     * Returns true if filled drawing is enabled, false if not
     *
     * @return
     */
    isDrawFilledEnabled();

    /**
     * Set to true if the DataSet should be drawn filled (surface), and not just
     * as a line, disabling this will give great performance boost. Please note that this method
     * uses the canvas.clipPath(...) method for drawing the filled area.
     * For devices with API level < 18 (Android 4.3), hardware acceleration of the chart should
     * be turned off. Default: false
     *
     * @param enabled
     */
    setDrawFilled(enabled);
}
