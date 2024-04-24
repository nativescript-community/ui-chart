import { AbstractBuffer } from './AbstractBuffer';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';

export class BarBuffer extends AbstractBuffer<IBarDataSet> {
    dataSetIndex = 0;
    dataSetCount = 1;
    containsStacks = false;
    inverted = false;

    /** width of the bar on the x-axis, in values (not pixels) */
    barWidth = 1;

    yAxisMin = 0;
    yAxisMax = 0;

    constructor(size: number, dataSetCount: number, containsStacks: boolean) {
        super(size);
        this.dataSetCount = dataSetCount;
        this.containsStacks = containsStacks;
    }

    protected addBar(left, top, right, bottom) {
        this.buffer[this.index++] = left;
        this.buffer[this.index++] = top;
        this.buffer[this.index++] = right;
        this.buffer[this.index++] = bottom;
    }

    public feed(data: IBarDataSet) {
        const size = data.entryCount * this.phaseX;
        const barWidthHalf = this.barWidth / 2;
        const yKey = data.yProperty;
        for (let i = 0; i < size; i++) {
            const e = data.getEntryForIndex(i);
            if (!e) {
                continue;
            }

            const x = data.getEntryXValue(e, i);
            let y = e[yKey];
            const vals = e.yVals;

            if (!this.containsStacks || !vals || vals.length === 0) {
                if (y === undefined || y === null) {
                    continue;
                }
                const left = x - barWidthHalf;
                const right = x + barWidthHalf;
                let bottom, top;

                if (this.inverted) {
                    bottom = y >= 0 ? y : this.yAxisMax <= 0 ? this.yAxisMax : 0;
                    top = y <= 0 ? y : this.yAxisMin >= 0 ? this.yAxisMin : 0;
                } else {
                    top = y >= 0 ? y : this.yAxisMax <= 0 ? this.yAxisMax : 0;
                    bottom = y <= 0 ? y : this.yAxisMin >= 0 ? this.yAxisMin : 0;
                }

                // multiply the height of the rect with the phase
                if (top > 0) {
                    top = bottom + this.phaseY * (top - bottom);
                } else {
                    bottom = top + this.phaseY * (bottom - top);
                }
                if (left !== right && top !== bottom) {
                    this.addBar(left, top, right, bottom);
                }
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

                    if (this.inverted) {
                        bottom = y >= yStart ? y : yStart;
                        top = y <= yStart ? y : yStart;
                    } else {
                        top = y >= yStart ? y : yStart;
                        bottom = y <= yStart ? y : yStart;
                    }

                    // multiply the height of the rect with the phase
                    if (top > 0) {
                        top = bottom + this.phaseY * (top - bottom);
                    } else {
                        bottom = top + this.phaseY * (bottom - top);
                    }

                    if (left !== right && top !== bottom) {
                        this.addBar(left, top, right, bottom);
                    }
                }
            }
        }

        this.reset();
    }
}
