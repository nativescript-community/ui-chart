import { PieRadarChartBase } from '../charts/PieRadarChartBase';
import { BarLineChartBase } from '../charts/BarLineChartBase';
import { IDataSet } from '../interfaces/datasets/IDataSet';
import { Utils } from '../utils/Utils';
import { ChartGesture, ChartTouchListener } from './ChartTouchListener';
import {
    GestureHandlerStateEvent,
    GestureHandlerTouchEvent,
    GestureState,
    GestureStateEventData,
    GestureTouchEventData,
    HandlerType,
    Manager,
    RotationGestureHandler,
    TapGestureHandler
} from '@nativescript-community/gesturehandler';
import { time } from '@nativescript/core/profiling';

let TAP_HANDLER_TAG = 11232000;
let ROTATION_HANDLER_TAG = 11231000;

class AngularVelocitySample {
    public time;
    public angle;

    public constructor(time, angle) {
        this.time = time;
        this.angle = angle;
    }
}
/**
 * TouchListener for Pie- and RadarChart with handles all
 * touch interaction.
 *

 */
export class PieRadarChartTouchListener extends ChartTouchListener<PieRadarChartBase<any, any, any>> {
    rotationGestureHandler: RotationGestureHandler;
    tapGestureHandler: TapGestureHandler;

    /**
     * the angle where the dragging started
     */
    private mStartAngle = 0;

    private _velocitySamples: AngularVelocitySample[] = [];

    private mDecelerationLastTime = 0;
    private mDecelerationAngularVelocity = 0;

    /**
     * Constructor with initialization parameters.
     *
     * @param chart instance of the chart
     */
    TAP_HANDLER_TAG;
    ROTATION_HANDLER_TAG;
    constructor(chart: PieRadarChartBase<any, any, any>) {
        super(chart);
        this.TAP_HANDLER_TAG = TAP_HANDLER_TAG++;
        this.ROTATION_HANDLER_TAG = ROTATION_HANDLER_TAG++;
    }

    getTapGestureOptions() {
        return { gestureTag: this.TAP_HANDLER_TAG, ...(this.chart.tapGestureOptions || {}) };
    }
    getRotationGestureOptions() {
        return { gestureTag: this.ROTATION_HANDLER_TAG, ...(this.chart.rotationGestureOptions || {}) };
    }

    getOrCreateRotationGestureHandler() {
        if (!this.rotationGestureHandler) {
            const manager = Manager.getInstance();
            const options = this.getRotationGestureOptions();
            this.rotationGestureHandler = manager.createGestureHandler(HandlerType.ROTATION, options.gestureTag, {});
            this.rotationGestureHandler.on(GestureHandlerStateEvent, this.onRotationGesture, this);
            this.rotationGestureHandler.on(GestureHandlerTouchEvent, this.onRotationGestureTouch, this);
        }
        return this.rotationGestureHandler;
    }

    getOrCreateTapGestureHandler() {
        if (!this.tapGestureHandler) {
            const manager = Manager.getInstance();
            const options = this.getTapGestureOptions();
            this.tapGestureHandler = manager.createGestureHandler(HandlerType.TAP, options.gestureTag, {});
            this.tapGestureHandler.on(GestureHandlerStateEvent, this.onTapGesture, this);
        }
        return this.tapGestureHandler;
    }

