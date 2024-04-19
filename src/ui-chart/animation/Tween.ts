import { time } from '@nativescript/core/profiling';
import { cancelAnimationFrame, requestAnimationFrame } from '@nativescript/core/animation-frame';
import { AdditiveTweening, EasingFunction } from '@nativescript-community/additween';
export { EasingFunction };
if (!global.window) {
    global.window = {
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
