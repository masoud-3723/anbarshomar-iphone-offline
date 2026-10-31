'use strict';
window.addEventListener('load',()=>{
 const label=document.getElementById('offlineReady'),detail=document.getElementById('offlineDetail'),button=document.getElementById('prepareOffline');
 const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 document.getElementById('installHint').hidden=standalone;
 const persist=document.getElementById('persistStorage'),storage=document.getElementById('storageStatus');
 storage.textContent='در پایان هر نوبت، اکسل و پشتیبان را در Files نگه دارید.';
 persist.onclick=async()=>{if(!navigator.storage?.persist){storage.textContent='این مرورگر درخواست نگهداری پایدار را پشتیبانی نمی‌کند؛ پشتیبان را در Files ذخیره کنید.';return;}persist.disabled=true;try{const granted=await navigator.storage.persist();storage.textContent=granted?'درخواست نگهداری پایدار پذیرفته شد. پشتیبان جداگانه را هم نگه دارید.':'درخواست نگهداری پایدار تأیید نشد؛ پشتیبان را در Files ذخیره کنید.';}catch{storage.textContent='وضعیت نگهداری پایدار مشخص نشد؛ پشتیبان را در Files نگه دارید.';}finally{persist.disabled=false;}};
 const deadline=(promise,ms)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('آماده‌سازی کامل نشد؛ با اینترنت دوباره بررسی کنید.')),ms);promise.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});
 const check=worker=>deadline(new Promise((resolve,reject)=>{const channel=new MessageChannel();channel.port1.onmessage=event=>{channel.port1.close();event.data?.ready?resolve(event.data):reject(Error('بعضی فایل‌های آفلاین کامل ذخیره نشده‌اند.'));};worker.postMessage({type:'CHECK_OFFLINE'},[channel.port2]);}),8000);
 let running=false;
 async function prepare(){if(running)return;running=true;button.disabled=true;try{
  if(!('serviceWorker' in navigator)||!window.isSecureContext)throw Error('این صفحه باید از لینک HTTPS در Safari باز شود.');
  // Existing local registration works without a registration/update network request.
  let registration=await navigator.serviceWorker.getRegistration(new URL('./',document.baseURI).href),result=null;
  if(registration?.active)try{result=await check(registration.active);}catch{}
  if(!result||result.version!=='3.1'||!navigator.serviceWorker.controller){
   if(navigator.onLine===false)throw Error('آماده‌سازی این نصب هنوز کامل نیست؛ یک بار با اینترنت از همین آیکون وارد شوید.');
   label.textContent='ذخیرهٔ فایل‌های آفلاین…';
   registration=await deadline(navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}),30000);
   // ready can resolve with an older active worker; wait for the complete current release.
   const start=Date.now();
   while(Date.now()-start<45000){
    if(registration.active)try{const value=await check(registration.active);if(value.version==='3.1'&&navigator.serviceWorker.controller){result=value;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,300));
   }
   if(!result||result.version!=='3.1')throw Error('نسخهٔ جدید هنوز کامل آماده نشده؛ برنامه را با اینترنت ببندید و دوباره باز کنید.');
  }
  window.anbarOfflineCache=result.cacheName;
  // Ready includes the actual Excel worker start, not just the presence of cache filenames.
  await deadline(window.testOfflineExcelBundle(),20000);
  label.textContent=standalone?'● آمادهٔ کار آفلاین':'● فایل‌های آفلاین آماده است';label.dataset.ready='true';
  detail.textContent=standalone?'آماده است: بازشدن برنامه و خواندن اکسل از حافظه بررسی شد. می‌توانید اینترنت را قطع کنید.':'فایل‌ها در این مرورگر آماده‌اند. بعد از افزودن به صفحهٔ اصلی، همان آیکون را یک بار با اینترنت باز کنید تا آمادهٔ کار آفلاین شود.';
  if(navigator.onLine!==false)registration.update().catch(()=>{});
 }catch(e){label.textContent='آفلاین کامل آماده نشده';label.dataset.ready='false';detail.textContent=e.message;}
 finally{running=false;button.disabled=false;}}
 button.onclick=prepare;
 // Avoid starting/terminating the Excel worker during an import or export already in progress.
 const originalPrepare=prepare;button.onclick=()=>{if(saving||exporting||staged){notify('ابتدا عملیات فایل جاری را تمام کنید.');return;}originalPrepare();};
 originalPrepare();
});
