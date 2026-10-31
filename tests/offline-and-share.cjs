const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
let checks=0;
const pass=name=>{checks++;console.log('PASS',name);};
function dialogHarness(canShare=true){
 const elements=new Map();
 for(const id of ['fileDialog','shareReadyFile','downloadReadyFile','closeFileSave','readyFileStatus','readyFileName','readyFileSize'])elements.set(id,{open:false,disabled:false,hidden:false,dataset:{},handlers:{},addEventListener(n,f){this.handlers[n]=f;},removeEventListener(n){delete this.handlers[n];},showModal(){this.open=true;},close(){this.open=false;}});
 let active=false,calls=0,sharedFile;
 const navigator={canShare:()=>canShare,share:arg=>{assert(active,'share must be called during the direct tap');calls++;sharedFile=arg.files[0];return Promise.resolve();}};
 const sandbox={window:{},document:{getElementById:id=>elements.get(id)},navigator,File,URL:{createObjectURL:()=> 'blob:test-file',revokeObjectURL(){}},Intl,setTimeout(fn,delay){if(delay===0)fn();}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'dist/file-save.js'),'utf8'),sandbox);
 return {elements,navigator,present:sandbox.window.presentFileSave,tap(id){active=true;const result=elements.get(id).onclick({preventDefault(){}});active=false;return result;},get calls(){return calls;},get sharedFile(){return sharedFile;}};
}
async function workerHarness(corrupt=false){
 const handlers={},stores=new Map(),scope='https://inventory.example/anbar/';
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return{async put(url,response){store.set(String(url),response.clone());},async match(url){return store.get(String(url))?.clone();}};},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
 let offline=false,networkCalls=0;
 const fetch=async url=>{networkCalls++;if(offline)throw Error('Network offline');const name=new URL(url).pathname.split('/').pop();let bytes=fs.readFileSync(path.join(root,'dist',name));if(corrupt&&name==='style.css')bytes=Buffer.from('partial upload');return new Response(bytes);};
 const self={registration:{scope},clients:{async claim(){}},async skipWaiting(){},addEventListener:(name,handler)=>handlers[name]=handler};
 const sandbox={self,caches,fetch,crypto:require('node:crypto').webcrypto,URL,Response,TextDecoder,Uint8Array,btoa};
 vm.runInNewContext(fs.readFileSync(path.join(root,'dist/sw.js'),'utf8'),sandbox);
 return {stores,handlers,caches,scope,setOffline(){offline=true;},get networkCalls(){return networkCalls;},async dispatch(name,extra={}){let result;handlers[name]({waitUntil:p=>result=p,respondWith:p=>result=p,...extra});return result;}};
}
(async()=>{
 let h=dialogHarness(),p=h.present(new Uint8Array([1,2,3]),'application/octet-stream','test.bin');
 assert.equal(h.calls,0);assert(h.elements.get('fileDialog').open);await h.tap('shareReadyFile');await p;assert.equal(h.calls,1);assert.equal(h.sharedFile.size,3);assert.equal(h.elements.get('fileDialog').open,false);pass('Share occurs only on a new direct tap after file preparation');
 h=dialogHarness();h.navigator.share=()=>Promise.reject(Object.assign(Error('cancelled'),{name:'AbortError'}));p=h.present(new Uint8Array([1]),'application/json','backup.json');await h.tap('shareReadyFile');assert(h.elements.get('fileDialog').open);assert.match(h.elements.get('readyFileStatus').textContent,/لغو/);h.navigator.share=()=>Promise.resolve();await h.tap('shareReadyFile');await p;pass('Share cancellation keeps the prepared file available for retry');
 h=dialogHarness();p=h.present(new Uint8Array([1]),'application/json','backup.json');const rejected=assert.rejects(p,/لغو/);h.tap('closeFileSave');await rejected;assert(!h.elements.get('fileDialog').open);pass('Closing the save dialog rejects cleanly without a stuck export');
 h=dialogHarness(false);p=h.present(new Uint8Array([2,3]),'application/json','backup.json');assert(h.elements.get('shareReadyFile').hidden);assert.equal(h.elements.get('downloadReadyFile').download,'backup.json');await h.tap('downloadReadyFile');await p;pass('Browsers without file sharing retain an explicit download path');
 h=dialogHarness();p=h.present(new Uint8Array([1]),'application/json','backup.json');h.navigator.share=()=>undefined;await h.tap('shareReadyFile');assert(h.elements.get('fileDialog').open);assert.match(h.elements.get('readyFileStatus').textContent,/باز نشد/);const cancel=assert.rejects(p);h.tap('closeFileSave');await cancel;pass('Undefined share results do not falsely report success');
 h=dialogHarness();p=h.present(new Uint8Array([1]),'application/json','a.json');await assert.rejects(h.present(new Uint8Array([2]),'application/json','b.json'),/قبلی/);const close=assert.rejects(p);h.tap('closeFileSave');await close;pass('Concurrent file save cannot replace the pending file');
 let w=await workerHarness();await w.dispatch('install');const size=[...w.stores.values()][0].size;assert.equal(size,12);let response;await w.dispatch('message',{data:{type:'CHECK_OFFLINE'},ports:[{postMessage:value=>response=value}]});assert.equal(response.ready,true);assert.equal(response.files,12);pass('Offline install verifies every asset and acknowledges the complete cache');
 w.setOffline();const before=w.networkCalls;const page=await w.dispatch('fetch',{request:new Request(w.scope+'?source=home-screen')});assert.match(await page.text(),/انبارشمار/);const js=await w.dispatch('fetch',{request:new Request(w.scope+'file-save.js?test=1')});assert.match(await js.text(),/presentFileSave/);assert.equal(w.networkCalls,before);pass('Root navigation and app assets are served without network requests');
 w=await workerHarness(true);await assert.rejects(w.dispatch('install'),/checksum mismatch/);assert.equal(w.stores.size,0);pass('Partial or mismatched deployment never activates a partial offline cache');
 w=await workerHarness();await w.dispatch('install');await w.caches.open('anbar-iphone-another-application-cache');await w.dispatch('activate');assert(w.stores.has('anbar-iphone-another-application-cache'));pass('Cache cleanup preserves other applications on the same origin');
 fs.writeFileSync(path.join(root,'tests/last-results.json'),JSON.stringify({checks,passed:true,platform:'Node unit tests; browser UI checked separately; physical iPhone not tested'},null,2));
 console.log('ALL CHECKS PASSED',checks);
})().catch(e=>{console.error(e);process.exit(1);});
