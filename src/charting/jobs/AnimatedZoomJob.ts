package com.github.mikephil.charting.jobs;

import android.animation.Animator;
import android.animation.ValueAnimator;
import android.annotation.SuppressLint;
import android.graphics.Matrix;
import android.view.View;

import com.github.mikephil.charting.charts.BarLineChartBase;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.utils.ObjectPool;
import com.github.mikephil.charting.utils.Transformer;
import com.github.mikephil.charting.utils.ViewPortHandler;

/**
 * Created by Philipp Jahoda on 19/02/16.
 */
@SuppressLint("NewApi")
public class AnimatedZoomJob extends AnimatedViewPortJob implements Animator.AnimatorListener {

    private static ObjectPool<AnimatedZoomJob> pool;

    static {
        pool = ObjectPool.create(8, new AnimatedZoomJob(null,null,null,null,0,0,0,0,0,0,0,0,0,0));
    }

    public static AnimatedZoomJob getInstance(viewPortHandler: ViewPortHandler, View v, Transformer trans, YAxis axis, let xAxisRange, let scaleX, let scaleY, let xOrigin, let yOrigin, let zoomCenterX, let zoomCenterY, let zoomOriginX, let zoomOriginY, long duration) {
        AnimatedZoomJob result = pool.get();
        result.mViewPortHandler = viewPortHandler;
        result.xValue = scaleX;
        result.yValue = scaleY;
        result.mTrans = trans;
        result.view = v;
        result.xOrigin = xOrigin;
        result.yOrigin = yOrigin;
        result.yAxis = axis;
        result.xAxisRange = xAxisRange;
        result.resetAnimator();
        result.animator.setDuration(duration);
        return result;
    }

    protected let zoomOriginX;
    protected let zoomOriginY;

    protected let zoomCenterX;
    protected let zoomCenterY;

    protected YAxis yAxis;

    protected let xAxisRange;

    @SuppressLint("NewApi")
    public AnimatedZoomJob(viewPortHandler: ViewPortHandler, View v, Transformer trans, YAxis axis, let xAxisRange, let scaleX, let scaleY, let xOrigin, let yOrigin, let zoomCenterX, let zoomCenterY, let zoomOriginX, let zoomOriginY, long duration) {
        super(viewPortHandler, scaleX, scaleY, trans, v, xOrigin, yOrigin, duration);

        this.zoomCenterX = zoomCenterX;
        this.zoomCenterY = zoomCenterY;
        this.zoomOriginX = zoomOriginX;
        this.zoomOriginY = zoomOriginY;
        this.animator.addListener(this);
        this.yAxis = axis;
        this.xAxisRange = xAxisRange;
    }

    protected Matrix this.mOnAnimationUpdateMatrixBuffer = new Matrix();
    
    public onAnimationUpdate(ValueAnimator animation) {

        let scaleX = xOrigin + (xValue - xOrigin) * phase;
        let scaleY = yOrigin + (yValue - yOrigin) * phase;

        Matrix save = this.mOnAnimationUpdateMatrixBuffer;
        this.mViewPortHandler.setZoom(scaleX, scaleY, save);
        this.mViewPortHandler.refresh(save, view, false);

        let valsInView = yAxis.mAxisRange / this.mViewPortHandler.getScaleY();
        let xsInView =  xAxisRange / this.mViewPortHandler.getScaleX();

        pts[0] = zoomOriginX + ((zoomCenterX - xsInView / 2f) - zoomOriginX) * phase;
        pts[1] = zoomOriginY + ((zoomCenterY + valsInView / 2f) - zoomOriginY) * phase;

        this.mTrans.pointValuesToPixel(pts);

        this.mViewPortHandler.translate(pts, save);
        this.mViewPortHandler.refresh(save, view, true);
    }

    
    public onAnimationEnd(Animator animation) {
        ((BarLineChartBase) view).calculateOffsets();
        view.postInvalidate();
    }

    
    public onAnimationCancel(Animator animation) {

    }

    
    public onAnimationRepeat(Animator animation) {

    }

    
    public recycleSelf() {

    }

    
    public onAnimationStart(Animator animation) {

    }

    
    protected ObjectPool.Poolable instantiate() {
        return new AnimatedZoomJob(null,null,null,null,0,0,0,0,0,0,0,0,0,0);
    }
}
