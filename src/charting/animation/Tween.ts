import { time } from '@nativescript/core/profiling';
import { AdditiveTweening, EasingFunction } from 'additween';
export { EasingFunction };
if (!global.window) {
    window = global.window = {
        requestAnimationFrame,
        cancelAnimationFrame,
        performance: {
            now: time
        }
    } as any;
}

export class Tween<T extends Record<string, number>> extends AdditiveTweening<T> {}