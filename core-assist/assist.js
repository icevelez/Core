let fragment_start_index = 0;

const CORE_ASSIST = {
    version: "v0.1.0",
    /**
     * Generates a function that initializes all templates used in a component
     * @param {string} script_code
     * @param {DocumentFragment[]} fragment_cache
     */
    cache_render_function: function (url, etag, script_code, fragment_cache) {
        const current_frag = [...fragment_cache].splice(fragment_start_index, fragment_cache.length);
        fragment_start_index = fragment_cache.length;

        const injectable_frag_func = `
        export function $CORE_INIT_TEMPLATE() {
            const $CORE = window.__core__;
            const html = window.__core_assist__.html;
            ${
                current_frag.map((frag, i) => {
                    const template = document.createElement("template");
                    template.content.append(frag);
                    const result = `$CORE.fragment_cache[${fragment_start_index + i}] = html(${JSON.stringify(template.innerHTML)})`;
                    frag.append(template.content)
                    return result;
                }).join("\n\t\t\t")
            }
        }`;

        script_code = `${script_code}\n\n${injectable_frag_func}`;

        CORE_ASSIST.service_worker.active.postMessage({ code: script_code, url, etag });

        return script_code;
    },
    /** @type {ServiceWorkerRegistration | null} */
    service_worker : null,
}

if (navigator.serviceWorker) {
    CORE_ASSIST.service_worker = await navigator.serviceWorker.register("./core-assist/service-worker.js", { type: "module" });
    window.__core_assist__ = CORE_ASSIST;
} else {
    console.error("Core Assist Error: Service Worker not found");
}
