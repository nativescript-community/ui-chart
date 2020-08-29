import { ImageSource } from '@nativescript/core/image-source';

/**
 * Created by Philipp Jahoda on 02/06/16.
 */
export interface BaseEntry {
  x: number;
  y: number;
  icon?: ImageSource;
  data?: any;
}
