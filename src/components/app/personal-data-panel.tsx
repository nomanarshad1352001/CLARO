"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  Fingerprint,
  Lock,
  ScanFace,
  Star,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { buildPersonalProfile, profileResolved } from "@/lib/personal-data";
import type { ProfileEntry } from "@/lib/types";

export default function PersonalDataPanel() {
  const s = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  const entries = useMemo(() => buildPersonalProfile(s.docs), [s.docs]);

  const auto = entries.filter((e) => e.status === "auto").length;
  const conflicts = entries.filter((e) => e.status === "conflict");
  const resolvedConflicts = conflicts.filter((e) => s.profileChoices[e.key]).length;
  const missing = entries.filter((e) => e.status === "missing").length;
  const locked = profileResolved(entries, s.profileChoices);

  return (
    <div className={`panel overflow-hidden ${locked ? "border-ok/30" : "glow-gold border-gold/35"}`}>
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5">
        <div className="flex items-center gap-3.5">
          <span className={`grid h-10 w-10 place-items-center rounded-xl border ${locked ? "border-ok/30 bg-ok/[0.07]" : "border-gold/30 bg-gold/[0.07]"}`}>
            <Fingerprint className={`h-5 w-5 ${locked ? "text-ok" : "text-gold"}`} />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-ivory">
              Personal data automation
            </h2>
            <p className="text-[11.5px] text-faint">
              Identity read from prior returns, assessments & official letters — contradictions confirmed by you, never guessed.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="num rounded-full border border-ok/30 bg-ok/[0.07] px-3 py-1 text-[10.5px] text-ok">
            {auto} auto-filled
          </span>
          {conflicts.length > 0 && (
            <span className={`num rounded-full border px-3 py-1 text-[10.5px] ${resolvedConflicts === conflicts.length ? "border-ok/30 bg-ok/[0.07] text-ok" : "border-alert/35 bg-alert/[0.07] text-alert"}`}>
              {resolvedConflicts}/{conflicts.length} confirmed
            </span>
          )}
          {missing > 0 && (
            <span className="num rounded-full border border-line-2 bg-white/60 px-3 py-1 text-[10.5px] text-faint">
              {missing} open
            </span>
          )}
        </div>
      </div>

      {/* entries */}
      <div className="divide-y divide-line/70">
        {entries.map((e) => (
          <EntryRow
            key={e.key}
            entry={e}
            expanded={expanded === e.key}
            onToggle={() => setExpanded(expanded === e.key ? null : e.key)}
            choice={s.profileChoices[e.key]}
            onChoose={(v) => s.chooseProfile(e.key, v)}
            onUnchoose={() => s.unchooseProfile(e.key)}
          />
        ))}
      </div>

      {/* footer */}
      <div className={`flex items-center justify-between gap-4 px-6 py-4 ${locked ? "bg-ok/[0.04]" : "bg-panel-2"}`}>
        <div className="flex items-center gap-2.5 text-[12px]">
          {locked ? (
            <>
              <Lock className="h-3.5 w-3.5 text-ok" />
              <span className="font-semibold text-ok">Identity locked</span>
              <span className="text-faint">— every personal field carries a cited source.</span>
            </>
          ) : (
            <>
              <ScanFace className="h-3.5 w-3.5 text-alert" />
              <span className="text-mist">
                {conflicts.length - resolvedConflicts} contradiction(s) need your confirmation before the return can use them.
              </span>
            </>
          )}
        </div>
        <span className="num text-[10.5px] text-faint">
          {entries.reduce((a, e) => a + e.candidates.length, 0)} data points · {new Set(entries.flatMap((e) => e.candidates.map((c) => c.docId))).size} documents
        </span>
      </div>
    </div>
  );
}

