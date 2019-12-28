import { ViewPortHandler } from "../utils/ViewPortHandler";

export abstract class ViewPortJob {

    protected  pts = [];

    protected  mViewPortHandler: ViewPortHandler;
    protected  xValue = 0;
    protected  yValue = 0;
    protected  mTrans :Transformer;
    protected  view;

    constructor(viewPortHandler: ViewPortHandler,  xValue,  yValue,
                        trans: Transformer,  v) {

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
        return  this.yValue;
    }
}
