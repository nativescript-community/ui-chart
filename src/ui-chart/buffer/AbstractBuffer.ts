import { Utils } from '../utils/Utils';

export abstract class AbstractBuffer<T> {
    protected index: number;
    protected phaseX: number;
    protected phaseY: number;
    protected from: number;
    protected to: number;

    public buffer;
    public entries: T[];

    /**
     * Initialization with buffer-size.
     *
     * @param size
     */
    constructor(size: number) {
        this.index = 0;
        this.buffer = Utils.getTempArray(size);
    }

    /** limits the drawing on the x-axis */
    public limitFrom(from: number) {
        if (from < 0) {
            from = 0;
        }
        this.from = from;
    }

    /** limits the drawing on the x-axis */
    public limitTo(to: number) {
        if (to < 0) {
            to = 0;
        }
        this.to = to;
    }

    /**
     * Resets the buffer index to 0 and makes the buffer reusable.
     */
    public reset() {
        this.index = 0;
    }

    /**
     * Returns the size (length) of the buffer array.
     */
    public get length() {
        return this.buffer.length;
    }

    /**
     * Set the phases used for animations.
     *
     * @param phaseX
     * @param phaseY
     */
    public setPhases(phaseX, phaseY) {
        this.phaseX = phaseX;
        this.phaseY = phaseY;
    }

    /**
     * Builds up the buffer with the provided data and resets the buffer-index
     * after feed-completion. This needs to run FAST.
     *
     * @param data
     */
    public abstract feed(data);
}
