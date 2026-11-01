'use strict';
// Prepare first; only the second, direct tap invokes the iOS share sheet.
// This keeps user activation even when XLSX generation takes several seconds.
(() => {
 let pending=false;
 window.presentFileSave=(bytes,mime,name)=>new Promise((resolve,reject)=>{
  if(pending){reject(Error('ابتدا پنجرهٔ فایل قبلی را ببندید.'));return;}
  const dialog=document.getElementById('fileDialog');
  const share=document.getElementById('shareReadyFile');
  const download=document.getElementById('downloadReadyFile');
  const close=document.getElementById('closeFileSave');
  const status=document.getElementById('readyFileStatus');
  let file,url,canShare=false,sharing=false,settled=false;
  try{
   file=new File([bytes],name,{type:mime});
   url=URL.createObjectURL(file);
   canShare=typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:[file]});
  }catch(e){if(url)URL.revokeObjectURL(url);reject(e);return;}
  pending=true;
  function finish(error){
   if(settled)return;settled=true;pending=false;
   dialog.removeEventListener('cancel',cancel);
   close.onclick=null;share.onclick=null;download.onclick=null;
   if(dialog.open)dialog.close();
   // Safari may still be consuming the download URL after the tap.
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   error?reject(error):resolve();
  }
  function cancel(event){if(event)event.preventDefault();if(sharing)return;finish(Error('ذخیرهٔ فایل لغو شد؛ اطلاعات شمارش محفوظ است.'));}
  document.getElementById('readyFileName').textContent=name;
  document.getElementById('readyFileSize').textContent=new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(file.size/1024)+' کیلوبایت';
  status.textContent=canShare?'فایل آماده است؛ محل ذخیره را در پنجرهٔ آیفون انتخاب کنید.':'از لینک دانلود استفاده کنید؛ اگر پیش‌نمایش باز شد، Share و Save to Files را بزنید.';
  share.hidden=!canShare;share.disabled=false;download.href=url;download.download=name;
  close.onclick=cancel;dialog.addEventListener('cancel',cancel);
  download.onclick=event=>{if(sharing){event.preventDefault();return;}status.textContent='فایل برای دانلود به مرورگر داده شد؛ ذخیره در Files را بررسی کنید.';setTimeout(()=>finish(),0);};
  share.onclick=async()=>{
   if(sharing||settled)return;
   sharing=true;share.disabled=true;close.disabled=true;status.textContent='محل ذخیره را در پنجرهٔ آیفون انتخاب کنید…';
   try{
    // Do not put an await or timer before this call.
    const result=navigator.share({files:[file],title:name});
    if(!result||typeof result.then!=='function')throw Error('پنجرهٔ ذخیره باز نشد؛ دوباره بزنید یا از دانلود استفاده کنید.');
    await result;finish();
   }catch(e){
    status.textContent=e.name==='AbortError'?'ذخیره یا اشتراک‌گذاری لغو شد. فایل آماده است؛ می‌توانید دوباره تلاش کنید.':'پنجرهٔ ذخیره باز نشد؛ دوباره بزنید یا از دانلود استفاده کنید.';
   }finally{sharing=false;share.disabled=false;close.disabled=false;}
  };
  close.disabled=false;
  try{dialog.showModal();}catch(e){finish(e);}
 });
})();
