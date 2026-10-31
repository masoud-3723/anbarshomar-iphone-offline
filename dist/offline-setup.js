'use strict';
window.addEventListener('load',async()=>{
 const label=document.getElementById('offlineReady');
 const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 document.getElementById('installHint').hidden=standalone;
 const persist=document.getElementById('persistStorage'),storage=document.getElementById('storageStatus');
 storage.textContent='در پایان هر نوبت، اکسل و پشتیبان را در Files نگه دارید.';
 persist.onclick=async()=>{
  if(!navigator.storage?.persist){storage.textContent='این نسخهٔ مرورگر درخواست نگهداری پایدار را پشتیبانی نمی‌کند؛ پشتیبان را در Files ذخیره کنید.';return;}
  persist.disabled=true;
  try{const granted=await navigator.storage.persist();storage.textContent=granted?'درخواست نگهداری پایدار پذیرفته شد. پشتیبان جداگانه را هم نگه دارید.':'درخواست نگهداری پایدار تأیید نشد؛ پشتیبان را در Files ذخیره کنید.';}
  catch{storage.textContent='وضعیت نگهداری پایدار مشخص نشد؛ پشتیبان را در Files نگه دارید.';}
  finally{persist.disabled=false;}
 };
 if(!('serviceWorker' in navigator)||!window.isSecureContext){label.textContent='نصب آفلاین آماده نیست';notify('برای نصب نسخهٔ آیفون، برنامه باید از لینک HTTPS مستقل باز شود.',true);return;}
 const deadline=(promise,ms)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('آماده‌سازی کامل نشد؛ با اینترنت دوباره برنامه را باز کنید.')),ms);promise.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});
 try{
  const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
  await deadline(navigator.serviceWorker.ready,20000);
  if(!navigator.serviceWorker.controller)await deadline(new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true})),8000);
  const worker=registration.active;
  if(!worker)throw Error('بخش آفلاین هنوز فعال نشده است.');
  const result=await deadline(new Promise((resolve,reject)=>{
   const channel=new MessageChannel();
   channel.port1.onmessage=event=>{channel.port1.close();event.data?.ready?resolve(event.data):reject(Error('بعضی فایل‌های آفلاین کامل ذخیره نشده‌اند.'));};
   worker.postMessage({type:'CHECK_OFFLINE'},[channel.port2]);
  }),8000);
  if(result.version!=='2.0')throw Error('نسخهٔ جدید آماده است؛ همهٔ پنجره‌های برنامه را ببندید و دوباره باز کنید.');
  label.textContent=standalone?'● آمادهٔ کار آفلاین':'● آمادهٔ نصب آفلاین';
  label.dataset.ready='true';
 }catch(e){label.textContent='آفلاین کامل آماده نشده';label.dataset.ready='false';notify(e.message,true);}
});
