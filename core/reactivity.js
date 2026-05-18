let is_debugger_on = false;

/** @type {Function[]} */
let effect_stack = [];
/** @type {Function | null} */
let current_effect = null;

/**
 * @type {Set<Function>}
 */
const effect_queue = new Set();
let is_flushing = false;

function track(dep) {
    if (!current_effect || dep.has(current_effect)) return;
    dep.add(current_effect);
    current_effect.deps.push(dep);
}

function trigger(dep) {
    for (const effect_fn of dep) effect_queue.add(effect_fn);

    if (is_flushing) return;
    is_flushing = true;

    queueMicrotask(() => {
        try {
            for (const fn of effect_queue) fn();
        } catch (error) {
            console.error("effect microtask execution error\n", effect_queue, error)
        } finally {
            effect_queue.clear();
            is_flushing = false;
        }
    });
}

export const trigger_dep = (object, key) => {
    const container = object[CONTAINER];
    trigger(container.deps[key])
    const child = container.children[key];
    if (child && child[CONTAINER]) trigger_all_nested(child[CONTAINER]);
};

function trigger_all_nested(container) {
    // trigger own deps
    for (const key in container.deps) trigger(container.deps[key]);

    // recursively trigger children
    for (const key in container.children) {
        const child = container.children[key];
        if (child && child[CONTAINER]) trigger_all_nested(child[CONTAINER]);
    }
}

/**
 * @param {{ deps : Set<Function>, children : Set<Function> }[]} effect_fn
 */
function dispose_deps(effect_fn) {
    for (const dep of effect_fn.deps) dep.delete(effect_fn);
    effect_fn.deps.length = 0;

    for (const fn of effect_fn.children) fn();
    effect_fn.children.length = 0;
}

/**
 * Returns a dispose function for manually disposal of effect
 * @param {Function} fn
 * @param {{ track_inner_effect : boolean }} options
 */
export function effect(fn, options = { track_inner_effect : true }) {
    if (typeof fn !== "function") throw "Effect callback is not a function";

    let dispose_fn = null;
    let active = true;      // flag to prevent effect re-run if already dispose

    const dispose = () => {
        if (typeof dispose_fn !== "function") return
        try {
            dispose_fn();
            dispose_fn = null;
        } catch (error) {
            console.trace("effect cleanup error\n", fn, error);
        }
    }

    const wrapped = () => {
        if (!active) return;

        dispose();
        dispose_deps(wrapped);

        effect_stack.push(wrapped);
        current_effect = wrapped;
        wrapped.deps = [];

        try {
            dispose_fn = fn();
        } catch (error) {
            // ignored
            if (is_debugger_on) console.error(error);
        } finally {
            effect_stack.pop();
            current_effect = effect_stack[effect_stack.length - 1] || null;
            if (current_effect?.track_inner_effect) current_effect.children.push(wrapped.dispose);
        }
    };

    wrapped.track_inner_effect = options.track_inner_effect;

    /** @type {Set<Function>[]} */
    wrapped.deps = [];
    /** @type {Function[]} */
    wrapped.children = [];

    wrapped.dispose = () => {
        if (!active) return;
        active = false;
        dispose();
        dispose_deps(wrapped);
    };

    wrapped();

    return wrapped.dispose;
}

const signal_key = Symbol();

/**
 * @param {any} signal
 */
export function is_signal(signal) {
    return Boolean(signal && typeof signal === "function" && signal[signal_key]);
}

/**
 * @template {any} T
 * @param {T} initial_value
 */
export function signal(initial_value) {
    let value = wrap_object(initial_value);
    let container = is_wrappable(value) ? value[CONTAINER] : null;

    const dep = new Set();

    const read = () => {
        track(dep);
        return value;
    }

    /**
     * @param {T} new_value
     */
    read.set = (new_value) => {
        if (value === new_value) return;

        if (container) {
            container.current = new_value;
        } else {
            value = wrap_object(new_value);
            container = is_wrappable(value) ? value[CONTAINER] : null;
        }

        trigger(dep);
    }

    /**
     * @param {() => T} fn
     */
    read.update = (fn) => {
        if (typeof fn !== "function") throw "signal update fn is not a function";
        try {
            read.set(fn(value));
        } catch (error) {
            console.error("signal update error\n", fn, error);
        }
    }

    read[signal_key] = true;

    return read;
}

const container_cache = new WeakMap();
const array_mutation_keys = new Set(["push","pop","shift","unshift","splice","sort","reverse","fill","copyWithin"]);
const map_mutation_keys = new Set(["set", "delete", "clear"]);
const map_access_keys = new Set(["get", "has", "size"]);

const IS_PROXY = Symbol("is_proxy");
const CONTAINER = Symbol("container");

export const is_proxy = (object) => typeof object === "object" && object[IS_PROXY];
const is_wrappable = (v) => v && typeof v === "object";

function create_container(object) {
    const container = {
        current: object,
        deps: Object.create(null),
        children: Object.create(null)
    };

    const proxy = new Proxy(container, {
        get(target, key) {
            if (key === IS_PROXY) return true;
            if (key === CONTAINER) return target;

            if (target.current instanceof Map || target.current instanceof Set) {
                if (map_access_keys.has(key)) return (...args) => {
                    const get_key = args[0];
                    let dep = target.deps[get_key];
                    if (!dep) dep = target.deps[get_key] = new Set();
                    track(dep)
                    return target.current[key](...args);
                }
                if (map_mutation_keys.has(key)) return (...args) => {
                    const result = target.current[key](...args.map((v) => (v && typeof v === "object" && v[IS_PROXY]) ? v[CONTAINER].current : v));
                    if (key !== "clear" && !(target instanceof Set && key === "set")) {
                        const get_key = args[0];
                        const dep = target.deps[get_key];
                        if (dep) trigger(dep)
                    } else {
                        trigger_all_nested(container)
                    }
                    return result;
                }
                return target.current[key];
            }

            let dep = target.deps[key];
            if (!dep) dep = target.deps[key] = new Set();

            const value = target.current[key];

            if (!is_wrappable(value)) {
                if (typeof value === "function")
                    // Hack to trigger update when mutating an array
                    return (Array.isArray(target.current)) ? ((...args) => {
                        const result = target.current[key](...args.map((v) => (v && typeof v === "object" && v[IS_PROXY]) ? v[CONTAINER].current : v));
                        if (array_mutation_keys.has(key)) trigger_all_nested(target);
                        return result;
                    }) : value;
                track(dep);
                return value;
            }

            track(dep);

            let child = target.children[key];

            if (!child) {
                child = target.children[key] = create_container(value);
            } else {
                child[CONTAINER].current = value;
            }

            return child;
        },
        set(target, key, new_value) {
            const current = target.current[key];
            const value = (is_wrappable(new_value) && new_value[CONTAINER]) ? new_value[CONTAINER].current : new_value;
            if (current === value) return true;

            const dep = target.deps[key];

            target.current[key] = value;
            if (dep) trigger(dep);

            // update nested child container
            const child = target.children[key];
            if (child) child[CONTAINER].current = value;

            return true;
        },
        deleteProperty(target, key) {
            delete target.current[key];

            const dep = target.deps[key];
            if (dep) trigger(dep);

            return true;
        }
    });

    return proxy;
}

/**
 * @template {any} T
 * @param {T} object
 * @returns {T}
 */
 function wrap_object(object) {
     if (!is_wrappable(object)) return object;
     if (object[IS_PROXY]) return object;
     if (container_cache.has(object)) return container_cache.get(object);

     const proxy = create_container(object);

     container_cache.set(object, proxy);

     return proxy;
 }
