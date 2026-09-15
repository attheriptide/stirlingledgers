import { useEffect, useState } from 'react';
import { listAllDays, setDay, listPurchases, updatePurchasePaid, listIncomes, updateIncomeReceived } from '../lib/db';
import { money } from '../lib/format';
import { toast } from '../lib/toast';
import type { Receivable, Payable } from '../lib/types';
import { SectionTitle, SummaryGrid, SummaryItem, EmptyRow, Th, Td, Note } from './ui';

export default function ReceivablesPayablesTab() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const days = await listAllDays();
    const purchases = await listPurchases();
    const incomes = await listIncomes();

    const rec: Receivable[] = [];
    const pay: Payable[] = [];

    days.forEach(({ date, day }) => {
      day.sales.forEach((r, i) => {
        const outstanding = (Number(r.price) || 0) - (Number(r.paid) || 0);
        if (outstanding > 0) {
          rec.push({
            source: 'sale', date, party: r.customer || '—', detail: r.model || '—',
            total: r.price, received: r.paid, outstanding, saleIndex: i,
          });
        }
      });
      day.expenditures.forEach((r) => {
        if (!r.paid && r.amount > 0) {
          pay.push({ source: 'expenditure', date, party: r.desc || '—', detail: 'Expenditure', total: r.amount, paid: 0, outstanding: r.amount });
        }
      });
    });

    incomes.forEach((e) => {
      const outstanding = e.amount - e.received;
      if (outstanding > 0) {
        rec.push({ source: 'income', date: e.date, party: e.source, detail: 'Other income', total: e.amount, received: e.received, outstanding, refId: e.id });
      }
    });

    purchases.forEach((p) => {
      const outstanding = p.cost - p.paid;
      if (outstanding > 0) {
        pay.push({ source: 'purchase', date: p.date, party: p.vendor || '—', detail: p.model, total: p.cost, paid: p.paid, outstanding, refId: p.id });
      }
    });

    rec.sort((a, b) => b.date.localeCompare(a.date));
    pay.sort((a, b) => b.date.localeCompare(a.date));
    setReceivables(rec);
    setPayables(pay);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const collectSalePayment = async (r: Receivable) => {
    if (r.saleIndex === undefined) return;
    const input = prompt(`Amount collected now (owing ${money(r.outstanding)}):`, String(r.outstanding));
    if (input === null) return;
    const extra = Number(input) || 0;
    if (extra <= 0) return;
    const days = await listAllDays();
    const match = days.find((d) => d.date === r.date);
    if (!match) return;
    const sales = match.day.sales.slice();
    const row = sales[r.saleIndex];
    if (!row) return;
    sales[r.saleIndex] = { ...row, paid: Math.min(row.price, (Number(row.paid) || 0) + extra) };
    const ok = await setDay(r.date, { ...match.day, sales });
    if (ok) { toast('Payment recorded'); refresh(); } else { toast('Could not update'); }
  };

  const collectIncomePayment = async (r: Receivable) => {
    if (!r.refId) return;
    const input = prompt(`Amount received now (owing ${money(r.outstanding)}):`, String(r.outstanding));
    if (input === null) return;
    const extra = Number(input) || 0;
    if (extra <= 0) return;
    const newReceived = Math.min(r.total, r.received + extra);
    const ok = await updateIncomeReceived(r.refId, newReceived);
    if (ok) { toast('Payment recorded'); refresh(); } else { toast('Could not update'); }
  };

  const settleExpenditure = async (p: Payable) => {
    const days = await listAllDays();
    const match = days.find((d) => d.date === p.date);
    if (!match) return;
    const expenditures = match.day.expenditures.map((r) =>
      r.desc === p.party && !r.paid && r.amount === p.total ? { ...r, paid: true } : r
    );
    const ok = await setDay(p.date, { ...match.day, expenditures });
    if (ok) { toast('Marked as paid'); refresh(); } else { toast('Could not update'); }
  };

  const payPurchase = async (p: Payable) => {
    if (!p.refId) return;
    const input = prompt(`Amount to pay now (owing ${money(p.outstanding)}):`, String(p.outstanding));
    if (input === null) return;
    const extra = Number(input) || 0;
    if (extra <= 0) return;
    const newPaid = Math.min(p.total, p.paid + extra);
    const ok = await updatePurchasePaid(p.refId, newPaid);
    if (ok) { toast('Payment recorded'); refresh(); } else { toast('Could not update'); }
  };

  const totalReceivable = receivables.reduce((s, r) => s + r.outstanding, 0);
  const totalPayable = payables.reduce((s, p) => s + p.outstanding, 0);

  return (
    <div>
      <SummaryGrid>
        <SummaryItem label="Total receivable (owed to you)" value={money(totalReceivable)} tone="balance" />
        <SummaryItem label="Total payable (you owe)" value={money(totalPayable)} tone={totalPayable > 0 ? 'negative' : 'default'} />
      </SummaryGrid>

      <SectionTitle>Receivables — owed to you</SectionTitle>
      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead><tr><Th>Date</Th><Th>From</Th><Th>Detail</Th><Th>Total</Th><Th>Received</Th><Th>Outstanding</Th><Th></Th></tr></thead>
        <tbody>
          {!loading && receivables.length === 0 && <EmptyRow colSpan={7}>Nothing outstanding — all sales and income are fully collected.</EmptyRow>}
          {receivables.map((r, i) => (
            <tr key={i}>
              <Td>{r.date}</Td>
              <Td>{r.party}</Td>
              <Td>{r.detail}{r.source === 'income' ? ' (income)' : ''}</Td>
              <Td>{money(r.total)}</Td>
              <Td>{money(r.received)}</Td>
              <Td className="text-red font-bold">{money(r.outstanding)}</Td>
              <Td>
                <button
                  onClick={() => (r.source === 'sale' ? collectSalePayment(r) : collectIncomePayment(r))}
                  className="text-[0.78rem] underline text-ink"
                >
                  Record payment
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionTitle>Payables — you owe</SectionTitle>
      <table className="w-full border-collapse mb-2.5 text-[0.88rem]">
        <thead><tr><Th>Date</Th><Th>To</Th><Th>Detail</Th><Th>Total</Th><Th>Paid</Th><Th>Outstanding</Th><Th></Th></tr></thead>
        <tbody>
          {!loading && payables.length === 0 && <EmptyRow colSpan={7}>Nothing outstanding — all expenditure and purchases are settled.</EmptyRow>}
          {payables.map((p, i) => (
            <tr key={i}>
              <Td>{p.date}</Td>
              <Td>{p.party}</Td>
              <Td>{p.detail}</Td>
              <Td>{money(p.total)}</Td>
              <Td>{money(p.paid)}</Td>
              <Td className="text-red font-bold">{money(p.outstanding)}</Td>
              <Td>
                <button
                  onClick={() => (p.source === 'purchase' ? payPurchase(p) : settleExpenditure(p))}
                  className="text-[0.78rem] underline text-ink"
                >
                  {p.source === 'purchase' ? 'Record payment' : 'Mark paid'}
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>This tab reads Sales and Expenditure from the Ledger, plus Purchases and Income — nothing here is entered directly.</Note>
    </div>
  );
}
