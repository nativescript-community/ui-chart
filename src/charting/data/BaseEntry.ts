/**
 * Created by Philipp Jahoda on 02/06/16.
 */
export abstract class BaseEntry {
	protected y: number;
	protected mIcon;
	protected mData;

	constructor(y: number, icon?: any, data?: any)
	{
		this.y = y;
		this.mIcon = icon;
		this.mData = data;
	}

	/**
     * Returns the y value of this Entry.
     *
     * @return
     */
    public getY(): number {
        return this.y;
    }

    /**
     * Sets the y-value for the Entry.
     *
     * @param y
     */
    public setY(y: number) {
        this.y = y;
    }

    /**
     * Returns the icon of this Entry.
     *
     * @return
     */
    public getIcon() {
        return this.mIcon;
    }

    /**
     * Sets the icon drawable
     *
     * @param icon
     */
    public setIcon(icon) {
        this.mIcon = icon;
    }

    /**
     * Returns the data, additional information that this Entry represents, or
     * null, if no data has been specified.
     *
     * @return
     */
    public getData() {
        return this.mData;
    }

    /**
     * Sets additional data this Entry should represent.
     *
     * @param data
     */
    public setData(data) {
        this.mData = data;
    }
}
