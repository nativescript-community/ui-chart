import { Color } from '@nativescript/core';
import { IRadarDataSet } from '../interfaces/datasets/IRadarDataSet';
import { RadarEntry } from './RadarEntry';
import { LineRadarDataSet } from './LineRadarDataSet';
import { ColorTemplate } from '../utils/ColorTemplate';

export class RadarDataSet extends LineRadarDataSet<RadarEntry> implements IRadarDataSet {
    /// flag indicating whether highlight circle should be drawn or not
    protected mDrawHighlightCircleEnabled = false;

    protected mHighlightCircleFillColor = new Color('white');

    /// The stroke color for highlight circle.
    /// If Utils.COLOR_NONE, the color of the dataset is taken.
    protected mHighlightCircleStrokeColor: string | Color = ColorTemplate.COLOR_NONE;

    protected mHighlightCircleStrokeAlpha = 0.3 * 255;
    protected mHighlightCircleInnerRadius = 3.0;
    protected mHighlightCircleOuterRadius = 4.0;
    protected mHighlightCircleStrokeWidth = 2.0;


    constructor(yVals: RadarEntry, label: string, yProperty?) {
        super(yVals, label,null,  yProperty);
        this.init();
    }

    /// Returns true if highlight circle should be drawn, false if not

    public isDrawHighlightCircleEnabled() {
        return this.mDrawHighlightCircleEnabled;
    }

    /// Sets whether highlight circle should be drawn or not

    public setDrawHighlightCircleEnabled(enabled) {
        this.mDrawHighlightCircleEnabled = enabled;
    }

    public getHighlightCircleFillColor() {
        return this.mHighlightCircleFillColor;
    }

    public setHighlightCircleFillColor(color: Color) {
        this.mHighlightCircleFillColor = color;
    }

    /// Returns the stroke color for highlight circle.
    /// If Utils.COLOR_NONE, the color of the dataset is taken.

    public getHighlightCircleStrokeColor() {
        return this.mHighlightCircleStrokeColor;
    }

    /// Sets the stroke color for highlight circle.
    /// Set to Utils.COLOR_NONE in order to use the color of the dataset;
    public setHighlightCircleStrokeColor(color: Color) {
        this.mHighlightCircleStrokeColor = color;
    }

    public getHighlightCircleStrokeAlpha() {
        return this.mHighlightCircleStrokeAlpha;
    }

    public setHighlightCircleStrokeAlpha(alpha: number) {
        this.mHighlightCircleStrokeAlpha = alpha;
    }

    public getHighlightCircleInnerRadius() {
        return this.mHighlightCircleInnerRadius;
    }

    public setHighlightCircleInnerRadius(radius: number) {
        this.mHighlightCircleInnerRadius = radius;
    }

    public getHighlightCircleOuterRadius() {
        return this.mHighlightCircleOuterRadius;
    }

    public setHighlightCircleOuterRadius(radius: number) {
        this.mHighlightCircleOuterRadius = radius;
    }

    public getHighlightCircleStrokeWidth() {
        return this.mHighlightCircleStrokeWidth;
    }

    public setHighlightCircleStrokeWidth(strokeWidth: number) {
        this.mHighlightCircleStrokeWidth = strokeWidth;
    }
}
