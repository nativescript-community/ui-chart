import { IFillFormatter } from './IFillFormatter';
import { ILineDataSet } from '../interfaces/datasets/ILineDataSet';
import { LineDataProvider } from '../interfaces/dataprovider/LineDataProvider';

export class DefaultFillFormatter implements IFillFormatter {
    public getFillLinePosition(dataSet: ILineDataSet, dataProvider: LineDataProvider) {
        let fillMin = 0;
        const chartMaxY = dataProvider.getYChartMax();
        const chartMinY = dataProvider.getYChartMin();

        const data = dataProvider.getLineData();

        if (dataSet.getYMax() > 0 && dataSet.getYMin() < 0) {
            fillMin = 0;
        } else {
            let max, min;

            if (data.getYMax() > 0) {
                max = 0;
            } else {
                max = chartMaxY;
            }
            if (data.getYMin() < 0) {
                min = 0;
            } else {
                min = chartMinY;
            }

            fillMin = dataSet.getYMin() >= 0 ? min : max;
        }

        return fillMin;
    }
}
