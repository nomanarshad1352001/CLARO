"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Check,
  Globe2,
  Home,
  Info,
  Landmark,
  Percent,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { LockedState, PageHead } from "@/components/app/shell";
import { useApp, genId } from "@/lib/store";
import { propertyTotals } from "@/lib/tax-engine";
import { getRules } from "@/lib/tax-rules";
import { CANTONS, getCanton } from "@/lib/tax-data";
import { fmtChf } from "@/lib/format";
import type { Property } from "@/lib/types";

export default function PropertyPage() {
  const router = useRouter();
  const s = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const year = s.setup?.year ?? 2025;
  const rules = getRules(year);
  const D = rules.deductions;
  const totals = propertyTotals(s.properties, year);

  const update = (id: string, patch: Partial<Property>) =>
    s.setProperties(s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  if (!s.incomeConfirmed) {
    return (
      <LockedState
        step="Income & assets"
        message="Property income and mortgage debt are part of the consolidated ledger — confirm it first so the figures stay consistent."
        ctaHref="/dashboard/income"
        ctaLabel="Go to income & assets"
      />
    );
  }

  return (
    <div>
      <PageHead
        kicker="Step 07 · Real estate"
        title={<>Property, <span className="display-italic gold-text">Swiss and foreign</span></>}
        sub="Tax value, rental or imputed rental income, mortgage balance and interest, and maintenance — with the maintenance flat-rate option and canton-specific rules applied automatically."
        actions={
          <button onClick={() => setAddOpen(true)} className="btn-ghost px-4 py-2.5 text-[13px]">
            <Plus className="h-4 w-4 text-gold" /> Add property
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Building2, label: "Swiss rental / imputed income", val: fmtChf(totals.swissIncome), sub: "Added to taxable income" },
          { icon: Globe2, label: "Foreign property income", val: fmtChf(totals.foreignIncome), sub: "Exempt — raises the rate only" },
          { icon: Landmark, label: "Tax values (CH + foreign)", val: fmtChf(totals.swissWealth + totals.foreignWealth), sub: "Foreign value exempt from CH wealth tax" },
          { icon: Percent, label: "Deductions from property", val: `− ${fmtChf(totals.maintenance + totals.mortgageInterest)}`, sub: "Maintenance + mortgage interest" },
        ].map((k) => (
          <div key={k.label} className="panel p-5">
            <k.icon className="h-4 w-4 text-gold" />
            <div className="num mt-3 text-[21px] text-ivory">{k.val}</div>
            <div className="mt-0.5 font-mono text-[9px] tracking-[0.2em] text-faint uppercase">{k.label}</div>
            <div className="mt-1.5 text-[11px] text-mist">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {s.properties.map((p) => {
          const gross = p.rentalIncome > 0 ? p.rentalIncome : p.imputedRental;
          const flat = gross * D.propertyMaintenanceFlat;
          const maint = p.maintenanceMode === "actual" ? p.maintenanceActual : flat;
          const foreign = p.countryCode !== "CH";
          const canton = p.cantonCode ? getCanton(p.cantonCode) : null;
          return (
            <motion.div key={p.id} layout className="panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl border ${foreign ? "border-pine-bright/40 bg-pine/25" : "border-gold/30 bg-gold/[0.07]"}`}>
                    {foreign ? <Globe2 className="h-4 w-4 text-pine-bright" /> : <Home className="h-4 w-4 text-gold" />}
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold text-ivory">{p.label}</div>
                    <div className="text-[10.5px] text-faint">
                      {foreign ? `Foreign property · ${p.countryCode}` : `${p.municipality}, canton ${p.cantonCode}`} · {p.source}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-line bg-white/60 px-2.5 py-1 font-mono text-[9px] tracking-widest text-mist uppercase">
                    {p.kind}
                  </span>
                  <button onClick={() => s.setProperties(s.properties.filter((x) => x.id !== p.id))}
                    className="rounded-full p-2 text-faint transition-colors hover:bg-alert/10 hover:text-alert">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-x-8 gap-y-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-3">
                <Num label="Market value" value={p.marketValue} onChange={(v) => update(p.id, { marketValue: v })} />
                <Num label={foreign ? "Foreign tax value" : "Tax value (amtlicher Wert)"} value={p.taxValue} onChange={(v) => update(p.id, { taxValue: v })} />
                <Num label="Rental income (received)" value={p.rentalIncome} onChange={(v) => update(p.id, { rentalIncome: v })} />
                <Num label="Imputed rental (Eigenmietwert)" value={p.imputedRental} onChange={(v) => update(p.id, { imputedRental: v })}
                  hint={!foreign && canton ? `Typically ${(D.imputedRentalRate * 100).toFixed(1)}% of tax value in ${canton.name}` : "Own-use value in the country of location"} />
                <Num label="Mortgage balance 31.12" value={p.mortgageBalance} onChange={(v) => update(p.id, { mortgageBalance: v })} />
                <Num label="Mortgage interest paid" value={p.mortgageInterest} onChange={(v) => update(p.id, { mortgageInterest: v })} />
              </div>

              <div className="border-t border-line bg-panel-2 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9.5px] tracking-[0.2em] text-faint uppercase">Maintenance</span>
                    <div className="flex gap-1.5">
                      {(["flat", "actual"] as const).map((m) => (
                        <button key={m} onClick={() => update(p.id, { maintenanceMode: m })}
                          className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                            p.maintenanceMode === m ? "border-gold/50 bg-gold/[0.08] text-gold-2" : "border-line-2 bg-white/60 text-mist hover:border-gold/30"
                          }`}>
                          {m === "flat" ? `Flat ${(D.propertyMaintenanceFlat * 100).toFixed(0)}%` : "Actual costs"}
                        </button>
                      ))}
                    </div>
                    {p.maintenanceMode === "actual" && (
                      <input className="field num ml-2 w-36 py-1.5 text-[12.5px]" value={p.maintenanceActual}
                        onChange={(e) => update(p.id, { maintenanceActual: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
                    )}
                  </div>
                  <div className="num text-[12.5px] text-gold-2">
                    Deduction applied: − {fmtChf(maint)}
                    {p.maintenanceMode === "flat" && <span className="ml-2 text-[10px] text-faint">({fmtChf(flat)} flat vs. {fmtChf(p.maintenanceActual)} actual)</span>}
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-mist">
                  <Info className="mt-0.5 h-3 w-3 shrink-0 text-gold/70" />
                  {foreign ? (
                    <span>
                      Foreign real estate is <b className="text-ivory">exempt</b> from Swiss income and wealth tax, but its value and rental
                      income are included when determining your tax <b className="text-ivory">rate</b> (Progressionsvorbehalt). Mortgage interest is
                      allocated proportionally.
                    </span>
                  ) : (
                    <span>
                      Canton {p.cantonCode}: imputed rental value is taxed as income for self-used property; maintenance may be claimed
                      at the flat rate or with actual invoices — whichever is higher, and the choice may be changed each year.
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {s.properties.length === 0 && (
          <div className="panel p-10 text-center">
            <Building2 className="mx-auto h-8 w-8 text-faint" />
            <p className="font-display mt-4 text-xl text-ivory">No property on file</p>
            <p className="mt-1.5 text-[12.5px] text-mist">If you own Swiss or foreign real estate, add it so the rules engine can apply the correct treatment.</p>
            <button onClick={() => setAddOpen(true)} className="btn-gold mt-5 px-5 py-2.5 text-[13px]"><Plus className="h-4 w-4" /> Add property</button>
          </div>
        )}
      </div>

      <div className={`panel mt-8 flex flex-wrap items-center justify-between gap-4 p-6 ${s.propertyConfirmed ? "border-ok/30" : "glow-gold border-gold/35"}`}>
        <div className="flex items-center gap-4">
          <span className={`grid h-11 w-11 place-items-center rounded-full ${s.propertyConfirmed ? "bg-ok/[0.1]" : "bg-gold/[0.1]"}`}>
            <Check className={`h-5 w-5 ${s.propertyConfirmed ? "text-ok" : "text-gold"}`} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ivory">
              {s.propertyConfirmed ? "Real estate confirmed" : "Confirm your real estate"}
            </p>
            <p className="max-w-xl text-[12px] leading-relaxed text-mist">
              {s.propertyConfirmed
                ? "Property income, values and deductions flow into the calculation."
                : `${s.properties.length} propert${s.properties.length === 1 ? "y" : "ies"} on file. Confirm to continue — you can return and adjust at any time.`}
            </p>
          </div>
        </div>
        {s.propertyConfirmed ? (
          <button onClick={() => router.push("/dashboard/calculation")} className="btn-gold px-6 py-3 text-sm">
            Run the calculation <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={s.confirmProperty} className="btn-gold px-6 py-3 text-sm"><Check className="h-4 w-4" /> Confirm real estate</button>
        )}
      </div>

      <AnimatePresence>
        {addOpen && (
          <AddPropertyModal onClose={() => setAddOpen(false)} onAdd={(p) => { s.setProperties([...s.properties, p]); setAddOpen(false); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Num({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[9.5px] tracking-[0.18em] text-faint uppercase">{label}</span>
      <input className="field num py-2 text-[13px]" value={value.toLocaleString("de-CH")}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)} />
      {hint && <span className="mt-1 block text-[10px] text-faint">{hint}</span>}
    </label>
  );
}

function AddPropertyModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Property) => void }) {
  const [label, setLabel] = useState("");
  const [foreign, setForeign] = useState(false);
  const [country, setCountry] = useState("FR");
  const [cantonCode, setCantonCode] = useState("ZH");
  const [kind, setKind] = useState<Property["kind"]>("primary");
  const [taxValue, setTaxValue] = useState("");
  const [rent, setRent] = useState("");
  const [mortgage, setMortgage] = useState("");
  const [interest, setInterest] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const tv = Number(taxValue.replace(/\D/g, "")) || 0;
    const r = Number(rent.replace(/\D/g, "")) || 0;
    onAdd({
      id: genId(),
      label: label || "New property",
      kind,
      countryCode: foreign ? country : "CH",
      cantonCode: foreign ? undefined : cantonCode,
      municipality: foreign ? undefined : getCanton(cantonCode).municipalities[0].name,
      marketValue: Math.round(tv * 1.42),
      taxValue: tv,
      imputedRental: r > 0 ? 0 : Math.round(tv * 0.035),
      rentalIncome: r,
      mortgageBalance: Number(mortgage.replace(/\D/g, "")) || 0,
      mortgageInterest: Number(interest.replace(/\D/g, "")) || 0,
      maintenanceMode: "flat",
      maintenanceActual: 0,
      source: "Manually added",
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-5 backdrop-blur-sm" onClick={onClose}>
      <motion.form initial={{ scale: 0.95, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 14 }}
        onClick={(e) => e.stopPropagation()} onSubmit={submit} className="panel w-full max-w-md p-7">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-2xl font-semibold text-ivory">Add property</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-faint hover:text-ivory"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-3">
          <input className="field" placeholder="Label — e.g. Wohnung Luzern" value={label} onChange={(e) => setLabel(e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            {(["primary", "secondary", "rental"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)}
                className={`rounded-xl border py-2.5 text-[12px] font-semibold capitalize transition-colors ${kind === k ? "border-gold/50 bg-gold/[0.07] text-gold-2" : "border-line-2 text-mist"}`}>
                {k}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setForeign(!foreign)}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-[13px] transition-colors ${foreign ? "border-pine-bright/45 bg-pine/25 text-ivory" : "border-line-2 text-ivory-dim"}`}>
            Property located abroad
            <span className="num text-[10.5px]">{foreign ? "ON" : "OFF"}</span>
          </button>
          {foreign ? (
            <select className="field" value={country} onChange={(e) => setCountry(e.target.value)}>
              {["FR", "DE", "IT", "AT", "ES", "PT", "GB", "US"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <select className="field" value={cantonCode} onChange={(e) => setCantonCode(e.target.value)}>
              {CANTONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          )}
          <input className="field num" inputMode="decimal" placeholder="Tax value (CHF)" value={taxValue} onChange={(e) => setTaxValue(e.target.value)} />
          <input className="field num" inputMode="decimal" placeholder="Annual rental income (0 if self-used)" value={rent} onChange={(e) => setRent(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="field num" inputMode="decimal" placeholder="Mortgage balance" value={mortgage} onChange={(e) => setMortgage(e.target.value)} />
            <input className="field num" inputMode="decimal" placeholder="Interest paid" value={interest} onChange={(e) => setInterest(e.target.value)} />
          </div>
          <button type="submit" className="btn-gold mt-1 w-full px-5 py-3 text-sm"><Plus className="h-4 w-4" /> Add property</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
