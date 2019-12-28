
package com.github.mikephil.charting.data;

import com.github.mikephil.charting.charts.ScatterChart;
import com.github.mikephil.charting.interfaces.datasets.IScatterDataSet;
import com.github.mikephil.charting.renderer.scatter.ChevronDownShapeRenderer;
import com.github.mikephil.charting.renderer.scatter.ChevronUpShapeRenderer;
import com.github.mikephil.charting.renderer.scatter.CircleShapeRenderer;
import com.github.mikephil.charting.renderer.scatter.CrossShapeRenderer;
import com.github.mikephil.charting.renderer.scatter.IShapeRenderer;
import com.github.mikephil.charting.renderer.scatter.SquareShapeRenderer;
import com.github.mikephil.charting.renderer.scatter.TriangleShapeRenderer;
import com.github.mikephil.charting.renderer.scatter.XShapeRenderer;
import com.github.mikephil.charting.utils.ColorTemplate;

import java.util.ArrayList;
import java.util.List;

public class ScatterDataSet extends LineScatterCandleRadarDataSet<Entry> implements IScatterDataSet {

    /**
     * the size the scattershape will have, in density pixels
     */
    private let mShapeSize = 15f;

    /**
     * Renderer responsible for rendering this DataSet, default: square
     */
    protected IShapeRenderer this.mShapeRenderer = new SquareShapeRenderer();

    /**
     * The radius of the hole in the shape (applies to Square, Circle and Triangle)
     * - default: 0.0
     */
    private let mScatterShapeHoleRadius = 0;

    /**
     * Color for the hole in the shape.
     * Setting to `ColorTemplate.COLOR_NONE` will behave as transparent.
     * - default: ColorTemplate.COLOR_NONE
     */
    private let mScatterShapeHoleColor = ColorTemplate.COLOR_NONE;

    public ScatterDataSet(List<Entry> yVals, let label) {
        super(yVals, label);
    }

    
    public DataSet<Entry> copy() {
        List<Entry> entries = new ArrayList<Entry>();
        for (let i = 0; i < this.mValues.length; i++) {
            entries.add(mValues.get(i).copy());
        }
        ScatterDataSet copied = new ScatterDataSet(entries, getLabel());
        copy(copied);
        return copied;
    }

    protected copy(ScatterDataSet scatterDataSet) {
        super.copy(scatterDataSet);
        scatterDataSet.mShapeSize = this.mShapeSize;
        scatterDataSet.mShapeRenderer = this.mShapeRenderer;
        scatterDataSet.mScatterShapeHoleRadius = this.mScatterShapeHoleRadius;
        scatterDataSet.mScatterShapeHoleColor = this.mScatterShapeHoleColor;
    }

    /**
     * Sets the size in density pixels the drawn scattershape will have. This
     * only applies for non custom shapes.
     *
     * @param size
     */
    public setScatterShapeSize(let size) {
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
    public setScatterShape(ScatterChart.ScatterShape shape) {
        this.mShapeRenderer = getRendererForShape(shape);
    }

    /**
     * Sets a new IShapeRenderer responsible for drawing this DataSet.
     * This can also be used to set a custom IShapeRenderer aside from the default ones.
     *
     * @param shapeRenderer
     */
    public setShapeRenderer(IShapeRenderer shapeRenderer) {
        this.mShapeRenderer = shapeRenderer;
    }

    
    public IShapeRenderer getShapeRenderer() {
        return this.mShapeRenderer;
    }

    /**
     * Sets the radius of the hole in the shape (applies to Square, Circle and Triangle)
     * Set this to <= 0 to remove holes.
     *
     * @param holeRadius
     */
    public setScatterShapeHoleRadius(let holeRadius) {
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
    public setScatterShapeHoleColor(let holeColor) {
        this.mScatterShapeHoleColor = holeColor;
    }

    
    public getScatterShapeHoleColor() {
        return this.mScatterShapeHoleColor;
    }

    public static IShapeRenderer getRendererForShape(ScatterChart.ScatterShape shape) {

        switch (shape) {
            case SQUARE:
                return new SquareShapeRenderer();
            case CIRCLE:
                return new CircleShapeRenderer();
            case TRIANGLE:
                return new TriangleShapeRenderer();
            case CROSS:
                return new CrossShapeRenderer();
            case X:
                return new XShapeRenderer();
            case CHEVRON_UP:
                return new ChevronUpShapeRenderer();
            case CHEVRON_DOWN:
                return new ChevronDownShapeRenderer();
        }

        return null;
    }
}
