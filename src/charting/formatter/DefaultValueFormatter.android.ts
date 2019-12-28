import { ValueFormatter } from './ValueFormatter';

export class DefaultValueFormatter extends ValueFormatter {
    /**
     * DecimalFormat for formatting
     */
    protected mFormat: java.text.DecimalFormat;

    protected mDecimalDigits;

    /**
     * Constructor that specifies to how many digits the value should be
     * formatted.
     *
     * @param digits
     */
    constructor(digits) {
        super();
        this.setup(digits);
    }

    /**
     * Sets up the formatter with a given number of decimal digits.
     *
     * @param digits
     */
    public setup(digits) {
        this.mDecimalDigits = digits;

        let b = '';
        for (let i = 0; i < digits; i++) {
            if (i == 0) b += '.';
            b += '0';
        }

        this.mFormat = new java.text.DecimalFormat('###,###,###,##0' + b);
    }

    public getFormattedValue(value) {
        // put more logic here ...
        // avoid memory allocations here (for performance reasons)

        return this.mFormat.format(value);
    }

    /**
     * Returns the number of decimal digits this formatter uses.
     *
     * @return
     */
    public getDecimalDigits() {
        return this.mDecimalDigits;
    }
}
