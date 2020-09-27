import TWEEN from '@nativescript-community/tween';
const Easing = TWEEN.Easing;
type EasingFunction = (k: number) => number;
export { Easing };
/**
 * Object responsible for all animations in the Chart. Animations require API level 11.
 *
 * @author Philipp Jahoda
 * @author Mick Ashton
 */
export class ChartAnimator {
    /** object that is updated upon animation update */
    private mListener: () => void;

    /** The phase of drawn values on the y-axis. 0 - 1 */
    protected mPhaseY = 1;

    /** The phase of drawn values on the x-axis. 0 - 1 */
    protected mPhaseX = 1;

    constructor(listener?: () => void) {
        this.mListener = listener;
    }

    private xAnimator(duration, easing: EasingFunction, listener?: () => void) {
        return new TWEEN.Tween({ value: 0 })
            .to({ value: 1 }, duration)
            .easing(easing)
            .onUpdate(obj => {
                // this.log('onUpdate', obj.value);
                this.setPhaseX(obj.value);
                if (listener) {
                    listener();
                }
                // ()=>this.onAnimationUpdate(this.animator)
            });
        // ObjectAnimator animatorX = ObjectAnimator.ofFloat(this, "phaseX", 0, 1);
        // animatorX.setInterpolator(easing);
        // animatorX.setDuration(duration);

        // return animatorX;
    }

    private yAnimator(duration, easing: EasingFunction = Easing.Linear.None, listener?: () => void) {
        return new TWEEN.Tween({ value: 0 })
            .to({ value: 1 }, duration)
            .easing(easing)
            .onUpdate(obj => {
                // this.log('onUpdate', obj.value);
                this.setPhaseY(obj.value);
                if (listener) {
                    listener();
                }
                // ()=>this.onAnimationUpdate(this.animator)
            });
        // ObjectAnimator animatorY = ObjectAnimator.ofFloat(this, "phaseY", 0, 1);
        // animatorY.setInterpolator(easing);
        // animatorY.setDuration(duration);

        // return animatorY;
    }

    /**
     * Animates values along the X axis.
     *
     * @param durationMillis animation duration
     * @param easing EasingFunction
     */
    public animateX(durationMillis, easing?: EasingFunction) {
        const animatorX = this.xAnimator(durationMillis, easing, this.mListener);
        animatorX.start(0);
    }

    /**
     * Animates values along both the X and Y axes.
     *
     * @param durationMillisX animation duration along the X axis
     * @param durationMillisY animation duration along the Y axis
     * @param easingX EasingFunction for the X axis
     * @param easingY EasingFunction for the Y axis
     */
    public animateXY(durationMillisX, durationMillisY, easingX: EasingFunction= Easing.Linear.None, easingY: EasingFunction = Easing.Linear.None) {
        const xAnimator = this.xAnimator(durationMillisX, easingX, durationMillisX > durationMillisY ? this.mListener : undefined);
        const yAnimator = this.yAnimator(durationMillisY, easingY || easingX, durationMillisX > durationMillisY ? undefined : this.mListener);
        xAnimator.start(0);
        yAnimator.start(0);
    }

    /**
     * Animates values along the Y axis.
     *
     * @param durationMillis animation duration
     * @param easing EasingFunction
     */
    public animateY(durationMillis, easing: EasingFunction) {
        const animatorY = this.yAnimator(durationMillis, easing, this.mListener);
        animatorY.start(0);
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
        if (phase > 1) {
            phase = 1;
        } else if (phase < 0) {
            phase = 0;
        }
        this.mPhaseY = phase;
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
        if (phase > 1) {
            phase = 1;
        } else if (phase < 0) {
            phase = 0;
        }
        this.mPhaseX = phase;
    }
}
