const root_context = Object.create(null);
let current_context = root_context;

export function create_new_context() {
    return Object.create(current_context);
}

export function set_current_context(context) {
    const old_context = current_context;
    current_context = context;
    return old_context;
}

export function set_context(key, value) {
    current_context[key] = value;
}

export function get_context(key) {
    return current_context[key];
}
