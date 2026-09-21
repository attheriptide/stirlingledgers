import { useEffect, useState } from 'react';
import { listReturns, addReturn, deleteReturn } from '../lib/db';
import { useInventory } from '../context/InventoryContext';
import { money, todayStr, uid } from '../lib/format';
import { toast } from '../lib/toast';
import type { ReturnEntry, ReturnKind } from '../lib/types';
import { SectionTitle, AddButton, DelButton, Field, inputCls, EmptyRow, Th, Td, Note } from './ui';

export default function ReturnsTab() {
  const { inventory, applyStockDeltas } = useInventory();
  const [returns, setReturns] = useState<ReturnEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [kind, setKind] = useState<ReturnKind>('sale_return');
  const [date, setDate] = useState(todayStr());
  const [party, setParty] = useState('');
  const [model, setModel] = useState('');
  const [qty, setQty] = useState('1');
  const [amount, setAmount] = useState('');

  const refresh = async () => {
    setLoading(true);
    setReturns(await listReturns());
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const resetForm = () => { setParty(''); setModel(''); setQty('1'); setAmount(''); };

  const stockDelta = (k: ReturnKind, q: number) => (k === 'sale_return' ? q : -q);

  const save = async () => {
    const qtyNum = Number(qty) || 1;
    const amtNum = Number(amount) || 0;
    if (!model.trim()) { toast('Enter a model'); return; }
    const entry: ReturnEntry = {
      id: uid(), date, kind, party: party || '—', model: model.trim(), qty: qtyNum, amount: amtNum, notes: '',
    };
    const ok = await addReturn(entry);
    if (!ok) { toast('Could not save return'); return; }
    await applyStockDeltas({ [model.trim()]: stockDelta(kind, qtyNum) });
    toast(kind === 'sale_return' ? 'Sale return saved — stock added back' : 'Purchase return saved — stock removed');
    resetForm();
    setShowForm(false);
    refresh();
  };

  const remove = async (r: ReturnEntry) => {
    const ok = await deleteReturn(r.id);
    if (!ok) { toast('Could not delete'); return; }
    await applyStockDeltas({ [r.model]: -stockDelta(r.kind, r.qty) });
    toast('Return deleted — stock adjusted back');
    refresh();
  };

  const modelOptions = Object.keys(inventory).sort();

  return (
    <div>
      <SectionTitle>Returns</SectionTitle>

      {!showForm ? (
        <AddButton onClick={() => setShowForm(true)}>+ Add return</AddButton>
      ) : (
        <div className="bg-highlight border border-highlight-border rounded-md p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setKind('sale_return')}
              className={`px-3 py-1.5 rounded-full text-[0.8rem] font-bold border ${kind === 'sale_return' ? 'bg-ink text-white border-ink' : 'bg-white text-muted border-rule'}`}
            >
              Customer return (sale)
            </button>
            <button
              onClick={() => setKind('purchase_return')}
              className={`px-3 py-1.5 rounded-full text-[0.8rem] font-bold border ${kind === 'purchase_return' ? 'bg-ink text-white border-ink' : 'bg-white text-muted border-rule'}`}
            >
              Return to vendor (purchase)
            </button>
          </div>
          <div className="flex gap-3 flex-wrap mb-3">
            <Field label="Date" className="max-w-[160px]">
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={kind === 'sale_return' ? 'Customer' : 'Vendor'}>
              <input className={inputCls} value={party} onChange={(e) => setParty(e.target.value)} />
            </Field>
            <Field label="Model">
              <input className={inputCls} list="return-models" value={model} onChange={(e) => setModel(e.target.value)} />
              <datalist id="return-models">
                {modelOptions.map((m) => <option key={m} value={m} />)}
              </datalist>
            </Field>
            <Field label="Qty" className="max-w-[90px]">
              <input type="number" min="1" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="Amount" className="max-w-[140px]">
              <input type="number" className={inputCls} placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-ink text-white px-4 py-1.5 rounded text-[0.85rem] font-bold">Save return</button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted text-[0.82rem] underline">Cancel</button>
          </div>
        </div>
      )}

      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead><tr><Th>Date</Th><Th>Type</Th><Th>Party</Th><Th>Model</Th><Th>Qty</Th><Th>Amount</Th><Th></Th></tr></thead>
        <tbody>
          {!loading && returns.length === 0 && <EmptyRow colSpan={7}>No returns recorded yet.</EmptyRow>}
          {returns.map((r) => (
            <tr key={r.id}>
              <Td>{r.date}</Td>
              <Td>{r.kind === 'sale_return' ? 'Customer return' : 'To vendor'}</Td>
              <Td>{r.party}</Td>
              <Td>{r.model}</Td>
              <Td>{r.qty}</Td>
              <Td>{money(r.amount)}</Td>
              <Td><DelButton onClick={() => remove(r)} /></Td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>A customer return adds stock back in. A return to a vendor removes stock, same as if it were sent back out.</Note>
    </div>
  );
}
