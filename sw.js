// Offline support: everything is cached on the first visit; videos are served from the cache in byte ranges.
const CACHE = 'pe-booth-v1';
const FILES = ["./", "index.html", "style.css", "fonts.css", "content.js", "app.js", "assets/bg-dots.jpg", "assets/bg-map.jpg", "assets/map-dots.png", "assets/map-solid.png"];
const mem = new Map();
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
async function ranged(req, range) {
  const url = req.url.split('#')[0].split('?')[0];
  let buf = mem.get(url);
  if (!buf) {
    const hit = await caches.match(url);
    if (!hit) return fetch(req);
    buf = await hit.arrayBuffer(); mem.set(url, buf);
  }
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  const size = buf.byteLength;
  let a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : size - 1;
  if (!m[1] && m[2]) { a = Math.max(0, size - +m[2]); b = size - 1; }
  b = Math.min(b, size - 1);
  return new Response(buf.slice(a, b + 1), { status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': 'video/mp4', 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': String(b - a + 1), 'Accept-Ranges': 'bytes' } });
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const range = req.headers.get('range');
  if (range) { e.respondWith(ranged(req, range).catch(() => fetch(req))); return; }
  e.respondWith(fetch(req).then(res => {
    if (res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
