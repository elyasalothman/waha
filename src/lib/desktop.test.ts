import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discover,localChat,validateLocalTool,httpsSource,type Model} from './desktop-model.ts';
import {createHost,risk,allowedURL} from './desktop-host.ts';
import {emptyData,loadData,persist} from './desktop-store.ts';
const model:Model={base:'http://127.0.0.1:11434',name:'qwen2.5:3b',kind:'ollama'};
const response=(data:unknown)=>new Response(JSON.stringify(data));
test('discovery handles Ollama, both compatible providers and offline',async()=>{
 const found=await discover(async url=>response(String(url).includes('11434')?{models:[{name:model.name}]}:{data:[{id:'gguf'}]}));
 assert.equal(found.length,3);assert.deepEqual(found[0],model);
 assert.deepEqual(await discover(async()=>{throw Error('offline');}),[]);
});
test('local requests use selected model, JSON planning, and private memory only for chat',async()=>{
 for(const kind of ['ollama','openai'] as const){let body:any;let url='';const fetcher:typeof fetch=async(u,i)=>{url=String(u);body=JSON.parse(String(i?.body));return response(kind==='ollama'?{message:{content:'جواب'}}:{choices:[{message:{content:'جواب'}}]});};
 assert.equal(await localChat({...model,kind},'سؤال',['سر'],false,fetcher),'جواب');assert.match(body.messages[0].content,/سر/);assert.equal(body.model,model.name);
 await localChat({...model,kind},'سؤال',[],true,fetcher);assert.ok(body.format==='json'||body.response_format.type==='json_object');assert.ok(url.endsWith(kind==='ollama'?'/api/chat':'/v1/chat/completions'));}
 await assert.rejects(localChat(model,'q',[],false,async()=>{throw Error('offline');}));
});
test('invalid/forbidden/extra argument plans never execute',()=>{
 assert.equal(validateLocalTool('{"tool":"calculate","args":{"expr":"2+3"}}').tool,'calculate');
 for(const content of ['oops','{"tool":"shell","args":{"command":"pwd"}}','{"tool":"delete_note","args":{"id":"1"}}','{"tool":"calculate","args":{"expr":"2","extra":true}}'])assert.throws(()=>validateLocalTool(content));
});
function setup(confirmed=true,fetcher?:typeof fetch){const data=emptyData();let prompts=0,opens=0,saves=0;const nav:string[]=[];const host=createHost(data,{confirm:async()=>{prompts++;return confirmed;},save:async()=>{saves++;},navigate:t=>{nav.push(t);},external:async()=>{opens++;},notify:async()=>{},fetcher},()=>undefined);return {host,data,nav,counts:()=>({prompts,opens,saves})};}
test('local math/navigation work offline and notes/memory persist only after consent',async()=>{
 const s=setup();await s.host.run('احسب ٢ + ٣');await s.host.run('افتح PDF');assert.deepEqual(s.nav,['pdf']);assert.equal(s.counts().prompts,0);
 await s.host.execute({tool:'remember',args:{text:'مدينتي جدة'}});await s.host.execute({tool:'add_note',args:{text:'نص'}});assert.equal(s.host.store.city(),'جدة');assert.equal(s.host.store.list('notes').length,1);assert.equal(s.counts().saves,2);
 const denied=setup(false);await assert.rejects(denied.host.run('تذكر أن اسمي أحمد ثم افتح PDF'));assert.equal(denied.host.store.list('memories').length,0);assert.deepEqual(denied.nav,[]);
});
test('URL scope, risk, cancellation and blocked deletion',async()=>{
 for(const url of ['http://waha.hajdah.com','https://evil.test','https://github.com/other','file:///tmp/a','https://waha.hajdah.com.evil.test'])assert.equal(allowedURL(url),false);
 assert.equal(allowedURL('https://lab.alhajda.com/math'),true);
 assert.equal(risk({tool:'calculate',args:{expr:'2'}}),'safe');assert.equal(risk({tool:'remember',args:{text:'a'}}),'change');
 const s=setup(false);await assert.rejects(s.host.external('https://waha.hajdah.com/books'));assert.equal(s.counts().opens,0);await assert.rejects(s.host.execute({tool:'delete_note',args:{id:'1'}}));
});
test('cloud sends question alone and trusts only HTTPS citations; no remote tools execute',async()=>{
 let body:any;const s=setup(true,async(_u,i)=>{body=JSON.parse(String(i?.body));return response({reply:'جواب',citations:[{url:'https://example.org/source'},{url:'http://bad.test'}]});});
 await s.host.execute({tool:'remember',args:{text:'PRIVATE'}});
 const reply:any=await s.host.execute({tool:'ask_mohsen',args:{q:'سؤال'}});
 assert.deepEqual(body,{message:'سؤال',messages:[]});assert.deepEqual(reply.sources,['https://example.org/source']);assert.equal(reply.label,'موثّق ✓');assert.equal(httpsSource('javascript:alert(1)'),false);
 s.data.mode='local';const result=await s.host.execute({tool:'ask_mohsen',args:{q:'سؤال'}});assert.match(String(result),/لا يوجد نموذج/);
});
test('host local fallback planner rejects forbidden output without executing it',async()=>{
 const data=emptyData();const host=createHost(data,{confirm:async()=>true,save:async()=>{},navigate:()=>{throw Error('unexpected');},external:async()=>{throw Error('unexpected');},notify:async()=>{},fetcher:async()=>response({message:{content:'{"tool":"shell","args":{}}'}})},()=>model);
 await assert.rejects(host.run('عبارة غامضة غير معروفة'));
});
test('browser storage roundtrip, invalid storage fails closed, evaluation saved',async()=>{
 const backing=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>backing.get(k)??null,setItem:(k:string,v:string)=>backing.set(k,v)}});
 const s=setup();await s.host.run('قيّم محسن');assert.ok(JSON.parse(s.data.values.evaluation).accuracy>=.95);await persist(s.data);assert.deepEqual(await loadData(),s.data);
 backing.set('desktop-agent','{"values":null}');await assert.rejects(loadData());
});
test('native storage bridge uses fixed app-data commands and exact JSON',async()=>{
 const {mockIPC,clearMocks}=await import('@tauri-apps/api/mocks');
 Object.defineProperty(globalThis,'window',{configurable:true,value:globalThis});
 let saved='';const calls:string[]=[];
 try {
 mockIPC((command,args)=>{calls.push(command);if(command==='agent_save'){saved=(args as {json:string}).json;return;}if(command==='agent_load')return saved;throw Error('unexpected command');});
 const data=emptyData();data.values.test='private';await persist(data);assert.deepEqual(await loadData(),data);assert.deepEqual(calls,['agent_save','agent_load']);
 }finally{clearMocks();delete (globalThis as any).window;}
});
test('safe note needs no consent; memory still requires consent',async()=>{
 const s=setup(false);await s.host.execute({tool:'add_note',args:{text:'ملاحظة آمنة'}});
 assert.equal(s.host.store.list('notes').length,1);assert.equal(s.counts().prompts,0);
 await assert.rejects(s.host.execute({tool:'remember',args:{text:'خاص'}}));
 assert.equal(s.host.store.list('memories').length,0);
});
test('planner disconnect falls back only in fallback mode, without private context',async()=>{
 for(const mode of ['fallback','local'] as const){
  const data=emptyData();data.mode=mode;data.values.private='SECRET';const requests:string[]=[];
  const host=createHost(data,{confirm:async()=>{throw Error('unexpected');},save:async()=>{},navigate:()=>{throw Error('unexpected');},external:async()=>{throw Error('unexpected');},notify:async()=>{},fetcher:async(u,i)=>{
   requests.push(String(u));if(String(u).startsWith(model.base))throw Error('disconnected');
   assert.deepEqual(JSON.parse(String(i?.body)),{message:'عبارة غامضة غير معروفة',messages:[]});
   return response({reply:'جواب احتياطي'});
  }},()=>model);
  if(mode==='local'){await assert.rejects(host.run('عبارة غامضة غير معروفة'),/انقطع النموذج/);assert.equal(requests.length,1);}
  else {const result:any=await host.run('عبارة غامضة غير معروفة');assert.equal(result[0].text,'جواب احتياطي');assert.equal(requests.length,2);}
 }
});
test('invalid planner JSON never falls back to cloud or executes',async()=>{
 const data=emptyData();let calls=0;
 const host=createHost(data,{confirm:async()=>{throw Error('unexpected');},save:async()=>{},navigate:()=>{throw Error('unexpected');},external:async()=>{throw Error('unexpected');},notify:async()=>{},fetcher:async()=>{calls++;return response({message:{content:'{"tool":"calculate","args":{"expr":"2"},"unexpected":true}'}});}},()=>model);
 await assert.rejects(host.run('عبارة غامضة غير معروفة'));assert.equal(calls,1);
});
test('valid model plan goes through the same memory consent gate',async()=>{
 for(const consent of [true,false]){
  const data=emptyData();let prompts=0;
  const host=createHost(data,{confirm:async()=>{prompts++;return consent;},save:async()=>{},navigate:()=>{},external:async()=>{},notify:async()=>{},fetcher:async()=>response({message:{content:'{"tool":"remember","args":{"text":"اسمي أحمد"}}'}})},()=>model);
  if(consent){await host.run('عبارة غامضة غير معروفة');assert.equal(host.store.list('memories').length,1);}
  else {await assert.rejects(host.run('عبارة غامضة غير معروفة'));assert.equal(host.store.list('memories').length,0);}
  assert.equal(prompts,1);
 }
});
test('default mode is cloud when no local model, until the user picks one',async()=>{
 const {autoMode}=await import('./desktop-store.ts');
 const d=emptyData();assert.equal(d.modeAuto,true);
 assert.equal(autoMode(d,false),'cloud');assert.equal(autoMode(d,true),'fallback');
 d.mode='local';d.modeAuto=false;assert.equal(autoMode(d,false),'local');
});
