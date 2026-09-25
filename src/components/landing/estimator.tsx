"use client";

import { useMemo, useState } from "react";
import { Reveal, SectionHeading } from "@/components/ui";
import { CANTONS, getCanton } from "@/lib/tax-data";
import { quickEstimate } from "@/lib/tax-engine";
import { fmtChf, fmtPct } from "@/lib/format";
import { ArrowRight, Users, Wallet } from "lucide-react";
import Link from "next/link";

export default function Estimator() {
  const [cantonCode, setCantonCode] = useState("ZH");
  const [muniId, setMuniId] = useState("zurich");
  const [income, setIncome] = useState(120_000);
  const [married, setMarried] = useState(false);

  const canton = getCanton(cantonCode);
  const result = useMemo(
    () => quickEstimate(cantonCode, muniId, income, married),
    [cantonCode, muniId, income, married]
  );

  const split = [
    { label: "Federal", v: result.federalTax },
    { label: "Cantonal", v: result.cantonalTax },
    { label: "Municipal", v: result.municipalTax },
    { label: "Wealth", v: result.wealthTax },
  ];
  const max = Math.max(...split.map((s) => s.v), 1);

  return (
    <section id="estimator" className="relative mx-auto max-w-7xl px-6 py-28">
      <div className="grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            align="left"
            kicker="Live estimator"
            title={
              <>
                Feel the rules engine, <span className="display-italic gold-text">live</span>
              </>
            }
            sub="This is the same deterministic model that runs inside the product — federal DBG brackets plus your canton's and municipality's multipliers. Not generated. Computed."
          />
          <Reveal delay={2} className="mt-8">
            <Link href="/signup" className="btn-ghost px-5 py-3 text-sm">
              Run it on my real documents
              <ArrowRight className="h-4 w-4 text-gold" />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={1}>
          <div className="panel glow-gold p-7 sm:p-9">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
                  Canton
                </span>
                <select
                  className="field"
                  value={cantonCode}
                  onChange={(e) => {
                    setCantonCode(e.target.value);
                    setMuniId(getCanton(e.target.value).municipalities[0].id);
                  }}
                >
                  {CANTONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
                  Municipality
                </span>
                <select className="field" value={muniId} onChange={(e) => setMuniId(e.target.value)}>
                  {canton.municipalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {(m.muniMult * 100).toFixed(0)}%
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
                  <Wallet className="h-3 w-3" /> Gross annual income
                </span>
                <span className="num text-gold-2">{fmtChf(income)}</span>
              </div>
              <input
                type="range"
                min={30_000}
                max={400_000}
                step={5_000}
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-full accent-[#d92e25]"
              />
            </div>

            <button
              onClick={() => setMarried(!married)}
              className={`mt-5 flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                married ? "border-gold/40 bg-gold/[0.07]" : "border-line-2 bg-white/[0.02]"
              }`}
            >
              <span className="flex items-center gap-2 text-sm text-ivory-dim">
                <Users className="h-4 w-4 text-gold/80" />
                Married / registered partnership (joint tariff)
              </span>
              <span
                className={`num rounded-full px-2.5 py-0.5 text-[10px] ${
                  married ? "bg-gold/15 text-gold-2" : "bg-white/5 text-faint"
                }`}
              >
                {married ? "ON" : "OFF"}
              </span>
            </button>

            <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto]">
              <div className="space-y-3">
                {split.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1 flex justify-between font-mono text-[10.5px] text-mist">
                      <span className="tracking-widest uppercase">{s.label}</span>
                      <span className="text-ivory-dim">{fmtChf(s.v)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all duration-500"
                        style={{ width: `${Math.max((s.v / max) * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-end justify-center border-t border-line pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
                <span className="font-mono text-[9.5px] tracking-[0.22em] text-faint uppercase">
                  Estimated total · {result.municipality}
                </span>
                <span className="font-display mt-1 text-4xl font-light text-ivory">
                  {fmtChf(result.totalAfterCredits)}
                </span>
                <span className="num mt-1 text-[12px] text-gold-2">
                  effective {fmtPct(result.effectiveRate)} / yr
                </span>
              </div>
            </div>

            <p className="mt-6 border-t border-line pt-4 text-[11px] leading-relaxed text-faint">
              Indicative, before personal deductions found by the AI (Pillar 3a, professional
              expenses, childcare…). The definitive assessment is issued by your tax office.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
