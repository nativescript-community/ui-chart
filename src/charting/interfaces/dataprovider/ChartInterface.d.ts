import { MPPointF } from '../../utils/MPPointF';
import { ValueFormatter } from '../../formatter/ValueFormatter';
import { ChartData } from '../../data/ChartData';
import { Rect } from '@nativescript-community/ui-canvas';

/**
 * Interface that provides everything there is to know about the dimensions,
 * bounds, and range of the chart.
 *

 */
export interface ChartInterface {
    /**
     * Returns the minimum x value of the chart, regardless of zoom or translation.
     *
     * @return
     */
    getXChartMin();

    /**
     * Returns the maximum x value of the chart, regardless of zoom or translation.
     *
     * @return
     */
    getXChartMax();

    getXRange();

    /**
     * Returns the minimum y value of the chart, regardless of zoom or translation.
     *
     * @return
     */
    getYChartMin();

    /**
     * Returns the maximum y value of the chart, regardless of zoom or translation.
     *
     * @return
     */
    getYChartMax();

    /**
     * Returns the maximum distance in scren dp a touch can be away from an entry to cause it to get highlighted.
     *
     * @return
     */
    getMaxHighlightDistance();

    getMeasuredWidth();

    getMeasuredHeight();

    getCenterOfView(): MPPointF;

    getCenterOffsets(): MPPointF;

    getContentRect(): Rect;

    getDefaultValueFormatter(): ValueFormatter;

    getData(): ChartData<any, any>;

    getMaxVisibleCount();
}
