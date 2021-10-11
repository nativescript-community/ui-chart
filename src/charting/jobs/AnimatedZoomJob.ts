import { Matrix } from '@nativescript-community/ui-canvas';
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
    protected mZoomOriginX: number;
    protected mZoomOriginY: number;

    protected mZoomCenterX: number;
    protected mZoomCenterY: number;

    protected mYAxis: YAxis;

    protected mXAxisRange;

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
        result.mXValue = scaleX;
        result.mYValue = scaleY;
        result.mTrans = trans;
        result.mView = v;
        result.mXOrigin = xOrigin;
        result.mYOrigin = yOrigin;

        result.mZoomCenterX = zoomCenterX;
        result.mZoomCenterY = zoomCenterY;
        result.mZoomOriginX = zoomOriginX;
        result.mZoomOriginY = zoomOriginY;

        result.mYAxis = axis;
        result.mXAxisRange = xAxisRange;
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

        this.mZoomCenterX = zoomCenterX;
        this.mZoomCenterY = zoomCenterY;
        this.mZoomOriginX = zoomOriginX;
        this.mZoomOriginY = zoomOriginY;
        // this.animator.addListener(this);
        this.mYAxis = axis;
        this.mXAxisRange = xAxisRange;
    }

    public onAnimationUpdate(animation) {
        const scaleX = this.mXOrigin + (this.mXValue - this.mXOrigin) * this.mPhase;
        const scaleY = this.mYOrigin + (this.mYValue - this.mYOrigin) * this.mPhase;

        const save = Utils.getTempMatrix();
        const viewPortHanlder = this.mViewPortHandler;
        viewPortHanlder.setZoom(scaleX, scaleY, save);
        viewPortHanlder.refresh(save, this.mView, false);

        const valsInView = this.mYAxis.mAxisRange / viewPortHanlder.getScaleY();
        const xsInView = this.mXAxisRange / viewPortHanlder.getScaleX();
        const pts = Utils.getTempArray(2);

        pts[0] = this.mZoomOriginX + (this.mZoomCenterX - xsInView / 2 - this.mZoomOriginX) * this.mPhase;
        pts[1] = this.mZoomOriginY + (this.mZoomCenterY + valsInView / 2 - this.mZoomOriginY) * this.mPhase;

        this.mTrans.pointValuesToPixel(pts);

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
