import { BarLineChartBase } from '../charts/BarLineChartBase';
import { Transformer } from '../utils/Transformer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ViewPortJob } from './ViewPortJob';
import { Tween, EasingFunction } from '../animation/Tween';

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
    protected mAnimator: Tween<any>;

    protected mPhase;

    protected mXOrigin: number;
    protected mYOrigin: number;

    constructor(viewPortHandler: ViewPortHandler, xValue, yValue, trans: Transformer, v: BarLineChartBase<any, any, any>, xOrigin: number, yOrigin: number, private duration: number) {
        super(viewPortHandler, xValue, yValue, trans, v);
        this.mXOrigin = xOrigin;
        this.mYOrigin = yOrigin;
    }

    createAnimator(duration) {
        this.mAnimator = new Tween({
            onRender: (state) => {
                this.mPhase = state.value;
                this.onAnimationUpdate(this.mAnimator);
            },
            onFinish: () => this.onAnimationEnd(this.mAnimator),
            onCancel: () => this.onAnimationCancel(this.mAnimator)
        });
        this.mAnimator['duration'] = duration;
    }

    public run() {
        if (!this.mAnimator) {
            this.createAnimator(this.duration);
        }
        
        this.mAnimator.tween( { value: 0 }, { value: 1 }, this.mAnimator['duration']);
    }

    public getPhase() {
        return this.mPhase;
    }

    public setPhase(phase) {
        this.mPhase = phase;
    }

    public getXOrigin() {
        return this.mXOrigin;
    }

    public getYOrigin() {
        return this.mYOrigin;
    }

    public abstract recycleSelf();

    protected resetAnimator() {
        this.mAnimator.cancel();
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
