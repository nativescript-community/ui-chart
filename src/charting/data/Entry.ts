
import { BaseEntry } from "./BaseEntry";

export class Entry extends BaseEntry  {
	protected x: number;

	constructor(x: number, y: number, icon?: any, data?: any)
	{
		super(y, icon, data);
		this.x = x;
	}

	/**
     * Returns the x value of this Entry.
     *
     * @return
     */
    public getX(): number {
        return this.x;
    }

    /**
     * Sets the x-value for the Entry.
     *
     * @param x
     */
    public setX(x: number) {
        this.x = x;
    }
}
