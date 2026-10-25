import { plan } from './agent/planner.ts';
import { validateCommand, requiresConfirmation, type AgentCommand } from './agent/registry.ts';
import { solveMath } from './agent/math.ts';
import { createLocalStore, parseArabicTime } from './agent/local.ts';
import { localChat, validateLocalTool, jsonFetch, httpsSource, type Model } from './desktop-model.ts';
import type { Data } from './desktop-store.ts';
import corpus from './agent/eval/phrases.json' with { type:'json' };
import { parseIntent } from './agent/intents.ts';
export const LINKS = { books:'https://waha.hajdah.com/books', news:'https://waha.hajdah.com/news', games:'https://waha.hajdah.com/games', weather:'https://waha.hajdah.com/weather', math:'https://lab.alhajda.com/math', feedback:'https://github.com/elyasalothman/waha/issues/new' };
export function allowedURL(url:string) {
  if (!httpsSource(url)) return false;
  const u = new URL(url);
  return (u.origin === 'https://waha.hajdah.com' || u.origin === 'https://lab.alhajda.com' && u.pathname === '/math' || u.origin === 'https://github.com' && u.pathname === '/elyasalothman/waha/issues/new');
}
export function risk(command:AgentCommand): 'safe'|'medium'|'change'|'blocked' {
  if (['delete_note','delete_reminder'].includes(command.tool)) return 'blocked';
  if (['open_url','open_app','play_game','open_book','search_books','continue_reading','live','search','prayer','exchange'].includes(command.tool)) return 'medium';
  return requiresConfirmation(command) ? 'change' : 'safe';
}
export type Ports = { confirm:(text:string,key?:string)=>Promise<boolean>; save:()=>Promise<void>; navigate:(tool:'pdf'|'cv', action?:string)=>void; external:(url:string)=>Promise<void>; notify:(text:string)=>Promise<void>; fetcher?:typeof fetch };
export function createHost(data:Data, ports:Ports, getModel:()=>Model|undefined) {
  const store = createLocalStore({ getItem:k=>data.values[k] ?? null, setItem:(k,v)=>{data.values[k]=v;} });
  const fetcher = ports.fetcher ?? fetch;
  async function external(url:string) {
    if (!allowedURL(url)) throw new Error('الرابط خارج قائمة السماح');
    if (!await ports.confirm('فتح الرابط في المتصفح؟ '+url,'open_url')) throw new Error('أُلغي الفتح');
    await ports.external(url); return 'فُتح الرابط';
  }
  async function answer(q:string) {
    const model = getModel();
    if (data.mode !== 'cloud' && model) {
      try { return { text:await localChat(model,q,store.list('memories').map(m=>m.text),false,fetcher), label:'من نموذجك المحلي — بلا مصدر' }; }
      catch { if (data.mode === 'local') throw new Error('انقطع النموذج المحلي؛ الأدوات المحلية متاحة'); }
    }
    if (data.mode === 'local') return 'لا يوجد نموذج محلي متصل. شغّل Ollama ثم أعد الاكتشاف؛ الأدوات المحلية تعمل.';
    const result = await jsonFetch('https://si.alhajda.com/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,messages:[]})},fetcher);
    if (result.success === false || typeof result.reply !== 'string' || !result.reply.trim()) throw new Error('الخدمة السحابية غير متاحة');
    const sources = (Array.isArray(result.citations) ? result.citations : Array.isArray(result.sources) ? result.sources : []).map((s:unknown)=> typeof s === 'string' ? s : (s as {url?:string})?.url).filter(httpsSource);
    return { text:result.reply || result.answer || result.text || result.message || 'لم يصل جواب', sources, label:sources.length ? 'موثّق ✓' : 'سحابي — بلا مصدر' };
  }
  async function execute(raw:AgentCommand):Promise<unknown> {
    const c = validateCommand(raw);
    const level = risk(c);
    if (level === 'blocked') throw new Error('حذف الملفات والعناصر غير مدعوم؛ يمكنك مسح بيانات محسن من الإعدادات بتأكيد');
    if (level === 'change' && !await ports.confirm('تأكيد: '+JSON.stringify(c))) throw new Error('أُلغي الإجراء');
    switch(c.tool) {
      case 'calculate': case 'math': return solveMath(c.args.expr);
      case 'pdf': ports.navigate('pdf',c.args.action); return 'فُتح استوديو PDF'+(c.args.action ? ' — اختر الملفات لتنفيذ '+c.args.action : '');
      case 'cv': ports.navigate('cv'); return 'فُتح منشئ السيرة';
      case 'add_note': store.add('notes',c.args.text); break;
      case 'reminder': case 'add_reminder': {
        const due = parseArabicTime('when' in c.args ? c.args.when || c.args.text : c.args.text);
        store.add('reminders',c.args.text,due?.dueAt); break;
      }
      case 'remember': store.add('memories',c.args.text); break;
      case 'forget': for (const m of store.list('memories')) if(m.text.includes(c.args.text)) store.remove('memories',m.id); break;
      case 'clear_memory': store.clear('memories'); break;
      case 'list_notes': return store.list('notes');
      case 'list_reminders': return store.list('reminders');
      case 'list_memory': return store.list('memories');
      case 'time': return new Date().toLocaleString('ar');
      case 'hijri': return new Date().toLocaleDateString('ar-SA-u-ca-islamic');
      case 'ask_mohsen': return answer(c.args.q);
      case 'open_url': return external(c.args.url);
      case 'weather': {
        if (!c.args.city) return 'اذكر المدينة: طقس الرياض';
        const geo = await jsonFetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=ar&name='+encodeURIComponent(c.args.city),{},fetcher);
        const city = geo.results?.[0]; if (!city) return 'لم أعثر على المدينة';
        const w = await jsonFetch(`https://api.open-meteo.com/v1/forecast?latitude=${Number(city.latitude)}&longitude=${Number(city.longitude)}&current=temperature_2m,wind_speed_10m`,{},fetcher);
        return `${city.name}: ${w.current.temperature_2m}°، الرياح ${w.current.wind_speed_10m} كم/س — Open-Meteo`;
      }
      case 'news': { const n=await jsonFetch('https://waha.hajdah.com/api/news',{},fetcher); return {text:(n.items || []).slice(0,6).map((x:{title:string})=>x.title).join('\n'),sources:(n.items || []).slice(0,6).map((x:{href:string})=>x.href).filter(httpsSource)}; }
      case 'open_app': {
        if (c.args.id === 'notes') return store.list('notes');
        if (c.args.id.includes('pdf')) {ports.navigate('pdf');return 'فُتح PDF';}
        if (c.args.id.includes('cv')) {ports.navigate('cv');return 'فُتحت السيرة';}
        if (/calc|math/.test(c.args.id)) return 'اكتب احسب ٢ + ٣، أو حل ٢س + ٤ = ١٠';
        const key=Object.keys(LINKS).find(k=>c.args.id.includes(k)) as keyof typeof LINKS|undefined;
        if(key) return external(LINKS[key]);
        return 'هذه الأداة غير متاحة على سطح المكتب';
      }
      case 'open_book': case 'search_books': case 'continue_reading': return external(LINKS.books);
      case 'play_game': return external(LINKS.games);
      default: return 'هذه الأداة غير متاحة على سطح المكتب؛ جرّب الحاسبة أو PDF أو الملاحظات.';
    }
    await ports.save(); return 'حُفظ محليًا على جهازك';
  }
  async function run(text:string) {
    if (text.trim() === 'قيّم محسن') {
      const passed = corpus.filter(row=>{try {const c=parseIntent(row.text);return c?.tool===row.tool && JSON.stringify(c.args)===JSON.stringify(row.args);}catch{return false;}}).length;
      const result = {passed,total:corpus.length,accuracy:passed/corpus.length,date:new Date().toISOString()};
      data.values.evaluation=JSON.stringify(result); await ports.save(); return [`دقة النواة: ${(100*result.accuracy).toFixed(1)}% (${passed}/${corpus.length})`];
    }
    const p=plan(text,{city:store.city()});
    if(p.confidence<0.5 || p.steps.length===0) {
      const model=getModel();
      if(model && data.mode!=='cloud') {
        const content=await localChat(model,text,[],true,fetcher);
        // Invalid/forbidden plans fail closed. No automatic cloud execution.
        const command=validateLocalTool(content);
        return [await execute(command)];
      }
      return [await answer(text)];
    }
    const results=[];
    for(const step of p.steps) results.push(await execute(step.command));
    return results;
  }
  return { run,execute,store,external };
}
