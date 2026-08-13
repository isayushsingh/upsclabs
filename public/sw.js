// Minimal service worker for installability + light offline support.
//
// Deliberately does NOT precache Next.js's hashed JS/CSS chunks — those
// filenames change on every build, so a static precache list would go
// stale and serve broken bundles after a deploy. Instead:
//   - Page navigations: network-first, falling back to a cached copy (or
//     the cached homepage) when offline, so a repeat visitor mid-flight
//     still gets *something* instead of the browser's offline page.
//   - Static assets (icons/fonts/images): cache-first, since those are
//     content-hashed or effectively immutable.
// Bump CACHE_VERSION whenever this file's caching strategy changes, so old
// clients drop their stale cache instead of accumulating cruft.
const CACHE_VERSION = "v1";
const CACHE_NAME = `upsclabs-${CACHE_VERSION}`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/")))
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
