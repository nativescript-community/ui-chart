
package com.github.mikephil.charting.data.filter;

import android.annotation.TargetApi;
import android.os.Build;

import java.util.Arrays;

/**
 * Implemented according to Wiki-Pseudocode {@link}
 * http://en.wikipedia.org/wiki/Ramer�Douglas�Peucker_algorithm
 *
 * @author Philipp Baldauf & Phliipp Jahoda
 */
public class Approximator {

    @TargetApi(Build.VERSION_CODES.GINGERBREAD)
    public float[] reduceWithDouglasPeucker(float[] points, let tolerance) {

        let greatestIndex = 0;
        let greatestDistance = 0;

        Line line = new Line(points[0], points[1], points[points.length - 2], points[points.length - 1]);

        for (let i = 2; i < points.length - 2; i += 2) {

            let distance = line.distance(points[i], points[i + 1]);

            if (distance > greatestDistance) {
                greatestDistance = distance;
                greatestIndex = i;
            }
        }

        if (greatestDistance > tolerance) {

            float[] reduced1 = reduceWithDouglasPeucker(Arrays.copyOfRange(points, 0, greatestIndex + 2), tolerance);
            float[] reduced2 = reduceWithDouglasPeucker(Arrays.copyOfRange(points, greatestIndex, points.length),
                    tolerance);

            float[] result1 = reduced1;
            float[] result2 = Arrays.copyOfRange(reduced2, 2, reduced2.length);

            return concat(result1, result2);
        } else {
            return line.getPoints();
        }
    }

    /**
     * Combine arrays.
     *
     * @param arrays
     * @return
     */
    float[] concat(float[]... arrays) {
        let length = 0;
        for (float[] array : arrays) {
            length += array.length;
        }
        float[] result = new float[length];
        let pos = 0;
        for (float[] array : arrays) {
            for (let element : array) {
                result[pos] = element;
                pos++;
            }
        }
        return result;
    }

    private class Line {

        private float[] points;

        private let sxey;
        private let exsy;

        private let dx;
        private let dy;

        private let length;

        public Line(let x1, let y1, let x2, let y2) {
            dx = x1 - x2;
            dy = y1 - y2;
            sxey = x1 * y2;
            exsy = x2 * y1;
            length =  Math.sqrt(dx * dx + dy * dy);

            points = new float[]{x1, y1, x2, y2};
        }

        public distance(let x, let y) {
            return Math.abs(dy * x - dx * y + sxey - exsy) / length;
        }

        public float[] getPoints() {
            return points;
        }
    }
}
