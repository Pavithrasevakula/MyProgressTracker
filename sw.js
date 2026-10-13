const CACHE_NAME="mpt-v8";
const APP_SHELL=["./","index.html","manifest.webmanifest","icon.png","firebase-config.js","styles.css?v=8","auth.css","app-shell.js?v=8","firebase-auth.js?v=8","planner.js?v=8","auth.js"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>Promise.all(APP_SHELL.map(file=>cache.add(file).catch(()=>null)))));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET"||new URL(request.url).origin!==location.origin)return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));
      return response;
    }).catch(()=>caches.match(request).then(cached=>cached||caches.match("index.html"))));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    const copy=response.clone();
    caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));
    return response;
  })));
});
