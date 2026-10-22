const CACHE_NAME = "musky-p2v-v10";
const APP_SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((error) => {
        // A temporary offline/cache error should not prevent the app from opening.
        console.warn("MuskySocials app shell could not be fully cached:", error);
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("musky-p2v-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Do not intercept third-party services, authentication, or API requests.
  if (url.origin !== self.location.origin) return;

  const isAppDocument = request.mode === "navigate" ||
    /\.(?:html|css|js|json|webmanifest)$/i.test(url.pathname);

  if (isAppDocument) {
    // Network first prevents stale HTML or scripts from resurrecting the old UI.
    event.respondWith(
      fetch(url.href, { cache: "no-store", credentials: request.credentials, redirect: request.redirect }).then((response) => {
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await caches.match("./index.html");
          if (fallback) return fallback;
        }
        return new Response("You appear to be offline. Reconnect and reload MuskySocials.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      })
    );
    return;
  }

  // Other same-origin assets are fetched fresh, with a cached fallback offline.
  event.respondWith(
    fetch(request).then((response) => {
      if (response && response.ok && response.type === "basic") {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())).catch(() => {});
      }
      return response;
    }).catch(async () => (await caches.match(request)) || Response.error())
  );
});
