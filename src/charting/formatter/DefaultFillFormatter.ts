import { IFillFormatter } from './IFillFormatter';
import { ILineDataSet } from '../interfaces/datasets/ILineDataSet';
import { LineDataProvider } from '../interfaces/dataprovider/LineDataProvider';

export class DefaultFillFormatter implements IFillFormatter {
    public getFillLinePosition(dataSet: ILineDataSet, dataProvider: LineDataProvider) {
        let fillMin = 0;
        const chartMaxY = dataProvider.yChartMax;
        const chartMinY = dataProvider.yChartMin;

        const data = dataProvider.lineData;

        if (dataSet.yMax > 0 && dataSet.yMin < 0) {
            fillMin = 0;
        } else {
            let max, min;

            if (data.yMax > 0) {
                max = 0;
            } else {
                max = chartMaxY;
            }
            if (data.yMin < 0) {
                min = 0;
            } else {
                min = chartMinY;
            }

            fillMin = dataSet.yMin >= 0 ? min : max;
        }

        return fillMin;
    }
}
