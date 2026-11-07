// Permite usar el diseñador sin internet una vez instalado en el celular.
// La página y sus íconos se guardan al instalar; las tipografías de Google se guardan la primera vez que se cargan.
// La página siempre se pide primero a internet, así que cada publicación llega sola al teléfono.
// Solo si cambias los íconos o el manifiesto, sube la versión para que se renueven.
const VERSION = "disenador-v1";
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icono-180.png", "./icono-192.png", "./icono-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // la página: primero internet (para tener siempre la última versión) y si no hay, la guardada
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // íconos, manifiesto y tipografías: lo guardado, y si no está, se baja y se guarda
  if (url.origin === location.origin || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    })));
  }
});
