"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Calculator,
  Check,
  Cpu,
  Landmark,
  Pencil,
  Scale,
  X,
} from "lucide-react";
import { LockedState, PageHead } from "@/components/app/shell";
import { useApp } from "@/lib/store";
import { buildEngineInput } from "@/lib/questions";
import { computeReturn } from "@/lib/tax-engine";
import { getCanton } from "@/lib/tax-data";
import { fmtChf, fmtPct } from "@/lib/format";
import type { CalcBreakdown } from "@/lib/types";

const PHASES = [
  "Applying DBG federal tariff…",
  "Applying cantonal & municipal Steuerfüsse…",
  "Netting child credits & DA-1 / RÜF reclaims…",
  "Cross-checking against 21 deduction rules…",
];

/* editable deduction lines → engine input mapping */
const EDITABLE: Record<string, { label: string }> = {
  don: { label: "donations" },
  med: { label: "medical costs" },
  debt: { label: "debt interest" },
  commute: { label: "commuting costs" },
};

export default function CalculationPage() {
  const router = useRouter();
  const s = useApp();
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const [compareMuni, setCompareMuni] = useState("");
  const [editLine, setEditLine] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const ready = s.setup && s.processed && s.questionsDone && s.incomeConfirmed && s.securitiesConfirmed && s.propertyConfirmed;
  const canton = s.setup ? getCanton(s.setup.canton) : null;

  const engineInput = useMemo(() => {
    if (!s.setup) return null;
    const setup = s.setup;
    const st = useApp.getState();
    const input = buildEngineInput({
      docs: st.docs,
      answers: st.answers,
      holdings: st.holdings,
      properties: st.properties,
      household: st.household,
      extraIncome: st.extraIncome,
      extraAssets: st.extraAssets,
      cantonCode: setup.canton,
      municipalityId: setup.municipalityId,
      year: setup.year,
    });
    const o = st.deductionOverrides;
    if (o.don !== undefined) input.donations = o.don;
    if (o.med !== undefined) input.medicalCosts = o.med;
    if (o.debt !== undefined) input.debtInterest = o.debt;
    if (o.commute !== undefined) {
      if (input.commuteMode === "car") input.commuteKmPerDay = o.commute;
      else input.publicPassCost = o.commute;
    }
    return input;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.setup, s.docs, s.answers, s.holdings, s.properties, s.household, s.extraIncome, s.extraAssets, s.deductionOverrides]);

  const compare = useMemo(() => {
    if (!engineInput || !compareMuni) return null;
    const r = computeReturn({ ...engineInput, municipalityId: compareMuni });
    return r;
  }, [engineInput, compareMuni]);

  const runCalc = async () => {
    if (!engineInput) return;
    setRunning(true);
    setPhase(0);
    const tick = setInterval(() => setPhase((p) => Math.min(p + 1, PHASES.length - 1)), 620);
    const res = await fetch("/api/tax/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(engineInput),
    });
    const data = await res.json();
    await new Promise((r) => setTimeout(r, PHASES.length * 420));
    clearInterval(tick);
    s.setCalc(data.result as CalcBreakdown);
    useApp.getState().log("calc", `Deterministic calculation completed — total ${fmtChf(data.result.totalAfterCredits)}`);
    setRunning(false);
  };

  if (!ready || !s.setup) {
    return (
      <LockedState
        step="Smart questions / Securities"
        message="The engine needs three things: merged documents, your answers and the confirmed custody list. Complete the previous steps to unlock the calculation."
        ctaHref="/dashboard/questions"
        ctaLabel="Continue the workflow"
      />
    );
  }

  const c = s.calc;

  return (
    <div>
      <PageHead
        kicker="Step 08 · Calculation"
        title={
          <>
            Numbers, not <span className="display-italic gold-text">guesses</span>
          </>
        }
        sub="An LLM never touches your figures. The statutory engine applies the federal DBG tariff and your exact cantonal & municipal multipliers — reproducible to the rappen."
        actions={
          c ? (
            <button onClick={runCalc} disabled={running} className="btn-ghost px-4 py-2.5 text-[13px]">
              <Cpu className="h-4 w-4 text-gold" />
              {running ? "Recomputing…" : "Recompute"}
            </button>
          ) : undefined
        }
      />

      {!c && !running && (
        <div className="panel mx-auto mt-10 max-w-xl p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold/30 bg-gold/[0.07]">
            <Calculator className="h-7 w-7 text-gold" />
          </div>
          <h2 className="font-display mt-6 text-3xl font-light text-ivory">
            Ready to compute · <span className="display-italic gold-text">{s.setup.year}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-mist">
            Input dossier: {fmtChf(engineInput?.grossSalaryPrimary ?? 0)} +{" "}
            {fmtChf(engineInput?.grossSalarySpouse ?? 0)} salaries · {engineInput?.holdings.length ?? 0} positions ·{" "}
            {s.setup.municipality}, canton {s.setup.canton}. Server-side execution, identical input gives
            identical output.
          </p>
          <button onClick={runCalc} className="btn-gold mt-7 px-8 py-3.5 text-sm">
            <Scale className="h-4 w-4" />
            Execute the rules engine
          </button>
        </div>
      )}

      <AnimatePresence>
        {running && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="panel mx-auto mt-10 max-w-xl p-10"
          >
            <div className="space-y-4">
              {PHASES.map((p, i) => (
                <div key={p} className={`flex items-center gap-3 text-[13.5px] transition-opacity ${i > phase ? "opacity-30" : ""}`}>
                  {i < phase ? (
                    <Check className="h-4 w-4 text-ok" />
                  ) : i === phase ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-line-2" />
                  )}
                  <span className={i <= phase ? "text-ivory" : "text-faint"}>{p}</span>
                </div>
              ))}
            </div>
            <div className="shimmer mt-6 h-1.5 rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {c && !running && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* verdict */}
          <div className="panel glow-gold grid gap-8 p-8 lg:grid-cols-[1fr_auto]">
            <div>
              <span className="kicker">Estimated tax burden · {c.year}</span>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Kpi label="Federal (DBG)" val={fmtChf(c.federalTax)} />
                <Kpi label={`Cantonal (${c.cantonCode})`} val={fmtChf(c.cantonalTax)} />
                <Kpi label={`Municipal (${c.municipality})`} val={fmtChf(c.municipalTax)} />
                <Kpi label="Church" val={fmtChf(c.churchTax)} dim />
                <Kpi label="Wealth tax" val={fmtChf(c.wealthTax)} dim />
                <Kpi label="Personal / child credits" val={`${fmtChf(c.personalTax)} / −${fmtChf(c.childCredits)}`} dim />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-gold/30 bg-gold/[0.06] px-3 py-1 font-mono text-[9.5px] tracking-widest text-gold uppercase">
                  {c.rulesVersion}
                </span>
                <span className="rounded-full border border-line bg-white/60 px-3 py-1 font-mono text-[9.5px] tracking-widest text-mist uppercase">
                  Federal tariff: {c.tariffUsed}
                </span>
                {c.exemptIncomeProgression ? (
                  <span className="rounded-full border border-pine-bright/40 bg-pine/25 px-3 py-1 font-mono text-[9.5px] tracking-widest text-ivory-dim uppercase">
                    Progression on {fmtChf(c.exemptIncomeProgression)} exempt
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-faint">
                Federal → {c.cantonCode} → {c.municipality} → {c.year} · taxable income federal {fmtChf(c.taxableIncomeFederal)} / cantonal{" "}
                {fmtChf(c.taxableIncomeCantonal)} · taxable wealth {fmtChf(c.wealthTaxable)}
              </p>
            </div>
            <div className="flex flex-col items-end justify-between gap-6 border-t border-line pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
              <div className="text-right">
                <div className="font-mono text-[9.5px] tracking-[0.22em] text-faint uppercase">Total before refunds</div>
                <div className="font-display mt-1 text-6xl font-light text-ivory">{fmtChf(c.totalAfterCredits)}</div>
                <div className="num mt-1 text-[12px] text-gold-2">effective {fmtPct(c.effectiveRate)} of gross income</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[9.5px] tracking-[0.22em] text-faint uppercase">
                  Net after 35% RÜF refund + DA-1
                </div>
                <div className="num mt-1 text-2xl text-ok">
                  {fmtChf(c.netPosition)}
                </div>
                <div className="text-[10.5px] text-faint">
                  refund {fmtChf(c.withholdingRefundCH, { decimals: true })} (RÜF) + {fmtChf(c.da1Credit, { decimals: true })} (DA-1 credited)
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            {/* deductions ledger */}
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <h3 className="font-display text-xl font-normal text-ivory">Deductions ledger</h3>
                <span className="num text-[12px] text-gold-2">− {fmtChf(c.totalDeductionsCantonal)} cantonal</span>
              </div>
              <div className="divide-y divide-line/70">
                {c.deductionLines.map((l) => (
                  <div key={l.id} className="group px-6 py-3.5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[13px] font-semibold text-ivory">{l.label}</span>
                        {l.auto && (
                          <span className="rounded-full border border-gold/30 bg-gold/[0.07] px-2 py-0.5 font-mono text-[8.5px] tracking-widest text-gold uppercase">
                            auto
                          </span>
                        )}
                        {EDITABLE[l.id] && (
                          <button
                            onClick={() => {
                              setEditLine(editLine === l.id ? null : l.id);
                              setEditVal(String(Math.round(l.amount)));
                            }}
                            className="rounded-full p-1 text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-gold"
                            aria-label={`Adjust ${l.label}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-baseline gap-3">
                        {l.cappedAt !== undefined && l.amount !== l.applied && (
                          <span className="num text-[11px] text-faint line-through">{fmtChf(l.amount)}</span>
                        )}
                        <span className="num text-[13.5px] text-gold-2">− {fmtChf(l.applied)}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-4">
                      <span className="text-[10.5px] text-faint">{l.source}</span>
                      {l.note && <span className="text-right text-[10px] text-faint">{l.note}</span>}
                    </div>
                    {editLine === l.id && (
                      <form
                        className="mt-3 flex max-w-xs gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const n = Number(editVal.replace(/['\s]/g, ""));
                          if (Number.isFinite(n) && n >= 0) {
                            s.setDeductionOverride(l.id, n);
                            setEditLine(null);
                            setTimeout(runCalc, 50);
                          }
                        }}
                      >
                        <input autoFocus className="field num py-2 text-[13px]" value={editVal} onChange={(e) => setEditVal(e.target.value)} />
                        <button type="submit" className="btn-gold px-3.5 text-[12px]"><Check className="h-3.5 w-3.5" /></button>
                        <button
                          type="button"
                          onClick={() => { s.setDeductionOverride(l.id, null); setEditLine(null); setTimeout(runCalc, 50); }}
                          className="btn-ghost px-3.5 text-[12px]"
                        ><X className="h-3.5 w-3.5" /></button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between bg-ink-2/50 px-6 py-4">
                <span className="text-[12px] text-mist">Gross income {fmtChf(c.grossIncome)} → taxable {fmtChf(c.taxableIncomeCantonal)}</span>
                <span className="num text-[13px] text-ivory">− {fmtPct(c.totalDeductionsCantonal / c.grossIncome)} income</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* waterfall */}
              <div className="panel p-6">
                <h3 className="font-display text-xl font-normal text-ivory">Composition</h3>
                <div className="mt-5 space-y-3.5">
                  {[
                    { l: "Federal tax", v: c.federalTax, c1: "#D92E25" },
                    { l: "Cantonal tax", v: c.cantonalTax, c1: "#B4231B" },
                    { l: "Municipal tax", v: c.municipalTax, c1: "#8E1B14" },
                    { l: "Church tax", v: c.churchTax, c1: "#C57A70" },
                    { l: "Wealth tax", v: c.wealthTax, c1: "#34577E" },
                  ].map((r) => {
                    const maxV = Math.max(c.federalTax, c.cantonalTax, c.municipalTax, 1);
                    return (
                      <div key={r.l}>
                        <div className="mb-1 flex justify-between text-[11px]">
                          <span className="text-mist">{r.l}</span>
                          <span className="num text-ivory-dim">{fmtChf(r.v)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max((r.v / maxV) * 100, 1.5)}%` }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full"
                            style={{ background: r.c1 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="gold-line my-5" />
                <div className="flex justify-between text-[12px]">
                  <span className="text-mist">Withholding refunds queue</span>
                  <span className="num text-ok">+{fmtChf(c.withholdingRefundCH, { decimals: true })}</span>
                </div>
                <div className="mt-1.5 flex justify-between text-[12px]">
                  <span className="text-mist">DA-1 foreign credits</span>
                  <span className="num text-ok">−{fmtChf(c.da1Credit, { decimals: true })}</span>
                </div>
              </div>

              {/* wealth composition */}
              {c.wealthBreakdown && c.wealthBreakdown.length > 0 && (
                <div className="panel p-6">
                  <h3 className="font-display text-xl font-semibold text-ivory">Wealth composition</h3>
                  <div className="mt-4 divide-y divide-line/70">
                    {c.wealthBreakdown.map((w) => (
                      <div key={w.label} className="flex items-center justify-between gap-4 py-2">
                        <span className="text-[12px] text-mist">{w.label}</span>
                        <span className={`num text-[12.5px] ${w.amount < 0 ? "text-alert" : "text-ivory"}`}>{fmtChf(w.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className="text-[12px] font-semibold text-ivory">Taxable wealth (after allowance)</span>
                    <span className="num text-[13px] text-gold-2">{fmtChf(c.wealthTaxable)}</span>
                  </div>
                </div>
              )}

              {/* comparator */}
              <div className="panel p-6">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gold" />
                  <h3 className="font-display text-xl font-normal text-ivory">What-if: another municipality</h3>
                </div>
                <select className="field mt-4" value={compareMuni} onChange={(e) => setCompareMuni(e.target.value)}>
                  <option value="">Compare within canton {s.setup.canton}…</option>
                  {canton?.municipalities
                    .filter((m) => m.id !== s.setup?.municipalityId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} · {(m.muniMult * 100).toFixed(0)}%
                      </option>
                    ))}
                </select>
                {compare && s.calc && (
                  <div className="mt-4 rounded-xl border border-gold/25 bg-gold/[0.05] px-4 py-3.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12.5px] text-ivory-dim">Living in {compare.municipality}</span>
                      <span className="num text-xl text-ivory">{fmtChf(compare.totalAfterCredits)}</span>
                    </div>
                    <div className="mt-1 text-[11.5px]">
                      {compare.totalAfterCredits < s.calc.totalAfterCredits ? (
                        <span className="text-ok">
                          ↓ {fmtChf(s.calc.totalAfterCredits - compare.totalAfterCredits)} less per year than {s.calc.municipality}
                        </span>
                      ) : (
                        <span className="text-alert">
                          ↑ {fmtChf(compare.totalAfterCredits - s.calc.totalAfterCredits)} more per year than {s.calc.municipality}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <p className="mt-4 flex items-start gap-2 text-[10.5px] leading-relaxed text-faint">
                  <Landmark className="mt-0.5 h-3 w-3 shrink-0 text-gold/60" />
                  Indicative estimate. The definitive assessment is issued by your cantonal tax administration.
                </p>
              </div>
            </div>
          </div>

          {/* next */}
          <div className="panel flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="max-w-xl text-[12.5px] leading-relaxed text-mist">
              The calculation is locked into your dossier as an immutable snapshot. One step remains:
              review the completed return, confirm your responsibility, and file.
            </p>
            <button onClick={() => router.push("/dashboard/filing")} className="btn-gold px-6 py-3 text-sm">
              Review & file the return
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Kpi({ label, val, dim }: { label: string; val: string; dim?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-ink-2/40 px-4 py-3">
      <div className="font-mono text-[9px] tracking-[0.18em] text-faint uppercase">{label}</div>
      <div className={`num mt-1 text-[17px] ${dim ? "text-ivory-dim" : "text-ivory"}`}>{val}</div>
    </div>
  );
}
