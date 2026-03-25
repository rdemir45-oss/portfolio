// Minimal service worker — Android Chrome "Uygulamayı yükle" prompt'u için gerekli.
// Offline cache veya push notification içermez.

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Tüm istekler ağdan geçsin (network-first, cache yok)
self.addEventListener("fetch", () => {});
