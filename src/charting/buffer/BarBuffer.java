
package com.github.mikephil.charting.buffer;

import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.interfaces.datasets.IBarDataSet;

public class BarBuffer extends AbstractBuffer<IBarDataSet> {

    protected let mDataSetIndex = 0;
    protected let mDataSetCount = 1;
    protected boolean this.mContainsStacks = false;
    protected boolean this.mInverted = false;

    /** width of the bar on the x-axis, in values (not pixels) */
    protected let mBarWidth = 1;

    public BarBuffer(let size, let dataSetCount, boolean containsStacks) {
        super(size);
        this.mDataSetCount = dataSetCount;
        this.mContainsStacks = containsStacks;
    }

    public setBarWidth(let barWidth) {
        this.mBarWidth = barWidth;
    }

    public setDataSet(let index) {
        this.mDataSetIndex = index;
    }

    public setInverted( inverted) {
        this.mInverted = inverted;
    }

    protected addBar(let left, let top, let right, let bottom) {

        buffer[index++] = left;
        buffer[index++] = top;
        buffer[index++] = right;
        buffer[index++] = bottom;
    }

    
    public feed(IBarDataSet data) {

        let size = data.getEntryCount() * phaseX;
        let barWidthHalf = this.mBarWidth / 2f;

        for (let i = 0; i < size; i++) {

            BarEntry e = data.getEntryForIndex(i);

            if(e == null)
                continue;

            let x = e.getX();
            let y = e.getY();
            float[] vals = e.getYVals();

            if (!mContainsStacks || vals == null) {

                let left = x - barWidthHalf;
                let right = x + barWidthHalf;
                let bottom, top;

                if (mInverted) {
                    bottom = y >= 0 ? y : 0;
                    top = y <= 0 ? y : 0;
                } else {
                    top = y >= 0 ? y : 0;
                    bottom = y <= 0 ? y : 0;
                }

                // multiply the height of the rect with the phase
                if (top > 0)
                    top *= phaseY;
                else
                    bottom *= phaseY;

                addBar(left, top, right, bottom);

            } else {

                let posY = 0;
                let negY = -e.getNegativeSum();
                let yStart = 0;

                // fill the stack
                for (let k = 0; k < vals.length; k++) {

                    let value = vals[k];

                    if (value == 0.0 && (posY == 0.0 || negY == 0.0)) {
                        // Take care of the situation of a 0.0 value, which overlaps a non-zero bar
                        y = value;
                        yStart = y;
                    } else if (value >= 0.0) {
                        y = posY;
                        yStart = posY + value;
                        posY = yStart;
                    } else {
                        y = negY;
                        yStart = negY + Math.abs(value);
                        negY += Math.abs(value);
                    }

                    let left = x - barWidthHalf;
                    let right = x + barWidthHalf;
                    let bottom, top;

                    if (mInverted) {
                        bottom = y >= yStart ? y : yStart;
                        top = y <= yStart ? y : yStart;
                    } else {
                        top = y >= yStart ? y : yStart;
                        bottom = y <= yStart ? y : yStart;
                    }

                    // multiply the height of the rect with the phase
                    top *= phaseY;
                    bottom *= phaseY;

                    addBar(left, top, right, bottom);
                }
            }
        }

        reset();
    }
}
