import { ILineDataSet } from '../interfaces/datasets/ILineDataSet';
import { LineDataProvider } from '../interfaces/dataprovider/LineDataProvider';

/**
 * Interface for providing a custom logic to where the filling line of a LineDataSet
 * should end. This of course only works if setFillEnabled(...) is set to true.
 *

 */
export interface IFillFormatter {
    /**
     * Returns the vertical (y-axis) position where the filled-line of the
     * LineDataSet should end.
     *
     * @param dataSet the ILineDataSet that is currently drawn
     * @param dataProvider
     * @return
     */
    getFillLinePosition(dataSet: ILineDataSet, dataProvider: LineDataProvider);
}
