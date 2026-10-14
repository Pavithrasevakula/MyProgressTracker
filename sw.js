const CACHE_NAME="mpt-v21";
const APP_SHELL=["./","index.html","manifest.webmanifest","icon.png","favicon.ico","firebase-config.js","push-config.js","styles.css?v=15","auth.css","app-shell.js?v=9","planner.js?v=10","firebase-auth.js?v=9","feature-kit.js?v=4","auth.js"];

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

self.addEventListener("push",event=>{
  let data={title:"MyProgressTrack",body:"You have a study step waiting.",url:"./index.html"};
  try{if(event.data)data={...data,...event.data.json()}}catch(error){console.error("Could not read push payload",error)}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:"icon.png",data:{url:data.url}}));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(openClients=>{
    const target=new URL(event.notification.data?.url||"./index.html",self.location.origin).href;
    const existing=openClients.find(client=>client.url===target);
    return existing?existing.focus():clients.openWindow(target);
  }));
});
