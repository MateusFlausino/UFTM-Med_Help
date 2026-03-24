self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open("dagv-app-shell-v2");
    await cache.addAll([
      "./",
      "./index.html",
      "./app.local.js",
      "./styles.css",
      "./icon.png",
      "./manifest.webmanifest",
      "./supabase-config.js",
      "./sca-parser.js",
      "./service-worker.js",
      "./vendor/pdfjs/pdf.mjs",
      "./vendor/pdfjs/pdf.worker.mjs",
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheKeys = await caches.keys();
    await Promise.all(
      cacheKeys
        .filter((key) => key !== "dagv-app-shell-v2" && key !== "dagv-runtime-v2")
        .map((key) => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleRuntimeRequest(request));
    return;
  }

  event.respondWith(handleStaticRequest(request));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    for (const client of allClients) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) {
          await client.navigate("/");
        }
        return;
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow("/");
    }
  })());
});

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open("dagv-app-shell-v2");
    cache.put("./index.html", response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match("./index.html");
    return cached || Response.error();
  }
}

async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open("dagv-app-shell-v2");
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return cached || Response.error();
  }
}

async function handleRuntimeRequest(request) {
  const cache = await caches.open("dagv-runtime-v2");

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    return cached || Response.error();
  }
}
