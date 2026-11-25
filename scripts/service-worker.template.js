/* SunTech owns only this worker and suntech-shell-* caches. It NEVER caches
 * API responses, personalized HTML, RSC, passwords, or financial mutations. */
const VERSION = __SUNTECH_VERSION__;
const CACHE = `suntech-shell-${VERSION}`;
const SHELL = __SUNTECH_SHELL__;
const ASSETS = __SUNTECH_ASSETS__;
const allowed = new Set(ASSETS);
const routes = /^(?:\/(?:pos|admin)(?:\/[^.]*)?|\/login|\/)$/;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  // No skipWaiting: open tills keep their current code until all tabs close.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('suntech-shell-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return;
  if (allowed.has(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname)) || fetch(request)));
    return;
  }
  if (request.mode === 'navigate' && routes.test(url.pathname)) {
    event.respondWith((async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch(request, { signal: controller.signal });
        if (response.status < 500) return response;
      } catch { /* Both application servers can be down. */ }
      finally { clearTimeout(timer); }
      return (await (await caches.open(CACHE)).match(SHELL)) || new Response('Offline application files are not ready. Reconnect to finish setup.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    })());
  }
});
