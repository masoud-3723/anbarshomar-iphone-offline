'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{id,value:'',hidden:false,disabled:false,dataset:{},classList:{toggle(){}},addEventListener(){},focus(){},files:[]});return elements.get(id);}
const tabs=['count','files','settings'].map(tab=>({...el('nav-'+tab),dataset:{tab}})),sections=tabs.map(b=>el('tab-'+b.dataset.tab));
const document={getElementById:el,documentElement:{dataset:{}},querySelectorAll:s=>s==='[data-tab]'?tabs:sections,body:{addEventListener(){}},addEventListener(){},hidden:false};
const context=vm.createContext({document,window:{addEventListener(){}},indexedDB:{open(){return {}; }},InventoryIndex:require('../dist/inventory-index.js'),Intl,Map,Set,crypto:require('node:crypto').webcrypto,console,setTimeout,clearTimeout});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/app.js'),'utf8'),context);
vm.runInContext('init()',context); // IndexedDB intentionally never completes.
assert.equal(typeof tabs[1].onclick,'function');assert.equal(typeof tabs[2].onclick,'function');tabs[2].onclick();assert.equal(el('tab-settings').hidden,false);assert.equal(el('tab-count').hidden,true);tabs[1].onclick();assert.equal(el('tab-files').hidden,false);assert.equal(el('tab-settings').hidden,true);assert.equal(el('importBtn').disabled,true);assert.equal(el('startupStatus').hidden,false);console.log('PASS Navigation works while storage initialization is pending; file writes remain guarded.');
