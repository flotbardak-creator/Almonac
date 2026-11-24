// Работа без интернета: файлы программы сохраняются в телефоне.
// В память записываются только нормальные ответы сайта: если сайт недоступен
// или отвечает ошибкой (например, 404), программа работает из сохранённой копии.
// При изменении программы поменяйте номер версии — телефон обновит файлы при следующем выходе в сеть.
const CACHE = 'navigator-v2';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const fromCache = req => caches.match(req).then(r => r || caches.match('index.html'));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // сначала сеть (чтобы получать обновления); при ошибке сайта или без сети — из памяти телефона
    e.respondWith(fetch(e.request).then(r => {
      if (!r.ok) return fromCache(e.request).then(c => c || r);
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    }).catch(() => fromCache(e.request)));
  } else {
    // шрифты: из памяти, если есть
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })));
  }
});
