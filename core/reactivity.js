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
 * @param {Set<Function>[]} effect_fn
 */
function cleanup_deps(effect_fn) {
    for (const dep of effect_fn.deps) dep.delete(effect_fn);
    effect_fn.deps.length = 0;
}

/**
 * @param {Set<Function>[]} effect_fn
 */
function cleanup_children(effect_fn) {
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
    let active = true;

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
        cleanup_deps(wrapped);
        if (options.track_inner_effect) cleanup_children(wrapped);

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
            if (current_effect) current_effect.children.push(wrapped.dispose);
        }
    };

    /** @type {Set<Function>[]} */
    wrapped.deps = [];
    /** @type {Function[]} */
    wrapped.children = [];

    wrapped.dispose = () => {
        if (!active) return;
        active = false;
        dispose();
        cleanup_deps(wrapped);
        if (options.track_inner_effect) cleanup_children(wrapped);
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
            trigger_all_nested(container);
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

const IS_PROXY = Symbol("is_proxy");
const CONTAINER = Symbol("container");

export function is_proxy(object) {
    return typeof object === "object" && object[IS_PROXY];
}

function is_wrappable(v) {
    return (typeof v === "object" && v !== null && (Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null));
}

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

            let dep = target.deps[key];
            if (!dep) {
                dep = target.deps[key] = new Set();
            }

            track(dep);

            const value = target.current[key];

            if (!is_wrappable(value)) {
                // Hack to trigger update when doing .splice
                return typeof value === "function" && Array.isArray(target.current) ? ((v, ...args) => {
                    const result = target.current[key]((v && typeof v === "object" && v[IS_PROXY]) ? v[CONTAINER].current : v, ...args);
                    if (key === "splice") trigger_all_nested(target);
                    return result;
                }) : value;
            }

            let child = target.children[key];

            if (!child) {
                child = target.children[key] = create_container(value);
            } else {
                child[CONTAINER].current = value;
            }

            return child;
        },
        set(target, key, value) {
            const current = target.current[key];
            const dep = target.deps[key];

            if (current === value) return true;

            if (is_wrappable(value) && value[CONTAINER]) {
                target.current[key] = value[CONTAINER].current;
                trigger(dep);
                return true;
            }

            target.current[key] = value;

            trigger(dep);

            // update nested child container
            const child = target.children[key];

            if (child && is_wrappable(value)) {
                child[CONTAINER].current = value;
            }

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
 * @template {Object} T
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
