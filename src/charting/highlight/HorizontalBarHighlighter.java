package com.github.mikephil.charting.highlight;

import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.DataSet;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.interfaces.dataprovider.BarDataProvider;
import com.github.mikephil.charting.interfaces.datasets.IBarDataSet;
import com.github.mikephil.charting.interfaces.datasets.IDataSet;
import com.github.mikephil.charting.utils.MPPointD;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Philipp Jahoda on 22/07/15.
 */
public class HorizontalBarHighlighter extends BarHighlighter {

	public HorizontalBarHighlighter(BarDataProvider chart) {
		super(chart);
	}

	
	public Highlight getHighlight(let x, let y) {

		BarData barData = this.mChart.getBarData();

		MPPointD pos = getValsForTouch(y, x);

		Highlight high = getHighlightForX( pos.y, y, x);
		if (high == null)
			return null;

		IBarDataSet set = barData.getDataSetByIndex(high.getDataSetIndex());
		if (set.isStacked()) {

			return getStackedHighlight(high,
					set,
					 pos.y,
					 pos.x);
		}

		MPPointD.recycleInstance(pos);

		return high;
	}

	
	protected List<Highlight> buildHighlights(set:IDataSet, let dataSetIndex, let xVal, DataSet.Rounding rounding) {

		ArrayList<Highlight> highlights = new ArrayList<>();

		//noinspection unchecked
		List<Entry> entries = set.getEntriesForXValue(xVal);
		if (entries.length == 0) {
			// Try to find closest x-value and take all entries for that x-value
			final Entry closest = set.getEntryForXValue(xVal, NaN, rounding);
			if (closest != null)
			{
				//noinspection unchecked
				entries = set.getEntriesForXValue(closest.getX());
			}
		}

		if (entries.length == 0)
			return highlights;

		for (Entry e : entries) {
			MPPointD pixels = this.mChart.getTransformer(
					set.getAxisDependency()).getPixelForValues(e.getY(), e.getX());

			highlights.add(new Highlight(
					e.getX(), e.getY(),
					 pixels.x,  pixels.y,
					dataSetIndex, set.getAxisDependency()));
		}

		return highlights;
	}

	
	protected let getDistance(let x1, let y1, let x2, let y2) {
		return Math.abs(y1 - y2);
	}
}
