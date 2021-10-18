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
} else if (!global.window.requestAnimationFrame) {
    global.window.requestAnimationFrame = requestAnimationFrame;
    global.window.cancelAnimationFrame = cancelAnimationFrame;
    if (!global.window.performance) {
        //@ts-ignore
        global.window.performance = {
            now: time
        };
    }
}

export class Tween<T extends Record<string, number>> extends AdditiveTweening<T> {}
