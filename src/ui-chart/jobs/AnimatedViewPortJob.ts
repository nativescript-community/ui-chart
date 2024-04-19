import { BarLineChartBase } from '../charts/BarLineChartBase';
import { Transformer } from '../utils/Transformer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ViewPortJob } from './ViewPortJob';
import { EasingFunction, Tween } from '../animation/Tween';

export interface AnimatorUpdateListener {
    onAnimationUpdate(animation: Tween<any>);
}
export interface AnimatorListener {
    onAnimationEnd(animation: Tween<any>);
    onAnimationCancel(animation: Tween<any>);
}
/**
 * Created by Philipp Jahoda on 19/02/16.
 */
export abstract class AnimatedViewPortJob extends ViewPortJob implements AnimatorUpdateListener, AnimatorListener {
    animator: Tween<any>;

    phase;

    xOrigin: number;
    yOrigin: number;

    constructor(
        viewPortHandler: ViewPortHandler,
        xValue,
        yValue,
        trans: Transformer,
        v: BarLineChartBase<any, any, any>,
        xOrigin: number,
        yOrigin: number,
        private duration: number
    ) {
        super(viewPortHandler, xValue, yValue, trans, v);
        this.xOrigin = xOrigin;
        this.yOrigin = yOrigin;
    }

    createAnimator(duration) {
        this.animator = new Tween({
            onRender: (state) => {
                this.phase = state.value;
                this.onAnimationUpdate(this.animator);
            },
            onFinish: () => this.onAnimationEnd(this.animator),
            onCancel: () => this.onAnimationCancel(this.animator)
        });
        this.animator['duration'] = duration;
    }

    public run() {
        if (!this.animator) {
            this.createAnimator(this.duration);
        }

        this.animator.tween({ value: 0 }, { value: 1 }, this.animator['duration']);
    }

    public abstract recycleSelf();

    protected resetAnimator() {
        this.animator.cancel();
    }

    public onAnimationStart(animation: Tween<any>) {}

    public onAnimationEnd(animation: Tween<any>) {
        try {
            this.recycleSelf();
        } catch (e) {
            // don't worry about it.
        }
    }

    public onAnimationCancel(animation: Tween<any>) {
        try {
            this.recycleSelf();
        } catch (e) {
            // don't worry about it.
        }
    }

    public onAnimationUpdate(animation: Tween<any>) {}
}
