import { Entry } from './Entry';
import { ILineRadarDataSet } from '../interfaces/datasets/ILineRadarDataSet';
import { LineScatterCandleRadarDataSet } from './LineScatterCandleRadarDataSet';
import { Color } from '@nativescript/core/color';
import { Utils } from '../utils/Utils';
import { ImageSource } from '@nativescript/core';

/**
 * Base dataset for line and radar DataSets.
 *

 */
export abstract class LineRadarDataSet<T extends Entry> extends LineScatterCandleRadarDataSet<T> {
    /**
     * the color that is used for filling the line surface
     */
    fillColor: string | Color = '#8CEAFF'; // rgb(140,234,255)

    /**
     * the drawable to be used for filling the line surface
     */
    fillDrawable: ImageSource;

    /**
     * transparency used for filling line surface
     */
    fillAlpha = 85;

    /**
     * the width of the drawn data lines
     * thinner line === better performance, thicker line === worse performance
     */
    lineWidth = 1.5;

    /**
     * if true, the data will also be drawn filled
     */
    drawFilledEnabled = false;
}
