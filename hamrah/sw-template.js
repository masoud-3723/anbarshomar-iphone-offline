'use strict';
const VERSION='3.6';
const MANIFEST_SHA='__MANIFEST_SHA__';
const PREFIX='anbar-hamrah-iphone-'+btoa(self.registration.scope).replace(/[^a-zA-Z0-9]/g,'')+'-';
const CACHE=PREFIX+MANIFEST_SHA.slice(0,16);
const ASSETS=__ASSET_NAMES__;
const assetURL=name=>new URL(name,self.registration.scope).href;
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch(assetURL('offline-assets.json'),{cache:'no-store',credentials:'same-origin'});
 if(!response.ok)throw Error('Offline asset manifest is unavailable');
 const bytes=await response.arrayBuffer();
 if(await sha(bytes)!==MANIFEST_SHA)throw Error('Offline manifest does not match this release');
 const manifest=JSON.parse(new TextDecoder().decode(bytes));
 if(manifest.version!==VERSION||manifest.assets.length!==ASSETS.length||new Set(manifest.assets.map(a=>a.path)).size!==ASSETS.length)throw Error('Invalid offline manifest');
 const files=await Promise.all(manifest.assets.map(async asset=>{
  if(!ASSETS.includes(asset.path))throw Error('Unexpected offline asset');
  const url=assetURL(asset.path),r=await fetch(url,{cache:'no-store',credentials:'same-origin'});
  if(!r.ok||r.redirected)throw Error('Offline asset could not be fetched: '+asset.path);
  const data=await r.clone().arrayBuffer();
  if(await sha(data)!==asset.sha256)throw Error('Offline asset checksum mismatch: '+asset.path);
  return [url,r];
 }));
 const cache=await caches.open(CACHE);
 await Promise.all(files.map(([url,r])=>cache.put(url,r)));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await self.clients.claim();
 await Promise.all((await caches.keys()).filter(name=>name.startsWith(PREFIX)&&name!==CACHE).map(name=>caches.delete(name)));
})()));
self.addEventListener('message',event=>{
 if(event.data?.type!=='CHECK_OFFLINE'||!event.ports[0])return;
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE),present=await Promise.all(ASSETS.map(name=>cache.match(assetURL(name))));
  event.ports[0].postMessage({ready:present.every(Boolean),version:VERSION,files:present.filter(Boolean).length,cacheName:CACHE});
 })());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url),scope=new URL(self.registration.scope);
 if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 const relative=url.pathname.slice(scope.pathname.length),name=event.request.mode==='navigate'||relative===''?'index.html':relative;
 if(!ASSETS.includes(name))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),hit=await cache.match(assetURL(name));
  if(hit)return hit;try{return await fetch(event.request);}catch{if(event.request.mode==='navigate')return new Response('<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>آماده‌سازی آفلاین</title><body style="font-family:Tahoma;padding:24px"><h2>نسخهٔ آفلاین این نصب کامل نشده</h2><p>اینترنت را وصل کنید و همین برنامه را از آیکون صفحهٔ اصلی باز کنید تا پیام آمادهٔ کار آفلاین نمایش داده شود.</p><p>برنامه و اطلاعات آن را حذف نکنید؛ شمارش‌ها در حافظهٔ گوشی باقی می‌مانند.</p><button onclick="location.reload()">تلاش دوباره</button></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}});throw Error('Offline asset is missing: '+name);}
 })());
});
