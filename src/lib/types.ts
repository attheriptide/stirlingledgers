// ---- Ledger (unchanged) ----
export type SaleRow = {
  customer: string;
  model: string;
  ref: string;
  price: number;
  paid: number;
};

export type ExpRow = {
  desc: string;
  amount: number;
  paid: boolean;
};

export type DayEntry = {
  bf: number;
  sales: SaleRow[];
  expenditures: ExpRow[];
  committed: Record<string, number> | null;
};

// ---- Inventory: now price-aware, so profit can actually be calculated ----
export type InventoryItem = {
  qty: number;
  costPrice: number;     // current average buying price per unit
  sellingPrice: number;  // suggested selling price per unit — auto-fills new sales
};
export type Inventory = Record<string, InventoryItem>;

// ---- Purchases: buying price, selling price and transport all captured ----
export type Purchase = {
  id: string;
  date: string;
  vendor: string;
  model: string;
  qty: number;
  buyingPrice: number;   // cost per unit, excluding transport
  sellingPrice: number;  // intended selling price per unit (updates the model's suggested price)
  transport: number;     // total transport/freight for this purchase (not per unit)
  cost: number;          // total landed cost = qty * buyingPrice + transport
  paid: number;          // amount paid to the vendor now; cost - paid = payable owed to them
  notes: string;
};

// ---- Income (unchanged) ----
export type IncomeEntry = {
  id: string;
  date: string;
  source: string;
  amount: number;
  received: number;
  notes: string;
};

// ---- Returns (unchanged) ----
export type ReturnKind = 'sale_return' | 'purchase_return';
export type ReturnEntry = {
  id: string;
  date: string;
  kind: ReturnKind;
  party: string;
  model: string;
  qty: number;
  amount: number;
  notes: string;
};

// ---- Computed views ----
export type Receivable = {
  source: 'sale' | 'income';
  date: string;
  party: string;
  detail: string;
  total: number;
  received: number;
  outstanding: number;
  refId?: string;
  saleIndex?: number;
};

export type Payable = {
  source: 'expenditure' | 'purchase';
  date: string;
  party: string;
  detail: string;
  total: number;
  paid: number;
  outstanding: number;
  refId?: string;
};

// ---- Profit summary, computed across everything ----
export type ProfitSummary = {
  revenue: number;
  salesReturns: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  otherIncome: number;
  expenses: number;
  netProfit: number;
  cashInHand: number;
};
