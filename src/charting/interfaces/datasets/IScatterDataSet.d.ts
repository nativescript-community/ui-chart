import { Color } from '@nativescript/core';
import { Entry } from '../../data/Entry';
import { IShapeRenderer } from '../../renderer/scatter/IShapeRenderer';
import { ILineScatterCandleRadarDataSet } from './ILineScatterCandleRadarDataSet';
/**
 * Created by philipp on 21/10/15.
 */
export interface IScatterDataSet extends ILineScatterCandleRadarDataSet<Entry> {
    /**
     * the size the scattershape will have, in density pixels
     */
    scatterShapeSize: number;

    /**
     * Sets the ScatterShape this DataSet should be drawn with. This will search for an available IShapeRenderer and set this
     * renderer for the DataSet.
     */
    scatterShape: ScatterShape;

    /**
     * Renderer responsible for rendering this DataSet, default: square
     */
    shapeRenderer: IShapeRenderer;

    /**
     * The radius of the hole in the shape (applies to Square, Circle and Triangle)
     * - default: 0.0
     */
    scatterShapeHoleRadius: number;

    /**
     * Color for the hole in the shape.
     * Setting to `ColorTemplate.COLOR_NONE` will behave as transparent.
     * - default: ColorTemplate.COLOR_NONE
     */
    scatterShapeHoleColor: string | Color;
}
