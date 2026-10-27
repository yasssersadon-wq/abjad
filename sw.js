// Service worker for أبجد: caches the app shell and every asset the app loads,
// so the app keeps working offline after one online visit.
const CACHE = "abjad-v3";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isPage = (req) =>
  req.mode === "navigate" || new URL(req.url).pathname.endsWith("/index.html") || new URL(req.url).pathname.endsWith("/");

const store = (req, res) => {
  // Cache same-origin, CORS and opaque responses (CDN scripts, fonts, @imgly model files).
  if (res && (res.ok || res.type === "opaque")) {
    const copy = res.clone();
    caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
  }
  return res;
};

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (isPage(req)) {
    // Network-first: the page picks up updates immediately; the cache is the offline fallback.
    event.respondWith(
      fetch(req).then((res) => store(req, res))
        .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for fonts, icons, scripts and models.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => store(req, res)))
      .catch(() => caches.match("./index.html"))
  );
});
