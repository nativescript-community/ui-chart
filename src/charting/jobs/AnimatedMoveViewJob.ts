import { BarLineChartBase } from '../charts/BarLineChartBase';
import { ObjectPool } from '../utils/ObjectPool';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { AnimatedViewPortJob } from './AnimatedViewPortJob';
/**
 * Created by Philipp Jahoda on 19/02/16.
 */
export class AnimatedMoveViewJob extends AnimatedViewPortJob {
    public static getInstance(viewPortHandler: ViewPortHandler, xValue, yValue, trans: Transformer, v: BarLineChartBase<any, any, any>, xOrigin, yOrigin, duration) {
        const result = pool.get();
        result.mViewPortHandler = viewPortHandler;
        result.xValue = xValue;
        result.yValue = yValue;
        result.transformer = trans;
        result.mView = v;
        result.xOrigin = xOrigin;
        result.yOrigin = yOrigin;
        //result.resetAnimator();
        result.createAnimator(duration);
        return result;
    }

    public static recycleInstance(instance: AnimatedMoveViewJob) {
        pool.recycle(instance);
    }

    constructor(viewPortHandler: ViewPortHandler, xValue, yValue, trans: Transformer, v: BarLineChartBase<any, any, any>, xOrigin, yOrigin, duration) {
        super(viewPortHandler, xValue, yValue, trans, v, xOrigin, yOrigin, duration);
    }

    public onAnimationUpdate(animation) {
        const pts = Utils.getTempArray(2);
        pts[0] = this.xOrigin + (this.xValue - this.xOrigin) * this.phase;
        pts[1] = this.yOrigin + (this.yValue - this.yOrigin) * this.phase;

        this.transformer.pointValuesToPixel(pts);
        this.mViewPortHandler.centerViewPort(pts, this.mView);
    }

    public recycleSelf() {
        AnimatedMoveViewJob.recycleInstance(this);
    }

    public instantiate() {
        return new AnimatedMoveViewJob(null, 0, 0, null, null, 0, 0, 0);
    }
}
const pool = ObjectPool.create<AnimatedMoveViewJob>(4, new AnimatedMoveViewJob(null, 0, 0, null, null, 0, 0, 0)).setReplenishPercentage(0.5);
