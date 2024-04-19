import { BarLineChartBase } from '../charts/BarLineChartBase';
import { Poolable } from '../utils/ObjectPool';
import { Transformer } from '../utils/Transformer';
import { ViewPortHandler } from '../utils/ViewPortHandler';

export abstract class ViewPortJob extends Poolable {
    protected mViewPortHandler: ViewPortHandler;
    xValue = 0;
    yValue = 0;
    transformer: Transformer;
    protected mView: BarLineChartBase<any, any, any>;

    public abstract run();

    constructor(viewPortHandler: ViewPortHandler, xValue, yValue, trans: Transformer, v) {
        super();
        this.mViewPortHandler = viewPortHandler;
        this.xValue = xValue;
        this.yValue = yValue;
        this.transformer = trans;
        this.mView = v;
    }
}
