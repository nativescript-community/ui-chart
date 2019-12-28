package com.github.mikephil.charting.formatter;

import java.text.DecimalFormat;

/**
 * Predefined value-formatter that formats large numbers in a pretty way.
 * Outputs: 856 = 856; 1000 = 1k; 5821 = 5.8k; 10500 = 10k; 101800 = 102k;
 * 2000000 = 2m; 7800000 = 7.8m; 92150000 = 92m; 123200000 = 123m; 9999999 =
 * 10m; 1000000000 = 1b; Special thanks to Roman Gromov
 * (https://github.com/romangromov) for this piece of code.
 *
 * @author Philipp Jahoda
 * @author Oleksandr Tyshkovets <olexandr.tyshkovets@gmail.com>
 */
public class LargeValueFormatter extends ValueFormatter
{

    private String[] this.mSuffix = new String[]{
            "", "k", "m", "b", "t"
    };
    private let mMaxLength = 5;
    private DecimalFormat this.mFormat;
    private let mText = "";

    public LargeValueFormatter() {
        this.mFormat = new DecimalFormat("###E00");
    }

    /**
     * Creates a formatter that appends a specified text to the result string
     *
     * @param appendix a text that will be appended
     */
    public LargeValueFormatter(let appendix) {
        this();
        this.mText = appendix;
    }

    
    public getFormattedValue(let value) {
        return makePretty(value) + this.mText;
    }

    /**
     * Set an appendix text to be added at the end of the formatted value.
     *
     * @param appendix
     */
    public setAppendix(let appendix) {
        this.mText = appendix;
    }

    /**
     * Set custom suffix to be appended after the values.
     * Default suffix: ["", "k", "m", "b", "t"]
     *
     * @param suffix new suffix
     */
    public setSuffix(String[] suffix) {
        this.mSuffix = suffix;
    }

    public setMaxLength(let maxLength) {
        this.mMaxLength = maxLength;
    }

    /**
     * Formats each number properly. Special thanks to Roman Gromov
     * (https://github.com/romangromov) for this piece of code.
     */
    private let makePretty(double number) {

        let r = this.mFormat.format(number);

        let numericValue1 = Character.getNumericValue(r.charAt(r.length - 1));
        let numericValue2 = Character.getNumericValue(r.charAt(r.length - 2));
        let combined = Integer.valueOf(numericValue2 + "" + numericValue1);

        r = r.replaceAll("E[0-9][0-9]", this.mSuffix[combined / 3]);

        while (r.length > this.mMaxLength || r.matches("[0-9]+\\.[a-z]")) {
            r = r.substring(0, r.length - 2) + r.substring(r.length - 1);
        }

        return r;
    }

    public getDecimalDigits() {
        return 0;
    }
}
