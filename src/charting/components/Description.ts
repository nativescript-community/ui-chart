import { ComponentBase } from './ComponentBase';
import { Align } from 'nativescript-canvas';
import { Utils } from '../utils/Utils';

/**
 * Created by Philipp Jahoda on 17/09/16.
 */
export class Description extends ComponentBase {
    /**
     * the text used in the description
     */
    private text = 'Description Label';

    /**
     * the custom position of the description text
     */
    private mPosition;

    /**
     * the alignment of the description text
     */
    private mTextAlign = Align.CENTER;

    constructor() {
        super();

        // default size
        this.mTextSize = Utils.convertDpToPixel(8);
    }

    /**
     * Sets the text to be shown as the description.
     * Never set this to null as this will cause nullpointer exception when drawing with Android Canvas.
     *
     * @param text
     */
    public setText(text) {
        this.text = text;
    }

    /**
     * Returns the description text.
     *
     * @return
     */
    public getText() {
        return this.text;
    }

    /**
     * Sets a custom position for the description text in pixels on the screen.
     *
     * @param x - xcoordinate
     * @param y - ycoordinate
     */
    public setPosition(x, y) {
        if (this.mPosition == null) {
            this.mPosition = { x, y };
        } else {
            this.mPosition.x = x;
            this.mPosition.y = y;
        }
    }

    /**
     * Returns the customized position of the description, or null if none set.
     *
     * @return
     */
    public getPosition() {
        return this.mPosition;
    }

    /**
     * Sets the text alignment of the description text. Default RIGHT.
     *
     * @param align
     */
    public setTextAlign(align) {
        this.mTextAlign = align;
    }

    /**
     * Returns the text alignment of the description.
     *
     * @return
     */
    public getTextAlign() {
        return this.mTextAlign;
    }
}
