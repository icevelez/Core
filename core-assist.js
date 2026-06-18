let fragment_start_index = 0;

const resolve_map = new Map();

const CORE_ASSIST = {
    version: "v0.1.0",
    /** @type {ServiceWorkerRegistration | null} */
    service_worker: null,
    broadcast_channel: new BroadcastChannel("CORE_ASSIST"),
    set_cache: function (url, etag, code) {
        CORE_ASSIST.broadcast_channel.postMessage({ type: "CACHE_MODULE", code, url, etag });
    },
    has_cache: async function (url) {
        const new_url = new URL(`${ url.startsWith("http:") || url.startsWith("https:") || url.startsWith("data:") ? url : `${window.location.origin}/${url}` }`);
        const id = Math.random().toString(16).substring(4);
        CORE_ASSIST.broadcast_channel.postMessage({ type: "HAS_MODULE", id, url : new_url.href });
        return new Promise((resolve) => { resolve_map.set(id, resolve) });
    },
    use_cache: async function (url) {
        const new_url = new URL(`${ url.startsWith("http:") || url.startsWith("https:") || url.startsWith("data:") ? url : `${window.location.origin}/${url}` }`);
        const { $COMPONENT_ID, default: render_function, ...component_promises } = await import(new_url);

        const CORE = window.__core__;
        await CORE.resolve_components(component_promises, $COMPONENT_ID());

        return render_function;
    },
    background_cache_validation: async function (url, etag) {
        const response = await fetch(url, { headers: { "If-None-Match" : etag, "X-Core-Cache-Validation" : "true" } });
        if (response.status !== 200) return;
        CORE_ASSIST.broadcast_channel.postMessage({ type: "INVALIDATE_MODULE", url });
    }
}

export async function start_core_assist() {
    if (navigator.serviceWorker) {
        await navigator.serviceWorker.register("./core-worker.js", { type: "module", scope : "/" });
        window.__core_assist__ = CORE_ASSIST;

        CORE_ASSIST.broadcast_channel.addEventListener("message", (event) => {
            const data = event.data;
            const type = data.type;

            if (type === "RESOLVE_HAS_MODULE") {
                const resolve = resolve_map.get(data.id);
                if (data.etag) background_cache_validation(data.url, data.etag); // if no "etag" just re-use cache indefinitely
                if (resolve) return resolve(data.has_cache);
                return;
            }
        })
    } else {
        console.error("Core Assist Error: Service Worker not found");
    }
}
