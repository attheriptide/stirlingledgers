import { useEffect, useState } from 'react';
import { listAllDays, listPurchases, listIncomes, listReturns } from '../lib/db';
import { computeCashBalance } from '../lib/cash';
import { useInventory } from '../context/InventoryContext';
import { money } from '../lib/format';
import { SectionTitle, SummaryGrid, SummaryItem, EmptyRow, Th, Td } from './ui';

const LOW_STOCK_THRESHOLD = 2;

type State = {
  cashInHand: number;
  revenue: number;
  salesReturns: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  otherIncome: number;
  expenses: number;
  netProfit: number;
  totalReceivable: number;
  totalPayable: number;
  topModels: [string, number][];
};

export default function DashboardTab({ onOpenTab }: { onOpenTab: (tab: 'receivables' | 'inventory') => void }) {
  const { inventory } = useInventory();
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    (async () => {
      const days = await listAllDays();
      const purchases = await listPurchases();
      const incomes = await listIncomes();
      const returns = await listReturns();

      let revenue = 0, expenses = 0;
      const unitsByModel: Record<string, number> = {};
      const sortedByDate = days.slice().sort((a, b) => a.date.localeCompare(b.date));

      sortedByDate.forEach(({ day }) => {
        const dayExp = day.expenditures.filter((r) => r.paid).reduce((s, r) => s + (Number(r.amount) || 0), 0);
        revenue += day.sales.reduce((s, r) => s + (Number(r.price) || 0), 0);
        expenses += dayExp;
        day.sales.forEach((r) => { if (r.model) unitsByModel[r.model] = (unitsByModel[r.model] || 0) + 1; });
      });

      // The one true cash figure — Ledger sales/expenditure, Income received,
      // Purchases paid and Returns, all rolled together. Same function the
      // Ledger tab uses for its own Brought Forward, so the two can never disagree.
      const cashInHand = await computeCashBalance();

      const cogs = Object.entries(unitsByModel).reduce((s, [model, qty]) => {
        const cost = inventory[model]?.costPrice ?? 0;
        return s + qty * cost;
      }, 0);


      const salesReturns = returns.filter((r) => r.kind === 'sale_return').reduce((s, r) => s + r.amount, 0);
      const netRevenue = revenue - salesReturns;
      const grossProfit = netRevenue - cogs;
      const otherIncome = incomes.reduce((s, i) => s + i.amount, 0);
      const netProfit = grossProfit + otherIncome - expenses;

      const salesReceivable = days.reduce((s, { day }) =>
        s + day.sales.reduce((s2, r) => s2 + Math.max(0, (r.price || 0) - (r.paid || 0)), 0), 0);
      const incomeReceivable = incomes.reduce((s, i) => s + Math.max(0, i.amount - i.received), 0);
      const expPayable = days.reduce((s, { day }) =>
        s + day.expenditures.filter((r) => !r.paid).reduce((s2, r) => s2 + r.amount, 0), 0);
      const purchasePayable = purchases.reduce((s, p) => s + Math.max(0, p.cost - p.paid), 0);

      const topModels = Object.entries(unitsByModel).sort((a, b) => b[1] - a[1]).slice(0, 5);

      setState({
        cashInHand, revenue, salesReturns, netRevenue, cogs, grossProfit,
        otherIncome, expenses, netProfit,
        totalReceivable: salesReceivable + incomeReceivable,
        totalPayable: expPayable + purchasePayable,
        topModels,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory]);

  const lowStock = Object.entries(inventory).filter(([, item]) => item.qty <= LOW_STOCK_THRESHOLD);

  if (!state) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <SummaryGrid>
        <SummaryItem label="Cash in hand" value={money(state.cashInHand)} tone={state.cashInHand < 0 ? 'negative' : 'balance'} />
        <SummaryItem label="Net profit (all time)" value={money(state.netProfit)} tone={state.netProfit < 0 ? 'negative' : 'balance'} />
        <SummaryItem label="Receivable (owed to you)" value={money(state.totalReceivable)} />
        <SummaryItem label="Payable (you owe)" value={money(state.totalPayable)} tone={state.totalPayable > 0 ? 'negative' : 'default'} />
      </SummaryGrid>

      <SectionTitle>Profit breakdown</SectionTitle>
      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <tbody>
          <tr><Td>Sales revenue</Td><Td className="text-right">{money(state.revenue)}</Td></tr>
          <tr><Td>Sales returns</Td><Td className="text-right text-red">-{money(state.salesReturns)}</Td></tr>
          <tr><Td>Net revenue</Td><Td className="text-right">{money(state.netRevenue)}</Td></tr>
          <tr><Td>Cost of goods sold</Td><Td className="text-right text-red">-{money(state.cogs)}</Td></tr>
          <tr><Td className="font-semibold">Gross profit</Td><Td className="text-right font-semibold">{money(state.grossProfit)}</Td></tr>
          <tr><Td>Other income</Td><Td className="text-right text-green">+{money(state.otherIncome)}</Td></tr>
          <tr><Td>Expenses</Td><Td className="text-right text-red">-{money(state.expenses)}</Td></tr>
          <tr><Td className="font-bold">Net profit</Td><Td className={`text-right font-bold ${state.netProfit < 0 ? 'text-red' : 'text-green'}`}>{money(state.netProfit)}</Td></tr>
        </tbody>
      </table>
      <div className="text-[0.72rem] text-muted mb-4">
        Cost of goods sold uses each model's current average cost price — good enough for day-to-day tracking, though not a strict historical FIFO figure.
      </div>

      <SectionTitle>Sales control</SectionTitle>
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div>
          <div className="text-[0.72rem] text-muted uppercase mb-1.5">Top selling models</div>
          <table className="w-full border-collapse text-[0.85rem]">
            <thead><tr><Th>Model</Th><Th>Units sold</Th></tr></thead>
            <tbody>
              {state.topModels.length === 0 && <EmptyRow colSpan={2}>No sales recorded yet.</EmptyRow>}
              {state.topModels.map(([m, q]) => <tr key={m}><Td>{m}</Td><Td>{q}</Td></tr>)}
            </tbody>
          </table>
        </div>
        <div>
          <div className="text-[0.72rem] text-muted uppercase mb-1.5">Low stock</div>
          <table className="w-full border-collapse text-[0.85rem]">
            <thead><tr><Th>Model</Th><Th>Qty</Th></tr></thead>
            <tbody>
              {lowStock.length === 0 && <EmptyRow colSpan={2}>Everything is well stocked.</EmptyRow>}
              {lowStock.map(([m, item]) => (
                <tr key={m} onClick={() => onOpenTab('inventory')} className="cursor-pointer hover:bg-highlight">
                  <Td className="text-red font-semibold">{m}</Td><Td className="text-red font-semibold">{item.qty}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
