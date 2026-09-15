import { useState } from 'react';
import { listDayDates, getDay } from '../lib/db';
import { money, todayStr } from '../lib/format';
import { toast } from '../lib/toast';
import { SectionTitle, Field, inputCls, SummaryGrid, SummaryItem, EmptyRow, Th, Td } from './ui';
import type { DayEntry } from '../lib/types';

type DayRow = { date: string; cashIn: number; expTotal: number; balance: number };

export default function ReportsTab({ onOpenDate }: { onOpenDate: (date: string) => void }) {
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [rows, setRows] = useState<DayRow[]>([]);
  const [totals, setTotals] = useState({ days: 0, cashIn: 0, expTotal: 0, salesValue: 0 });
  const [modelUnits, setModelUnits] = useState<[string, number][]>([]);
  const [ran, setRan] = useState(false);

  const run = async () => {
    if (!from || !to) { toast('Pick both dates'); return; }
    const dates = (await listDayDates()).filter((d) => d >= from && d <= to).sort();
    const days: (DayEntry | null)[] = await Promise.all(dates.map((d) => getDay(d)));

    let totalCashIn = 0, totalExp = 0, totalSalesValue = 0;
    const units: Record<string, number> = {};
    const newRows: DayRow[] = [];

    dates.forEach((d, idx) => {
      const day = days[idx];
      if (!day) return;
      const cashIn = day.sales.reduce((s, r) => s + (Number(r.paid) || 0), 0);
      const salesValue = day.sales.reduce((s, r) => s + (Number(r.price) || 0), 0);
      const expTotal = day.expenditures.filter((r) => r.paid).reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const balance = (Number(day.bf) || 0) + cashIn - expTotal;
      totalCashIn += cashIn; totalExp += expTotal; totalSalesValue += salesValue;
      day.sales.forEach((r) => { if (r.model) units[r.model] = (units[r.model] || 0) + 1; });
      newRows.push({ date: d, cashIn, expTotal, balance });
    });

    setRows(newRows);
    setTotals({ days: dates.length, cashIn: totalCashIn, expTotal: totalExp, salesValue: totalSalesValue });
    setModelUnits(Object.entries(units).sort((a, b) => b[1] - a[1]));
    setRan(true);
  };

  return (
    <div>
      <div className="flex gap-3.5 items-end mb-3.5 flex-wrap">
        <Field label="From" className="max-w-[170px]">
          <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To" className="max-w-[170px]">
          <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <button onClick={run} className="bg-ink text-white px-5 py-2 rounded font-bold text-[0.9rem]">Run report</button>
      </div>

      {ran && (
        <SummaryGrid>
          <SummaryItem label="Days in range" value={String(totals.days)} />
          <SummaryItem label="Cash sales (paid)" value={money(totals.cashIn)} />
          <SummaryItem label="Sales value (incl. credit)" value={money(totals.salesValue)} />
          <SummaryItem label="Expenditure" value={money(totals.expTotal)} />
          <SummaryItem
            label="Net (cash − expenditure)"
            value={money(totals.cashIn - totals.expTotal)}
            tone={totals.cashIn - totals.expTotal < 0 ? 'negative' : 'balance'}
          />
        </SummaryGrid>
      )}

      <SectionTitle>Units sold by model (in range)</SectionTitle>
      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead><tr><Th>Model</Th><Th>Units sold</Th></tr></thead>
        <tbody>
          {modelUnits.length === 0 && <EmptyRow colSpan={2}>No units sold in this range.</EmptyRow>}
          {modelUnits.map(([m, q]) => (
            <tr key={m}><Td>{m}</Td><Td>{q}</Td></tr>
          ))}
        </tbody>
      </table>

      <SectionTitle>Day by day</SectionTitle>
      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead><tr><Th>Date</Th><Th>Cash in</Th><Th>Expenditure</Th><Th>Balance</Th></tr></thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={4}>No saved days in this range.</EmptyRow>}
          {rows.map((r) => (
            <tr key={r.date} className="cursor-pointer hover:bg-[#f4efe2]" onClick={() => onOpenDate(r.date)}>
              <Td>{r.date}</Td><Td>{money(r.cashIn)}</Td><Td>{money(r.expTotal)}</Td><Td>{money(r.balance)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
