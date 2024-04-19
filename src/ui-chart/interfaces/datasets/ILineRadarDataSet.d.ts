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
     */
    fillColor: Color | string;

    /**
     * Returns the drawable used for filling the area below the line.
     */
    fillDrawable: ImageSource;

    /**
     * Returns the alpha value that is used for filling the line surface,
     * default: 85
     */
    fillAlpha: number;

    /**
     * the stroke-width of the drawn line
     */
    lineWidth: number;

    /**
     * Rtrue if filled drawing is enabled, false if not
     */
    drawFilledEnabled: boolean;
}
