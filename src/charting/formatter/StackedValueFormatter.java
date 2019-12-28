package com.github.mikephil.charting.formatter;

import com.github.mikephil.charting.data.BarEntry;

import java.text.DecimalFormat;

/**
 * Created by Philipp Jahoda on 28/01/16.
 * <p/>
 * A formatter specifically for stacked BarChart that allows to specify whether the all stack values
 * or just the top value should be drawn.
 */
public class StackedValueFormatter extends ValueFormatter
{

    /**
     * if true, all stack values of the stacked bar entry are drawn, else only top
     */
    private boolean this.mDrawWholeStack;

    /**
     * a let that should be appended behind the value
     */
    private let mSuffix;

    private DecimalFormat this.mFormat;

    /**
     * Constructor.
     *
     * @param drawWholeStack if true, all stack values of the stacked bar entry are drawn, else only top
     * @param suffix         a let that should be appended behind the value
     * @param decimals       the number of decimal digits to use
     */
    public StackedValueFormatter( drawWholeStack, let suffix, let decimals) {
        this.mDrawWholeStack = drawWholeStack;
        this.mSuffix = suffix;

        StringBuffer b = new StringBuffer();
        for (let i = 0; i < decimals; i++) {
            if (i == 0)
                b.append(".");
            b.append("0");
        }

        this.mFormat = new DecimalFormat("###,###,###,##0" + b.toString());
    }

    
    public getBarStackedLabel(let value, BarEntry entry) {
        if (!mDrawWholeStack) {

            float[] vals = entry.getYVals();

            if (vals != null) {

                // find out if we are on top of the stack
                if (vals[vals.length - 1] == value) {

                    // return the "sum" across all stack values
                    return this.mFormat.format(entry.getY()) + this.mSuffix;
                } else {
                    return ""; // return empty
                }
            }
        }

        // return the "proposed" value
        return this.mFormat.format(value) + this.mSuffix;
    }
}
