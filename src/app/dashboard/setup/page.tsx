"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Landmark, MapPin } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHead } from "@/components/app/shell";
import { CANTONS, TAX_YEARS, getCanton } from "@/lib/tax-data";
import { Reveal } from "@/components/ui";
import { buildPersonalProfile, lockedProfile } from "@/lib/personal-data";
import { Sparkles, ArrowUpRight, Check, Users, Globe2, Briefcase } from "lucide-react";
import type { CivilStatus } from "@/lib/types";

export default function SetupPage() {
  const router = useRouter();
  const setup = useApp((s) => s.setup);
  const setSetup = useApp((s) => s.setSetup);

  const [canton, setCanton] = useState(setup?.canton ?? "ZH");
  const [municipality, setMunicipality] = useState(setup?.municipality ?? "");
  const [year, setYear] = useState(setup?.year ?? 2025);

  const c = getCanton(canton);
  const muni = useMemo(
    () => c.municipalities.find((m) => m.id === municipality) ?? null,
    [c, municipality]
  );

  const household = useApp((s) => s.household);
  const setHousehold = useApp((s) => s.setHousehold);
  const docsState = useApp((s) => s.docs);
  const choices = useApp((s) => s.profileChoices);
  const processed = useApp((s) => s.processed);
  const detected = useMemo(() => {
    const prof = lockedProfile(buildPersonalProfile(docsState), choices);
    if (!prof.canton || !prof.municipality) return null;
    const codeMatch = prof.canton.toUpperCase().match(/\b(ZH|BE|LU|UR|SZ|OW|NW|GL|ZG|FR|SO|BS|BL|SH|AR|AI|SG|GR|AG|TG|TI|VD|VS|NE|GE|JU)\b/);
    if (!codeMatch) return null;
    const code = codeMatch[1];
    const cantonObj = CANTONS.find((x) => x.code === code);
    if (!cantonObj) return null;
    const target = prof.municipality.toLowerCase().replace(/\([^)]*\)/g, "").trim();
    const muniObj =
      cantonObj.municipalities.find((m) => m.name.toLowerCase().startsWith(target.slice(0, 5))) ??
      cantonObj.municipalities[0];
    return { code, muniId: muniObj.id, muniName: muniObj.name };
  }, [docsState, choices]);

  const applyDetected = () => {
    if (!detected) return;
    setCanton(detected.code);
    setMunicipality(detected.muniId);
  };

  const alreadyApplied = detected && canton === detected.code && municipality === detected.muniId;

  const save = () => {
    if (!muni) return;
    setSetup({ canton, municipality: muni.name, municipalityId: muni.id, year });
    router.push("/dashboard/documents");
  };

  return (
    <div>
      <PageHead
        kicker="Step 01 · Your situation"
        title={
          <>
            Who you are, and where you <span className="display-italic gold-text">pay</span>
          </>
        }
        sub="Swiss taxation is hyper-local: the same income costs CHF 6'100 in Zug and CHF 11'300 in the city of Zürich. Your canton and municipality set the multipliers for the deterministic engine."
      />

      {processed && detected && (
        <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border p-5 ${alreadyApplied ? "border-ok/30 bg-ok/[0.05]" : "glow-gold border-gold/35 bg-gold/[0.04]"}`}>
          <div className="flex items-center gap-3.5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${alreadyApplied ? "bg-ok/[0.1]" : "bg-gold/[0.1]"}`}>
              <Sparkles className={`h-4.5 w-4.5 ${alreadyApplied ? "text-ok" : "text-gold"}`} />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-ivory">
                {alreadyApplied
                  ? `Identity automation confirmed: ${detected.muniName}, canton ${detected.code}`
                  : `Detected from your official documents: ${detected.muniName}, canton ${detected.code}`}
              </p>
              <p className="text-[11.5px] text-faint">
                Read from the 2024 Steuerveranlagung &amp; 2025 Aufforderung — {alreadyApplied ? "applied." : "one click applies it instead of choosing manually."}
              </p>
            </div>
          </div>
          {!alreadyApplied && (
            <button onClick={applyDetected} className="btn-gold px-5 py-2.5 text-[13px]">
              <ArrowUpRight className="h-4 w-4" /> Apply detected jurisdiction
            </button>
          )}
          {alreadyApplied && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-ok uppercase">
              <Check className="h-3.5 w-3.5" /> Applied
            </span>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* year */}
          <Reveal>
            <div className="panel p-6">
              <div className="mb-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-faint uppercase">
                <Landmark className="h-3.5 w-3.5 text-gold" /> Tax year
              </div>
              <div className="grid grid-cols-3 gap-3">
                {TAX_YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`num rounded-xl border py-3.5 text-lg transition-all ${
                      year === y
                        ? "border-gold/50 bg-gold/[0.08] text-gold-2"
                        : "border-line-2 text-mist hover:border-gold/25 hover:text-ivory"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* canton grid */}
          <Reveal delay={1}>
            <div className="panel p-6">
              <div className="mb-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-faint uppercase">
                <MapPin className="h-3.5 w-3.5 text-gold" /> Canton · {CANTONS.length} covered live
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {CANTONS.map((k) => (
                  <button
                    key={k.code}
                    onClick={() => {
                      setCanton(k.code);
                      setMunicipality("");
                    }}
                    className={`rounded-xl border px-2 py-3 text-center transition-all ${
                      canton === k.code
                        ? "border-gold/50 bg-gold/[0.08]"
                        : "border-line-2 hover:border-gold/25"
                    }`}
                  >
                    <span className={`num block text-[15px] ${canton === k.code ? "text-gold-2" : "text-ivory"}`}>
                      {k.code}
                    </span>
                    <span className="block truncate text-[9.5px] text-faint">{k.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* municipality */}
          <Reveal delay={2}>
            <div className="panel p-6">
              <div className="mb-4 font-mono text-[10px] tracking-[0.22em] text-faint uppercase">
                Municipality · canton {c.name}
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {c.municipalities.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMunicipality(m.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition-all ${
                      municipality === m.id
                        ? "border-gold/50 bg-gold/[0.08]"
                        : "border-line-2 hover:border-gold/25"
                    }`}
                  >
                    <span className={`block truncate text-[13px] font-semibold ${municipality === m.id ? "text-gold-2" : "text-ivory-dim"}`}>
                      {m.name}
                    </span>
                    <span className="num block text-[10.5px] text-faint">
                      {(m.muniMult * 100).toFixed(0)}% Steuerfuss
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
          {/* taxpayer situation */}
          <Reveal delay={3}>
            <div className="panel p-6">
              <div className="mb-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-faint uppercase">
                <Users className="h-3.5 w-3.5 text-gold" /> Taxpayer situation
              </div>
              <span className="mb-2 block text-[11.5px] text-mist">Civil status on 31 December — this selects the federal tariff.</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {([
                  ["single", "Single"],
                  ["married", "Married"],
                  ["registered_partnership", "Registered partnership"],
                  ["separated", "Separated"],
                  ["divorced", "Divorced"],
                  ["widowed", "Widowed"],
                ] as [CivilStatus, string][]).map(([v, l]) => (
                  <button key={v} onClick={() => setHousehold({ civilStatus: v })}
                    className={`rounded-xl border px-3 py-2.5 text-left text-[12.5px] font-semibold transition-all ${
                      household.civilStatus === v ? "border-gold/50 bg-gold/[0.08] text-gold-2" : "border-line-2 bg-white/60 text-mist hover:border-gold/30"
                    }`}>
                    {l}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Counter label="Children" value={household.childrenCount} onChange={(n) => setHousehold({ childrenCount: n })} />
                <Counter label="Other dependants" value={household.dependantsCount} onChange={(n) => setHousehold({ dependantsCount: n })} />
              </div>

              <div className="mt-5 space-y-2">
                {household.childrenCount > 0 && !["married", "registered_partnership"].includes(household.civilStatus) && (
                  <Toggle label="I have sole custody / run a single-parent household"
                    hint="Unlocks the federal Elterntarif — a materially lower tariff."
                    on={household.soleCustody} onToggle={() => setHousehold({ soleCustody: !household.soleCustody })} />
                )}
                <Toggle label="I moved to another municipality or canton during the year"
                  hint="Swiss rule: the domicile on 31 December is taxed for the whole year."
                  on={household.movedDuringYear} onToggle={() => setHousehold({ movedDuringYear: !household.movedDuringYear })} />
                {household.movedDuringYear && (
                  <div className="rounded-xl border border-line bg-panel-2 px-4 py-3">
                    <span className="mb-2 block font-mono text-[9.5px] tracking-[0.18em] text-faint uppercase">Previous canton</span>
                    <select className="field py-2 text-[13px]" value={household.previousCanton ?? ""} onChange={(e) => setHousehold({ previousCanton: e.target.value })}>
                      <option value="">— select —</option>
                      {CANTONS.map((k) => <option key={k.code} value={k.code}>{k.name}</option>)}
                    </select>
                    <p className="mt-2 text-[10.5px] leading-relaxed text-mist">
                      Your full-year tax is owed to the canton and municipality where you lived on 31 December; the previous canton settles
                      any instalments already paid.
                    </p>
                  </div>
                )}
                <Toggle label="Cross-border situation (work or residence abroad)"
                  hint="Activates DTA handling and exemption with progression for foreign items."
                  on={household.crossBorder} onToggle={() => setHousehold({ crossBorder: !household.crossBorder })} />
                <Toggle label="I had more than one employer during the year"
                  hint="Multiple salary certificates are aggregated per person."
                  on={household.multipleEmployers} onToggle={() => setHousehold({ multipleEmployers: !household.multipleEmployers })} />
              </div>
            </div>
          </Reveal>
        </div>

        {/* summary card */}
        <Reveal delay={1}>
          <div className="panel glow-gold sticky top-24 p-7">
            <span className="kicker">Selection</span>
            <div className="mt-5 space-y-4">
              <Row label="Tax year" value={String(year)} />
              <Row label="Canton" value={c.name} />
              <Row label="Municipality" value={muni?.name ?? "— select —"} />
              <Row label="Civil status" value={household.civilStatus.replace("_", " ")} />
              <Row label="Children / dependants" value={`${household.childrenCount} / ${household.dependantsCount}`} />
              <div className="gold-line" />
              <Row label="Cantonal multiplier" value={`${(c.cantonMult * 100).toFixed(0)}% of simple tax`} />
              <Row label="Municipal multiplier" value={muni ? `${(muni.muniMult * 100).toFixed(0)}%` : "—"} />
              <Row label="Church surcharge" value={`${(c.churchRate * 100).toFixed(0)}% (if registered)`} />
              <Row
                label="Filing channel"
                value={c.eFiling ? "Direct e-filing" : "Official export"}
                gold={c.eFiling}
              />
            </div>
            <button
              onClick={save}
              disabled={!muni}
              className="btn-gold mt-7 w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Lock jurisdiction & continue
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-4 text-center text-[10.5px] leading-relaxed text-faint">
              Tariff model {year} · Steuerfüsse per municipal decree. 14 more cantons unlock with your subscription region.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function Row({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-[10px] tracking-[0.18em] text-faint uppercase">{label}</span>
      <span className={`num text-[13px] ${gold ? "text-gold-2" : "text-ivory"}`}>{value}</span>
    </div>
  );
}

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="rounded-xl border border-line bg-panel-2 px-4 py-3">
      <span className="block font-mono text-[9.5px] tracking-[0.18em] text-faint uppercase">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="grid h-7 w-7 place-items-center rounded-full border border-line-2 text-mist transition-colors hover:border-gold/40 hover:text-gold">−</button>
        <span className="num w-6 text-center text-[17px] text-ivory">{value}</span>
        <button onClick={() => onChange(value + 1)} className="grid h-7 w-7 place-items-center rounded-full border border-line-2 text-mist transition-colors hover:border-gold/40 hover:text-gold">+</button>
      </div>
    </div>
  );
}

function Toggle({ label, hint, on, onToggle }: { label: string; hint: string; on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`flex w-full items-start justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
        on ? "border-gold/45 bg-gold/[0.06]" : "border-line-2 bg-white/60 hover:border-gold/25"
      }`}>
      <span>
        <span className={`block text-[12.5px] font-semibold ${on ? "text-gold-2" : "text-ivory-dim"}`}>{label}</span>
        <span className="mt-0.5 block text-[10.5px] leading-snug text-faint">{hint}</span>
      </span>
      <span className={`num shrink-0 rounded-full px-2.5 py-1 text-[9.5px] ${on ? "bg-gold/15 text-gold-2" : "bg-panel-3 text-faint"}`}>{on ? "YES" : "NO"}</span>
    </button>
  );
}
