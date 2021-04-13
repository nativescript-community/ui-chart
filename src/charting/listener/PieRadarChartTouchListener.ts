import { PieRadarChartBase } from '../charts/PieRadarChartBase';
import { BarLineChartBase } from '../charts/BarLineChartBase';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { Utils } from '../utils/Utils';
import { ChartGesture, ChartTouchListener } from './ChartTouchListener';
import {
    GestureHandlerStateEvent,
    GestureState,
    GestureStateEventData,
    HandlerType,
    Manager,
    RotationGestureHandler,
    TapGestureHandler
} from '@nativescript-community/gesturehandler';

/**
 * TouchListener for Pie- and RadarChart with handles all
 * touch interaction.
 *

 */
export class PieRadarChartTouchListener extends ChartTouchListener<PieRadarChartBase<any, any, any>> {
    rotationGestureHandler: RotationGestureHandler;
    tapGestureHandler: TapGestureHandler;

    /**
     * Constructor with initialization parameters.
     *
     * @param chart instance of the chart
     */
    constructor(chart: PieRadarChartBase<any, any, any>) {
        super(chart);
    }

    getOrCreateRotationGestureHandler() {
        if (!this.rotationGestureHandler) {
            const manager = Manager.getInstance();
            this.rotationGestureHandler = manager.createGestureHandler(HandlerType.ROTATION, 11231, {}).on(GestureHandlerStateEvent, this.onRotationGesture, this);
        }
        return this.rotationGestureHandler;
    }

    getOrCreateTapGestureHandler() {
        if (!this.tapGestureHandler) {
            const manager = Manager.getInstance();
            this.tapGestureHandler = manager.createGestureHandler(HandlerType.TAP, 11232, {}).on(GestureHandlerStateEvent, this.onTapGesture, this);
        }
        return this.tapGestureHandler;
    }

    setRotation(enabled: boolean) {
        if (enabled) {
            this.getOrCreateRotationGestureHandler().attachToView(this.mChart);
        } else if (this.rotationGestureHandler) {
            this.rotationGestureHandler.detachFromView(this.mChart);
        }
    }
    setTap(enabled: boolean) {
        if (enabled) {
            this.getOrCreateTapGestureHandler().attachToView(this.mChart);
        } else if (this.tapGestureHandler) {
            this.tapGestureHandler.detachFromView(this.mChart);
        }
    }
    dispose() {
        super.dispose();
        const chart = this.mChart;
        this.rotationGestureHandler && this.rotationGestureHandler.detachFromView(chart);
        this.tapGestureHandler && this.tapGestureHandler.detachFromView(chart);
        // this.longpressGestureHandler.detachFromView(chart);
    }
    init() {
        super.init();

        if (this.mChart.isRotationEnabled()) {
            this.setRotation(true);
        }

        if (this.mChart.isHighlightPerTapEnabled()) {
            this.setTap(true);
        }
        // this.longpressGestureHandler.attachToView(chart);
    }

    /**
     * Returns the correct translation depending on the provided x and y touch
     * points
     *
     * @param x
     * @param y
     * @return
     */
    public getTrans(x, y) {
        const vph = this.mChart.getViewPortHandler();
        const xTrans = x - vph.offsetLeft();
        const yTrans = -(vph.getChartHeight() - y - vph.offsetBottom());

        return { x: xTrans, y: yTrans };
    }

    /**
     * ################ ################ ################ ################
     */
    /** GESTURE RECOGNITION BELOW */

    public onRotationGesture(event: GestureStateEventData) {
        if (event.data.state === GestureState.BEGAN || event.data.state === GestureState.ACTIVE) {
            this.mLastGesture = ChartGesture.ROTATE;
            const chart = this.mChart;

            if (chart.hasListeners('rotate')) {
                chart.notify({ eventName: 'rotate', data: event.data, object: chart });
            }

            // TODO: Implement rotation for charts
        }
    }

    public onTapGesture(event: GestureStateEventData) {
        if (event.data.state === GestureState.END && event.data.prevState === GestureState.ACTIVE) {
            this.mLastGesture = ChartGesture.SINGLE_TAP;
            const chart = this.mChart;

            const h = chart.getHighlightByTouchPoint(event.data.extraData.x, event.data.extraData.y);
            if (chart.hasListeners('tap')) {
                chart.notify({ eventName: 'tap', data: event.data, object: chart, highlight: h });
            }

            if (!chart.isHighlightPerTapEnabled()) {
                return;
            }

            this.performHighlight(h);
        }
    }
}
