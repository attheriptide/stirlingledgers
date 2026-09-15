import { useEffect, useState } from 'react';
import { getDay, setDay, listDayDates } from '../lib/db';
import { useInventory } from '../context/InventoryContext';
import { money, todayStr } from '../lib/format';
import { toast } from '../lib/toast';
import type { DayEntry, SaleRow, ExpRow } from '../lib/types';
import {
  SectionTitle, AddButton, SaveButton, DelButton, Field, inputCls,
  SummaryGrid, SummaryItem, EmptyRow, Th, Td, Note,
} from './ui';

const blankSale = (): SaleRow => ({ customer: '', model: '', ref: '', price: 0, paid: 0 });
const blankExp = (): ExpRow => ({ desc: '', amount: 0, paid: true });

export default function LedgerTab({ date, onDateChange: onDateChangeExternal }: { date: string; onDateChange: (d: string) => void }) {
  const { inventory, applyStockDeltas } = useInventory();
  const [day, setDayState] = useState<DayEntry>({ bf: 0, sales: [], expenditures: [], committed: null });
  const [loadStatus, setLoadStatus] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const computeBF = async (d: string): Promise<number> => {
    const dates = (await listDayDates()).filter((x) => x < d).sort();
    if (dates.length === 0) return 0;
    const prev = await getDay(dates[dates.length - 1]);
    if (!prev) return 0;
    const cashIn = prev.sales.reduce((s, r) => s + (Number(r.paid) || 0), 0);
    const expTotal = prev.expenditures.filter((r) => r.paid).reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return (Number(prev.bf) || 0) + cashIn - expTotal;
  };

  const load = async (d: string) => {
    setLoadStatus('Loading…');
    const existing = await getDay(d);
    if (existing) {
      setDayState(existing);
      setLoadStatus('Existing entry loaded');
    } else {
      const bf = await computeBF(d);
      setDayState({ bf, sales: [], expenditures: [], committed: null });
      setLoadStatus('New day');
    }
  };

  useEffect(() => {
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const onDateChange = (d: string) => {
    onDateChangeExternal(d || todayStr());
  };

  const updateSale = (i: number, patch: Partial<SaleRow>) => {
    const sales = day.sales.slice();
    sales[i] = { ...sales[i], ...patch };
    setDayState({ ...day, sales });
  };
  const updateExp = (i: number, patch: Partial<ExpRow>) => {
    const expenditures = day.expenditures.slice();
    expenditures[i] = { ...expenditures[i], ...patch };
    setDayState({ ...day, expenditures });
  };
  const removeSale = (i: number) => setDayState({ ...day, sales: day.sales.filter((_, idx) => idx !== i) });
  const removeExp = (i: number) => setDayState({ ...day, expenditures: day.expenditures.filter((_, idx) => idx !== i) });

  const cashIn = day.sales.reduce((s, r) => s + (Number(r.paid) || 0), 0);
  const salesValue = day.sales.reduce((s, r) => s + (Number(r.price) || 0), 0);
  const expTotal = day.expenditures.filter((r) => r.paid).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const balance = (Number(day.bf) || 0) + cashIn - expTotal;

  const save = async () => {
    // Net stock effect of: undoing whatever this day previously committed, then applying the current rows.
    const deltas: Record<string, number> = {};
    if (day.committed) {
      Object.entries(day.committed).forEach(([model, qty]) => {
        if (model) deltas[model] = (deltas[model] || 0) + qty;
      });
    }
    const soldCounts: Record<string, number> = {};
    day.sales.forEach((r) => { if (r.model) soldCounts[r.model] = (soldCounts[r.model] || 0) + 1; });
    Object.entries(soldCounts).forEach(([model, qty]) => {
      deltas[model] = (deltas[model] || 0) - qty;
    });
    await applyStockDeltas(deltas);

    const toSave: DayEntry = { ...day, committed: soldCounts };
    const ok = await setDay(date, toSave);
    setDayState(toSave);
    setSaveStatus(ok ? 'Saved ✓' : 'Save failed — try again');
    toast(ok ? 'Day saved' : 'Could not save');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const modelOptions = Object.keys(inventory).sort();

  return (
    <div>
      <div className="flex gap-3.5 items-end mb-3.5 flex-wrap">
        <Field label="Date" className="max-w-[180px]">
          <input type="date" className={inputCls} value={date} onChange={(e) => onDateChange(e.target.value)} />
        </Field>
        <Field label="Brought Forward" className="max-w-[160px]">
          <input
            type="number"
            className={inputCls}
            value={day.bf}
            onChange={(e) => setDayState({ ...day, bf: Number(e.target.value) || 0 })}
          />
        </Field>
        <span className="text-[0.78rem] text-muted">{loadStatus}</span>
      </div>

      <SectionTitle>Sales</SectionTitle>
      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead>
          <tr>
            <Th>Customer</Th><Th>Model</Th><Th>Ref</Th><Th>Price</Th><Th>Paid</Th><Th>Balance</Th><Th></Th>
          </tr>
        </thead>
        <tbody>
          {day.sales.length === 0 && <EmptyRow colSpan={7}>No sales recorded for this day yet.</EmptyRow>}
          {day.sales.map((row, i) => {
            const bal = (Number(row.price) || 0) - (Number(row.paid) || 0);
            return (
              <tr key={i}>
                <Td><input className={inputCls} value={row.customer} onChange={(e) => updateSale(i, { customer: e.target.value })} /></Td>
                <Td>
                  <select className={inputCls} value={row.model} onChange={(e) => updateSale(i, { model: e.target.value })}>
                    <option value="">—</option>
                    {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Td>
                <Td><input className={inputCls} style={{ maxWidth: 70 }} value={row.ref} onChange={(e) => updateSale(i, { ref: e.target.value })} /></Td>
                <Td><input type="number" className={inputCls} style={{ maxWidth: 110 }} value={row.price} onChange={(e) => updateSale(i, { price: Number(e.target.value) || 0 })} /></Td>
                <Td><input type="number" className={inputCls} style={{ maxWidth: 110 }} value={row.paid} onChange={(e) => updateSale(i, { paid: Number(e.target.value) || 0 })} /></Td>
                <Td>{money(bal)}</Td>
                <Td><DelButton onClick={() => removeSale(i)} /></Td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <AddButton onClick={() => setDayState({ ...day, sales: [...day.sales, blankSale()] })}>+ Add sale</AddButton>

      <SectionTitle>Expenditure</SectionTitle>
      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead><tr><Th>Description</Th><Th>Amount</Th><Th>Paid?</Th><Th></Th></tr></thead>
        <tbody>
          {day.expenditures.length === 0 && <EmptyRow colSpan={4}>No expenditure recorded for this day yet.</EmptyRow>}
          {day.expenditures.map((row, i) => (
            <tr key={i}>
              <Td><input className={inputCls} value={row.desc} onChange={(e) => updateExp(i, { desc: e.target.value })} /></Td>
              <Td><input type="number" className={inputCls} style={{ maxWidth: 130 }} value={row.amount} onChange={(e) => updateExp(i, { amount: Number(e.target.value) || 0 })} /></Td>
              <Td className="text-center"><input type="checkbox" checked={row.paid} onChange={(e) => updateExp(i, { paid: e.target.checked })} /></Td>
              <Td><DelButton onClick={() => removeExp(i)} /></Td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddButton onClick={() => setDayState({ ...day, expenditures: [...day.expenditures, blankExp()] })}>+ Add expenditure</AddButton>

      <SummaryGrid>
        <SummaryItem label="Brought forward" value={money(day.bf)} />
        <SummaryItem label="Cash sales (paid)" value={money(cashIn)} />
        <SummaryItem label="Sales value (incl. credit)" value={money(salesValue)} />
        <SummaryItem label="Expenditure" value={money(expTotal)} />
        <SummaryItem label="Balance" value={money(balance)} tone={balance < 0 ? 'negative' : 'balance'} />
      </SummaryGrid>

      <div className="flex justify-between items-center mt-4.5">
        <SaveButton onClick={save}>Save day</SaveButton>
        <span className="text-[0.78rem] text-muted">{saveStatus}</span>
      </div>
      <Note>Stock is reduced automatically when a day is saved (editing and re-saving the same day won't double-count).</Note>
    </div>
  );
}
