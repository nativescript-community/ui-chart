import TWEEN from '@nativescript-community/tween';
import { BarLineChartBase } from '../charts/BarLineChartBase';
import { Transformer } from '../utils/Transformer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ViewPortJob } from './ViewPortJob';

export interface AnimatorUpdateListener {
    onAnimationUpdate(animation: TWEEN.Tween);
}
export interface AnimatorListener {
    onAnimationStart(animation: TWEEN.Tween);
    onAnimationEnd(animation: TWEEN.Tween);
    onAnimationCancel(animation: TWEEN.Tween);
}
/**
 * Created by Philipp Jahoda on 19/02/16.
 */
export abstract class AnimatedViewPortJob extends ViewPortJob implements AnimatorUpdateListener, AnimatorListener {
    protected animator: TWEEN.Tween;

    protected phase;

    protected xOrigin;
    protected yOrigin;

    constructor(viewPortHandler: ViewPortHandler, xValue, yValue, trans: Transformer, v: BarLineChartBase<any, any, any>, xOrigin, yOrigin, private duration) {
        super(viewPortHandler, xValue, yValue, trans, v);
        this.xOrigin = xOrigin;
        this.yOrigin = yOrigin;
    }

    createAnimator(duration) {
        this.animator = new TWEEN.Tween({ value: 0 })
            .to({ value: 1 }, duration)
            .onStop(() => this.onAnimationCancel(this.animator))
            .onComplete(() => this.onAnimationEnd(this.animator))
            .onStart(() => this.onAnimationStart(this.animator))
            .onUpdate((obj) => {
                this.phase = obj.value;
                this.onAnimationUpdate(this.animator);
            });
    }

    public run() {
        if (!this.animator) {
            this.createAnimator(this.duration);
        }
        this.animator.start();
    }

    public getPhase() {
        return this.phase;
    }

    public setPhase(phase) {
        this.phase = phase;
    }

    public getXOrigin() {
        return this.xOrigin;
    }

    public getYOrigin() {
        return this.yOrigin;
    }

    public abstract recycleSelf();

    protected resetAnimator() {
        this.animator.stop();
        this.animator.update(0);
        // this.animator.reset();
        // this.animator.reverse();
        // this.animator.addUpdateListener(this);
        // this.animator.addListener(this);
    }

    public onAnimationStart(animation: TWEEN.Tween) {}

    public onAnimationEnd(animation: TWEEN.Tween) {
        try {
            this.recycleSelf();
        } catch (e) {
            // don't worry about it.
        }
    }

    public onAnimationCancel(animation: TWEEN.Tween) {
        try {
            this.recycleSelf();
        } catch (e) {
            // don't worry about it.
        }
    }

    public onAnimationUpdate(animation: TWEEN.Tween) {}
}
