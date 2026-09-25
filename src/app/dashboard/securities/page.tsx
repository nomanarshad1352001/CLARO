"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  Download,
  Landmark,
  Plus,
  ShieldQuestion,
  Building2,
  BadgeCheck,
  RefreshCw,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { LockedState, PageHead } from "@/components/app/shell";
import { useApp, genId } from "@/lib/store";
import { fmtChf, fmtNum } from "@/lib/format";
import type { Holding } from "@/lib/types";
import { coverageStats, groupByCustodian, isinCheckDigitValid, valorFromIsin } from "@/lib/securities-engine";

export default function SecuritiesPage() {
  const router = useRouter();
  const s = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [ictaxRun, setIctaxRun] = useState(false);

  const cov = coverageStats(s.holdings);
  const groups = groupByCustodian(s.holdings);

  const runIcTax = async () => {
    setVerifying(true);
    const res = await fetch("/api/securities/ictax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isins: s.holdings.map((h) => h.isin), year: s.setup?.year ?? 2025 }),
    });
    const data = await res.json();
    type R = { isin: string; status: string; valor?: string; closing?: number; currency?: string; assetClass?: Holding["assetClass"]; source?: string };
    const map = new Map<string, R>((data.results as R[]).map((r) => [r.isin, r]));
    s.setHoldings(
      s.holdings.map((h) => {
        const r = map.get(h.isin.toUpperCase());
        if (!r || r.status !== "verified" || !r.closing) return { ...h, valor: h.valor ?? valorFromIsin(h.isin) };
        const value = Math.round(h.qty * r.closing * h.fxRate * 100) / 100;
        return {
          ...h,
          valor: r.valor ?? h.valor,
          price: r.closing,
          assetClass: r.assetClass ?? h.assetClass,
          valueChf: value,
          ictax: { value: r.closing, currency: r.currency ?? "CHF", source: r.source ?? "ICTax", verified: true },
        };
      })
    );
    useApp.getState().log("chart", `ICTax verification — ${data.verified}/${data.requested} positions matched the FTA Kursliste`);
    setIctaxRun(true);
    setVerifying(false);
  };

  const totals = s.holdings.reduce(
    (a, h) => ({
      value: a.value + h.valueChf,
      div: a.div + h.dividendGrossChf,
      ruef: a.ruef + (h.reclaimType === "RÜF" ? h.withholdingChf : 0),
      da1: a.da1 + (h.reclaimType === "DA-1" ? h.withholdingChf : 0),
    }),
    { value: 0, div: 0, ruef: 0, da1: 0 }
  );

  const alloc = [
    { label: "Swiss equities", v: s.holdings.filter((h) => h.country === "CH" && h.assetClass === "Equity").reduce((a, h) => a + h.valueChf, 0), c: "#D92E25" },
    { label: "US / foreign", v: s.holdings.filter((h) => h.country !== "CH").reduce((a, h) => a + h.valueChf, 0), c: "#34577E" },
    { label: "ETFs", v: s.holdings.filter((h) => h.assetClass === "ETF").reduce((a, h) => a + h.valueChf, 0), c: "#8F959E" },
    { label: "Funds", v: s.holdings.filter((h) => h.assetClass === "Fund").reduce((a, h) => a + h.valueChf, 0), c: "#7BA05B" },
    { label: "Bonds", v: s.holdings.filter((h) => h.assetClass === "Bond").reduce((a, h) => a + h.valueChf, 0), c: "#C4B89F" },
  ].filter((a) => a.v > 0);

  const exportCsv = () => {
    const rows = [
      ["Name", "Ticker", "ISIN", "Valor", "Custodian", "Class", "Qty", "Value CHF", "Dividends CHF", "WHT CHF", "Reclaim", "ICTax"],
      ...s.holdings.map((h) => [h.name, h.ticker, h.isin, h.valor ?? "", h.custodian, h.assetClass, h.qty, h.valueChf.toFixed(2), h.dividendGrossChf.toFixed(2), h.withholdingChf.toFixed(2), h.reclaimType, h.ictax?.verified ? "verified" : "statement"]),
    ];
    const blob = new Blob([rows.map((r) => r.join(";")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "claro-wertschriftenverzeichnis.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!s.incomeConfirmed) {
    return (
      <LockedState
        step="Income & assets"
        message="Securities are reconciled after the consolidated ledger, so dividends are counted exactly once."
        ctaHref="/dashboard/income"
        ctaLabel="Go to income & assets"
      />
    );
  }

  return (
    <div>
      <PageHead
        kicker="Step 06 · Securities"
        title={
          <>
            Your custody, <span className="display-italic gold-text">position by position</span>
          </>
        }
        sub="Parsed automatically from every custodian\u2019s e-tax statement. Dividends are grossed up for income tax, year-end values feed the wealth tax, and every reclaimable franc of withholding tax is queued for recovery."
        actions={
          <div className="flex gap-3">
            <button onClick={runIcTax} disabled={verifying} className="btn-ghost px-4 py-2.5 text-[13px] disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 text-gold ${verifying ? "animate-spin" : ""}`} />
              {verifying ? "Querying ICTax…" : "Verify with ICTax"}
            </button>
            <button onClick={exportCsv} className="btn-ghost px-4 py-2.5 text-[13px]">
              <Download className="h-4 w-4" /> CSV
            </button>
            <button onClick={() => setAddOpen(true)} className="btn-ghost px-4 py-2.5 text-[13px]">
              <Plus className="h-4 w-4 text-gold" /> Add position
            </button>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Landmark, label: "Tax value 31.12", val: fmtChf(totals.value), sub: `${s.holdings.length} positions · incl. FX at 0.89 USD`, tone: "text-ivory" },
          { icon: BadgeDollarSign, label: "Gross income", val: fmtChf(totals.div, { decimals: true }), sub: "Dividends & coupons, grossed up", tone: "text-ivory" },
          { icon: TrendingUp, label: "35% anticipatory tax", val: fmtChf(totals.ruef, { decimals: true }), sub: "Refunded via this return (RÜF)", tone: "text-ok" },
          { icon: ShieldQuestion, label: "DA-1 foreign credits", val: fmtChf(totals.da1, { decimals: true }), sub: "US 15% WHT · W-8BEN on file", tone: "text-gold-2" },
        ].map((k) => (
          <div key={k.label} className="panel p-5">
            <k.icon className="h-4 w-4 text-gold" />
            <div className={`num mt-3 text-[22px] ${k.tone}`}>{k.val}</div>
            <div className="mt-0.5 font-mono text-[9px] tracking-[0.2em] text-faint uppercase">{k.label}</div>
            <div className="mt-1.5 text-[11px] text-mist">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* recognition coverage + custodians */}
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <div className="panel p-6">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-gold" />
            <h3 className="font-display text-lg font-semibold text-ivory">Automatic recognition</h3>
          </div>
          <p className="mt-1.5 text-[11.5px] text-faint">
            Positions parsed from e-tax statements — you never type a security by hand.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { l: "Positions parsed", v: `${cov.total}` },
              { l: "Valid ISIN (ISO 6166)", v: `${cov.withIsin}/${cov.total}` },
              { l: "Valor numbers derived", v: `${cov.withValor}/${cov.total}` },
              { l: "ICTax verified", v: `${cov.withIcTax}/${cov.total}` },
            ].map((x) => (
              <div key={x.l} className="rounded-xl border border-line bg-panel-2 px-4 py-3">
                <div className="num text-[17px] text-ivory">{x.v}</div>
                <div className="mt-0.5 font-mono text-[9px] tracking-[0.16em] text-faint uppercase">{x.l}</div>
              </div>
            ))}
          </div>
          <div className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-[11.5px] leading-relaxed ${ictaxRun ? "border-ok/30 bg-ok/[0.05] text-ivory-dim" : "border-gold/30 bg-gold/[0.05] text-mist"}`}>
            <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
            {ictaxRun
              ? `Year-end values replaced with the official FTA Kursliste (ICTax) closing prices for ${cov.withIcTax} positions. Unlisted securities keep the custodian value and stay flagged.`
              : "Run the ICTax check to replace custodian prices with the Federal Tax Administration's official year-end valuations."}
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gold" />
            <h3 className="font-display text-lg font-semibold text-ivory">Banks & brokers · {groups.length}</h3>
          </div>
          <p className="mt-1.5 text-[11.5px] text-faint">Statements from several institutions consolidated into one Wertschriftenverzeichnis.</p>
          <div className="mt-4 space-y-2">
            {groups.map((g) => (
              <div key={g.custodian} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-panel-2 px-4 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold text-ivory">{g.custodian}</div>
                  <div className="num text-[10px] text-faint">{g.count} positions · {g.verified} ICTax-verified</div>
                </div>
                <div className="num shrink-0 text-right text-[12.5px] text-ivory">{fmtChf(g.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* allocation */}
      <div className="panel mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[10px] tracking-[0.22em] text-faint uppercase">Allocation by segment</span>
          <div className="flex flex-wrap gap-4">
            {alloc.map((a) => (
              <span key={a.label} className="flex items-center gap-1.5 text-[11px] text-mist">
                <span className="h-2 w-2 rounded-full" style={{ background: a.c }} />
                {a.label} · <span className="num text-ivory-dim">{Math.round((a.v / totals.value) * 100)}%</span>
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full">
          {alloc.map((a) => (
            <div key={a.label} style={{ width: `${(a.v / totals.value) * 100}%`, background: a.c }} />
          ))}
        </div>
      </div>

      {/* holdings table */}
      <div className="panel mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-line">
                {["Security", "Custodian", "Class", "Qty", "Price", "Tax value", "Dividends", "WHT", "Reclaim", ""].map((h) => (
                  <th key={h} className="px-5 py-4 font-mono text-[9.5px] font-medium tracking-[0.2em] text-faint uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.holdings.map((h) => (
                <tr key={h.id} className="group border-b border-line/60 transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div className="text-[13px] font-semibold text-ivory">{h.name}</div>
                    <div className="num flex flex-wrap items-center gap-x-2 text-[10px] text-faint">
                      <span>{h.ticker}</span>
                      <span className={isinCheckDigitValid(h.isin) ? "text-mist" : "text-alert"}>{h.isin}</span>
                      {h.valor && <span className="rounded bg-panel-3 px-1.5 py-0.5 text-[9px] text-mist">Valor {h.valor}</span>}
                      {h.ictax?.verified && (
                        <span className="inline-flex items-center gap-1 rounded bg-ok/10 px-1.5 py-0.5 text-[9px] text-ok">
                          <BadgeCheck className="h-2.5 w-2.5" /> ICTax
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[11.5px] text-mist">{h.custodian}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-line bg-white/60 px-2 py-0.5 font-mono text-[9px] tracking-widest text-mist uppercase">{h.assetClass}</span>
                  </td>
                  <td className="num px-5 py-4 text-[13px] text-ivory-dim">{fmtNum(h.qty)}</td>
                  <td className="num px-5 py-4 text-[13px] text-ivory-dim">
                    {h.currency} {fmtNum(h.price)}
                  </td>
                  <td className="num px-5 py-4 text-[13px] text-ivory">{fmtChf(h.valueChf, { decimals: true })}</td>
                  <td className="num px-5 py-4 text-[13px] text-ivory-dim">{fmtChf(h.dividendGrossChf, { decimals: true })}</td>
                  <td className="num px-5 py-4 text-[13px] text-ivory-dim">
                    {fmtChf(h.withholdingChf, { decimals: true })}
                    <span className="ml-1 text-[9.5px] text-faint">({Math.round(h.withholdingRate * 100)}%)</span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      title={h.reclaimNote}
                      className={`cursor-help rounded-full border px-2.5 py-1 font-mono text-[9.5px] tracking-widest uppercase ${
                        h.reclaimType === "RÜF"
                          ? "border-ok/40 bg-ok/10 text-ok"
                          : "border-gold/40 bg-gold/10 text-gold-2"
                      }`}
                    >
                      {h.reclaimType}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <button
                      onClick={() => s.setHoldings(s.holdings.filter((x) => x.id !== h.id))}
                      className="rounded-full p-1.5 text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-alert/10 hover:text-alert"
                      aria-label={`Remove ${h.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 bg-ink-2/50 px-5 py-4">
          <p className="text-[11px] text-faint">
            FX 31.12: USD→CHF 0.890 · EUR→CHF 0.940 · ISIN check digits validated, Valor derived for Swiss lines · hover a chip for reclaim mechanics
          </p>
          <div className="num text-[12.5px] text-ivory">
            Total income reclaim: <span className="text-ok">{fmtChf(totals.ruef + totals.da1, { decimals: true })}</span>
          </div>
        </div>
      </div>

      {/* confirm */}
      <div className={`panel mt-8 flex flex-wrap items-center justify-between gap-4 p-6 ${s.securitiesConfirmed ? "border-ok/30" : "glow-gold border-gold/35"}`}>
        <div className="flex items-center gap-4">
          <span className={`grid h-11 w-11 place-items-center rounded-full ${s.securitiesConfirmed ? "bg-ok/15" : "bg-gold/15"}`}>
            <Check className={`h-5 w-5 ${s.securitiesConfirmed ? "text-ok" : "text-gold"}`} />
          </span>
          <div>
            <p className="font-display text-lg text-ivory">
              {s.securitiesConfirmed ? "Positions confirmed" : "Confirm the Wertschriftenverzeichnis"}
            </p>
            <p className="max-w-xl text-[12px] leading-relaxed text-mist">
              {s.securitiesConfirmed
                ? "Your holdings feed income & wealth tax exactly as listed."
                : "Verify quantities and values against your bank statement, then confirm. This list becomes part of the official return."}
            </p>
          </div>
        </div>
        {s.securitiesConfirmed ? (
          <button onClick={() => router.push("/dashboard/property")} className="btn-gold px-6 py-3 text-sm">
            Continue to real estate
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={s.confirmSecurities} className="btn-gold px-6 py-3 text-sm">
            <Check className="h-4 w-4" /> Confirm positions
          </button>
        )}
      </div>

      {/* add modal */}
      <AnimatePresence>
        {addOpen && (
          <AddHoldingModal
            onClose={() => setAddOpen(false)}
            onAdd={(h) => {
              s.setHoldings([...s.holdings, h]);
              setAddOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddHoldingModal({ onClose, onAdd }: { onClose: () => void; onAdd: (h: Holding) => void }) {
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [div, setDiv] = useState("");
  const [foreign, setForeign] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(qty) || 0;
    const p = Number(price) || 0;
    const d = Number(div) || 0;
    const value = q * p * (foreign ? 0.89 : 1);
    const divChf = d * (foreign ? 0.89 : 1);
    onAdd({
      id: genId(),
      name: name || "Unnamed position",
      ticker: ticker || "—",
      isin: "manual entry",
      custodian: "Manual entry",
      country: foreign ? "US" : "CH",
      assetClass: "Equity",
      qty: q,
      price: p,
      currency: foreign ? "USD" : "CHF",
      fxRate: foreign ? 0.89 : 1,
      valueChf: Math.round(value * 100) / 100,
      dividendGrossChf: Math.round(divChf * 100) / 100,
      withholdingRate: foreign ? 0.15 : 0.35,
      withholdingChf: Math.round(divChf * (foreign ? 0.15 : 0.35) * 100) / 100,
      reclaimType: foreign ? "DA-1" : "RÜF",
      reclaimNote: foreign ? "15% foreign WHT — credited via DA-1." : "35% Swiss anticipatory tax — reclaimed via the tax return.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="panel w-full max-w-md p-7"
      >
        <div className="flex items-start justify-between">
          <h3 className="font-display text-2xl font-light text-ivory">Add a position</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-faint hover:text-ivory">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-3">
          <input className="field" placeholder="Name — e.g. Richemont SA" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="field num" placeholder="Ticker" value={ticker} onChange={(e) => setTicker(e.target.value)} />
            <input className="field num" placeholder="Quantity" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="field num" placeholder="Price 31.12" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            <input className="field num" placeholder="Gross dividend" inputMode="decimal" value={div} onChange={(e) => setDiv(e.target.value)} />
          </div>
          <button
            type="button"
            onClick={() => setForeign(!foreign)}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-[13px] transition-colors ${
              foreign ? "border-gold/40 bg-gold/[0.07] text-gold-2" : "border-line-2 text-ivory-dim"
            }`}
          >
            Foreign security (USD / DA-1 treatment)
            <span className="num text-[10.5px]">{foreign ? "ON" : "OFF"}</span>
          </button>
          <button type="submit" className="btn-gold mt-1 w-full px-5 py-3 text-sm">
            <Plus className="h-4 w-4" /> Add to custody list
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
