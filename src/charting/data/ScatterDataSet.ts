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
    mShapeSize = 15;

    /**
     * Renderer responsible for rendering this DataSet, default: square
     */
    mShapeRenderer = new SquareShapeRenderer();

    /**
     * The radius of the hole in the shape (applies to Square, Circle and Triangle)
     * - default: 0.0
     */
    mScatterShapeHoleRadius = 0;

    /**
     * Color for the hole in the shape.
     * Setting to `ColorTemplate.COLOR_NONE` will behave as transparent.
     * - default: ColorTemplate.COLOR_NONE
     */
    mScatterShapeHoleColor: string | Color = ColorTemplate.COLOR_NONE;

    constructor(yVals, label, xProperty?, yProperty?) {
        super(yVals, label, xProperty, yProperty);
        this.init();
    }
    /**
     * Sets the size in density pixels the drawn scattershape will have. This
     * only applies for non custom shapes.
     *
     * @param size
     */
    public setScatterShapeSize(size: number) {
        this.mShapeSize = size;
    }

    public getScatterShapeSize() {
        return this.mShapeSize;
    }

    /**
     * Sets the ScatterShape this DataSet should be drawn with. This will search for an available IShapeRenderer and set this
     * renderer for the DataSet.
     *
     * @param shape
     */
    public setScatterShape(shape: ScatterShape) {
        this.mShapeRenderer = ScatterDataSet.getRendererForShape(shape);
    }

    /**
     * Sets a new IShapeRenderer responsible for drawing this DataSet.
     * This can also be used to set a custom IShapeRenderer aside from the default ones.
     *
     * @param shapeRenderer
     */
    public setShapeRenderer(shapeRenderer: IShapeRenderer) {
        this.mShapeRenderer = shapeRenderer;
    }

    public getShapeRenderer(): IShapeRenderer {
        return this.mShapeRenderer;
    }

    /**
     * Sets the radius of the hole in the shape (applies to Square, Circle and Triangle)
     * Set this to <= 0 to remove holes.
     *
     * @param holeRadius
     */
    public setScatterShapeHoleRadius(holeRadius: number) {
        this.mScatterShapeHoleRadius = holeRadius;
    }

    public getScatterShapeHoleRadius() {
        return this.mScatterShapeHoleRadius;
    }

    /**
     * Sets the color for the hole in the shape.
     *
     * @param holeColor
     */
    public setScatterShapeHoleColor(holeColor: string | Color) {
        this.mScatterShapeHoleColor = holeColor;
    }

    public getScatterShapeHoleColor() {
        return this.mScatterShapeHoleColor;
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
