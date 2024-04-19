import { ValueFormatter } from './ValueFormatter';
import format from 'number-format.js';

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
    decimalDigits;

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
        this.decimalDigits = digits;

        let b = '';
        for (let i = 0; i < digits; i++) {
            b += '0';
        }
        // Requires decimal separator in order to avoid zero format issues
        this.mFormat = '###,###,###,##0.' + b;
    }

    public getFormattedValue(value) {
        return format(this.mFormat, value);
    }
}
