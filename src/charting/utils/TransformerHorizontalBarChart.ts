import { Transformer } from './Transformer';

/**
 * Transformer class for the HorizontalBarChart.
 *

 */
export class TransformerHorizontalBarChart extends Transformer {
    /**
     * Prepares the matrix that contains all offsets.
     *
     * @param inverted
     */
    public prepareMatrixOffset(inverted) {
        this.mMatrixOffset.reset();

        // offset.postTranslate(mOffsetLeft, getHeight() - this.mOffsetBottom);

        if (!inverted) {
            this.mMatrixOffset.postTranslate(this.mViewPortHandler.offsetLeft(), this.mViewPortHandler.getChartHeight() - this.mViewPortHandler.offsetBottom());
        } else {
            this.mMatrixOffset.setTranslate(
                -(this.mViewPortHandler.getChartWidth() - this.mViewPortHandler.offsetRight()),
                this.mViewPortHandler.getChartHeight() - this.mViewPortHandler.offsetBottom()
            );
            this.mMatrixOffset.postScale(-1.0, 1.0);
        }

        // this.mMatrixOffset.set(offset);

        // this.mMatrixOffset.reset();
        //
        // this.mMatrixOffset.postTranslate(mOffsetLeft, getHeight() -
        // this.mOffsetBottom);
    }
}
