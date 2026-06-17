
const CACHE_NAME = "core-compiled-modules";

const localcache = new Map();
const broadcast_channel = new BroadcastChannel("CORE_ASSIST");


self.addEventListener("fetch", (event) => {
    if (event.request.destination !== 'script') return;
    const cache = handle_component_request(event.request);
    if (!cache) return;
    event.respondWith(cache);
});

broadcast_channel.addEventListener("message", (event) => {
    const data = event.data;
    const type = data.type;

    if (type === "CACHE_MODULE") {
        localcache.set(data.url, { code: data.code, etag: data.etag });
        return;
    }

    if (type === "HAS_MODULE") {
        const has_cache = localcache.has(data.url);
        broadcast_channel.postMessage({ type : "RESOLVE_HAS_MODULE",  id: data.id, url: data.url, etag: data.etag, has_cache });
        return;
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
