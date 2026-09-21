import { useEffect, useState, type ReactNode } from 'react';
import { registerToastListener } from '../lib/toast';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-paper border border-rule rounded-xl shadow-sm p-5 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="font-semibold text-[0.95rem] mt-5 mb-2 pb-1 border-b border-rule text-ink">
      {children}
    </div>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="bg-transparent border border-dashed border-rule text-accent px-3 py-1.5 rounded-md text-[0.82rem] font-medium mb-4 hover:bg-highlight"
    >
      {children}
    </button>
  );
}

export function SaveButton({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-accent text-white border-none px-5 py-2 rounded-md font-semibold text-[0.9rem] hover:opacity-90 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function DelButton({ onClick, title = 'Remove' }: { onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} className="bg-transparent border-none text-muted hover:text-red cursor-pointer text-base leading-none px-1">
      ✕
    </button>
  );
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-[130px] ${className}`}>
      <label className="text-[0.7rem] text-muted block mb-1 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export const inputCls =
  'text-[0.88rem] px-2.5 py-1.5 border border-rule rounded-md bg-white text-ink w-full focus:outline-none focus:border-accent';

export function SummaryGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 mt-3.5 bg-highlight p-4 rounded-xl border border-highlight-border"
         style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
      {children}
    </div>
  );
}

export function SummaryItem({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'balance' | 'negative' }) {
  const toneCls = tone === 'balance' ? 'text-green' : tone === 'negative' ? 'text-red' : 'text-ink';
  return (
    <div>
      <div className="text-[0.7rem] text-muted uppercase tracking-wide">{label}</div>
      <div className={`text-[1.3rem] font-bold ${toneCls}`}>{value}</div>
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-muted italic text-[0.85rem] py-3">{children}</td>
    </tr>
  );
}

export function Th({ children }: { children?: ReactNode }) {
  return (
    <th className="bg-highlight text-left px-2.5 py-2 text-[0.72rem] uppercase tracking-wide text-muted border-b border-rule">
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-2 py-1.5 border-b border-rule ${className}`}>{children}</td>;
}

export function Note({ children }: { children: ReactNode }) {
  return <div className="text-[0.75rem] text-muted mt-1">{children}</div>;
}

export function Toast() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    registerToastListener((m) => {
      setMsg(m);
      setShow(true);
      const t = setTimeout(() => setShow(false), 2200);
      return () => clearTimeout(t);
    });
    return () => registerToastListener(null);
  }, []);

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 bg-ink text-white px-4 py-2 rounded-full text-[0.82rem] pointer-events-none transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {msg}
    </div>
  );
}
