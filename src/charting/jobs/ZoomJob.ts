import { Matrix } from 'nativescript-canvas';
import { BarLineChartBase } from '../charts/BarLineChartBase';
import { AxisDependency } from '../components/YAxis';
import { ObjectPool } from '../utils/ObjectPool';
import { Transformer } from '../utils/Transformer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ViewPortJob } from './ViewPortJob';

export class ZoomJob extends ViewPortJob {
    public static getInstance(viewPortHandler: ViewPortHandler, scaleX, scaleY, xValue, yValue, trans: Transformer, axis: AxisDependency, v: BarLineChartBase<any, any, any>) {
        const result = pool.get();
        result.xValue = xValue;
        result.yValue = yValue;
        result.scaleX = scaleX;
        result.scaleY = scaleY;
        result.mViewPortHandler = viewPortHandler;
        result.mTrans = trans;
        result.axisDependency = axis;
        result.view = v;
        return result;
    }

    public static recycleInstance(instance: ZoomJob) {
        pool.recycle(instance);
    }

    protected scaleX;
    protected scaleY;

    protected axisDependency: AxisDependency;

    constructor(viewPortHandler: ViewPortHandler, scaleX, scaleY, xValue, yValue, trans: Transformer, axis: AxisDependency, v: BarLineChartBase<any, any, any>) {
        super(viewPortHandler, xValue, yValue, trans, v);

        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.axisDependency = axis;
    }

    protected mRunMatrixBuffer = new Matrix();

    public run() {
        const save = this.mRunMatrixBuffer;
        this.mViewPortHandler.zoom(this.scaleX, this.scaleY, save);
        this.mViewPortHandler.refresh(save, this.view, false);

        const yValsInView = this.view.getAxis(this.axisDependency).mAxisRange / this.mViewPortHandler.getScaleY();
        const xValsInView = this.view.getXAxis().mAxisRange / this.mViewPortHandler.getScaleX();

        this.pts[0] = this.xValue - xValsInView / 2;
        this.pts[1] = this.yValue + yValsInView / 2;

        this.mTrans.pointValuesToPixel(this.pts);

        this.mViewPortHandler.translate(this.pts, save);
        this.mViewPortHandler.refresh(save, this.view, false);

        this.view.calculateOffsets();
        this.view.invalidate();

        ZoomJob.recycleInstance(this);
    }

    public instantiate() {
        return new ZoomJob(null, 0, 0, 0, 0, null, null, null);
    }
}
const pool = ObjectPool.create<ZoomJob>(1, new ZoomJob(null, 0, 0, 0, 0, null, null, null)).setReplenishPercentage(0.5);
