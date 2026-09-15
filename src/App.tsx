import { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { Toast } from './components/ui';
import { supabaseConfigured } from './lib/supabase';
import { todayStr } from './lib/format';
import LedgerTab from './components/LedgerTab';
import InventoryTab from './components/InventoryTab';
import ReportsTab from './components/ReportsTab';
import PurchasesTab from './components/PurchasesTab';
import IncomeTab from './components/IncomeTab';
import ReturnsTab from './components/ReturnsTab';
import ReceivablesPayablesTab from './components/ReceivablesPayablesTab';

type TabId = 'ledger' | 'purchases' | 'income' | 'returns' | 'receivables' | 'inventory' | 'reports';

const TABS: { id: TabId; label: string }[] = [
  { id: 'ledger', label: 'Ledger' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'income', label: 'Income' },
  { id: 'returns', label: 'Returns' },
  { id: 'receivables', label: 'Receivables & Payables' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'reports', label: 'Reports' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('ledger');
  const [ledgerDate, setLedgerDate] = useState(todayStr());

  const openDateInLedger = (date: string) => {
    setLedgerDate(date);
    setTab('ledger');
  };

  return (
    <InventoryProvider>
      <div className="min-h-screen bg-[#efeae0] p-4 font-serif text-ink">
        <div className="max-w-[960px] mx-auto bg-paper border border-[#d8d2c2] rounded-md shadow p-5 sm:p-6">
          <h1 className="text-[1.4rem] font-bold mb-0.5 tracking-wide">Stirling Mini Ledger</h1>
          <div className="text-muted text-[0.82rem] mb-4">
            Sales, purchases, expenses, income, returns &amp; stock — all in one place
          </div>

          {!supabaseConfigured && (
            <div className="bg-[#fceeec] border border-[#e3b8b0] text-red text-[0.8rem] rounded p-3 mb-4">
              Supabase isn't configured — add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to
              your <code>.env</code> file (locally) or your Netlify site's environment variables (in production), then
              redeploy.
            </div>
          )}

          <div className="flex gap-1 border-b-2 border-ink mb-4 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-[0.88rem] font-bold rounded-t-md -mb-0.5 ${
                  tab === t.id
                    ? 'text-ink bg-[#f4efe2] border border-[#d8d2c2] border-b-2 border-b-paper'
                    : 'text-muted border border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'ledger' && <LedgerTab date={ledgerDate} onDateChange={setLedgerDate} />}
          {tab === 'purchases' && <PurchasesTab />}
          {tab === 'income' && <IncomeTab />}
          {tab === 'returns' && <ReturnsTab />}
          {tab === 'receivables' && <ReceivablesPayablesTab />}
          {tab === 'inventory' && <InventoryTab />}
          {tab === 'reports' && <ReportsTab onOpenDate={openDateInLedger} />}
        </div>
      </div>
      <Toast />
    </InventoryProvider>
  );
}
