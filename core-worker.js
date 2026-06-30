const localcache = new Map();
const broadcast_channel = new BroadcastChannel("CORE_ASSIST");

self.addEventListener("fetch", (event) => {
    if (event.request.destination !== 'script') return;
    const cache = handle_component_request(event.request);
    if (!cache) return;
    event.respondWith(cache);
});

broadcast_channel.addEventListener("message", async (event) => {
    const data = event.data;
    const type = data.type;

    if (type === "CACHE_MODULE") {
        const cache = localcache.get(data.url);
        localcache.set(data.url, { ...cache, code: data.code });
        return;
    }

    if (type === "HAS_MODULE") {
        const cache = localcache.get(data.url);
        if (!cache) localcache.set(data.url, { text: data.text });
        broadcast_channel.postMessage({ type: "RESOLVE_HAS_MODULE", id: data.id, has_cache: (data.text === cache?.text) });
    }
});

function handle_component_request(request) {
    const metadata = localcache.get(request.url);
    if (!metadata) return;
    return new Response(metadata.code, {
        headers: {
            "Content-Type": "application/javascript"
        }
    });
}
