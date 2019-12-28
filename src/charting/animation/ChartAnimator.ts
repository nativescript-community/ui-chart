
/**
 * Object responsible for all animations in the Chart. Animations require API level 11.
 *
 * @author Philipp Jahoda
 * @author Mick Ashton
 */
export class ChartAnimator {

    /** object that is updated upon animation update */
    private mListener;

    /** The phase of drawn values on the y-axis. 0 - 1 */
    protected  mPhaseY = 1;

    /** The phase of drawn values on the x-axis. 0 - 1 */
    protected  mPhaseX = 1;


    constructor( listener?) {
        this.mListener = listener;
    }

    private  xAnimator( duration,  easing /*: EasingFunction */) {

        // ObjectAnimator animatorX = ObjectAnimator.ofFloat(this, "phaseX", 0, 1);
        // animatorX.setInterpolator(easing);
        // animatorX.setDuration(duration);

        // return animatorX;
    }

    private  yAnimator( duration,  easing /*: EasingFunction */) {

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
    public animateX( durationMillis,  easing?/* : EasingFunction */) {

        // ObjectAnimator animatorX = xAnimator(durationMillis, easing);
        // animatorX.addUpdateListener(mListener);
        // animatorX.start();
    }



    /**
     * Animates values along both the X and Y axes.
     *
     * @param durationMillisX animation duration along the X axis
     * @param durationMillisY animation duration along the Y axis
     * @param easing EasingFunction for both axes
     */
    // public animateXY( durationMillisX,  durationMillisY?,  easing/* :EasingFunction */) {

        // ObjectAnimator xAnimator = xAnimator(durationMillisX, easing);
        // ObjectAnimator yAnimator = yAnimator(durationMillisY, easing);

        // if (durationMillisX > durationMillisY) {
        //     xAnimator.addUpdateListener(mListener);
        // } else {
        //     yAnimator.addUpdateListener(mListener);
        // }

        // xAnimator.start();
        // yAnimator.start();
    // }

    /**
     * Animates values along both the X and Y axes.
     *
     * @param durationMillisX animation duration along the X axis
     * @param durationMillisY animation duration along the Y axis
     * @param easingX EasingFunction for the X axis
     * @param easingY EasingFunction for the Y axis
     */
    public animateXY( durationMillisX,  durationMillisY,  easingX/* :EasingFunction */,
                           easingY/* :EasingFunction */) {

        // ObjectAnimator xAnimator = xAnimator(durationMillisX, easingX);
        // ObjectAnimator yAnimator = yAnimator(durationMillisY, easingY);

        // if (durationMillisX > durationMillisY) {
        //     xAnimator.addUpdateListener(mListener);
        // } else {
        //     yAnimator.addUpdateListener(mListener);
        // }

        // xAnimator.start();
        // yAnimator.start();
    }

    /**
     * Animates values along the Y axis.
     *
     * @param durationMillis animation duration
     * @param easing EasingFunction
     */
    public animateY( durationMillis,  easing/* :EasingFunction */) {

        // ObjectAnimator animatorY = yAnimator(durationMillis, easing);
        // animatorY.addUpdateListener(mListener);
        // animatorY.start();
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
    public setPhaseY( phase) {
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
    public setPhaseX( phase) {
        if (phase > 1) {
            phase = 1;
        } else if (phase < 0) {
            phase = 0;
        }
        this.mPhaseX = phase;
    }
}
