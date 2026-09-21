import { useState, type ReactElement } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { Card, Toast } from './components/ui';
import { supabaseConfigured } from './lib/supabase';
import { todayStr } from './lib/format';
import DashboardTab from './components/DashboardTab';
import LedgerTab from './components/LedgerTab';
import InventoryTab from './components/InventoryTab';
import ReportsTab from './components/ReportsTab';
import PurchasesTab from './components/PurchasesTab';
import IncomeTab from './components/IncomeTab';
import ReturnsTab from './components/ReturnsTab';
import ReceivablesPayablesTab from './components/ReceivablesPayablesTab';

type TabId = 'dashboard' | 'ledger' | 'purchases' | 'income' | 'returns' | 'receivables' | 'inventory' | 'reports';

const NAV: { id: TabId; label: string; icon: ReactElement }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" /> },
  { id: 'ledger', label: 'Ledger', icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 14h4" /></> },
  { id: 'purchases', label: 'Purchases', icon: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></> },
  { id: 'income', label: 'Income', icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 10h4.5a1.5 1.5 0 010 3H9" /></> },
  { id: 'returns', label: 'Returns', icon: <path d="M3 12a9 9 0 109-9M3 12V5m0 7h7" /> },
  { id: 'receivables', label: 'Receivables & Payables', icon: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></> },
  { id: 'inventory', label: 'Inventory', icon: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><path d="M3.27 6.96L12 12l8.73-5.04M12 22.08V12" /></> },
  { id: 'reports', label: 'Reports', icon: <><rect x="3" y="10" width="4" height="10" /><rect x="10" y="4" width="4" height="16" /><rect x="17" y="14" width="4" height="6" /></> },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('dashboard');
  const [ledgerDate, setLedgerDate] = useState(todayStr());

  const openDateInLedger = (date: string) => {
    setLedgerDate(date);
    setTab('ledger');
  };

  const openTab = (t: 'receivables' | 'inventory') => setTab(t);

  const activeLabel = NAV.find((n) => n.id === tab)?.label ?? '';

  return (
    <InventoryProvider>
      <div className="min-h-screen bg-pageBg flex flex-col md:flex-row font-sans text-ink">
        {/* Sidebar */}
        <div className="w-full md:w-[220px] md:min-h-screen shrink-0 bg-paper border-b md:border-b-0 md:border-r border-rule p-3.5 flex md:flex-col">
          <div className="flex items-center gap-2 px-1.5 py-1 mb-0 md:mb-5">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <circle cx="16" cy="16" r="11" stroke="#17181c" strokeWidth="2" />
              <circle cx="24" cy="16" r="11" stroke="#ee6a30" strokeWidth="2" />
              <circle cx="20" cy="25" r="11" stroke="#17181c" strokeWidth="2" fill="none" />
            </svg>
            <div className="leading-tight">
              <div className="font-display font-bold text-[1rem]">stirling</div>
              <div className="text-[0.6rem] text-muted uppercase tracking-wide">Mini Ledger</div>
            </div>
          </div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[0.85rem] font-medium whitespace-nowrap ${
                  tab === n.id ? 'bg-accent-dim text-accent' : 'text-muted hover:bg-highlight'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
                  {n.icon}
                </svg>
                {n.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 sm:p-7 max-w-[1100px]">
          <h1 className="text-[1.3rem] font-bold mb-4 text-ink">{activeLabel}</h1>

          {!supabaseConfigured && (
            <div className="bg-danger-bg border border-danger-border text-red text-[0.8rem] rounded-md p-3 mb-4">
              Supabase isn't configured — add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to
              your <code>.env</code> file (locally) or your Netlify site's environment variables (in production), then
              redeploy.
            </div>
          )}

          <Card>
            {tab === 'dashboard' && <DashboardTab onOpenTab={openTab} />}
            {tab === 'ledger' && <LedgerTab date={ledgerDate} onDateChange={setLedgerDate} />}
            {tab === 'purchases' && <PurchasesTab />}
            {tab === 'income' && <IncomeTab />}
            {tab === 'returns' && <ReturnsTab />}
            {tab === 'receivables' && <ReceivablesPayablesTab />}
            {tab === 'inventory' && <InventoryTab />}
            {tab === 'reports' && <ReportsTab onOpenDate={openDateInLedger} />}
          </Card>
        </div>
      </div>
      <Toast />
    </InventoryProvider>
  );
}
