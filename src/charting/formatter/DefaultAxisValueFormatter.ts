import { ValueFormatter } from './ValueFormatter';
const format = require('number-format.js');

/**
 * Created by philipp on 02/06/16.
 */
export class DefaultAxisValueFormatter extends ValueFormatter {
    /**
     * decimalformat for formatting
     */
    protected mFormat: string;

    /**
     * the number of decimal digits this formatter uses
     */
    protected digits;

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

    setup(digits) {
        this.digits = digits;

        let b = '';
        for (let i = 0; i < digits; i++) {
            if (i === 0) b += '.';
            b += '0';
        }

        this.mFormat = '###,###,###,##0' + b;
    }

    public getFormattedValue(value) {
        return format(this.mFormat, value);
    }

    /**
     * Returns the number of decimal digits this formatter uses or -1, if unspecified.
     *
     * @return
     */
    public getDecimalDigits() {
        return this.digits;
    }
}
