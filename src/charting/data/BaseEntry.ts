import Shape from '@nativescript-community/ui-canvas/shapes/shape';
import { ImageSource } from '@nativescript/core/image-source';

/**
 * Created by Philipp Jahoda on 02/06/16.
 */
export interface BaseEntry {
    icon?: ImageSource | Shape;
    data?: any;
    [k: string]: any;
}
