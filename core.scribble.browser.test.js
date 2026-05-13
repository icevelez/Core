// === Core-reactivity === //

/** @type {Function[]} */
const effect_stack = [];
/** @type {Function | null} */
let current_effect = null;

/**
 * batching state
 * @type {Set<Function>}
 */
const effect_queue = new Set();
let is_flushing = false;

function queue_effect(dep) {
    for (const effect_fn of dep) effect_queue.add(effect_fn);

    if (is_flushing) return;
    is_flushing = true;

    queueMicrotask(() => {
        try {
            for (const fn of effect_queue) fn();
        } catch (error) {
            console.error("effect microtask execution error\n", { effect_queue }, error)
        } finally {
            effect_queue.clear();
            is_flushing = false;
        }
    });
}

/**
 * @param {Set<Function>[]} effect_fn
 */
function cleanup_deps(effect_fn) {
    for (const dep of effect_fn.deps) dep.delete(effect_fn);
    effect_fn.deps.length = 0;
}

/**
 * @param {Function[]} effect_fn
 */
function cleanup_children(dispose_fns) {
    for (const fn of dispose_fns) fn();
    dispose_fns.length = 0;
}

/**
 * Returns a dispose function for manually disposal of effect
 * @param {Function} fn
 */
function effect(fn) {
    if (typeof fn !== "function") throw "Effect callback is not a function";

    let fn_cleanup = null;
    let active = true;

    const fn_cleanup_fn = () => {
        if (typeof fn_cleanup !== "function") return
        try {
            fn_cleanup();
            fn_cleanup = null;
        } catch (error) {
            console.error("effect cleanup error\n", { fn }, error);
        }
    }

    const wrapped = () => {
        if (!active) return;

        fn_cleanup_fn();
        cleanup_deps(wrapped);
        cleanup_children(wrapped.children);

        effect_stack.push(wrapped);
        current_effect = wrapped;
        wrapped.deps = [];

        try {
            fn_cleanup = fn();
        } catch (error) {
            console.error("effect error:", fn, "\n", error);
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
        fn_cleanup_fn();
        cleanup_deps(wrapped);
        cleanup_children(wrapped.children);
    };

    wrapped();

    return wrapped.dispose;
}

/**
 * @template {any} T
 * @param {T} initial_value
 */
function signal(initial_value) {
    let value = wrap_object(initial_value);

    const dep = new Set();
    const read = () => {
        if (!current_effect || dep.has(current_effect)) return value;

        dep.add(current_effect);
        current_effect.deps.push(dep);

        return value;
    }

    /**
     * @param {T} new_value
     */
    read.set = (new_value) => {
        if (value === new_value) return;
        value = new_value;
        queue_effect(dep);
    }

    /**
     * @param {() => T} fn
     */
    read.update = (fn) => {
        if (typeof fn !== "function") throw "signal update fn is not a function";
        try {
            const new_value = fn(value);
            read.set(new_value);
        } catch (error) {
            console.error("signal update error\n", { fn }, error);
        }
    }

    return read;
}

/**
 * @template {any} T
 * @param {() => T} fn
 * @returns {{ () => T, dispose : () => void }}
 */
function memoize(fn) {
    const value = signal(null);
    const set = value.set;

    delete value.set;
    delete value.update;

    value.dispose = effect(() => {
        const new_value = fn();
        if (value() === new_value) return;
        set(new_value);
    })

    return value;
}

/**
 * WeakMap: target -> Map(key -> Set(effects))
 * @type {WeakMap<Object, Map<any, Set<Function>>>}
 */
const target_weakmap = new WeakMap();

/**
 * @param {Object} target
 * @param {any} key
 */
function listen_for_reactive_dependencies(target, key) {
    if (!current_effect) return;

    let deps_map = target_weakmap.get(target);
    if (!deps_map) {
        deps_map = new Map();
        target_weakmap.set(target, deps_map);
    }

    let dep = deps_map.get(key);
    if (!dep) {
        dep = new Set();
        deps_map.set(key, dep);
    }

    if (!dep.has(current_effect)) {
        dep.add(current_effect);
        current_effect.deps.push(dep);
    }
}

/**
 * @param {Object} target
 * @param {any} key
 */
function trigger_reactive_dependencies_of(target, key) {
    const deps_map = target_weakmap.get(target);
    if (!deps_map) return;

    const dep = deps_map.get(key);
    if (!dep) return;

    // batch instead of immediate run
    queue_effect(dep);
}

const proxy_cache = new WeakMap();
const IS_PROXY = Symbol();
const isWrappableObject = (v) => Array.isArray(v) || (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

/**
 * @template {Object} T
 * @param {T} object
 * @returns {T}
 */
function wrap_object(object) {
    if (typeof object !== "object" || object === null) return object;
    if (!isWrappableObject(object)) {
        console.warn("object", object, "cannot be proxied. object will not be reactive.");
        return object;
    }

    if (proxy_cache.has(object)) return proxy_cache.get(object);

    if (object[IS_PROXY]) return object;
    object[IS_PROXY] = true;

    const proxy = new Proxy(object, {
        get(target, key) {
            listen_for_reactive_dependencies(target, key);
            return wrap_object(target[key]);
        },
        set(target, key, value, receiver) {
            if (target[key] === value) return true;
            const result = Reflect.set(target, key, value, receiver); // used for proper assignment
            // target[key] = value;
            trigger_reactive_dependencies_of(target, key);
            return result;
        },
        deleteProperty(target, key) {
            const result = delete target[key];
            trigger_reactive_dependencies_of(target, key);
            return result;
        }
    })

    proxy_cache.set(object, proxy);

    return proxy;
}


// === Core === //

/*
current_props = [];
secret_key = Symbol();

function create_link(object, key) {
    return { object, key };
}

function attach_property(object, key, value) {
    const fn = object[secret_key];
    if (!fn) return false;
    fn(key, value);
}

function attach_props(object, props) {
	for (const [key, value] of current_props) attach_property(object, key, value);
}

class CoreComponent {
  constructor() {
      const link_vars = new Map();

      this[secret_key] = (key, fn) => link_vars.set(key, fn);

      attach_props(this);

      return new Proxy(this, {
          get(target, key) {
              const linked_var = link_vars.get(key);
              if (linked_var) return linked_var.object[linked_var.key];

              return target[key];
          },
          set(target, key, value) {
              const linked_var = link_vars.get(key);
              if (linked_var) {
                  linked_var.object[linked_var.key] = value;
                  return true;
              }

              target[key] = value;
              return true;
          },
          deleteProperty(target, key) {
            const linked_var = link_vars.get(key);
            if (linked_var) {
                delete linked_var.object[linked_var.key];
                return true;
            }

            delete target[key];
            return true;
          }
      })
	}
}

class Parent extends CoreComponent {
	name = "john doe";
}

class Counter extends CoreComponent {
    count = 0;

	onMount = () => {
		// console.log("counter mounting:", this.name);
    }
}

class Double extends CoreComponent {
    get n() { return this.name };
    double = () => this.count * 2;
}

const parent = new Parent();

current_props = [['name', create_link(parent, 'name')]];
const counter = new Counter();
current_props = [];

current_props = [['name', create_link(counter, 'name')], ['count', create_link(counter, 'count')]];
const double = new Double();
current_props = [];

// const onmount = counter.onMount;
// delete counter.onMount;

// const ondestroy = counter.onDestroy;
// delete counter.onDestroy;

// const onmount_cleanup = onmount();

console.log(counter.name)

delete counter.name;

console.log(parent.name);

counter.name = "renamed john";

console.log(parent.name);
*/

class Component {
    profile = signal({
        name: "john doe",
        age: 26,
        friends: [
            "lisa",
            "mathew",
            "albert",
            "andrew",
        ]
	});
}

const component = new Component();

const dispose_efffect = effect(() => {
    effect(() => {
        console.log("component:", component.profile().test);
    })
    effect(() => {
        console.log("component:", component.profile().friends.length);
    })
    effect(() => {
        console.log("component:", component.profile().friends);
    })
})

setTimeout(() => component.profile().friends.pop(), 3000);
setTimeout(() => component.profile.set({ test : "LOLOLOLOL" }), 4000);
setInterval(() => component.profile().friends[0] = (Math.random() + 1).toString(36).substring(7), 1000);
// setInterval(() => counter.count.set(counter.count() + 1), 1000);
