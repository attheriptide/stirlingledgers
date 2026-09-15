import { useEffect, useState } from 'react';
import { listPurchases, addPurchase, deletePurchase, updatePurchasePaid } from '../lib/db';
import { useInventory } from '../context/InventoryContext';
import { money, todayStr, uid } from '../lib/format';
import { toast } from '../lib/toast';
import type { Purchase } from '../lib/types';
import { SectionTitle, AddButton, DelButton, Field, inputCls, EmptyRow, Th, Td, Note } from './ui';

export default function PurchasesTab() {
  const { inventory, applyStockDeltas, addModel } = useInventory();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(todayStr());
  const [vendor, setVendor] = useState('');
  const [model, setModel] = useState('');
  const [qty, setQty] = useState('1');
  const [cost, setCost] = useState('');
  const [paid, setPaid] = useState('');

  const refresh = async () => {
    setLoading(true);
    setPurchases(await listPurchases());
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const resetForm = () => {
    setVendor(''); setModel(''); setQty('1'); setCost(''); setPaid('');
  };

  const save = async () => {
    const costNum = Number(cost) || 0;
    const qtyNum = Number(qty) || 1;
    if (!model.trim()) { toast('Enter a model'); return; }
    if (costNum <= 0) { toast('Enter the cost'); return; }
    const paidNum = paid === '' ? costNum : Number(paid) || 0;
    const p: Purchase = {
      id: uid(), date, vendor: vendor || '—', model: model.trim(), qty: qtyNum, cost: costNum, paid: paidNum, notes: '',
    };
    const ok = await addPurchase(p);
    if (!ok) { toast('Could not save purchase'); return; }
    if (!(model.trim() in inventory)) {
      await addModel(model.trim(), qtyNum);
    } else {
      await applyStockDeltas({ [model.trim()]: qtyNum });
    }
    toast('Purchase saved — stock updated');
    resetForm();
    setShowForm(false);
    refresh();
  };

  const remove = async (p: Purchase) => {
    const ok = await deletePurchase(p.id);
    if (!ok) { toast('Could not delete'); return; }
    await applyStockDeltas({ [p.model]: -p.qty });
    toast('Purchase deleted — stock adjusted back');
    refresh();
  };

  const recordPayment = async (p: Purchase) => {
    const input = prompt(`Amount to pay ${p.vendor || 'vendor'} now (owing ${money(p.cost - p.paid)}):`, String(p.cost - p.paid));
    if (input === null) return;
    const extra = Number(input) || 0;
    if (extra <= 0) return;
    const newPaid = Math.min(p.cost, p.paid + extra);
    const ok = await updatePurchasePaid(p.id, newPaid);
    if (ok) { toast('Payment recorded'); refresh(); } else { toast('Could not update'); }
  };

  const modelOptions = Object.keys(inventory).sort();
  const totalCost = purchases.reduce((s, p) => s + p.cost, 0);
  const totalOwing = purchases.reduce((s, p) => s + Math.max(0, p.cost - p.paid), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <SectionTitle>Purchases (stock bought in)</SectionTitle>
      </div>

      {!showForm ? (
        <AddButton onClick={() => setShowForm(true)}>+ Add purchase</AddButton>
      ) : (
        <div className="bg-[#f4efe2] border border-[#e0d9c6] rounded-md p-4 mb-4">
          <div className="flex gap-3 flex-wrap mb-3">
            <Field label="Date" className="max-w-[160px]">
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Vendor">
              <input className={inputCls} placeholder="Supplier name" value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </Field>
            <Field label="Model">
              <input className={inputCls} list="purchase-models" placeholder="e.g. HP 840 G7" value={model} onChange={(e) => setModel(e.target.value)} />
              <datalist id="purchase-models">
                {modelOptions.map((m) => <option key={m} value={m} />)}
              </datalist>
            </Field>
            <Field label="Qty" className="max-w-[90px]">
              <input type="number" min="1" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="Total cost" className="max-w-[140px]">
              <input type="number" className={inputCls} placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} />
            </Field>
            <Field label="Paid now" className="max-w-[140px]">
              <input type="number" className={inputCls} placeholder={cost || '0'} value={paid} onChange={(e) => setPaid(e.target.value)} />
            </Field>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-ink text-white px-4 py-1.5 rounded text-[0.85rem] font-bold">Save purchase</button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted text-[0.82rem] underline">Cancel</button>
          </div>
        </div>
      )}

      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead><tr><Th>Date</Th><Th>Vendor</Th><Th>Model</Th><Th>Qty</Th><Th>Cost</Th><Th>Paid</Th><Th>Owing</Th><Th></Th></tr></thead>
        <tbody>
          {!loading && purchases.length === 0 && <EmptyRow colSpan={8}>No purchases recorded yet.</EmptyRow>}
          {purchases.map((p) => {
            const owing = p.cost - p.paid;
            return (
              <tr key={p.id}>
                <Td>{p.date}</Td>
                <Td>{p.vendor}</Td>
                <Td>{p.model}</Td>
                <Td>{p.qty}</Td>
                <Td>{money(p.cost)}</Td>
                <Td>{money(p.paid)}</Td>
                <Td className={owing > 0 ? 'text-red font-bold' : ''}>
                  {owing > 0 ? (
                    <button onClick={() => recordPayment(p)} className="underline">{money(owing)}</button>
                  ) : '—'}
                </Td>
                <Td><DelButton onClick={() => remove(p)} /></Td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Note>
        Total purchase cost: <strong>{money(totalCost)}</strong> · Owed to vendors (payable): <strong className={totalOwing > 0 ? 'text-red' : ''}>{money(totalOwing)}</strong>
      </Note>
      <Note>Saving a purchase adds the quantity straight to Inventory. New model names are created automatically.</Note>
    </div>
  );
}
