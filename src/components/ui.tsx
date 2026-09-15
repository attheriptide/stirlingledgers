import { useEffect, useState, type ReactNode } from 'react';
import { registerToastListener } from '../lib/toast';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-paper border border-[#d8d2c2] rounded-md shadow-sm p-5 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="font-bold text-[0.95rem] mt-5 mb-2 pb-1 border-b border-rule text-ink">
      {children}
    </div>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="bg-transparent border border-dashed border-[#a9a290] text-ink px-3 py-1.5 rounded text-[0.82rem] mb-4 hover:bg-[#f4efe2]"
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
      className="bg-ink text-white border-none px-5 py-2 rounded font-bold text-[0.9rem] hover:opacity-90 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function DelButton({ onClick, title = 'Remove' }: { onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} className="bg-transparent border-none text-red cursor-pointer text-base leading-none px-1">
      ✕
    </button>
  );
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-[130px] ${className}`}>
      <label className="text-[0.78rem] text-muted block mb-1 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export const inputCls =
  'font-serif text-[0.92rem] px-2 py-1.5 border border-[#c8c2b2] rounded bg-[#fffdf7] text-ink w-full';

export function SummaryGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-2.5 mt-3.5 bg-[#f4efe2] p-3.5 rounded-md border border-[#e0d9c6]"
         style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
      {children}
    </div>
  );
}

export function SummaryItem({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'balance' | 'negative' }) {
  const toneCls = tone === 'balance' ? 'text-green' : tone === 'negative' ? 'text-red' : 'text-ink';
  return (
    <div>
      <div className="text-[0.72rem] text-muted uppercase">{label}</div>
      <div className={`text-[1.15rem] font-bold ${toneCls}`}>{value}</div>
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-muted italic text-[0.85rem] py-2.5">{children}</td>
    </tr>
  );
}

export function Th({ children }: { children?: ReactNode }) {
  return (
    <th className="bg-[#e9e3d3] text-left px-2 py-1.5 text-[0.75rem] uppercase tracking-wide text-muted border-b border-rule">
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-1.5 py-1 border-b border-[#eee3e3] ${className}`}>{children}</td>;
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
