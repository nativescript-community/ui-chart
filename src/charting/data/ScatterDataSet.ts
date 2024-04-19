import { Color } from '@nativescript/core';
import { ScatterShape } from '../charts/ScatterChart';
import { IScatterDataSet } from '../interfaces/datasets/IScatterDataSet';
import { ChevronDownShapeRenderer } from '../renderer/scatter/ChevronDownShapeRenderer';
import { ChevronUpShapeRenderer } from '../renderer/scatter/ChevronUpShapeRenderer';
import { CircleShapeRenderer } from '../renderer/scatter/CircleShapeRenderer';
import { CrossShapeRenderer } from '../renderer/scatter/CrossShapeRenderer';
import { IShapeRenderer } from '../renderer/scatter/IShapeRenderer';
import { SquareShapeRenderer } from '../renderer/scatter/SquareShapeRenderer';
import { TriangleShapeRenderer } from '../renderer/scatter/TriangleShapeRenderer';
import { XShapeRenderer } from '../renderer/scatter/XShapeRenderer';
import { ColorTemplate } from '../utils/ColorTemplate';
import { Entry } from './Entry';
import { LineScatterCandleRadarDataSet } from './LineScatterCandleRadarDataSet';

export class ScatterDataSet extends LineScatterCandleRadarDataSet<Entry> implements IScatterDataSet {
    /**
     * the size the scattershape will have, in density pixels
     */
    scatterShapeSize = 15;

    /**
     * Sets the ScatterShape this DataSet should be drawn with. This will search for an available IShapeRenderer and set this
     * renderer for the DataSet.
     */
    public set scatterShape(shape: ScatterShape) {
        this.shapeRenderer = ScatterDataSet.getRendererForShape(shape);
    }

    /**
     * Renderer responsible for rendering this DataSet, default: square
     */
    shapeRenderer = new SquareShapeRenderer();

    /**
     * The radius of the hole in the shape (applies to Square, Circle and Triangle)
     * - default: 0.0
     */
    scatterShapeHoleRadius = 0;

    /**
     * Color for the hole in the shape.
     * Setting to `ColorTemplate.COLOR_NONE` will behave as transparent.
     * - default: ColorTemplate.COLOR_NONE
     */
    scatterShapeHoleColor: string | Color = ColorTemplate.COLOR_NONE;

    constructor(yVals, label, xProperty?, yProperty?) {
        super(yVals, label, xProperty, yProperty);
        this.init();
    }
    public static getRendererForShape(shape: ScatterShape) {
        switch (shape) {
            case ScatterShape.SQUARE:
                return new SquareShapeRenderer();
            case ScatterShape.CIRCLE:
                return new CircleShapeRenderer();
            case ScatterShape.TRIANGLE:
                return new TriangleShapeRenderer();
            case ScatterShape.CROSS:
                return new CrossShapeRenderer();
            case ScatterShape.X:
                return new XShapeRenderer();
            case ScatterShape.CHEVRON_UP:
                return new ChevronUpShapeRenderer();
            case ScatterShape.CHEVRON_DOWN:
                return new ChevronDownShapeRenderer();
        }
    }
}
