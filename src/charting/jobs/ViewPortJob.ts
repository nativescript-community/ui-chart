import { BarLineChartBase } from '../charts/BarLineChartBase';
import { Poolable } from '../utils/ObjectPool';
import { Transformer } from '../utils/Transformer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Utils } from '../utils/Utils';

export abstract class ViewPortJob extends Poolable {
    protected pts = Utils.createNativeArray(2);

    protected mViewPortHandler: ViewPortHandler;
    protected xValue = 0;
    protected yValue = 0;
    protected mTrans: Transformer;
    protected view: BarLineChartBase<any, any, any>;

    public abstract run();

    constructor(viewPortHandler: ViewPortHandler, xValue, yValue, trans: Transformer, v) {
        super();
        this.mViewPortHandler = viewPortHandler;
        this.xValue = xValue;
        this.yValue = yValue;
        this.mTrans = trans;
        this.view = v;
    }

    public getXValue() {
        return this.xValue;
    }

    public getYValue() {
        return this.yValue;
    }
}
