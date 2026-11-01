'use strict';
class InventoryIndex {
 constructor(norm,ident){this.norm=norm;this.ident=ident;this.rebuild([],[]);}
 rebuild(products,entries){this.order=null;this.products=new Map();this.records=[];this.tags=new Map();this.entries=new Map();this.groups=new Map();this.totals=new Map();this.roundCounts={1:0,2:0,3:0};for(const p of products)this.addProduct(p);const grouped=new Map();for(const e of entries){const key=e.productId+'|'+e.round;if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(e);}for(const group of grouped.values())this.replaceGroup(group[0].productId,group[0].round,group);this.order=[...this.entries.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id)).map(e=>e.id);}
 addProduct(p){this.products.set(p.id,p);this.records.push({product:p,name:this.norm(p.name),code:this.norm(p.code)});const tag=this.ident(p.tag);if(tag){if(!this.tags.has(tag))this.tags.set(tag,[]);this.tags.get(tag).push(p);}}
 search(query,mode,limit=41){if(mode==='tag')return (this.tags.get(this.ident(query))||[]).slice(0,limit);const value=this.norm(query),out=[];for(const row of this.records){if(row[mode==='code'?'code':'name'].includes(value)){out.push(row.product);if(out.length>=limit)break;}}return out;}
 group(id,round){return this.groups.get(id+'|'+round)||[];}
 total(id,round){const key=id+'|'+round;return this.totals.has(key)?this.totals.get(key):null;}
 replaceGroup(id,round,rows){const key=id+'|'+round,old=this.groups.get(key)||[],fresh=[],oldIds=new Set(old.map(e=>e.id));this.roundCounts[round]-=old.length;for(const e of old)this.entries.delete(e.id);for(const e of rows){if(!oldIds.has(e.id))fresh.push(e.id);this.entries.set(e.id,e);}const sorted=[...rows].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));this.groups.set(key,sorted);if(rows.length)this.totals.set(key,rows.reduce((n,e)=>n+e.qtyMilli,0));else this.totals.delete(key);this.roundCounts[round]+=rows.length;if(this.order&&fresh.length)this.order.unshift(...fresh.reverse());}
 recent(operator,round){const out=[],seen=new Set();for(const id of this.order||[]){const e=this.entries.get(id);if(!e||e.operator!==operator||e.round!==round||seen.has(e.productId))continue;seen.add(e.productId);out.push(e);if(out.length===3)break;}return out;}
}
if(typeof module!=='undefined')module.exports=InventoryIndex;
