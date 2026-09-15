import { supabase } from './supabase';
import type { DayEntry, Inventory, Purchase, IncomeEntry, ReturnEntry } from './types';

/* =====================================================================
   LEDGER DAYS + INVENTORY
   Same two tables and same read/write shape as the original HTML build
   (kv_days: date + jsonb blob, kv_inventory: model + qty). Behavior here
   is unchanged — only the transport (Supabase JS client vs raw fetch)
   is different.
   ===================================================================== */
export async function getDay(date: string): Promise<DayEntry | null> {
  const { data, error } = await supabase.from('kv_days').select('data').eq('date', date).maybeSingle();
  if (error) { console.error('getDay failed', error); return null; }
  return data ? (data.data as DayEntry) : null;
}

export async function setDay(date: string, value: DayEntry): Promise<boolean> {
  const { error } = await supabase.from('kv_days').upsert({ date, data: value });
  if (error) { console.error('setDay failed', error); return false; }
  return true;
}

export async function listDayDates(): Promise<string[]> {
  const { data, error } = await supabase.from('kv_days').select('date');
  if (error) { console.error('listDayDates failed', error); return []; }
  return (data ?? []).map((r) => r.date as string);
}

export async function listAllDays(): Promise<{ date: string; day: DayEntry }[]> {
  const dates = (await listDayDates()).sort();
  const days = await Promise.all(dates.map((d) => getDay(d)));
  return dates
    .map((date, i) => ({ date, day: days[i] }))
    .filter((x): x is { date: string; day: DayEntry } => x.day !== null);
}

export async function getInventory(): Promise<Inventory | null> {
  const { data, error } = await supabase.from('kv_inventory').select('model, qty');
  if (error) { console.error('getInventory failed', error); return null; }
  if (!data || data.length === 0) return null;
  const obj: Inventory = {};
  data.forEach((r) => { obj[r.model as string] = r.qty as number; });
  return obj;
}

export async function setInventory(inv: Inventory): Promise<boolean> {
  const rows = Object.entries(inv).map(([model, qty]) => ({ model, qty }));
  const { error: delErr } = await supabase.from('kv_inventory').delete().neq('model', '__none__');
  if (delErr) { console.error('setInventory delete failed', delErr); return false; }
  if (rows.length) {
    const { error: insErr } = await supabase.from('kv_inventory').insert(rows);
    if (insErr) { console.error('setInventory insert failed', insErr); return false; }
  }
  return true;
}

/* =====================================================================
   PURCHASES  (new)
   ===================================================================== */
export async function listPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase.from('purchases').select('*').order('date', { ascending: false });
  if (error) { console.error('listPurchases failed', error); return []; }
  return (data ?? []) as Purchase[];
}

export async function addPurchase(p: Purchase): Promise<boolean> {
  const { error } = await supabase.from('purchases').insert(p);
  if (error) { console.error('addPurchase failed', error); return false; }
  return true;
}

export async function deletePurchase(id: string): Promise<boolean> {
  const { error } = await supabase.from('purchases').delete().eq('id', id);
  if (error) { console.error('deletePurchase failed', error); return false; }
  return true;
}

export async function updatePurchasePaid(id: string, paid: number): Promise<boolean> {
  const { error } = await supabase.from('purchases').update({ paid }).eq('id', id);
  if (error) { console.error('updatePurchasePaid failed', error); return false; }
  return true;
}

/* =====================================================================
   INCOME  (new)
   ===================================================================== */
export async function listIncomes(): Promise<IncomeEntry[]> {
  const { data, error } = await supabase.from('incomes').select('*').order('date', { ascending: false });
  if (error) { console.error('listIncomes failed', error); return []; }
  return (data ?? []) as IncomeEntry[];
}

export async function addIncome(i: IncomeEntry): Promise<boolean> {
  const { error } = await supabase.from('incomes').insert(i);
  if (error) { console.error('addIncome failed', error); return false; }
  return true;
}

export async function deleteIncome(id: string): Promise<boolean> {
  const { error } = await supabase.from('incomes').delete().eq('id', id);
  if (error) { console.error('deleteIncome failed', error); return false; }
  return true;
}

export async function updateIncomeReceived(id: string, received: number): Promise<boolean> {
  const { error } = await supabase.from('incomes').update({ received }).eq('id', id);
  if (error) { console.error('updateIncomeReceived failed', error); return false; }
  return true;
}

/* =====================================================================
   RETURNS  (new)
   ===================================================================== */
export async function listReturns(): Promise<ReturnEntry[]> {
  const { data, error } = await supabase.from('returns').select('*').order('date', { ascending: false });
  if (error) { console.error('listReturns failed', error); return []; }
  return (data ?? []) as ReturnEntry[];
}

export async function addReturn(r: ReturnEntry): Promise<boolean> {
  const { error } = await supabase.from('returns').insert(r);
  if (error) { console.error('addReturn failed', error); return false; }
  return true;
}

export async function deleteReturn(id: string): Promise<boolean> {
  const { error } = await supabase.from('returns').delete().eq('id', id);
  if (error) { console.error('deleteReturn failed', error); return false; }
  return true;
}
