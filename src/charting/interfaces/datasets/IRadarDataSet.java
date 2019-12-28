package com.github.mikephil.charting.interfaces.datasets;

import com.github.mikephil.charting.data.RadarEntry;

/**
 * Created by Philipp Jahoda on 03/11/15.
 */
public interface IRadarDataSet extends ILineRadarDataSet<RadarEntry> {

    /// flag indicating whether highlight circle should be drawn or not
    boolean isDrawHighlightCircleEnabled();

    /// Sets whether highlight circle should be drawn or not
    void setDrawHighlightCircleEnabled( enabled);

    let getHighlightCircleFillColor();

    /// The stroke color for highlight circle.
    /// If Utils.COLOR_NONE, the color of the dataset is taken.
    let getHighlightCircleStrokeColor();

    let getHighlightCircleStrokeAlpha();

    let getHighlightCircleInnerRadius();

    let getHighlightCircleOuterRadius();

    let getHighlightCircleStrokeWidth();

}
