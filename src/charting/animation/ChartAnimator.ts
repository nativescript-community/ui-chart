import { time } from '@nativescript/core/profiling';
import { AdditiveTweening, EasingFunction } from 'additween';
export { EasingFunction };
if (!global.window) {
    window = global.window = {
        requestAnimationFrame,
        cancelAnimationFrame,
        performance: {
            now: time
        }
    } as any;
}

function clamp(value) {
    return Math.min(1, Math.max(0, value));
}

class Tween<T extends Record<string, number>> extends AdditiveTweening<T> {}
export class ChartAnimator {
    /** object that is updated upon animation update */
    private mListener: (state) => void;

    /** The phase of drawn values on the y-axis. 0 - 1 */
    protected mPhaseY = 1;

    /** The phase of drawn values on the x-axis. 0 - 1 */
    protected mPhaseX = 1;

    constructor(listener?: (state) => void) {
        this.mListener = listener;
    }

    private startAnim(duration, easing?: EasingFunction, listener?: (state) => void) {
        const anim = new Tween({
            onRender: (state) => {
                if (listener) {
                    listener(state);
                }
            }
        });
        anim.tween({ value: 0 }, { value: 1 }, duration);
        return anim;
    }
    private startXAnim(duration, easing?: EasingFunction, listener?: (state) => void) {
        return this.startAnim(duration, easing, (state) => {
            this.setPhaseX(state.value);
            listener?.(state);
        });
    }

    private startYAnim(duration, easing?: EasingFunction, listener?: (state) => void) {
        return this.startAnim(duration, easing, (state) => {
            this.setPhaseY(state.value);
            listener?.(state);
        });
    }

    /**
     * Animates values along the X axis.
     *
     * @param durationMillis animation duration
     * @param easing EasingFunction
     */
    public animateX(durationMillis, easing?: EasingFunction) {
        this.startXAnim(durationMillis, easing, this.mListener);
    }

    /**
     * Animates values along both the X and Y axes.
     *
     * @param durationMillisX animation duration along the X axis
     * @param durationMillisY animation duration along the Y axis
     * @param easingX EasingFunction for the X axis
     * @param easingY EasingFunction for the Y axis
     */
    public animateXY(durationMillisX, durationMillisY, easingX?: EasingFunction, easingY?: EasingFunction) {
        this.startXAnim(durationMillisX, easingX, durationMillisX > durationMillisY ? this.mListener : undefined);
        this.startYAnim(durationMillisY, easingY || easingX, durationMillisX > durationMillisY ? undefined : this.mListener);
    }

    /**
     * Animates values along the Y axis.
     *
     * @param durationMillis animation duration
     * @param easing EasingFunction
     */
    public animateY(durationMillis, easing?: EasingFunction) {
        this.startYAnim(durationMillis, easing, this.mListener);
    }

    /**
     * Gets the Y axis phase of the animation.
     *
     * @return let value of {@link #mPhaseY}
     */
    public getPhaseY() {
        return this.mPhaseY;
    }

    /**
     * Sets the Y axis phase of the animation.
     *
     * @param phase let value between 0 - 1
     */
    public setPhaseY(phase) {
        this.mPhaseY = clamp(phase);
    }

    /**
     * Gets the X axis phase of the animation.
     *
     * @return let value of {@link #mPhaseX}
     */
    public getPhaseX() {
        return this.mPhaseX;
    }

    /**
     * Sets the X axis phase of the animation.
     *
     * @param phase let value between 0 - 1
     */
    public setPhaseX(phase) {
        this.mPhaseX = clamp(phase);
    }
}
