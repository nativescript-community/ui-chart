import { BarLineChartBase } from '../charts/BarLineChartBase';
import { YAxis } from '../components/YAxis';
import { ObjectPool } from '../utils/ObjectPool';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { AnimatedViewPortJob } from './AnimatedViewPortJob';
/**
 * Created by Philipp Jahoda on 19/02/16.
 */
export class AnimatedZoomJob extends AnimatedViewPortJob {
    zoomOriginX: number;
    zoomOriginY: number;

    zoomCenterX: number;
    zoomCenterY: number;

    protected mYAxis: YAxis;

    xAxisRange;

    public static getInstance(
        viewPortHandler: ViewPortHandler,
        v: BarLineChartBase<any, any, any>,
        trans: Transformer,
        axis: YAxis,
        xAxisRange,
        scaleX: number,
        scaleY: number,
        xOrigin: number,
        yOrigin: number,
        zoomCenterX: number,
        zoomCenterY: number,
        zoomOriginX: number,
        zoomOriginY: number,
        duration: number
    ) {
        const result = pool.get();
        result.mViewPortHandler = viewPortHandler;
        result.xValue = scaleX;
        result.yValue = scaleY;
        result.transformer = trans;
        result.mView = v;
        result.xOrigin = xOrigin;
        result.yOrigin = yOrigin;

        result.zoomCenterX = zoomCenterX;
        result.zoomCenterY = zoomCenterY;
        result.zoomOriginX = zoomOriginX;
        result.zoomOriginY = zoomOriginY;

        result.mYAxis = axis;
        result.xAxisRange = xAxisRange;
        result.createAnimator(duration);
        return result;
    }

    constructor(
        viewPortHandler: ViewPortHandler,
        v: BarLineChartBase<any, any, any>,
        trans: Transformer,
        axis: YAxis,
        xAxisRange,
        scaleX: number,
        scaleY: number,
        xOrigin: number,
        yOrigin: number,
        zoomCenterX: number,
        zoomCenterY: number,
        zoomOriginX: number,
        zoomOriginY: number,
        duration: number
    ) {
        super(viewPortHandler, scaleX, scaleY, trans, v, xOrigin, yOrigin, duration);

        this.zoomCenterX = zoomCenterX;
        this.zoomCenterY = zoomCenterY;
        this.zoomOriginX = zoomOriginX;
        this.zoomOriginY = zoomOriginY;
        // this.animator.addListener(this);
        this.mYAxis = axis;
        this.xAxisRange = xAxisRange;
    }

    public onAnimationUpdate(animation) {
        const scaleX = this.xOrigin + (this.xValue - this.xOrigin) * this.phase;
        const scaleY = this.yOrigin + (this.yValue - this.yOrigin) * this.phase;

        const save = Utils.getTempMatrix();
        const viewPortHanlder = this.mViewPortHandler;
        viewPortHanlder.setZoom(scaleX, scaleY, save);
        viewPortHanlder.refresh(save, this.mView, false);

        const valsInView = this.mYAxis.mAxisRange / viewPortHanlder.getScaleY();
        const xsInView = this.xAxisRange / viewPortHanlder.getScaleX();
        const pts = Utils.getTempArray(2);

        pts[0] = this.zoomOriginX + (this.zoomCenterX - xsInView / 2 - this.zoomOriginX) * this.phase;
        pts[1] = this.zoomOriginY + (this.zoomCenterY + valsInView / 2 - this.zoomOriginY) * this.phase;

        this.transformer.pointValuesToPixel(pts);

        viewPortHanlder.translate(pts, save);
        viewPortHanlder.refresh(save, this.mView, true);
    }

    public onAnimationEnd(animation) {
        this.mView.calculateOffsets();
        this.mView.invalidate();
    }

    public onAnimationCancel(animation) {}

    public recycleSelf() {}

    public instantiate() {
        return new AnimatedZoomJob(null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
const pool = ObjectPool.create<AnimatedZoomJob>(8, new AnimatedZoomJob(null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)).setReplenishPercentage(0.5);
