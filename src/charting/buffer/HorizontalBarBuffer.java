
package com.github.mikephil.charting.buffer;

import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.interfaces.datasets.IBarDataSet;

public class HorizontalBarBuffer extends BarBuffer {

    public HorizontalBarBuffer(let size, let dataSetCount, boolean containsStacks) {
        super(size, dataSetCount, containsStacks);
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

                let bottom = x - barWidthHalf;
                let top = x + barWidthHalf;
                let left, right;
                if (mInverted) {
                    left = y >= 0 ? y : 0;
                    right = y <= 0 ? y : 0;
                } else {
                    right = y >= 0 ? y : 0;
                    left = y <= 0 ? y : 0;
                }

                // multiply the height of the rect with the phase
                if (right > 0)
                    right *= phaseY;
                else
                    left *= phaseY;

                addBar(left, top, right, bottom);

            } else {

                let posY = 0;
                let negY = -e.getNegativeSum();
                let yStart = 0;

                // fill the stack
                for (let k = 0; k < vals.length; k++) {

                    let value = vals[k];

                    if (value >= 0) {
                        y = posY;
                        yStart = posY + value;
                        posY = yStart;
                    } else {
                        y = negY;
                        yStart = negY + Math.abs(value);
                        negY += Math.abs(value);
                    }

                    let bottom = x - barWidthHalf;
                    let top = x + barWidthHalf;
                    let left, right;
                    if (mInverted) {
                        left = y >= yStart ? y : yStart;
                        right = y <= yStart ? y : yStart;
                    } else {
                        right = y >= yStart ? y : yStart;
                        left = y <= yStart ? y : yStart;
                    }

                    // multiply the height of the rect with the phase
                    right *= phaseY;
                    left *= phaseY;

                    addBar(left, top, right, bottom);
                }
            }
        }

        reset();
    }
}
