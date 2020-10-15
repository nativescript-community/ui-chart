import { AbstractBuffer } from './AbstractBuffer';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';
import { getEntryXValue } from '../data/BaseEntry';

export class BarBuffer extends AbstractBuffer<IBarDataSet> {
    protected mDataSetIndex = 0;
    protected mDataSetCount = 1;
    protected mContainsStacks = false;
    protected mInverted = false;

    /** width of the bar on the x-axis, in values (not pixels) */
    protected mBarWidth = 1;

    protected mYAxisMin = 0;
    protected mYAxisMax = 0;

    constructor(size: number, dataSetCount: number, containsStacks: boolean) {
        super(size);
        this.mDataSetCount = dataSetCount;
        this.mContainsStacks = containsStacks;
    }

    public setBarWidth(barWidth: number) {
        this.mBarWidth = barWidth;
    }

    public setDataSet(index: number) {
        this.mDataSetIndex = index;
    }

    public setInverted(inverted: boolean) {
        this.mInverted = inverted;
    }

    public setYAxisMin(min: number) {
        this.mYAxisMin = min;
    }

    public setYAxisMax(max: number) {
        this.mYAxisMax = max;
    }

    protected addBar(left, top, right, bottom) {
        this.buffer[this.index++] = left;
        this.buffer[this.index++] = top;
        this.buffer[this.index++] = right;
        this.buffer[this.index++] = bottom;
    }

    public feed(data: IBarDataSet) {
        const size = data.getEntryCount() * this.phaseX;
        const barWidthHalf = this.mBarWidth / 2;
        const xKey = data.xProperty;
        const yKey = data.yProperty;
        for (let i = 0; i < size; i++) {
            const e = data.getEntryForIndex(i);
            if (e == null) {
                continue;
            }

            const x = getEntryXValue(e, xKey, i);
            let y = e[yKey];
            const vals = e.yVals;

            if (!this.mContainsStacks || vals == null || vals.length === 0) {
                const left = x - barWidthHalf;
                const right = x + barWidthHalf;
                let bottom, top;

                if (this.mInverted) {
                    bottom = y >= 0 ? y : this.mYAxisMax <= 0 ? this.mYAxisMax : 0;
                    top = y <= 0 ? y : this.mYAxisMin >= 0 ? this.mYAxisMin : 0;
                } else {
                    top = y >= 0 ? y : this.mYAxisMax <= 0 ? this.mYAxisMax : 0;
                    bottom = y <= 0 ? y : this.mYAxisMin >= 0 ? this.mYAxisMin : 0;
                }

                // multiply the height of the rect with the phase
                if (top > 0) {
                    top *= this.phaseY;
                } else {
                    bottom *= this.phaseY;
                }

                this.addBar(left, top, right, bottom);
            } else {
                let posY = 0;
                let negY = -e.negativeSum;
                let yStart = 0;

                // fill the stack
                for (let k = 0; k < vals.length; k++) {
                    const value = vals[k];

                    if (value === 0.0 && (posY === 0.0 || negY === 0.0)) {
                        // Take care of the situation of a 0.0 value, which overlaps a non-zero bar
                        y = value;
                        yStart = y;
                    } else if (value >= 0.0) {
                        y = posY;
                        yStart = posY + value;
                        posY = yStart;
                    } else {
                        y = negY;
                        yStart = negY + Math.abs(value);
                        negY += Math.abs(value);
                    }

                    const left = x - barWidthHalf;
                    const right = x + barWidthHalf;
                    let bottom, top;

                    if (this.mInverted) {
                        bottom = y >= yStart ? y : yStart;
                        top = y <= yStart ? y : yStart;
                    } else {
                        top = y >= yStart ? y : yStart;
                        bottom = y <= yStart ? y : yStart;
                    }

                    // multiply the height of the rect with the phase
                    top *= this.phaseY;
                    bottom *= this.phaseY;

                    this.addBar(left, top, right, bottom);
                }
            }
        }

        this.reset();
    }
}
