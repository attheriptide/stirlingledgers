import { useEffect, useState } from 'react';
import { listPurchases, addPurchase, deletePurchase, updatePurchasePaid } from '../lib/db';
import { useInventory } from '../context/InventoryContext';
import { money, todayStr, uid } from '../lib/format';
import { toast } from '../lib/toast';
import type { Purchase } from '../lib/types';
import { SectionTitle, AddButton, DelButton, Field, inputCls, EmptyRow, Th, Td, Note } from './ui';

export default function PurchasesTab() {
  const { inventory, recordPurchase, applyStockDeltas } = useInventory();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(todayStr());
  const [vendor, setVendor] = useState('');
  const [model, setModel] = useState('');
  const [qty, setQty] = useState('1');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [transport, setTransport] = useState('0');
  const [paid, setPaid] = useState('');

  const refresh = async () => {
    setLoading(true);
    setPurchases(await listPurchases());
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  // prefill selling price from what's already on file for this model, if any
  useEffect(() => {
    const item = inventory[model.trim()];
    if (item && item.sellingPrice > 0 && sellingPrice === '') setSellingPrice(String(item.sellingPrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  const resetForm = () => {
    setVendor(''); setModel(''); setQty('1'); setBuyingPrice(''); setSellingPrice(''); setTransport('0'); setPaid('');
  };

  const qtyNum = Number(qty) || 1;
  const buyingNum = Number(buyingPrice) || 0;
  const transportNum = Number(transport) || 0;
  const totalCost = qtyNum * buyingNum + transportNum;
  const landedPerUnit = qtyNum > 0 ? (qtyNum * buyingNum + transportNum) / qtyNum : buyingNum;
  const sellingNum = Number(sellingPrice) || 0;
  const marginPerUnit = sellingNum > 0 ? sellingNum - landedPerUnit : 0;

  const save = async () => {
    if (!model.trim()) { toast('Enter a model'); return; }
    if (buyingNum <= 0) { toast('Enter the buying price'); return; }
    const paidNum = paid === '' ? totalCost : Number(paid) || 0;
    const p: Purchase = {
      id: uid(), date, vendor: vendor || '—', model: model.trim(), qty: qtyNum,
      buyingPrice: buyingNum, sellingPrice: sellingNum, transport: transportNum,
      cost: totalCost, paid: paidNum, notes: '',
    };
    const ok = await addPurchase(p);
    if (!ok) { toast('Could not save purchase'); return; }
    await recordPurchase(p.model, qtyNum, landedPerUnit, sellingNum);
    toast('Purchase saved — stock and pricing updated');
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
  const totalSpent = purchases.reduce((s, p) => s + p.cost, 0);
  const totalOwing = purchases.reduce((s, p) => s + Math.max(0, p.cost - p.paid), 0);

  return (
    <div>
      <SectionTitle>Purchases (stock bought in)</SectionTitle>

      {!showForm ? (
        <AddButton onClick={() => setShowForm(true)}>+ Add purchase</AddButton>
      ) : (
        <div className="bg-highlight border border-highlight-border rounded-md p-4 mb-4">
          <div className="flex gap-3 flex-wrap mb-3">
            <Field label="Date" className="max-w-[150px]">
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
            <Field label="Qty" className="max-w-[80px]">
              <input type="number" min="1" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
          </div>
          <div className="flex gap-3 flex-wrap mb-3">
            <Field label="Buying price / unit" className="max-w-[160px]">
              <input type="number" className={inputCls} placeholder="0" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} />
            </Field>
            <Field label="Transport (total)" className="max-w-[150px]">
              <input type="number" className={inputCls} value={transport} onChange={(e) => setTransport(e.target.value)} />
            </Field>
            <Field label="Selling price / unit" className="max-w-[160px]">
              <input type="number" className={inputCls} placeholder="0" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
            </Field>
            <Field label="Paid to vendor now" className="max-w-[160px]">
              <input type="number" className={inputCls} placeholder={String(totalCost || 0)} value={paid} onChange={(e) => setPaid(e.target.value)} />
            </Field>
          </div>

          <div className="text-[0.82rem] text-muted mb-3 flex gap-5 flex-wrap">
            <span>Landed cost/unit: <strong className="text-ink">{money(landedPerUnit)}</strong></span>
            <span>Total cost: <strong className="text-ink">{money(totalCost)}</strong></span>
            {sellingNum > 0 && (
              <span>Margin/unit: <strong className={marginPerUnit >= 0 ? 'text-green' : 'text-red'}>{money(marginPerUnit)}</strong></span>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={save} className="bg-accent text-white px-4 py-1.5 rounded-md text-[0.85rem] font-semibold">Save purchase</button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted text-[0.82rem] underline">Cancel</button>
          </div>
        </div>
      )}

      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead>
          <tr>
            <Th>Date</Th><Th>Vendor</Th><Th>Model</Th><Th>Qty</Th><Th>Buy/unit</Th><Th>Transport</Th>
            <Th>Sell/unit</Th><Th>Total cost</Th><Th>Paid</Th><Th>Owing</Th><Th></Th>
          </tr>
        </thead>
        <tbody>
          {!loading && purchases.length === 0 && <EmptyRow colSpan={11}>No purchases recorded yet.</EmptyRow>}
          {purchases.map((p) => {
            const owing = p.cost - p.paid;
            return (
              <tr key={p.id}>
                <Td>{p.date}</Td>
                <Td>{p.vendor}</Td>
                <Td>{p.model}</Td>
                <Td>{p.qty}</Td>
                <Td>{money(p.buyingPrice)}</Td>
                <Td>{money(p.transport)}</Td>
                <Td>{p.sellingPrice > 0 ? money(p.sellingPrice) : '—'}</Td>
                <Td>{money(p.cost)}</Td>
                <Td>{money(p.paid)}</Td>
                <Td className={owing > 0 ? 'text-red font-semibold' : ''}>
                  {owing > 0 ? <button onClick={() => recordPayment(p)} className="underline">{money(owing)}</button> : '—'}
                </Td>
                <Td><DelButton onClick={() => remove(p)} /></Td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Note>
        Total spent on stock: <strong>{money(totalSpent)}</strong> · Owed to vendors (payable): <strong className={totalOwing > 0 ? 'text-red' : ''}>{money(totalOwing)}</strong>
      </Note>
      <Note>Transport is spread across the units bought to work out the true landed cost — that's what profit is measured against, not just the buying price.</Note>
    </div>
  );
}
