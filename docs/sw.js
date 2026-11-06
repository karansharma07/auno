// Replaces the old root demo service worker, and unregisters it to prevent stale content.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys()){if(k.startsWith('auno-static-demo-'))await caches.delete(k)}await self.registration.unregister();await self.clients.claim();})()));
