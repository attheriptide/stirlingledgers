import { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { money } from '../lib/format';
import { toast } from '../lib/toast';
import { SectionTitle, AddButton, DelButton, EmptyRow, Th, Td, Note, inputCls } from './ui';

const LOW_STOCK_THRESHOLD = 2;

export default function InventoryTab() {
  const { inventory, setStock, setPrices, addModel, deleteModel } = useInventory();
  const [newModel, setNewModel] = useState('');
  const [newQty, setNewQty] = useState('0');
  const [newCost, setNewCost] = useState('0');
  const [newSelling, setNewSelling] = useState('0');
  const [adding, setAdding] = useState(false);

  const models = Object.keys(inventory).sort();

  const handleAdd = async () => {
    const name = newModel.trim();
    if (!name) return;
    await addModel(name, Number(newQty) || 0, Number(newCost) || 0, Number(newSelling) || 0);
    setNewModel(''); setNewQty('0'); setNewCost('0'); setNewSelling('0');
    setAdding(false);
    toast('Model added');
  };

  const lowStockCount = models.filter((m) => inventory[m].qty <= LOW_STOCK_THRESHOLD).length;

  return (
    <div>
      <SectionTitle>Current stock</SectionTitle>
      {lowStockCount > 0 && (
        <div className="text-[0.8rem] text-red bg-danger-bg border border-danger-border rounded-md px-3 py-2 mb-3">
          {lowStockCount} model{lowStockCount > 1 ? 's are' : ' is'} at {LOW_STOCK_THRESHOLD} unit{LOW_STOCK_THRESHOLD > 1 ? 's' : ''} or below — worth reordering soon.
        </div>
      )}
      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead><tr><Th>Model</Th><Th>Stock qty</Th><Th>Cost price</Th><Th>Selling price</Th><Th>Margin/unit</Th><Th></Th></tr></thead>
        <tbody>
          {models.length === 0 && <EmptyRow colSpan={6}>No models yet — add one below.</EmptyRow>}
          {models.map((m) => {
            const item = inventory[m];
            const margin = item.sellingPrice > 0 ? item.sellingPrice - item.costPrice : null;
            const low = item.qty <= LOW_STOCK_THRESHOLD;
            return (
              <tr key={m}>
                <Td className={low ? 'text-red font-semibold' : ''}>{m}{low ? ' ⚠' : ''}</Td>
                <Td>
                  <input
                    type="number" className={inputCls} style={{ maxWidth: 90 }} value={item.qty}
                    onChange={async (e) => { await setStock(m, Number(e.target.value) || 0); toast('Stock updated'); }}
                  />
                </Td>
                <Td>
                  <input
                    type="number" className={inputCls} style={{ maxWidth: 100 }} value={item.costPrice}
                    onChange={async (e) => { await setPrices(m, Number(e.target.value) || 0, item.sellingPrice); }}
                  />
                </Td>
                <Td>
                  <input
                    type="number" className={inputCls} style={{ maxWidth: 100 }} value={item.sellingPrice}
                    onChange={async (e) => { await setPrices(m, item.costPrice, Number(e.target.value) || 0); }}
                  />
                </Td>
                <Td className={margin === null ? '' : margin >= 0 ? 'text-green' : 'text-red'}>
                  {margin === null ? '—' : money(margin)}
                </Td>
                <Td><DelButton onClick={async () => { await deleteModel(m); }} /></Td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!adding ? (
        <AddButton onClick={() => setAdding(true)}>+ Add model</AddButton>
      ) : (
        <div className="flex gap-2 items-end mb-4 flex-wrap">
          <input className={inputCls} style={{ maxWidth: 200 }} placeholder="Model name" value={newModel} onChange={(e) => setNewModel(e.target.value)} />
          <input type="number" className={inputCls} style={{ maxWidth: 110 }} placeholder="Opening qty" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
          <input type="number" className={inputCls} style={{ maxWidth: 110 }} placeholder="Cost price" value={newCost} onChange={(e) => setNewCost(e.target.value)} />
          <input type="number" className={inputCls} style={{ maxWidth: 110 }} placeholder="Selling price" value={newSelling} onChange={(e) => setNewSelling(e.target.value)} />
          <button onClick={handleAdd} className="bg-accent text-white px-4 py-1.5 rounded-md text-[0.85rem] font-semibold">Add</button>
          <button onClick={() => setAdding(false)} className="text-muted text-[0.82rem] underline">Cancel</button>
        </div>
      )}
      <Note>Cost and selling prices update automatically whenever you record a Purchase — edit them here only to correct a mistake.</Note>
    </div>
  );
}
