'use strict';
window.addEventListener('load',()=>{
 const $=id=>document.getElementById(id),ready=$('offlineReady'),detail=$('offlineDetail'),prepareButton=$('prepareOffline');
 const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 $('installHint').hidden=standalone;
 const deadline=(promise,ms)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('آماده‌سازی کامل نشد؛ با اینترنت دوباره بررسی کنید.')),ms);promise.then(v=>{clearTimeout(timer);resolve(v)},e=>{clearTimeout(timer);reject(e)});});
 function check(worker){return deadline(new Promise((resolve,reject)=>{const channel=new MessageChannel();channel.port1.onmessage=event=>{channel.port1.close();event.data?.ready&&event.data.version==='2.0'?resolve(event.data):reject(Error('فایل‌های این نسخه کامل ذخیره نشده‌اند.'));};worker.postMessage({type:'CHECK_OFFLINE'},[channel.port2]);}),6000);}
 async function testExcel(cacheName){const cache=await caches.open(cacheName),response=await cache.match(new URL('excel-worker.js',document.baseURI).href);if(!response)throw Error('فایل خواندن اکسل روی گوشی کامل نیست.');const url=URL.createObjectURL(await response.blob());return new Promise((resolve,reject)=>{let worker,done=false;const finish=e=>{if(done)return;done=true;clearTimeout(timer);worker?.terminate();URL.revokeObjectURL(url);e?reject(e):resolve();};const timer=setTimeout(()=>finish(Error('پردازشگر اکسل آماده نشد؛ دوباره بررسی کنید.')),15000);try{worker=new Worker(url);worker.onmessage=({data})=>data.error?finish(Error(data.error)):data.result?.ready?finish():finish(Error('پردازشگر اکسل پاسخ معتبر نداد.'));worker.onerror=()=>finish(Error('پردازشگر اکسل اجرا نشد.'));worker.postMessage({id:1,type:'ping',data:null});}catch(e){finish(e);}});}
 let running=false;
 async function prepare(){if(running)return;running=true;prepareButton.disabled=true;try{
  if(!('serviceWorker' in navigator)||!window.isSecureContext)throw Error('این لینک را با HTTPS در Safari باز کنید.');
  let registration=await navigator.serviceWorker.getRegistration(new URL('./',document.baseURI).href),result;
  if(registration?.active&&navigator.serviceWorker.controller)try{result=await check(registration.active);}catch{}
  if(!result){if(navigator.onLine===false)throw Error('اولین آماده‌سازی به اینترنت نیاز دارد؛ همین آیکون را یک بار با اینترنت باز کنید.');ready.textContent='ذخیرهٔ فایل‌های آفلاین…';registration=await deadline(navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}),30000);const start=Date.now();while(Date.now()-start<45000){if(registration.active&&navigator.serviceWorker.controller)try{result=await check(registration.active);break;}catch{}await new Promise(r=>setTimeout(r,300));}if(!result)throw Error('این نصب هنوز آماده نیست؛ با اینترنت ببندید و دوباره باز کنید.');}
  await testExcel(result.cacheName);
  ready.textContent=standalone?'● آمادهٔ کار آفلاین':'● فایل‌های آفلاین آماده است';ready.dataset.ready='true';
  detail.textContent=standalone?'فایل‌های برنامه و اجرای پردازشگر اکسل از حافظه بررسی شد. شمارش و خروجی گوشی بدون اینترنت در دسترس‌اند.':'بعد از افزودن به صفحهٔ اصلی، همان آیکون را یک بار با اینترنت باز کنید و دوباره این پیام را بررسی کنید.';
  if(navigator.onLine!==false)registration.update().catch(()=>{});
 }catch(e){ready.textContent='آفلاین کامل آماده نشده';ready.dataset.ready='false';detail.textContent=e.message;}finally{running=false;prepareButton.disabled=false;}}
 prepareButton.onclick=prepare;
 $('storageStatus').textContent='پایان هر نوبت، خروجی گوشی را در Files نگه دارید.';
 $('persistStorage').onclick=async()=>{if(!navigator.storage?.persist){$('storageStatus').textContent='در این مرورگر درخواست نگهداری پایدار در دسترس نیست؛ خروجی را در Files نگه دارید.';return;}try{const granted=await navigator.storage.persist();$('storageStatus').textContent=granted?'درخواست نگهداری پایدار پذیرفته شد؛ خروجی مستقل را هم نگه دارید.':'درخواست نگهداری پایدار تأیید نشد؛ خروجی را در Files نگه دارید.';}catch{$('storageStatus').textContent='وضعیت نگهداری مشخص نشد؛ خروجی را در Files نگه دارید.';}};
 async function health(){const button=$('checkCenter'),label=$('centerHealth');button.disabled=true;label.textContent='در حال بررسی ارتباط مرکز…';try{const r=await rpc('health',{},'',10000);if(r.version!=='2.0')throw Error();label.textContent='مرکز وب قابل دسترسی است؛ برای تجمیع با کد تیم یا رمز مدیر وارد شوید.';label.dataset.connected='true';}catch{label.textContent='مرکز فعلاً در دسترس نیست؛ شمارش و خروجی گوشی مستقل است.';label.dataset.connected='false';}finally{button.disabled=false;}}
 $('checkCenter').onclick=health;
 prepare();if(navigator.onLine!==false)health();
});
