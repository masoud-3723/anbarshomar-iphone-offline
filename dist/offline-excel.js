'use strict';
// Load the whole Excel engine from the verified local release. No nested worker imports.
window.loadOfflineExcelBundle=async function(){
 const url=new URL('excel-worker.js',document.baseURI).href,marker='// ANBAR_OFFLINE_EXCEL_3_1';
 async function checked(response){if(!response||!response.ok)return null;const blob=await response.blob();return (await blob.slice(0,marker.length).text())===marker?new Blob([blob],{type:'text/javascript'}):null;}
 if('caches' in window){
  const prefix='anbar-iphone-'+btoa(new URL('./',document.baseURI).href).replace(/[^a-zA-Z0-9]/g,'')+'-';
  const names=(await caches.keys()).filter(name=>name.startsWith(prefix)).reverse();
  if(window.anbarOfflineCache&&names.includes(window.anbarOfflineCache))names.unshift(window.anbarOfflineCache);
  for(const name of new Set(names)){const blob=await checked(await (await caches.open(name)).match(url));if(blob)return blob;}
 }
 // Online first launch is supported; prepared offline launches take the cache-only path above.
 if(navigator.onLine===false)throw Error('بخش اکسل آفلاین این نصب آماده نیست. یک بار با اینترنت از آیکون صفحهٔ اصلی باز کنید و «بررسی و آماده‌سازی آفلاین» را بزنید.');
 const blob=await checked(await fetch(url,{cache:'no-store',credentials:'same-origin'}));
 if(!blob)throw Error('فایل‌های نسخهٔ جدید کامل دریافت نشدند؛ با اینترنت برنامه را به‌روزرسانی کنید.');
 return blob;
};

window.testOfflineExcelBundle=async function(){
 const blob=await window.loadOfflineExcelBundle(),url=URL.createObjectURL(blob);let worker;
 try{return await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{worker?.terminate();reject(Error('بخش خواندن اکسل هنوز آماده نشده است.'));},15000);
  try{worker=new Worker(url);worker.onmessage=({data})=>{clearTimeout(timer);data.result?.ready&&data.result.version==='3.1'?resolve(data.result):reject(Error(data.error||'نسخهٔ اکسل آماده نیست.'));};worker.onerror=()=>{clearTimeout(timer);reject(Error('اجرای بخش اکسل از حافظه ممکن نشد.'));};worker.postMessage({id:0,type:'ping',data:null});}catch(e){clearTimeout(timer);reject(e);}
 });}finally{worker?.terminate();URL.revokeObjectURL(url);}
};
