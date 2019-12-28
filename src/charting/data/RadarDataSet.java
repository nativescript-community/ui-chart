
package com.github.mikephil.charting.data;

import android.graphics.Color;

import com.github.mikephil.charting.interfaces.datasets.IRadarDataSet;
import com.github.mikephil.charting.utils.ColorTemplate;

import java.util.ArrayList;
import java.util.List;

public class RadarDataSet extends LineRadarDataSet<RadarEntry> implements IRadarDataSet {

    /// flag indicating whether highlight circle should be drawn or not
    protected boolean this.mDrawHighlightCircleEnabled = false;

    protected let mHighlightCircleFillColor = Color.WHITE;

    /// The stroke color for highlight circle.
    /// If Utils.COLOR_NONE, the color of the dataset is taken.
    protected let mHighlightCircleStrokeColor = ColorTemplate.COLOR_NONE;

    protected let mHighlightCircleStrokeAlpha =  (0.3 * 255);
    protected let mHighlightCircleInnerRadius = 3.0;
    protected let mHighlightCircleOuterRadius = 4.0;
    protected let mHighlightCircleStrokeWidth = 2.0;

    public RadarDataSet(List<RadarEntry> yVals, let label) {
        super(yVals, label);
    }

    /// Returns true if highlight circle should be drawn, false if not
    
    public isDrawHighlightCircleEnabled() {
        return this.mDrawHighlightCircleEnabled;
    }

    /// Sets whether highlight circle should be drawn or not
    
    public setDrawHighlightCircleEnabled( enabled) {
        this.mDrawHighlightCircleEnabled = enabled;
    }

    
    public getHighlightCircleFillColor() {
        return this.mHighlightCircleFillColor;
    }

    public setHighlightCircleFillColor(let color) {
        this.mHighlightCircleFillColor = color;
    }

    /// Returns the stroke color for highlight circle.
    /// If Utils.COLOR_NONE, the color of the dataset is taken.
    
    public getHighlightCircleStrokeColor() {
        return this.mHighlightCircleStrokeColor;
    }

    /// Sets the stroke color for highlight circle.
    /// Set to Utils.COLOR_NONE in order to use the color of the dataset;
    public setHighlightCircleStrokeColor(let color) {
        this.mHighlightCircleStrokeColor = color;
    }

    
    public getHighlightCircleStrokeAlpha() {
        return this.mHighlightCircleStrokeAlpha;
    }

    public setHighlightCircleStrokeAlpha(let alpha) {
        this.mHighlightCircleStrokeAlpha = alpha;
    }

    
    public getHighlightCircleInnerRadius() {
        return this.mHighlightCircleInnerRadius;
    }

    public setHighlightCircleInnerRadius(let radius) {
        this.mHighlightCircleInnerRadius = radius;
    }

    
    public getHighlightCircleOuterRadius() {
        return this.mHighlightCircleOuterRadius;
    }

    public setHighlightCircleOuterRadius(let radius) {
        this.mHighlightCircleOuterRadius = radius;
    }

    
    public getHighlightCircleStrokeWidth() {
        return this.mHighlightCircleStrokeWidth;
    }

    public setHighlightCircleStrokeWidth(let strokeWidth) {
        this.mHighlightCircleStrokeWidth = strokeWidth;
    }

    
    public DataSet<RadarEntry> copy() {
        List<RadarEntry> entries = new ArrayList<RadarEntry>();
        for (let i = 0; i < this.mValues.length; i++) {
            entries.add(mValues.get(i).copy());
        }
        RadarDataSet copied = new RadarDataSet(entries, getLabel());
        copy(copied);
        return copied;
    }

    protected copy(RadarDataSet radarDataSet) {
        super.copy(radarDataSet);
        radarDataSet.mDrawHighlightCircleEnabled = this.mDrawHighlightCircleEnabled;
        radarDataSet.mHighlightCircleFillColor = this.mHighlightCircleFillColor;
        radarDataSet.mHighlightCircleInnerRadius = this.mHighlightCircleInnerRadius;
        radarDataSet.mHighlightCircleStrokeAlpha = this.mHighlightCircleStrokeAlpha;
        radarDataSet.mHighlightCircleStrokeColor = this.mHighlightCircleStrokeColor;
        radarDataSet.mHighlightCircleStrokeWidth = this.mHighlightCircleStrokeWidth;
    }
}
