import { useEffect, useState } from 'react';
import { listIncomes, addIncome, deleteIncome, updateIncomeReceived } from '../lib/db';
import { money, todayStr, uid } from '../lib/format';
import { toast } from '../lib/toast';
import type { IncomeEntry } from '../lib/types';
import { SectionTitle, AddButton, DelButton, Field, inputCls, EmptyRow, Th, Td, Note } from './ui';

export default function IncomeTab() {
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(todayStr());
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [received, setReceived] = useState('');

  const refresh = async () => {
    setLoading(true);
    setIncomes(await listIncomes());
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const resetForm = () => { setSource(''); setAmount(''); setReceived(''); };

  const save = async () => {
    const amt = Number(amount) || 0;
    if (!source.trim()) { toast('Enter a source'); return; }
    if (amt <= 0) { toast('Enter an amount'); return; }
    const rec = received === '' ? amt : Number(received) || 0;
    const entry: IncomeEntry = { id: uid(), date, source: source.trim(), amount: amt, received: rec, notes: '' };
    const ok = await addIncome(entry);
    if (!ok) { toast('Could not save'); return; }
    toast('Income saved');
    resetForm();
    setShowForm(false);
    refresh();
  };

  const remove = async (id: string) => {
    const ok = await deleteIncome(id);
    if (ok) { toast('Deleted'); refresh(); } else { toast('Could not delete'); }
  };

  const collect = async (e: IncomeEntry) => {
    const input = prompt(`Amount received now (still owed: ${money(e.amount - e.received)}):`, String(e.amount - e.received));
    if (input === null) return;
    const extra = Number(input) || 0;
    if (extra <= 0) return;
    const newReceived = Math.min(e.amount, e.received + extra);
    const ok = await updateIncomeReceived(e.id, newReceived);
    if (ok) { toast('Payment recorded'); refresh(); } else { toast('Could not update'); }
  };

  const totalIncome = incomes.reduce((s, e) => s + e.amount, 0);
  const totalReceived = incomes.reduce((s, e) => s + e.received, 0);

  return (
    <div>
      <SectionTitle>Income (other than stock sales)</SectionTitle>

      {!showForm ? (
        <AddButton onClick={() => setShowForm(true)}>+ Add income</AddButton>
      ) : (
        <div className="bg-highlight border border-highlight-border rounded-md p-4 mb-4">
          <div className="flex gap-3 flex-wrap mb-3">
            <Field label="Date" className="max-w-[160px]">
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Source">
              <input className={inputCls} placeholder="e.g. Repair service, rent received" value={source} onChange={(e) => setSource(e.target.value)} />
            </Field>
            <Field label="Amount" className="max-w-[140px]">
              <input type="number" className={inputCls} placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Received now" className="max-w-[140px]">
              <input type="number" className={inputCls} placeholder={amount || '0'} value={received} onChange={(e) => setReceived(e.target.value)} />
            </Field>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-ink text-white px-4 py-1.5 rounded text-[0.85rem] font-bold">Save income</button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted text-[0.82rem] underline">Cancel</button>
          </div>
        </div>
      )}

      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead><tr><Th>Date</Th><Th>Source</Th><Th>Amount</Th><Th>Received</Th><Th>Owing</Th><Th></Th></tr></thead>
        <tbody>
          {!loading && incomes.length === 0 && <EmptyRow colSpan={6}>No income recorded yet.</EmptyRow>}
          {incomes.map((e) => {
            const owing = e.amount - e.received;
            return (
              <tr key={e.id}>
                <Td>{e.date}</Td>
                <Td>{e.source}</Td>
                <Td>{money(e.amount)}</Td>
                <Td>{money(e.received)}</Td>
                <Td className={owing > 0 ? 'text-red font-bold' : ''}>
                  {owing > 0 ? <button onClick={() => collect(e)} className="underline">{money(owing)}</button> : '—'}
                </Td>
                <Td><DelButton onClick={() => remove(e.id)} /></Td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Note>
        Total income: <strong>{money(totalIncome)}</strong> · Received so far: <strong>{money(totalReceived)}</strong>
      </Note>
    </div>
  );
}
