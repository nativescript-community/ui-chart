import { Matrix } from '@nativescript-community/ui-canvas';
import { BarLineChartBase } from '../charts/BarLineChartBase';
import { AxisDependency } from '../components/YAxis';
import { ObjectPool } from '../utils/ObjectPool';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ViewPortJob } from './ViewPortJob';

export class ZoomJob extends ViewPortJob {
    protected mScaleX: number;
    protected mScaleY: number;

    protected mAxisDependency: AxisDependency;

    public static getInstance(viewPortHandler: ViewPortHandler, scaleX, scaleY, xValue, yValue, trans: Transformer, axis: AxisDependency, v: BarLineChartBase<any, any, any>) {
        const result = pool.get();
        result.mXValue = xValue;
        result.mYValue = yValue;
        result.mScaleX = scaleX;
        result.mScaleY = scaleY;
        result.mViewPortHandler = viewPortHandler;
        result.mTrans = trans;
        result.mAxisDependency = axis;
        result.mView = v;
        return result;
    }

    public static recycleInstance(instance: ZoomJob) {
        pool.recycle(instance);
    }


    constructor(viewPortHandler: ViewPortHandler, scaleX, scaleY, xValue, yValue, trans: Transformer, axis: AxisDependency, v: BarLineChartBase<any, any, any>) {
        super(viewPortHandler, xValue, yValue, trans, v);

        this.mScaleX = scaleX;
        this.mScaleY = scaleY;
        this.mAxisDependency = axis;
    }


    public run() {
        const save = Utils.getTempMatrix();
        const viewPortHanlder = this.mViewPortHandler;
        viewPortHanlder.zoom(this.mScaleX, this.mScaleY, save);
        viewPortHanlder.refresh(save, this.mView, false);

        const yValsInView = this.mView.getAxis(this.mAxisDependency).mAxisRange / viewPortHanlder.getScaleY();
        const xValsInView = this.mView.getXAxis().mAxisRange / viewPortHanlder.getScaleX();
        const pts = Utils.getTempArray(2);

        pts[0] = this.mXValue - xValsInView / 2;
        pts[1] = this.mYValue + yValsInView / 2;

        this.mTrans.pointValuesToPixel(pts);

        viewPortHanlder.translate(pts, save);
        viewPortHanlder.refresh(save, this.mView, false);

        this.mView.calculateOffsets();
        this.mView.invalidate();

        ZoomJob.recycleInstance(this);
    }

    public instantiate() {
        return new ZoomJob(null, 0, 0, 0, 0, null, null, null);
    }
}
const pool = ObjectPool.create<ZoomJob>(1, new ZoomJob(null, 0, 0, 0, 0, null, null, null)).setReplenishPercentage(0.5);