function EntryRow({
  entry: e,
  expanded,
  onToggle,
  choice,
  onChoose,
  onUnchoose,
}: {
  entry: ProfileEntry;
  expanded: boolean;
  onToggle: () => void;
  choice?: string;
  onChoose: (v: string) => void;
  onUnchoose: () => void;
}) {
  const decided = choice !== undefined;
  return (
    <div className={`${e.status === "conflict" && !decided ? "bg-alert/[0.035]" : ""}`}>
      <button onClick={onToggle} className="flex w-full items-center gap-4 px-6 py-3.5 text-left">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
            e.status === "auto"
              ? "bg-ok/[0.09]"
              : e.status === "conflict"
                ? decided
                  ? "bg-ok/[0.09]"
                  : "bg-alert/[0.1]"
                : "bg-panel-3"
          }`}
        >
          {e.status === "auto" ? (
            <Check className="h-3.5 w-3.5 text-ok" />
          ) : e.status === "conflict" ? (
            decided ? <BadgeCheck className="h-3.5 w-3.5 text-ok" /> : <CircleAlert className="h-3.5 w-3.5 text-alert" />
          ) : (
            <CircleHelp className="h-3.5 w-3.5 text-faint" />
          )}
        </span>

        <span className="w-44 shrink-0 text-[12.5px] font-semibold text-ivory-dim">{e.label}</span>

        <span className="min-w-0 flex-1">
          {e.status === "auto" && (
            <span className="block truncate text-[13px] text-ivory">
              {e.key === "ahv" || e.key === "incomeCurrent" ? <span className="num">{e.value}</span> : e.value}
            </span>
          )}
          {e.status === "conflict" && (
            <span className={`block truncate text-[13px] ${decided ? "text-ivory" : "text-alert"}`}>
              {decided ? choice : `${e.candidates.length} contradicting values — confirmation required`}
            </span>
          )}
          {e.status === "missing" && (
            <span className="block truncate text-[12px] text-faint italic">
              Not found yet — add a prior return, assessment or official letter
            </span>
          )}
        </span>

        <span className="hidden shrink-0 items-center gap-3 sm:flex">
          {e.candidates.length > 0 && (
            <span className="num text-[10px] text-faint">
              {e.candidates.length} src{e.candidates.length > 1 ? "s" : ""}
            </span>
          )}
          {e.status === "auto" && e.confidence !== undefined && (
            <span className={`num text-[10px] ${e.confidence >= 0.95 ? "text-ok" : "text-mist"}`}>
              {Math.round(e.confidence * 100)}%
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-faint transition-transform ${expanded ? "rotate-180" : ""}`} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-panel-2/70 px-6 pt-1 pb-5 pl-[4.75rem]">
              {e.status === "conflict" && !decided && (
                <p className="mb-3 max-w-xl text-[11.5px] leading-relaxed text-mist">
                  These documents contradict each other. Select the correct value — it will be used
                  everywhere in the return. If marked, the starred option is the system&rsquo;s suggestion (
                  {e.suggestedReason}).
                </p>
              )}
              <div className={`grid gap-2 ${e.status === "conflict" && !decided ? "sm:grid-cols-2" : ""}`}>
                {dedupeCandidates(e).map((c) => {
                  const isSuggested = e.status === "conflict" && c.value === e.suggested;
                  const isChosen = decided && choice === c.value;
                  if (e.status === "conflict" && !decided) {
                    return (
                      <button
                        key={`${c.docId}-${c.value}`}
                        onClick={() => onChoose(c.value)}
                        className={`rounded-xl border px-4 py-3 text-left transition-colors hover:border-gold/50 hover:bg-gold/[0.05] ${
                          isSuggested ? "border-gold/40 bg-gold/[0.04]" : "border-line-2 bg-white/60"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`text-[13px] font-semibold ${e.key === "ahv" ? "num" : ""} text-ivory`}>{c.value}</span>
                          {isSuggested && (
                            <span className="flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 font-mono text-[8.5px] tracking-widest text-gold uppercase">
                              <Star className="h-2.5 w-2.5" /> suggested
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block truncate text-[10.5px] text-faint">{c.source}</span>
                        <span className="num mt-0.5 block text-[9.5px] text-faint">
                          OCR confidence {Math.round(c.confidence * 100)}%
                        </span>
                      </button>
                    );
                  }
                  return (
                    <div
                      key={`${c.docId}-${c.value}`}
                      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-2.5 ${
                        isChosen ? "border-ok/35 bg-ok/[0.05]" : "border-line bg-white/50"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className={`block truncate text-[12px] ${isChosen ? "font-semibold text-ok" : "text-ivory-dim"}`}>
                          {c.value}
                        </span>
                        <span className="block truncate text-[10px] text-faint">{c.source}</span>
                      </span>
                      <span className="num shrink-0 text-[9.5px] text-faint">{Math.round(c.confidence * 100)}%</span>
                    </div>
                  );
                })}
              </div>
              {decided && (
                <button
                  onClick={onUnchoose}
                  className="mt-3 text-[10.5px] font-semibold text-faint underline-offset-2 hover:text-gold hover:underline"
                >
                  reconsider this field
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function dedupeCandidates(e: ProfileEntry) {
  if (e.status === "auto") {
    return e.candidates;
  }
  const seen = new Map<string, (typeof e.candidates)[number]>();
  for (const c of e.candidates) {
    if (!seen.has(c.value)) seen.set(c.value, { ...c });
  }
  return [...seen.values()];
}
