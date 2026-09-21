// Single source of truth for "how much cash does the business actually have".
// Every tab that shows a balance (Ledger's Brought Forward, the Dashboard's
// Cash in hand) calls through here instead of computing its own version —
// that duplication is exactly what caused Income and Purchases to be
// invisible to the Ledger's balance before.
import { listAllDays, listPurchases, listIncomes, listReturns } from './db';

type Options = {
  /** Only include transactions dated strictly before this date (used for a day's opening balance). */
  before?: string;
  /** Only include transactions dated on or before this date (used for "balance as of end of day X"). */
  upTo?: string;
};

export async function computeCashBalance(opts: Options = {}): Promise<number> {
  const { before, upTo } = opts;
  const include = (d: string) => {
    if (before !== undefined) return d < before;
    if (upTo !== undefined) return d <= upTo;
    return true; // no bound given → include everything (current total)
  };

  const [days, purchases, incomes, returns] = await Promise.all([
    listAllDays(), listPurchases(), listIncomes(), listReturns(),
  ]);

  let balance = 0;

  days.filter(({ date }) => include(date)).forEach(({ day }) => {
    balance += day.sales.reduce((s, r) => s + (Number(r.paid) || 0), 0);
    balance -= day.expenditures.filter((r) => r.paid).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  });

  incomes.filter((i) => include(i.date)).forEach((i) => {
    balance += Number(i.received) || 0;
  });

  purchases.filter((p) => include(p.date)).forEach((p) => {
    balance -= Number(p.paid) || 0;
  });

  returns.filter((r) => include(r.date)).forEach((r) => {
    // A customer return pays cash back out; a return to a vendor gets cash back in.
    balance += r.kind === 'sale_return' ? -(Number(r.amount) || 0) : (Number(r.amount) || 0);
  });

  return balance;
}
