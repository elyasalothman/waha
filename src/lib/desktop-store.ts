import { isTauri } from './native.ts';
export type Data = { values: Record<string,string>; mode: 'local'|'fallback'|'cloud'; model: string; allowed: string[] };
export const emptyData = (): Data => ({ values:{}, mode:'fallback', model:'', allowed:[] });
export async function loadData(): Promise<Data> {
  const raw = isTauri() ? await (await import('@tauri-apps/api/core')).invoke<string>('agent_load') : localStorage.getItem('desktop-agent');
  if (!raw) return emptyData();
  const data = JSON.parse(raw);
  if (!data || typeof data.values !== 'object' || Array.isArray(data.values) || !Object.values(data.values).every(v => typeof v === 'string')) throw new Error('بيانات محسن تالفة؛ لم يتم استبدالها');
  return { values:data.values, mode: ['local','fallback','cloud'].includes(data.mode) ? data.mode : 'fallback', model:typeof data.model === 'string' ? data.model : '', allowed:Array.isArray(data.allowed) ? data.allowed.filter((x:unknown) => typeof x === 'string') : [] };
}
let pending: Promise<void> = Promise.resolve();
export async function persist(data: Data) {
  const json = JSON.stringify(data);
  const native = isTauri();
  pending = pending.catch(() => {}).then(async () => {
    if (native) await (await import('@tauri-apps/api/core')).invoke('agent_save', { json });
    else localStorage.setItem('desktop-agent', json);
  });
  await pending;
}
