# Stirling Mini Ledger

A small business ledger — sales, purchases, expenses, income, returns, stock
and receivables/payables — backed by Supabase, built with Vite + React + TypeScript + Tailwind.

## What's the same as before, and what's new

**Unchanged** (same fields, same calculations, same behavior):
- **Ledger** tab — daily Sales + Expenditure, Brought Forward, Balance, Save day
- **Inventory** tab — live stock per model
- **Reports** tab — date-range totals, units sold by model, day-by-day history

**New:**
- **Purchases** — stock bought in, cash or on credit to a vendor. Adds straight to Inventory.
- **Income** — income that isn't a stock sale (e.g. a repair service, rent received).
- **Returns** — a customer return (stock comes back in) or a return to a vendor (stock goes back out).
- **Receivables & Payables** — one view of everything still owed to you (unpaid/partial sales +
  income) and everything you still owe (unpaid expenditure + purchases), with a "record payment"
  action on each line.

## What's new in this version

Redesigned to feel like Monarch Money — a sidebar, a Dashboard as the landing screen, and one
clean color system throughout, replacing the earlier cream "paper ledger" look and the crowded
top tab row.

**Dashboard** (new, and now the first thing you see): cash in hand, net profit, a full profit
breakdown (revenue → COGS → gross profit → other income/expenses → net profit), top-selling
models, and a low-stock list — profit monitoring and sales control in one place.

**Purchases**, rebuilt: you now enter **buying price**, **selling price**, and a **transport**
cost per purchase. Transport is spread across the units bought to get a true landed cost per
unit, which is what profit is measured against — not just the sticker buying price. Saving a
purchase updates the model's stock, its running average cost, and its suggested selling price.

**Inventory**, extended: shows cost price, selling price and per-unit margin for every model,
plus a low-stock warning banner. Selling price now auto-fills when you add a sale in the Ledger
tab, so pricing stays consistent without having to remember it.

**Unchanged in substance:** Ledger (daily sales/expenditure), Reports, and the Income/
Returns/Receivables & Payables tabs added earlier — same data, same behavior, restyled to match.

If you already have this project's tables set up, just re-run `supabase/schema.sql` — it adds
the new `cost_price`/`selling_price`/`transport` columns without touching existing rows.



```bash
npm install
```

Create a `.env` file in the project root (there's already a `.env.example` to copy):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Run the database setup once, in Supabase → SQL Editor → paste `supabase/schema.sql` → Run.
(Safe to re-run — it uses `create table if not exists`.)

```bash
npm run dev      # local dev server
npm run build    # production build → outputs to dist/
```

## Deploying on Netlify

1. Connect this GitHub repo to Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Site configuration → Environment variables → add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

`.env` is gitignored on purpose — your keys live in Netlify's environment variables for the
deployed site, and in your local `.env` for development. Nothing sensitive gets committed.

## Security note

The SQL setup makes every table publicly readable/writable by anyone holding your Supabase URL
and anon key (there's no login). That's fine for a private tool with a link only you use. Add
Supabase Auth + narrower row-level-security policies before treating this as protected against
others editing your data.

## Project structure

```
src/
  lib/
    supabase.ts     # Supabase client (reads Vite env vars)
    types.ts         # shared TypeScript types
    db.ts             # every read/write to Supabase lives here
    format.ts        # money/date/id helpers
    toast.ts          # tiny toast notification utility
  context/
    InventoryContext.tsx  # shared stock state + every stock mutation
  components/
    ui.tsx                    # shared presentational pieces (paper-ledger styling)
    LedgerTab.tsx              # unchanged
    InventoryTab.tsx           # unchanged
    ReportsTab.tsx             # unchanged
    PurchasesTab.tsx           # new
    IncomeTab.tsx               # new
    ReturnsTab.tsx               # new
    ReceivablesPayablesTab.tsx    # new
  App.tsx    # tab navigation + layout
supabase/
  schema.sql   # full database setup (existing + new tables, RLS policies)
```