    setRotation(enabled: boolean) {
        if (enabled) {
            this.getOrCreateRotationGestureHandler().attachToView(this.chart);
        } else if (this.rotationGestureHandler) {
            this.rotationGestureHandler.detachFromView(this.chart);
        }
    }
    setTap(enabled: boolean) {
        if (enabled) {
            this.getOrCreateTapGestureHandler().attachToView(this.chart);
        } else if (this.tapGestureHandler) {
            this.tapGestureHandler.detachFromView(this.chart);
        }
    }
    dispose() {
        super.dispose();
        const chart = this.chart;
        this.rotationGestureHandler && this.rotationGestureHandler.detachFromView(chart);
        this.tapGestureHandler && this.tapGestureHandler.detachFromView(chart);
        // this.longpressGestureHandler.detachFromView(chart);
    }
    init() {
        super.init();

        if (this.chart.rotationEnabled) {
            this.setRotation(true);
        }

        if (this.chart.highlightPerTapEnabled) {
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
        const vph = this.chart.viewPortHandler;
        const xTrans = x - vph.offsetLeft;
        const yTrans = -(vph.chartHeight - y - vph.offsetBottom);

        return { x: xTrans, y: yTrans };
    }

    /**
     * sets the starting angle of the rotation, this is only used by the touch
     * listener, x and y is the touch position
     *
     * @param x
     * @param y
     */
    setGestureStartAngle(x, y) {
        this.mStartAngle = this.chart.getAngleForPoint(x, y) - this.chart.rawRotationAngle;
    }

    /**
     * updates the view rotation depending on the given touch position, also
     * takes the starting angle into consideration
     *
     * @param x
     * @param y
     */
    updateGestureRotation(x, y) {
        this.chart.rotationAngle = this.chart.getAngleForPoint(x, y) - this.mStartAngle;
    }
    /**
     * ################ ################ ################ ################
     */
    /** GESTURE RECOGNITION BELOW */

    public onRotationGesture(event: GestureStateEventData) {
        console.log('onRotationGesture', event.data.prevState, event.data.state);
        const chart = this.chart;
        const x = event.data.extraData.x;
        const y = event.data.extraData.y;
        if (event.data.state === GestureState.BEGAN || event.data.state === GestureState.ACTIVE) {
            this.mLastGesture = ChartGesture.ROTATE;
            chart.disableScroll();
            if (chart.hasListeners('rotate')) {
                chart.notify({ eventName: 'rotate', data: event.data, object: chart });
            }

            if (event.data.state === GestureState.BEGAN) {
                this.stopDeceleration();

                this.resetVelocity();
                if (chart.dragDecelerationEnabled) {
                    this.sampleVelocity(x, y);
                }
                this.setGestureStartAngle(x, y);
            } else {
                if (chart.dragDecelerationEnabled) {
                    this.sampleVelocity(x, y);
                }
                this.updateGestureRotation(x, y);
            }
        } else if (event.data.state === GestureState.CANCELLED || event.data.state === GestureState.END) {
            this.mDecelerationAngularVelocity = this.calculateVelocity();

            if (this.mDecelerationAngularVelocity !== 0) {
                this.mDecelerationLastTime = time();
                // this.mDecelerationLastTime = AnimationUtils.currentAnimationTimeMillis();

                // Utils.postInvalidateOnAnimation(chart); // This causes computeScroll to fire, recommended for this by Google
                this.chart.invalidate();
            }
            if (chart.dragDecelerationEnabled) {
                this.sampleVelocity(x, y);
            }
            chart.enableScroll();
        }
    }
    public onRotationGestureTouch(event: GestureTouchEventData) {
        const chart = this.chart;
        const x = event.data.extraData.x;
        const y = event.data.extraData.y;
        if (event.data.state === GestureState.ACTIVE) {
            this.mLastGesture = ChartGesture.ROTATE;
            chart.disableScroll();
            if (chart.hasListeners('rotate')) {
                chart.notify({ eventName: 'rotate', data: event.data, object: chart });
            }

            if (chart.dragDecelerationEnabled) {
                this.sampleVelocity(x, y);
            }
            this.updateGestureRotation(x, y);
            this.chart.invalidate();
        }
    }

    public onTapGesture(event: GestureStateEventData) {
        if (event.data.state === GestureState.END && event.data.prevState === GestureState.ACTIVE) {
            this.mLastGesture = ChartGesture.SINGLE_TAP;
            const chart = this.chart;

            const h = chart.getHighlightByTouchPoint(event.data.extraData.x, event.data.extraData.y);
            if (chart.hasListeners('tap')) {
                chart.notify({ eventName: 'tap', data: event.data, object: chart, highlight: h });
            }

            if (!chart.highlightPerTapEnabled) {
                return;
            }

            this.performHighlight(h);
        }
    }

    private resetVelocity() {
        this._velocitySamples = [];
    }

    private sampleVelocity(touchLocationX, touchLocationY) {
        // const currentTime = AnimationUtils.currentAnimationTimeMillis();
        const currentTime = time();

        this._velocitySamples.push(new AngularVelocitySample(currentTime, this.chart.getAngleForPoint(touchLocationX, touchLocationY)));

        // Remove samples older than our sample time - 1 seconds
        for (let i = 0, count = this._velocitySamples.length; i < count - 2; i++) {
            if (currentTime - this._velocitySamples[i].time > 1000) {
                this._velocitySamples.shift();
                i--;
                count--;
            } else {
                break;
            }
        }
    }

    private calculateVelocity() {
        if (this._velocitySamples.length === 0) {
            return 0;
        }

        const firstSample = this._velocitySamples[0];
        const lastSample = this._velocitySamples[this._velocitySamples.length - 1];

        // Look for a sample that's closest to the latest sample, but not the same, so we can deduce the direction
        let beforeLastSample = firstSample;
        for (let i = this._velocitySamples.length - 1; i >= 0; i--) {
            beforeLastSample = this._velocitySamples[i];
            if (beforeLastSample.angle !== lastSample.angle) {
                break;
            }
        }

        // Calculate the sampling time
        let timeDelta = (lastSample.time - firstSample.time) / 1000;
        if (timeDelta === 0) {
            timeDelta = 0.1;
        }

        // Calculate clockwise/ccw by choosing two values that should be closest to each other,
        // so if the angles are two far from each other we know they are inverted "for sure"
        let clockwise = lastSample.angle >= beforeLastSample.angle;
        if (Math.abs(lastSample.angle - beforeLastSample.angle) > 270.0) {
            clockwise = !clockwise;
        }

        // Now if the "gesture" is over a too big of an angle - then we know the angles are inverted, and we need to move them closer to each other from both sides of the 360.0 wrapping point
        if (lastSample.angle - firstSample.angle > 180.0) {
            firstSample.angle += 360.0;
        } else if (firstSample.angle - lastSample.angle > 180.0) {
            lastSample.angle += 360.0;
        }

        // The velocity
        let velocity = Math.abs((lastSample.angle - firstSample.angle) / timeDelta);

        // Direction?
        if (!clockwise) {
            velocity = -velocity;
        }

        return velocity;
    }

    /**
     * Sets the deceleration-angular-velocity to 0f
     */
    public stopDeceleration() {
        this.mDecelerationAngularVelocity = 0;
    }

    public computeScroll() {
        if (this.mDecelerationAngularVelocity === 0) {
            return;
        } // There's no deceleration in progress

        // const currentTime = AnimationUtils.currentAnimationTimeMillis();
        const currentTime = time();

        this.mDecelerationAngularVelocity *= this.chart.dragDecelerationFrictionCoef;

        const timeInterval = (currentTime - this.mDecelerationLastTime) / 1000;

        this.chart.rotationAngle = this.chart.rotationAngle + this.mDecelerationAngularVelocity * timeInterval;

        this.mDecelerationLastTime = currentTime;

        if (Math.abs(this.mDecelerationAngularVelocity) >= 0.001) {
            // Utils.postInvalidateOnAnimation(this.chart);
            this.chart.invalidate();
        } // This causes computeScroll to fire, recommended for this by Google
        else {
            this.stopDeceleration();
        }
    }
}
