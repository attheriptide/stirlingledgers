import { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { toast } from '../lib/toast';
import { SectionTitle, AddButton, DelButton, EmptyRow, Th, Td, Note, inputCls } from './ui';

export default function InventoryTab() {
  const { inventory, setStock, addModel, deleteModel } = useInventory();
  const [newModel, setNewModel] = useState('');
  const [newQty, setNewQty] = useState('0');
  const [adding, setAdding] = useState(false);

  const models = Object.keys(inventory).sort();

  const handleAdd = async () => {
    const name = newModel.trim();
    if (!name) return;
    await addModel(name, Number(newQty) || 0);
    setNewModel('');
    setNewQty('0');
    setAdding(false);
    toast('Model added');
  };

  return (
    <div>
      <SectionTitle>Current stock</SectionTitle>
      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead><tr><Th>Model</Th><Th>Stock qty</Th><Th></Th></tr></thead>
        <tbody>
          {models.length === 0 && <EmptyRow colSpan={3}>No models yet — add one below.</EmptyRow>}
          {models.map((m) => (
            <tr key={m}>
              <Td>{m}</Td>
              <Td>
                <input
                  type="number"
                  className={inputCls}
                  style={{ maxWidth: 100 }}
                  value={inventory[m]}
                  onChange={async (e) => { await setStock(m, Number(e.target.value) || 0); toast('Stock updated'); }}
                />
              </Td>
              <Td><DelButton onClick={async () => { await deleteModel(m); }} /></Td>
            </tr>
          ))}
        </tbody>
      </table>

      {!adding ? (
        <AddButton onClick={() => setAdding(true)}>+ Add model</AddButton>
      ) : (
        <div className="flex gap-2 items-end mb-4 flex-wrap">
          <input className={inputCls} style={{ maxWidth: 220 }} placeholder="Model name" value={newModel} onChange={(e) => setNewModel(e.target.value)} />
          <input type="number" className={inputCls} style={{ maxWidth: 120 }} placeholder="Opening qty" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
          <button onClick={handleAdd} className="bg-ink text-white px-4 py-1.5 rounded text-[0.85rem] font-bold">Add</button>
          <button onClick={() => setAdding(false)} className="text-muted text-[0.82rem] underline">Cancel</button>
        </div>
      )}
      <Note>This shows live stock on hand. Historical open/close per day isn't stored separately — use Reports to see units sold per model on any given day.</Note>
    </div>
  );
}
