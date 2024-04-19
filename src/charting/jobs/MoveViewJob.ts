import { BarLineChartBase } from '../charts/BarLineChartBase';
import { ObjectPool } from '../utils/ObjectPool';
import { Transformer } from '../utils/Transformer';
import { Utils } from '../utils/Utils';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { ViewPortJob } from './ViewPortJob';
/**
 * Created by Philipp Jahoda on 19/02/16.
 */
export class MoveViewJob extends ViewPortJob {
    public static getInstance(viewPortHandler: ViewPortHandler, xValue, yValue, trans: Transformer, v: BarLineChartBase<any, any, any>) {
        const result = pool.get();
        result.mViewPortHandler = viewPortHandler;
        result.xValue = xValue;
        result.yValue = yValue;
        result.transformer = trans;
        result.mView = v;
        return result;
    }

    public static recycleInstance(instance: MoveViewJob) {
        pool.recycle(instance);
    }

    constructor(viewPortHandler: ViewPortHandler, xValue, yValue, trans: Transformer, v: BarLineChartBase<any, any, any>) {
        super(viewPortHandler, xValue, yValue, trans, v);
    }

    public run() {
        const pts = Utils.getTempArray(2);
        pts[0] = this.xValue;
        pts[1] = this.yValue;

        this.transformer.pointValuesToPixel(pts);
        this.mViewPortHandler.centerViewPort(pts, this.mView);

        MoveViewJob.recycleInstance(this);
    }

    public instantiate() {
        return new MoveViewJob(this.mViewPortHandler, this.xValue, this.yValue, this.transformer, this.mView);
    }
}
const pool = ObjectPool.create<MoveViewJob>(2, new MoveViewJob(null, 0, 0, null, null)).setReplenishPercentage(0.5);
