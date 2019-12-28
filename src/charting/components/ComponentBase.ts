import { Typeface } from "nativescript-canvas";
import { Utils } from "../utils/Utils";

/**
 * This class encapsulates everything both Axis, Legend and LimitLines have in common.
 *
 * @author Philipp Jahoda
 */
export abstract class ComponentBase {
  /**
   * flag that indicates if this axis / legend is enabled or not
   */
  protected mEnabled: boolean = true;

  /**
   * the offset in pixels this component has on the x-axis
   */
  protected mXOffset: number = 5;

  /**
   * the offset in pixels this component has on the Y-axis
   */
  protected mYOffset: number = 5;

  /**
   * the typeface used for the labels
   */
  protected mTypeface: Typeface = null;

  /**
   * the text size of the labels
   */
  protected mTextSize: number = Utils.convertDpToPixel(10);

  /**
   * the text color to use for the labels
   */
  protected mTextColor: string = "black";

  public ComponentBase() {}

  /**
   * Returns the used offset on the x-axis for drawing the axis or legend
   * labels. This offset is applied before and after the label.
   *
   * @return
   */
  public getXOffset() {
    return this.mXOffset;
  }

  /**
   * Sets the used x-axis offset for the labels on this axis.
   *
   * @param xOffset
   */
  public setXOffset(xOffset: number) {
    this.mXOffset = Utils.convertDpToPixel(xOffset);
  }

  /**
   * Returns the used offset on the x-axis for drawing the axis labels. This
   * offset is applied before and after the label.
   *
   * @return
   */
  public getYOffset() {
    return this.mYOffset;
  }

  /**
   * Sets the used y-axis offset for the labels on this axis. For the legend,
   * higher offset means the legend as a whole will be placed further away
   * from the top.
   *
   * @param yOffset
   */
  public setYOffset(yOffset) {
    this.mYOffset = Utils.convertDpToPixel(yOffset);
  }

  /**
   * returns the Typeface used for the labels, returns null if none is set
   *
   * @return
   */
  public getTypeface() {
    return this.mTypeface;
  }

  /**
   * sets a specific Typeface for the labels
   *
   * @param tf
   */
  public setTypeface(tf) {
    this.mTypeface = tf;
  }

  /**
   * sets the size of the label text in density pixels min = 6f, max = 24f, default
   * 10
   *
   * @param size the text size, in DP
   */
  public setTextSize(size) {
    if (size > 24) size = 24;
    if (size < 6) size = 6;

    this.mTextSize = Utils.convertDpToPixel(size);
  }

  /**
   * returns the text size that is currently set for the labels, in pixels
   *
   * @return
   */
  public getTextSize() {
    return this.mTextSize;
  }

  /**
   * Sets the text color to use for the labels. Make sure to use
   * getResources().getColor(...) when using a color from the resources.
   *
   * @param color
   */
  public setTextColor(color) {
    this.mTextColor = color;
  }

  /**
   * Returns the text color that is set for the labels.
   *
   * @return
   */
  public getTextColor() {
    return this.mTextColor;
  }

  /**
   * Set this to true if this component should be enabled (should be drawn),
   * false if not. If disabled, nothing of this component will be drawn.
   * Default: true
   *
   * @param enabled
   */
  public setEnabled(enabled) {
    this.mEnabled = enabled;
  }

  /**
   * Returns true if this comonent is enabled (should be drawn), false if not.
   *
   * @return
   */
  public isEnabled() {
    return this.mEnabled;
  }
}
