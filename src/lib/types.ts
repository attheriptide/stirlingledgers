// ---- Ledger (unchanged from the original build) ----
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

export type Inventory = Record<string, number>;

// ---- New: purchases (stock bought in, cash or on credit to a vendor) ----
export type Purchase = {
  id: string;
  date: string;
  vendor: string;
  model: string;
  qty: number;
  cost: number;
  paid: number; // amount paid to the vendor now; cost - paid = payable owed to them
  notes: string;
};

// ---- New: other income (not a stock sale) ----
export type IncomeEntry = {
  id: string;
  date: string;
  source: string;
  amount: number;
  received: number; // amount received now; amount - received = receivable owed to you
  notes: string;
};

// ---- New: returns, either side ----
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

// ---- Computed views, not stored directly ----
export type Receivable = {
  source: 'sale' | 'income';
  date: string;
  party: string;
  detail: string;
  total: number;
  received: number;
  outstanding: number;
  refId?: string; // for incomes, so a payment can be recorded against it
  saleIndex?: number; // for sales, the row's index within that day's entry
};

export type Payable = {
  source: 'expenditure' | 'purchase';
  date: string;
  party: string;
  detail: string;
  total: number;
  paid: number;
  outstanding: number;
  refId?: string; // for purchases
  expIndex?: number; // for expenditures, the row's index within that day's entry
};
