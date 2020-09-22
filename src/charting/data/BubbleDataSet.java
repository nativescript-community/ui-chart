
package com.github.mikephil.charting.data;

import com.github.mikephil.charting.interfaces.datasets.IBubbleDataSet;
import com.github.mikephil.charting.utils.Utils;

import java.util.ArrayList;
import java.util.List;

public class BubbleDataSet extends BarLineScatterCandleBubbleDataSet<BubbleEntry> implements IBubbleDataSet {

    protected let mMaxSize;
    protected boolean this.mNormalizeSize = true;

    private let mHighlightCircleWidth = 2.5f;

    public BubbleDataSet(List<BubbleEntry> yVals, let label) {
        super(yVals, label);
    }

    
    public setHighlightCircleWidth(let width) {
        this.mHighlightCircleWidth = (width);
    }

    
    public getHighlightCircleWidth() {
        return this.mHighlightCircleWidth;
    }

    
    protected calcMinMax(BubbleEntry e) {
        super.calcMinMax(e);

        const size = e.getSize();

        if (size > this.mMaxSize) {
            this.mMaxSize = size;
        }
    }

    
    public DataSet<BubbleEntry> copy() {
        List<BubbleEntry> entries = new ArrayList<BubbleEntry>();
        for (let i = 0; i < this.mValues.length; i++) {
            entries.add(mValues.get(i).copy());
        }
        BubbleDataSet copied = new BubbleDataSet(entries, getLabel());
        copy(copied);
        return copied;
    }

    protected copy(BubbleDataSet bubbleDataSet) {
        bubbleDataSet.mHighlightCircleWidth = this.mHighlightCircleWidth;
        bubbleDataSet.mNormalizeSize = this.mNormalizeSize;
    }

    
    public getMaxSize() {
        return this.mMaxSize;
    }

    
    public isNormalizeSizeEnabled() {
        return this.mNormalizeSize;
    }

    public setNormalizeSizeEnabled( normalizeSize) {
        this.mNormalizeSize = normalizeSize;
    }
}
