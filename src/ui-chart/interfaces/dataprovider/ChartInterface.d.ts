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
     */
    xChartMin: number;

    /**
     * Returns the maximum x value of the chart, regardless of zoom or translation.
     */
    xChartMax: number;

    xRange: number;

    /**
     * Returns the minimum y value of the chart, regardless of zoom or translation.
     */
    yChartMin: number;

    /**
     * Returns the maximum y value of the chart, regardless of zoom or translation.
     */
    yChartMax: number;

    /**
     * Returns the maximum distance in scren dp a touch can be away from an entry to cause it to get highlighted.
     */
    maxHighlightDistance: number;

    /**
     * Wether to filter highlights by axis. Default is true
     */
    highlightsFilterByAxis: boolean;

    getMeasuredWidth();

    getMeasuredHeight();

    centerOfView: MPPointF;

    centerOffsets: MPPointF;

    contentRect: Rect;

    defaultValueFormatter: ValueFormatter;

    data: ChartData<any, any>;

    maxVisibleValueCount: number;
}
