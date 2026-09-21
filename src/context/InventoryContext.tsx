import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getInventory, setInventory as persistInventory } from '../lib/db';
import type { Inventory, InventoryItem } from '../lib/types';

const DEFAULT_INVENTORY: Inventory = {
  'HP 840 G7': { qty: 7, costPrice: 0, sellingPrice: 0 },
  'HP 820 G2': { qty: 2, costPrice: 0, sellingPrice: 0 },
  'HP 840 G5': { qty: 1, costPrice: 0, sellingPrice: 0 },
  'HP 440': { qty: 1, costPrice: 0, sellingPrice: 0 },
  'HP ZBook': { qty: 1, costPrice: 0, sellingPrice: 0 },
  'HP Folio G1': { qty: 1, costPrice: 0, sellingPrice: 0 },
  'Dell Latitude E3300': { qty: 4, costPrice: 0, sellingPrice: 0 },
  'Dell Latitude 3380': { qty: 2, costPrice: 0, sellingPrice: 0 },
  'Dell Latitude 3340': { qty: 2, costPrice: 0, sellingPrice: 0 },
  'Lenovo T470': { qty: 2, costPrice: 0, sellingPrice: 0 },
  'Lenovo Yoga': { qty: 0, costPrice: 0, sellingPrice: 0 },
};

type Ctx = {
  inventory: Inventory;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Apply one or more qty +/- adjustments atomically, leaving prices untouched. */
  applyStockDeltas: (deltas: Record<string, number>) => Promise<void>;
  setStock: (model: string, qty: number) => Promise<void>;
  setPrices: (model: string, costPrice: number, sellingPrice: number) => Promise<void>;
  addModel: (model: string, qty: number, costPrice?: number, sellingPrice?: number) => Promise<void>;
  deleteModel: (model: string) => Promise<void>;
  /** Record a purchase's effect on stock: adds qty, rolls the cost into a weighted average, updates selling price if given. */
  recordPurchase: (model: string, qtyAdded: number, landedCostPerUnit: number, sellingPrice?: number) => Promise<void>;
  /** Record a return's effect on stock: sale returns add qty back, purchase returns remove qty. Prices untouched. */
  recordReturn: (model: string, qtyDelta: number) => Promise<void>;
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

  const getItem = (model: string): InventoryItem => inventory[model] ?? { qty: 0, costPrice: 0, sellingPrice: 0 };

  const applyStockDeltas = async (deltas: Record<string, number>) => {
    const next = { ...inventory };
    Object.entries(deltas).forEach(([model, delta]) => {
      if (!model) return;
      const item = next[model] ?? { qty: 0, costPrice: 0, sellingPrice: 0 };
      next[model] = { ...item, qty: item.qty + delta };
    });
    await persist(next);
  };

  const setStock = async (model: string, qty: number) => {
    await persist({ ...inventory, [model]: { ...getItem(model), qty } });
  };

  const setPrices = async (model: string, costPrice: number, sellingPrice: number) => {
    await persist({ ...inventory, [model]: { ...getItem(model), costPrice, sellingPrice } });
  };

  const addModel = async (model: string, qty: number, costPrice = 0, sellingPrice = 0) => {
    await persist({ ...inventory, [model]: { qty, costPrice, sellingPrice } });
  };

  const deleteModel = async (model: string) => {
    const next = { ...inventory };
    delete next[model];
    await persist(next);
  };

  const recordPurchase = async (model: string, qtyAdded: number, landedCostPerUnit: number, sellingPrice?: number) => {
    const existing = getItem(model);
    const totalQty = existing.qty + qtyAdded;
    const weightedCost = totalQty > 0
      ? (existing.qty * existing.costPrice + qtyAdded * landedCostPerUnit) / totalQty
      : landedCostPerUnit;
    const next: InventoryItem = {
      qty: totalQty,
      costPrice: weightedCost,
      sellingPrice: sellingPrice !== undefined && sellingPrice > 0 ? sellingPrice : existing.sellingPrice,
    };
    await persist({ ...inventory, [model]: next });
  };

  const recordReturn = async (model: string, qtyDelta: number) => {
    await applyStockDeltas({ [model]: qtyDelta });
  };

  return (
    <InventoryCtx.Provider
      value={{ inventory, loading, refresh, applyStockDeltas, setStock, setPrices, addModel, deleteModel, recordPurchase, recordReturn }}
    >
      {children}
    </InventoryCtx.Provider>
  );
}

export function useInventory(): Ctx {
  const ctx = useContext(InventoryCtx);
  if (!ctx) throw new Error('useInventory must be used within an InventoryProvider');
  return ctx;
}
