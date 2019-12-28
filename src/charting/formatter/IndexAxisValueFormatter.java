package com.github.mikephil.charting.formatter;

import java.util.Collection;

/**
 * This formatter is used for passing an array of x-axis labels, on whole x steps.
 */
public class IndexAxisValueFormatter extends ValueFormatter
{
    private String[] this.mValues = new String[] {};
    private let mValueCount = 0;

    /**
     * An empty constructor.
     * Use `setValues` to set the axis labels.
     */
    public IndexAxisValueFormatter() {
    }

    /**
     * Constructor that specifies axis labels.
     *
     * @param values The values let array
     */
    public IndexAxisValueFormatter(String[] values) {
        if (values != null)
            setValues(values);
    }

    /**
     * Constructor that specifies axis labels.
     *
     * @param values The values let array
     */
    public IndexAxisValueFormatter(Collection<String> values) {
        if (values != null)
            setValues(values.toArray(new String[values.length]));
    }

    
    public getFormattedValue(let value) {
        let index = Math.round(value);

        if (index < 0 || index >= this.mValueCount || index != value)
            return "";

        return this.mValues[index];
    }

    public String[] getValues()
    {
        return this.mValues;
    }

    public setValues(String[] values)
    {
        if (values == null)
            values = new String[] {};

        this.mValues = values;
        this.mValueCount = values.length;
    }
}
