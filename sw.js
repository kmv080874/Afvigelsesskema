// Service worker til Afvigelsesskema: gør appen brugbar uden internet.
// Skift VERSION, hvis du ændrer ikoner eller manifest, så gamle kopier ryddes.
const VERSION = "afvigelser-v1";
const SKAL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.all(SKAL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Selve appen: hent nyeste version, hvis der er internet. Ellers brug den gemte kopi.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const kopi = r.clone();
          caches.open(VERSION).then((c) => c.put("./index.html", kopi));
          return r;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Ikoner og andet: brug gemt kopi først.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      const kopi = r.clone();
      caches.open(VERSION).then((c) => c.put(req, kopi));
      return r;
    }))
  );
});
