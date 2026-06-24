import { signal } from "core";

/**
 * Creates a managed reactive value whose state can only be modified through explicitly defined actions.
 *
 * Similar to: Flux Stores, Redux reducers + dispatch, Pinia stores, Zustand actions
 *
 * Actions receive the current state as their first argument and
 * return the next state. Actions may be synchronous or asynchronous.
 *
 * If an action returns a Promise:
 * - `pending()` becomes `true`
 * - the resolved value becomes the new state
 * - any thrown error is exposed through `error()`
 *
 * @template {any} T
 * @template {Record<string, (state:T, ...args:any[]) => T | Promise<T>>} A
 *
 * @param {T} value Initial state value.
 * @param {A} actions Object containing action functions.
 *
 * @returns {[
 *     () => T,
 *     {
 *         [K in keyof A]:
 *             (...args:
 *                 Parameters<A[K]> extends [any, ...infer R]
 *                     ? R
 *                     : never
 *             ) => void | Promise<void>
 *     },
 *     () => boolean,
 *     () => Error | null
 * ]}
 *
 * Returns:
 * 1. State getter
 * 2. Bound actions
 * 3. Pending getter
 * 4. Error getter
 */
export function create_managed_value(value, actions) {
    const action_keys = Object.keys(actions);
    const [value, setValue] = signal(value);
    const [pending, setPending] = signal(false);
    const [error, setError] = signal(null);
    const defined_actions = {};

    for (const key of action_keys) defined_actions[key] = function (...args) {
        const value = actions[key](value(), ...args);
        if (value instanceof Promise) {
            setPending(true);
            return value.then((value) => { setValue(value); setError(null); }).catch(error => setError(error)).finally(() => setPending(false));
        }
        setValue(value);
    }

    return [value, defined_actions, pending, error];
}
