import { supabase } from './supabase';
import type { DayEntry, Inventory, Purchase, IncomeEntry, ReturnEntry } from './types';

/* =====================================================================
   LEDGER DAYS  (unchanged)
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

/* =====================================================================
   INVENTORY  (now price-aware: qty + cost price + selling price)
   ===================================================================== */
export async function getInventory(): Promise<Inventory | null> {
  const { data, error } = await supabase.from('kv_inventory').select('model, qty, cost_price, selling_price');
  if (error) { console.error('getInventory failed', error); return null; }
  if (!data || data.length === 0) return null;
  const obj: Inventory = {};
  data.forEach((r) => {
    obj[r.model as string] = {
      qty: (r.qty as number) ?? 0,
      costPrice: (r.cost_price as number) ?? 0,
      sellingPrice: (r.selling_price as number) ?? 0,
    };
  });
  return obj;
}

export async function setInventory(inv: Inventory): Promise<boolean> {
  const rows = Object.entries(inv).map(([model, item]) => ({
    model,
    qty: item.qty,
    cost_price: item.costPrice,
    selling_price: item.sellingPrice,
  }));
  const { error: delErr } = await supabase.from('kv_inventory').delete().neq('model', '__none__');
  if (delErr) { console.error('setInventory delete failed', delErr); return false; }
  if (rows.length) {
    const { error: insErr } = await supabase.from('kv_inventory').insert(rows);
    if (insErr) { console.error('setInventory insert failed', insErr); return false; }
  }
  return true;
}

/* =====================================================================
   PURCHASES  (buying price, selling price, transport all captured)
   ===================================================================== */
function purchaseToRow(p: Purchase) {
  return {
    id: p.id, date: p.date, vendor: p.vendor, model: p.model, qty: p.qty,
    buying_price: p.buyingPrice, selling_price: p.sellingPrice, transport: p.transport,
    cost: p.cost, paid: p.paid, notes: p.notes,
  };
}
function rowToPurchase(r: any): Purchase {
  return {
    id: r.id, date: r.date, vendor: r.vendor, model: r.model, qty: r.qty,
    buyingPrice: r.buying_price ?? 0, sellingPrice: r.selling_price ?? 0, transport: r.transport ?? 0,
    cost: r.cost, paid: r.paid, notes: r.notes ?? '',
  };
}

export async function listPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase.from('purchases').select('*').order('date', { ascending: false });
  if (error) { console.error('listPurchases failed', error); return []; }
  return (data ?? []).map(rowToPurchase);
}

export async function addPurchase(p: Purchase): Promise<boolean> {
  const { error } = await supabase.from('purchases').insert(purchaseToRow(p));
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
   INCOME  (unchanged)
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
   RETURNS  (unchanged)
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
