import { Color } from '@nativescript/core';
import { IRadarDataSet } from '../interfaces/datasets/IRadarDataSet';
import { RadarEntry } from './RadarEntry';
import { LineRadarDataSet } from './LineRadarDataSet';
import { ColorTemplate } from '../utils/ColorTemplate';

export class RadarDataSet extends LineRadarDataSet<RadarEntry> implements IRadarDataSet {
    /// flag indicating whether highlight circle should be drawn or not
    drawHighlightCircleEnabled = false;

    highlightCircleFillColor = new Color('white');

    /// The stroke color for highlight circle.
    /// If Utils.COLOR_NONE, the color of the dataset is taken.
    highlightCircleStrokeColor: string | Color = ColorTemplate.COLOR_NONE;

    highlightCircleStrokeAlpha = 0.3 * 255;
    highlightCircleInnerRadius = 3.0;
    highlightCircleOuterRadius = 4.0;
    highlightCircleStrokeWidth = 2.0;

    constructor(yVals: RadarEntry, label: string, yProperty?) {
        super(yVals, label, null, yProperty);
        this.init();
    }
}
