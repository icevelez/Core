const core_component_cache = new Map();
const promise_map = new Map();
const broadcast_channel = new BroadcastChannel("CORE_ASSIST");

self.addEventListener('install', self.skipWaiting);
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
    const url = event.request.url;
    const destination = event.request.destination;

    if (destination === 'script' && url.split(".").at(-1) === "html") {
        event.respondWith(core_intercept(url));
        return;
    }
});

const defaut_url_option = {
    headers: {
        "Content-Type": "application/javascript"
    }
};

async function core_intercept(url) {
    const cache = core_component_cache.get(url);
    try {
        const response = await fetch(url);
        if (!response.ok) return response;
        if (response.status === 304 && cache && cache.module) return new Response(cache.module, { ...defaut_url_option });

        const text = await response.text();
        if (cache && cache.text === text) return new Response(cache.module, { ...defaut_url_option });

        const promise_id = Math.random().toString(16).slice(2);
        broadcast_channel.postMessage({ type: "COMPILE_CORE_COMPONENT", promise_id, text });
        const module = await new Promise((resolve) => promise_map.set(promise_id, resolve));

        core_component_cache.set(url, { text, module });

        return new Response(module, { ...defaut_url_option });
    } catch (error) {
        console.error(error);
        if (cache && cache.module) {
            console.info("[Core Worker]: Something went wrong. Falling back to cached modules");
            return new Response(cache.module, { ...defaut_url_option });
        }
    }
}

broadcast_channel.addEventListener("message", async (event) => {
    const data = event.data;
    const type = data.type;

    if (type === "RESOLVE_COMPILE_CORE_COMPONENT") {
        const { promise_id, module } = data;
        const resolve = promise_map.get(promise_id);

        if (!resolve) {
            console.error("[Core Worker]: Broadcast Message to resovle a core component has no resolve function");
            return;
        }

        resolve(module);
        return;
    }
});
