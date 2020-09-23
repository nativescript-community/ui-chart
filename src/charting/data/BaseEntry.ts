import { ImageSource } from '@nativescript/core/image-source';

/**
 * Created by Philipp Jahoda on 02/06/16.
 */
export interface BaseEntry {
    icon?: ImageSource;
    data?: any;
    [k: string]: any;
}
