import { Matrix } from 'nativescript-canvas';
import { BarLineChartBase } from '../charts/BarLineChartBase';
import { YAxis } from '../components/YAxis';
import { ObjectPool } from '../utils/ObjectPool';
import { Transformer } from '../utils/Transformer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { AnimatedViewPortJob } from './AnimatedViewPortJob';
/**
 * Created by Philipp Jahoda on 19/02/16.
 */
export class AnimatedZoomJob extends AnimatedViewPortJob {
    public static getInstance(
        viewPortHandler: ViewPortHandler,
        v: BarLineChartBase<any, any, any>,
        trans: Transformer,
        axis: YAxis,
        xAxisRange,
        scaleX,
        scaleY,
        xOrigin,
        yOrigin,
        zoomCenterX,
        zoomCenterY,
        zoomOriginX,
        zoomOriginY,
        duration
    ) {
        const result = pool.get();
        result.mViewPortHandler = viewPortHandler;
        result.xValue = scaleX;
        result.yValue = scaleY;
        result.mTrans = trans;
        result.view = v;
        result.xOrigin = xOrigin;
        result.yOrigin = yOrigin;

        result.zoomCenterX = zoomCenterX;
        result.zoomCenterY = zoomCenterY;
        result.zoomOriginX = zoomOriginX;
        result.zoomOriginY = zoomOriginY;

        result.yAxis = axis;
        result.xAxisRange = xAxisRange;
        result.createAnimator(duration);
        return result;
    }

    protected zoomOriginX;
    protected zoomOriginY;

    protected zoomCenterX;
    protected zoomCenterY;

    protected yAxis;

    protected xAxisRange;

    constructor(
        viewPortHandler: ViewPortHandler,
        v: BarLineChartBase<any, any, any>,
        trans: Transformer,
        axis: YAxis,
        xAxisRange,
        scaleX,
        scaleY,
        xOrigin,
        yOrigin,
        zoomCenterX,
        zoomCenterY,
        zoomOriginX,
        zoomOriginY,
        duration
    ) {
        super(viewPortHandler, scaleX, scaleY, trans, v, xOrigin, yOrigin, duration);

        this.zoomCenterX = zoomCenterX;
        this.zoomCenterY = zoomCenterY;
        this.zoomOriginX = zoomOriginX;
        this.zoomOriginY = zoomOriginY;
        // this.animator.addListener(this);
        this.yAxis = axis;
        this.xAxisRange = xAxisRange;
    }

    protected mOnAnimationUpdateMatrixBuffer = new Matrix();

    public onAnimationUpdate(animation) {
        const scaleX = this.xOrigin + (this.xValue - this.xOrigin) * this.phase;
        const scaleY = this.yOrigin + (this.yValue - this.yOrigin) * this.phase;

        const save = this.mOnAnimationUpdateMatrixBuffer;
        this.mViewPortHandler.setZoom(scaleX, scaleY, save);
        this.mViewPortHandler.refresh(save, this.view, false);

        const valsInView = this.yAxis.mAxisRange / this.mViewPortHandler.getScaleY();
        const xsInView = this.xAxisRange / this.mViewPortHandler.getScaleX();

        this.pts[0] = this.zoomOriginX + (this.zoomCenterX - xsInView / 2 - this.zoomOriginX) * this.phase;
        this.pts[1] = this.zoomOriginY + (this.zoomCenterY + valsInView / 2 - this.zoomOriginY) * this.phase;

        this.mTrans.pointValuesToPixel(this.pts);

        this.mViewPortHandler.translate(this.pts, save);
        this.mViewPortHandler.refresh(save, this.view, true);
    }

    public onAnimationEnd(animation) {
        this.view.calculateOffsets();
        this.view.invalidate();
    }

    public onAnimationCancel(animation) {}

    public recycleSelf() {}

    public instantiate() {
        return new AnimatedZoomJob(null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
const pool = ObjectPool.create<AnimatedZoomJob>(8, new AnimatedZoomJob(null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)).setReplenishPercentage(0.5);
