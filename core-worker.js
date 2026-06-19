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
        localcache.set(data.url, { code: data.code, etag: data.etag, file : data.file });
        return;
    }

    if (type === "HAS_MODULE") {
        const cache = localcache.get(data.url);
        broadcast_channel.postMessage({ type : "RESOLVE_HAS_MODULE",  id: data.id, url: data.url, etag: cache?.etag, file: cache?.file, has_cache : Boolean(cache) });
        return;
    }

    if (type === "VALIDATE_MODULE") {
        try {
            const cache = localcache.get(data.url);
            const response = await fetch(data.url, { headers: { "If-None-Match": cache.etag || "", "X-Core-Cache-Validation": "true" } });

            if (cache.etag && response.status === 304) return;
            if (!cache.etag && response.status === 200) {
                // console.warn("[core-assist]: no etag found. matching response body isntead");
                if (!cache.file) return // console.error("[core-assist]: no component file found. skipping cache invalidation");
                const text = await response.text();
                if (text === cache.file) return;
                // .error("[core-assist]: component file does not match server response. Invalidating module cache");
            } else {
                // console.error("[core-assist]: etag mismatch. Invalidating module cache");
            }
        } catch (error) {
            console.log(error)
        }

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
