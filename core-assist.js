let fragment_start_index = 0;

const resolve_map = new Map();

const CORE_ASSIST = {
    version: "v0.1.0",
    /** @type {ServiceWorkerRegistration | null} */
    service_worker: null,
    broadcast_channel: new BroadcastChannel("CORE_ASSIST"),
    /**
     * Generates a function that initializes all templates used in a component
     * @param {string} script_code
     * @param {DocumentFragment[]} fragment_cache
     */
    cache_render_function: function (url, etag, component_id, script_code, fragment_cache) {
        const current_frag = [...fragment_cache.map((f) => f.cloneNode(true))].splice(fragment_start_index, fragment_cache.length);

        const injectable_frag_func = `
    export function $COMPONENT_ID() {
        return "${component_id}";
    }

    export function $CORE_INIT_TEMPLATE() {
        const $CORE = window.__core__;
        const html = window.__core_assist__.html;
        ${
            current_frag.map((frag, i) => {
                const template = document.createElement("template");
                template.content.append(frag);
                return `$CORE.fragment_cache[${fragment_start_index + i}] = html(${JSON.stringify(template.innerHTML)})`;
            }).join("\n\t\t")
        }
    }`;

        script_code = `${script_code}${injectable_frag_func}`;

        CORE_ASSIST.broadcast_channel.postMessage({ type: "CACHE_MODULE", code: script_code, url, etag });

        fragment_start_index = fragment_cache.length;

        return script_code;
    },
    /**
     * Converts string to Document Fragment
     * @param {string} html_string
     */
    html: function (html_string) {
        const template = document.createElement("template");
        template.innerHTML = html_string;
        return template.content;
    },
    has_cache: async function (url) {
        const new_url = new URL(`${ url.startsWith("http:") || url.startsWith("https:") || url.startsWith("data:") ? url : `${window.location.origin}/${url}` }`);
        const id = Math.random().toString(16).substring(4);
        CORE_ASSIST.broadcast_channel.postMessage({ type: "HAS_MODULE", id, url : new_url.href });
        return new Promise((resolve) => { resolve_map.set(id, resolve) });
    },
    use_cache: async function (url) {
        const new_url = new URL(`${ url.startsWith("http:") || url.startsWith("https:") || url.startsWith("data:") ? url : `${window.location.origin}/${url}` }`);
        const { $CORE_INIT_TEMPLATE, $COMPONENT_ID, default: render_function, ...component_promises } = await import(new_url);

        $CORE_INIT_TEMPLATE();

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
