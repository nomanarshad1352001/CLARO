"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Fingerprint,
  GitMerge,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { LockedState, PageHead } from "@/components/app/shell";
import PersonalDataPanel from "@/components/app/personal-data-panel";
import { useApp } from "@/lib/store";
import { inferredFacts, numericField } from "@/lib/questions";
import { buildPersonalProfile, profileResolved } from "@/lib/personal-data";

export default function ReviewPage() {
  const router = useRouter();
  const s = useApp();
  const [drawer, setDrawer] = useState(false);

  const resolvedCount = s.conflicts.filter((c) => c.resolved).length;
  const profile = s.processed ? buildPersonalProfile(s.docs) : [];
  const profileConflictCount = profile.filter((e) => e.status === "conflict").length;
  const profileDone = profileResolved(profile, s.profileChoices);
  const docConflictsDone = s.conflicts.every((c) => c.resolved !== undefined);
  const allResolved = docConflictsDone && profileDone;
  const facts = s.processed ? inferredFacts(s.docs, s.holdings) : [];
  const gross = numericField(s.docs, "gross_salary");
  const p3a = numericField(s.docs, "contribution_3a");

  const resolve = (id: string, value: string) => {
    s.resolveConflict(id, value);
    if (id === "childcare-amount") {
      const st = useApp.getState();
      const doc = st.docs.find((d) => d.type === "childcare_receipt");
      if (doc?.fields) {
        st.updateDoc(doc.id, {
          fields: doc.fields.map((f) =>
            f.key === "childcare_amount"
              ? { ...f, numeric: Number(value), value: `CHF ${Number(value).toLocaleString("de-CH")}` }
              : f
          ),
        });
      }
    }
    useApp.getState().log("sparkles", `Conflict resolved: ${s.conflicts.find((c) => c.id === id)?.title ?? id}`);
  };

  if (!s.processed) {
    return (
      <LockedState
        step="Documents"
        message="The AI review assembles once your documents have been read. Upload and run the analysis first — it takes under a minute."
        ctaHref="/dashboard/documents"
        ctaLabel="Go to documents"
      />
    );
  }

  return (
    <div>
      <PageHead
        kicker="Step 03 · AI review"
        title={
          <>
            Everything, <span className="display-italic gold-text">reconciled</span>
          </>
        }
        sub="The AI merged your documents into a single set of facts. Below: what it knows for certain, what conflicts needs your judgement, and which gaps will become questions."
      />

      {/* headline stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Income identified", val: `CHF ${gross.toLocaleString("de-CH")}`, sub: `${s.docs.filter((d) => d.type === "salary_certificate").length} salary certificates merged` },
          { label: "Pension (3a) payments", val: `CHF ${p3a.toLocaleString("de-CH")}`, sub: "Two VIAC certificates combined" },
          { label: "Contradictions to confirm", val: `${resolvedCount + profile.filter((e) => e.status === "conflict" && s.profileChoices[e.key]).length}/${s.conflicts.length + profileConflictCount}`, sub: allResolved ? "All settled — thank you" : "Never guessed — your confirmation required" },
        ].map((k) => (
          <div key={k.label} className="panel p-5">
            <div className="num text-[26px] text-ivory">{k.val}</div>
            <div className="mt-0.5 font-mono text-[9.5px] tracking-[0.2em] text-faint uppercase">{k.label}</div>
            <div className="mt-2 text-[11.5px] text-mist">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* personal data automation — identity merge */}
      <div className="mt-8">
        <PersonalDataPanel />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          {/* inferred facts */}
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-gold/25 bg-gold/[0.06]">
                <Fingerprint className="h-4 w-4 text-gold" />
              </span>
              <div>
                <h2 className="font-display text-xl font-normal text-ivory">Established facts</h2>
                <p className="text-[11.5px] text-faint">Inferred with high confidence — no questions needed.</p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-line">
              {facts.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <div className="text-[13px] font-semibold text-ivory">{f.label}</div>
                    <div className="mt-0.5 text-[11px] text-faint">Source: {f.source}</div>
                  </div>
                  <div className="num text-right text-[12.5px] text-gold-2">{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* conflicts */}
          <div className="panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-alert/30 bg-alert/[0.06]">
                  <CircleAlert className="h-4 w-4 text-alert" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-normal text-ivory">Conflicts</h2>
                  <p className="text-[11.5px] text-faint">Where documents disagree, you decide — once.</p>
                </div>
              </div>
              <span className={`num rounded-full px-2.5 py-1 text-[10.5px] ${allResolved ? "bg-ok/10 text-ok" : "bg-alert/10 text-alert"}`}>
                {resolvedCount}/{s.conflicts.length} resolved
              </span>
            </div>
            <div className="mt-5 space-y-4">
              <AnimatePresence initial={false}>
                {s.conflicts.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    className={`rounded-2xl border p-5 transition-colors ${
                      c.resolved ? "border-ok/25 bg-ok/[0.03]" : "border-alert/25 bg-alert/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[14px] font-semibold text-ivory">{c.title}</div>
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-mist">{c.detail}</p>
                      </div>
                      {c.resolved && (
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok/15">
                          <Check className="h-3.5 w-3.5 text-ok" />
                        </span>
                      )}
                    </div>
                    {!c.resolved ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {c.options.map((o) => (
                          <button
                            key={o.value}
                            onClick={() => resolve(c.id, o.value)}
                            className="rounded-xl border border-line-2 px-4 py-3 text-left transition-colors hover:border-gold/45 hover:bg-gold/[0.05]"
                          >
                            <span className="num block text-[13px] text-ivory">{o.label}</span>
                            <span className="mt-0.5 block text-[10.5px] text-faint">{o.source}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-ink-2/60 px-4 py-2.5">
                        <span className="num text-[12.5px] text-ok">
                          Applied: {c.options.find((o) => o.value === c.resolved)?.label}
                        </span>
                        <button
                          onClick={() => useApp.setState({ conflicts: s.conflicts.map((x) => (x.id === c.id ? { ...x, resolved: undefined } : x)) })}
                          className="text-[10.5px] font-semibold text-faint underline-offset-2 hover:text-ivory hover:underline"
                        >
                          change
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {s.conflicts.length === 0 && (
                <p className="rounded-xl border border-dashed border-line-2 p-5 text-center text-[12.5px] text-faint">
                  No conflicts detected across your documents — unusually clean.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* right column: questions preview + merge drawer */}
        <div className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-gold/25 bg-gold/[0.06]">
                <HelpCircle className="h-4 w-4 text-gold" />
              </span>
              <div>
                <h2 className="font-display text-xl font-normal text-ivory">Still invisible to the AI</h2>
                <p className="text-[11.5px] text-faint">These become your only questions — nothing more.</p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              {s.missing.map((m) => (
                <div key={m.id} className="rounded-xl border border-line bg-ink-2/40 px-4 py-3">
                  <div className="text-[12.5px] font-semibold text-ivory-dim">{m.label}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-faint">{m.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <button onClick={() => setDrawer(!drawer)} className="flex w-full items-center justify-between">
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-gold/25 bg-gold/[0.06]">
                  <GitMerge className="h-4 w-4 text-gold" />
                </span>
                <span className="text-left">
                  <span className="font-display block text-base text-ivory">Merge ledger</span>
                  <span className="text-[11px] text-faint">How facts were combined</span>
                </span>
              </span>
              <ChevronDown className={`h-4 w-4 text-mist transition-transform ${drawer ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {drawer && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-2 border-t border-line pt-4 font-mono text-[11px] leading-relaxed">
                    <Line l="identity" v="2 persons · 1 child" />
                    <Line l="income sources" v="2 salaries + interest + dividends" />
                    <Line l="deduction docs" v="3a × 2 · premiums · kita · donation · medical" />
                    <Line l="wealth sources" v="bank + 8 securities positions" />
                    <Line l="conflicts quarantined" v={`${s.conflicts.length} items held for your decision`} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={`panel p-6 ${allResolved ? "glow-gold border-gold/35" : ""}`}>
            <div className="flex items-start gap-3">
              <Sparkles className={`mt-1 h-4 w-4 ${allResolved ? "text-gold" : "text-faint"}`} />
              <p className="text-[12.5px] leading-relaxed text-mist">
                {allResolved
                  ? "The dossier is consistent — identity confirmed, contradictions settled. The assistant will now ask only the remaining questions."
                  : `Confirm ${s.conflicts.length - resolvedCount + profileConflictCount - profile.filter((e) => e.status === "conflict" && s.profileChoices[e.key]).length} remaining contradiction(s) above to unlock the question round.`}
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/questions")}
              disabled={!allResolved}
              className="btn-gold mt-4 w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue to smart questions
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-faint">{l}</span>
      <span className="text-right text-ivory-dim">{v}</span>
    </div>
  );
}
