const CACHE_NAME = "core-compiled-modules";

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (!url.pathname.endsWith(".html")) return;

    event.respondWith(handle_component_request(event.request));
});

self.addEventListener("message", async (event) => {
    const data = event.data;

    if (data.type !== "CACHE_MODULE") {
        return;
    }

    const cache = await caches.open(CACHE_NAME);

    await cache.put(
        data.url,
        {
            etag : data.etag,
            code: data.code
        },
    );
});

async function handle_component_request(request) {
    const cache = await caches.open(CACHE_NAME);
    const metadata = await cache.match(request.url);

    if (!metadata) {
        return fetch(request);
    }

    const response = new Response(metadata.code, {
        headers: {
            "Content-Type": "application/javascript",
            "X-Core-Compiled": "true",
        },
    });

    if (!metadata.etag) {
        return response;
    }

    const validation = await fetch(request.url, {
        headers: {
            "If-None-Match": metadata.etag,
        },
    });

    if (validation.status === 304) {
        return response;
    }

    await db.delete(request.url);

    return validation;
}
