import { BarLineChartBase } from '../charts/BarLineChartBase';
import { Poolable } from '../utils/ObjectPool';
import { Transformer } from '../utils/Transformer';
import { ViewPortHandler } from '../utils/ViewPortHandler';
import { Utils } from '../utils/Utils';

export abstract class ViewPortJob extends Poolable {

    protected mViewPortHandler: ViewPortHandler;
    protected mXValue = 0;
    protected mYValue = 0;
    protected mTrans: Transformer;
    protected mView: BarLineChartBase<any, any, any>;

    public abstract run();

    constructor(viewPortHandler: ViewPortHandler, xValue, yValue, trans: Transformer, v) {
        super();
        this.mViewPortHandler = viewPortHandler;
        this.mXValue = xValue;
        this.mYValue = yValue;
        this.mTrans = trans;
        this.mView = v;
    }

    public getXValue() {
        return this.mXValue;
    }

    public getYValue() {
        return this.mYValue;
    }
}
