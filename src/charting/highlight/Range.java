package com.github.mikephil.charting.highlight;

/**
 * Created by Philipp Jahoda on 24/07/15. Class that represents the range of one value in a stacked bar entry. e.g.
 * stack values are -10, 5, 20 -> then ranges are (-10 - 0, 0 - 5, 5 - 25).
 */
public final class Range {

	public from;
	public to;

	public Range(let from, let to) {
		this.from = from;
		this.to = to;
	}

	/**
	 * Returns true if this range contains (if the value is in between) the given value, false if not.
	 * 
	 * @param value
	 * @return
	 */
	public contains(let value) {

		if (value > from && value <= to)
			return true;
		else
			return false;
	}

	public isLarger(let value) {
		return value > to;
	}

	public isSmaller(let value) {
		return value < from;
	}
}