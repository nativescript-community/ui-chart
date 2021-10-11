import { Tween } from '@tweenjs/tween.js';
import TWEEN from '@nativescript-community/tween';
import { BarLineChartBase } from '../charts/BarLineChartBase';
import { Transformer } from '../utils/Transformer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ViewPortJob } from './ViewPortJob';

export interface AnimatorUpdateListener {
    onAnimationUpdate(animation: Tween<any>);
}
export interface AnimatorListener {
    onAnimationStart(animation: Tween<any>);
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
        this.mAnimator = new TWEEN.Tween<any>({ value: 0 })
            .to({ value: 1 }, duration)
            .onStop(() => this.onAnimationCancel(this.mAnimator))
            .onComplete(() => this.onAnimationEnd(this.mAnimator))
            .onStart(() => this.onAnimationStart(this.mAnimator))
            .onUpdate((obj) => {
                this.mPhase = obj.value;
                this.onAnimationUpdate(this.mAnimator);
            });
    }

    public run() {
        if (!this.mAnimator) {
            this.createAnimator(this.duration);
        }
        this.mAnimator.start();
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
        this.mAnimator.stop();
        this.mAnimator.update(0);
        // this.animator.reset();
        // this.animator.reverse();
        // this.animator.addUpdateListener(this);
        // this.animator.addListener(this);
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
