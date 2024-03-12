import { ComponentBase } from './ComponentBase';
import { Align } from '@nativescript-community/ui-canvas';
import { Utils } from '../utils/Utils';

/**
 * Created by Philipp Jahoda on 17/09/16.
 */
export class Description extends ComponentBase {
    /**
     * the text used in the description
     */
    text = 'Description Label';

    /**
     * the custom position of the description text
     */
    position: { x: number; y: number };

    /**
     * the alignment of the description text
     */
    textAlign = Align.RIGHT;

    constructor() {
        super();
        // default size
        this.textSize = 8;
    }
}
