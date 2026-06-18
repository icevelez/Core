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
        localcache.set(data.url, { code: data.code, etag: data.etag, file : data.file });
        return;
    }

    if (type === "HAS_MODULE") {
        const cache = localcache.get(data.url);
        broadcast_channel.postMessage({ type : "RESOLVE_HAS_MODULE",  id: data.id, url: data.url, etag: cache?.etag, file: cache?.file, has_cache : Boolean(cache) });
        return;
    }

    if (type === "INVALIDATE_MODULE") {
        localcache.delete(data.url);
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
