// もらいうけ帳 オフライン用 Service Worker
// ・電波があるときは常に最新のアプリを読み込む（ネット優先）
// ・電波がないときは端末に保存したアプリで起動する
const CACHE = "morai-v1.3.1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== "GET" || u.origin !== location.origin) return; // Googleへの送信には触らない
  const isPage = req.mode === "navigate" || /\/(index\.html)?$/.test(u.pathname);
  if (isPage) {
    // ネット優先：最新版を取得して保存。圏外なら保存版
    e.respondWith(
      fetch(req, { cache: "no-store" }).then(res => {
        const cp = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", cp)); return res;
      }).catch(() => caches.match("./index.html", { ignoreSearch: true }))
    );
    return;
  }
  // アイコン等：保存版優先
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
