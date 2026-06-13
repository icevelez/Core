import { signal } from "../core/runtime.js";

const CONTROLLER_VALUE = Symbol();

/**
 * @template T
 * @template {Record<string, (value:T, ...args:any[]) => (T | Promise<T>)>} A
 *
 * @param {T} value
 * @param {A} actions
 *
 * @returns {{ state : T } & { [K in keyof A]: (...args: Parameters<A[K]> extends [any, ...infer R] ? R : never) => void }}
 */
export function create_controller_store(value, actions) {
    const action_keys = Object.keys(actions).filter(k => k !== "state");
    const defined_actions = {
        [CONTROLLER_VALUE]: signal(value),
        get state() {
            return this[CONTROLLER_VALUE][0]();
        },
    };

    for (const key of action_keys) defined_actions[key] = function (...args) {
        const value = actions[key](this[CONTROLLER_VALUE][0](), ...args);
        if (value instanceof Promise) return value.then((value) => this[CONTROLLER_VALUE][1](value));
        this[CONTROLLER_VALUE][1](value);
    }

    return defined_actions;
}
