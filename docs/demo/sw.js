/* AUNO public demonstration offline shell. Not for real authenticated user data. */
const VERSION='auno-preserved-demo-v3-20261106';
const APP_FILES=['./','./index.html','./theme.js','./styles.css','./app.js','./insights.js','./suite.js','./suite.css','./demo-api.js','./seed.json','./favicon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(APP_FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n!==VERSION).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(request,copy)).catch(()=>{})}return response}).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html'))));
});
