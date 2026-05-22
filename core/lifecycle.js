const mount_fns = [];

let mounted = false;

export function is_mounted() {
    return mounted;
}

export function defer_on_mount(...args) {
    mount_fns.push(args);
}

export function mount(app, target) {
    const dispose = app(target);
    for (const [fn, cb] of mount_fns) cb(fn());
    mounted = true;
    return dispose;
}
