import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getInventory, setInventory as persistInventory } from '../lib/db';
import type { Inventory } from '../lib/types';

const DEFAULT_INVENTORY: Inventory = {
  'HP 840 G7': 7, 'HP 820 G2': 2, 'HP 840 G5': 1, 'HP 440': 1, 'HP ZBook': 1,
  'HP Folio G1': 1, 'Dell Latitude E3300': 4, 'Dell Latitude 3380': 2,
  'Dell Latitude 3340': 2, 'Lenovo T470': 2, 'Lenovo Yoga': 0,
};

type Ctx = {
  inventory: Inventory;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Apply one or more +/- adjustments atomically (e.g. undo a day's old sales, apply new ones, in one write). */
  applyStockDeltas: (deltas: Record<string, number>) => Promise<void>;
  setStock: (model: string, qty: number) => Promise<void>;
  addModel: (model: string, qty: number) => Promise<void>;
  deleteModel: (model: string) => Promise<void>;
};

const InventoryCtx = createContext<Ctx | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventoryState] = useState<Inventory>({});
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const inv = await getInventory();
    setInventoryState(inv ?? DEFAULT_INVENTORY);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, []);

  const persist = async (next: Inventory) => {
    setInventoryState(next);
    await persistInventory(next);
  };

  const applyStockDeltas = async (deltas: Record<string, number>) => {
    const next = { ...inventory };
    Object.entries(deltas).forEach(([model, delta]) => {
      if (!model) return;
      next[model] = (next[model] || 0) + delta;
    });
    await persist(next);
  };

  const setStock = async (model: string, qty: number) => {
    await persist({ ...inventory, [model]: qty });
  };

  const addModel = async (model: string, qty: number) => {
    await persist({ ...inventory, [model]: qty });
  };

  const deleteModel = async (model: string) => {
    const next = { ...inventory };
    delete next[model];
    await persist(next);
  };

  return (
    <InventoryCtx.Provider value={{ inventory, loading, refresh, applyStockDeltas, setStock, addModel, deleteModel }}>
      {children}
    </InventoryCtx.Provider>
  );
}

export function useInventory(): Ctx {
  const ctx = useContext(InventoryCtx);
  if (!ctx) throw new Error('useInventory must be used within an InventoryProvider');
  return ctx;
}
