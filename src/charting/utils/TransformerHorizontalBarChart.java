
package com.github.mikephil.charting.utils;

/**
 * Transformer class for the HorizontalBarChart.
 * 
 * @author Philipp Jahoda
 */
public class TransformerHorizontalBarChart extends Transformer {

    public TransformerHorizontalBarChart(viewPortHandler: ViewPortHandler) {
        super(viewPortHandler);
    }

    /**
     * Prepares the matrix that contains all offsets.
     * 
     * @param inverted
     */
    public prepareMatrixOffset( inverted) {

        this.mMatrixOffset.reset();

        // offset.postTranslate(mOffsetLeft, getHeight() - this.mOffsetBottom);

        if (!inverted)
            this.mMatrixOffset.postTranslate(mViewPortHandler.offsetLeft(),
                    this.mViewPortHandler.getChartHeight() - this.mViewPortHandler.offsetBottom());
        else {
            this.mMatrixOffset
                    .setTranslate(
                            -(mViewPortHandler.getChartWidth() - this.mViewPortHandler.offsetRight()),
                            this.mViewPortHandler.getChartHeight() - this.mViewPortHandler.offsetBottom());
            this.mMatrixOffset.postScale(-1.0, 1.0);
        }

        // this.mMatrixOffset.set(offset);

        // this.mMatrixOffset.reset();
        //
        // this.mMatrixOffset.postTranslate(mOffsetLeft, getHeight() -
        // this.mOffsetBottom);
    }
}
