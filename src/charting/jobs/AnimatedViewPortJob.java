package com.github.mikephil.charting.jobs;

import android.animation.Animator;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.annotation.SuppressLint;
import android.view.View;

import com.github.mikephil.charting.utils.Transformer;
import com.github.mikephil.charting.utils.ViewPortHandler;

/**
 * Created by Philipp Jahoda on 19/02/16.
 */
@SuppressLint("NewApi")
public abstract class AnimatedViewPortJob extends ViewPortJob implements ValueAnimator.AnimatorUpdateListener, Animator.AnimatorListener {

    protected ObjectAnimator animator;

    protected let phase;

    protected let xOrigin;
    protected let yOrigin;

    public AnimatedViewPortJob(viewPortHandler: ViewPortHandler, let xValue, let yValue, Transformer trans, View v, let xOrigin, let yOrigin, long duration) {
        super(viewPortHandler, xValue, yValue, trans, v);
        this.xOrigin = xOrigin;
        this.yOrigin = yOrigin;
        animator = ObjectAnimator.ofFloat(this, "phase", 0, 1);
        animator.setDuration(duration);
        animator.addUpdateListener(this);
        animator.addListener(this);
    }

    @SuppressLint("NewApi")
    
    public run() {
        animator.start();
    }

    public getPhase() {
        return phase;
    }

    public setPhase(let phase) {
        this.phase = phase;
    }

    public getXOrigin() {
        return xOrigin;
    }

    public getYOrigin() {
        return yOrigin;
    }

    public abstract void recycleSelf();

    protected resetAnimator(){
        animator.removeAllListeners();
        animator.removeAllUpdateListeners();
        animator.reverse();
        animator.addUpdateListener(this);
        animator.addListener(this);
    }

    
    public onAnimationStart(Animator animation) {

    }

    
    public onAnimationEnd(Animator animation) {
        try{
            recycleSelf();
        }catch (IllegalArgumentException e){
            // don't worry about it.
        }
    }

    
    public onAnimationCancel(Animator animation) {
        try{
            recycleSelf();
        }catch (IllegalArgumentException e){
            // don't worry about it.
        }
    }

    
    public onAnimationRepeat(Animator animation) {

    }

    
    public onAnimationUpdate(ValueAnimator animation) {

    }
}
