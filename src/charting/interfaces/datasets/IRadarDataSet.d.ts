import { Color } from '@nativescript/core';
import { ILineRadarDataSet } from './ILineRadarDataSet';
import { RadarEntry } from '../../data/RadarEntry';
/**
 * Created by Philipp Jahoda on 03/11/15.
 */
export interface IRadarDataSet extends ILineRadarDataSet<RadarEntry> {
    /// flag indicating whether highlight circle should be drawn or not
    isDrawHighlightCircleEnabled(): boolean;

    /// Sets whether highlight circle should be drawn or not
    setDrawHighlightCircleEnabled(enabled: boolean);

    getHighlightCircleFillColor(): string | Color;

    /// The stroke color for highlight circle.
    /// If Utils.COLOR_NONE, the color of the dataset is taken.
    getHighlightCircleStrokeColor(): string | Color;

    getHighlightCircleStrokeAlpha(): number;

    getHighlightCircleInnerRadius(): number;

    getHighlightCircleOuterRadius(): number;

    getHighlightCircleStrokeWidth(): number;
}
