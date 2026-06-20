import { signal } from "core";

const STORE_KEY = Symbol();

/**
 *
 * Creates a managed reactive value whose state can only be
 * modified through explicitly defined actions.
 *
 * This pattern is similar to:
 *   - Flux stores
 *   - Redux reducers + dispatchers
 *   - Zustand actions
 *   - Pinia actions
 *
 * Instead of exposing a writable signal directly, state updates
 * are centralized inside named actions, making state transitions
 * easier to reason about and debug.
 *
 * Example:
 *
 * ```js
 * const Counter = create_managed_value(0, {
 *     increment(value) {
 *         return value + 1;
 *     },
 *
 *     decrement(value) {
 *         return value - 1;
 *     },
 *
 *     add(value, amount) {
 *         return value + amount;
 *     }
 * });
 *
 * Counter.increment();
 * Counter.add(5);
 *
 * console.log(Counter.value);
 * ```
 *
 * Actions receive the current state as their first argument and
 * must return the next state.
 *
 * Both synchronous and asynchronous actions are supported.
 *
 * Example:
 *
 * ```js
 * const User = create_managed_value(null, {
 *     async load() {
 *         return await fetch("/api/user")
 *             .then(r => r.json());
 *     }
 * });
 * ```
 *
 * When an action returns a Promise, the state is updated
 * automatically after the Promise resolves.
 *
 * @template T
 * @template {Record<string, (value:T, ...args:any[]) => (T | Promise<T>)>} A
 *
 * @param {T} value
 * @param {A} actions
 *
 * @returns {{ value : T } & { [K in keyof A]: (...args: Parameters<A[K]> extends [any, ...infer R] ? R : never) => void }}
 */
export function create_managed_value(value, actions) {
    const action_keys = Object.keys(actions).filter(k => k !== "value");
    const defined_actions = {
        [STORE_KEY]: signal(value),
        get value() {
            return this[STORE_KEY][0]();
        },
    };

    for (const key of action_keys) defined_actions[key] = function (...args) {
        const value = actions[key](this[STORE_KEY][0](), ...args);
        if (value instanceof Promise) return value.then((value) => this[STORE_KEY][1](value));
        this[STORE_KEY][1](value);
    }

    return defined_actions;
}
