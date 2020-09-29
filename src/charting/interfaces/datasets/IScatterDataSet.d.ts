import { Color } from '@nativescript/core';
import { Entry } from '../../data/Entry';
import { IShapeRenderer } from '../../renderer/scatter/IShapeRenderer';
import { ILineScatterCandleRadarDataSet } from './ILineScatterCandleRadarDataSet';
/**
 * Created by philipp on 21/10/15.
 */
export interface IScatterDataSet extends ILineScatterCandleRadarDataSet<Entry> {
    /**
     * Returns the currently set scatter shape size
     *
     * @return
     */
    getScatterShapeSize(): number;

    /**
     * Returns radius of the hole in the shape
     *
     * @return
     */
    getScatterShapeHoleRadius(): number;

    /**
     * Returns the color for the hole in the shape
     *
     * @return
     */
    getScatterShapeHoleColor(): string | Color;

    /**
     * Returns the IShapeRenderer responsible for rendering this DataSet.
     *
     * @return
     */
    getShapeRenderer(): IShapeRenderer;
}
