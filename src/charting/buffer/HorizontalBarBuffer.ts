import { BarBuffer } from './BarBuffer';
import { IBarDataSet } from '../interfaces/datasets/IBarDataSet';

export class HorizontalBarBuffer extends BarBuffer {
    constructor(size: number, dataSetCount: number, containsStacks: boolean) {
        super(size, dataSetCount, containsStacks);
    }

    public feed(data: IBarDataSet) {
        const size = data.getEntryCount() * this.phaseX;
        const barWidthHalf = this.mBarWidth / 2;

        for (let i = 0; i < size; i++) {
            const e = data.getEntryForIndex(i);
            if (e === null) {
                continue;
            }

            const x = e.getX();
            let y = e.getY();
            const vals = e.getYVals();

            if (!this.mContainsStacks || vals == null) {
                const bottom = x - barWidthHalf;
                const top = x + barWidthHalf;
                let left, right;
                if (this.mInverted) {
                    left = y >= 0 ? y : 0;
                    right = y <= 0 ? y : 0;
                } else {
                    right = y >= 0 ? y : 0;
                    left = y <= 0 ? y : 0;
                }

                // multiply the height of the rect with the phase
                if (right > 0) {
                    right *= this.phaseY;
                } else {
                    left *= this.phaseY;
                }

                this.addBar(left, top, right, bottom);
            } else {
                let posY = 0;
                let negY = -e.getNegativeSum();
                let yStart = 0;

                // fill the stack
                for (let k = 0; k < vals.length; k++) {
                    const value = vals[k];

                    if (value >= 0) {
                        y = posY;
                        yStart = posY + value;
                        posY = yStart;
                    } else {
                        y = negY;
                        yStart = negY + Math.abs(value);
                        negY += Math.abs(value);
                    }

                    const bottom = x - barWidthHalf;
                    const top = x + barWidthHalf;
                    let left, right;
                    if (this.mInverted) {
                        left = y >= yStart ? y : yStart;
                        right = y <= yStart ? y : yStart;
                    } else {
                        right = y >= yStart ? y : yStart;
                        left = y <= yStart ? y : yStart;
                    }

                    // multiply the height of the rect with the phase
                    right *= this.phaseY;
                    left *= this.phaseY;

                    this.addBar(left, top, right, bottom);
                }
            }
        }
        this.reset();
    }
}
