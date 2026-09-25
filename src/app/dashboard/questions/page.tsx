"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BotMessageSquare,
  Check,
  CheckCheck,
  CornerDownRight,
  Minus,
  Pencil,
  Sparkles,
} from "lucide-react";
import { LockedState, PageHead } from "@/components/app/shell";
import { useApp, genId } from "@/lib/store";
import { visibleQuestions, commuteAddresses, type Question } from "@/lib/questions";
import { estimateCommute } from "@/lib/geo";
import { Navigation } from "lucide-react";
import { fmtNum } from "@/lib/format";

function displayFor(q: Question, value: string | number | boolean): string {
  if (q.kind === "toggle") return value ? "Yes" : "No";
  if (q.kind === "amount") return `CHF ${fmtNum(Number(value))}`;
  if (q.kind === "distance") return `${value} km / day`;
  return q.options?.find((o) => o.value === value)?.label ?? String(value);
}

export default function QuestionsPage() {
  const router = useRouter();
  const s = useApp();
  const [typing, setTyping] = useState(false);
  const [amount, setAmount] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const geo = commuteAddresses(s.docs);
  const est = estimateCommute(geo.home, geo.work);

  const allResolved = s.conflicts.every((c) => c.resolved !== undefined);
  const ready = s.processed && allResolved;

  const questions = visibleQuestions(s.answers);
  const activeIdx = questions.findIndex((q) => !s.answers.some((a) => a.questionId === q.id));
  const finished = activeIdx === -1 && questions.length > 0;
  const active = activeIdx >= 0 ? questions[activeIdx] : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [s.answers.length, typing]);

  useEffect(() => {
    if (finished && !s.questionsDone) s.setQuestionsDone(true);
  }, [finished, s]);

  const submit = (q: Question, value: string | number | boolean) => {
    setTyping(true);
    setAmount("");
    setTimeout(() => {
      s.answer({ questionId: q.id, value, display: displayFor(q, value), at: new Date().toISOString() });
      setTyping(false);
    }, 650);
  };

  if (!s.processed || !allResolved) {
    return (
      <LockedState
        step={!s.processed ? "Documents" : "AI review"}
        message={
          !s.processed
            ? "The assistant only formulates questions after reading your documents — that is the whole point."
            : "Settle the open conflicts first; your answers change what the AI needs to ask."
        }
        ctaHref={!s.processed ? "/dashboard/documents" : "/dashboard/review"}
        ctaLabel={!s.processed ? "Go to documents" : "Resolve conflicts"}
      />
    );
  }

  const answeredCount = questions.filter((q) => s.answers.some((a) => a.questionId === q.id)).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div>
        <PageHead
          kicker="Step 04 · Smart questions"
          title={
            <>
              Only the <span className="display-italic gold-text">gaps</span>
            </>
          }
          sub="Every fact already present in your documents was applied silently. What follows is the exact remainder the law requires and no document can provide."
        />

        {/* chat */}
        <div className="panel flex min-h-[520px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="relative grid h-9 w-9 place-items-center rounded-full border border-gold/30 bg-gold/[0.08]">
                <BotMessageSquare className="h-4 w-4 text-gold" />
                <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel bg-ok" />
              </span>
              <div>
                <div className="text-[13px] font-semibold text-ivory">CLARO Assistant</div>
                <div className="num text-[10px] text-faint">
                  {finished ? "dossier complete" : `question ${Math.min(activeIdx + 1, questions.length)} of ${questions.length}`}
                </div>
              </div>
            </div>
            <span className="num rounded-full bg-white/[0.04] px-3 py-1 text-[10px] text-mist">
              {answeredCount} answered
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-6" style={{ maxHeight: 560 }}>
            {/* intro */}
            <AiBubble>
              I merged <b className="text-gold-2">{s.docs.length} documents</b> into your dossier. A handful of
              facts are still missing — I will ask for those one by one, and nothing else.
            </AiBubble>

            {questions.map((q, i) => {
              const ans = s.answers.find((a) => a.questionId === q.id);
              const isActive = q.id === active?.id;
              return (
                <div key={q.id} className="space-y-4">
                  {ans ? (
                    <>
                      <AiBubble faded>
                        <span className="flex items-center gap-2">
                          <CheckCheck className="h-3.5 w-3.5 text-ok" />
                          {q.prompt}
                        </span>
                      </AiBubble>
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-gold/30 bg-gold/[0.08] px-4 py-3">
                          <div className="num text-[13.5px] text-gold-2">{ans.display}</div>
                          <button
                            onClick={() => s.editAnswer(q.id)}
                            className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-faint hover:text-ivory"
                          >
                            <Pencil className="h-2.5 w-2.5" /> change
                          </button>
                        </div>
                      </div>
                    </>
                  ) : isActive ? (
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <AiBubble>{q.prompt}</AiBubble>
                      <div className="pl-11">
                        <div className="mb-3 flex items-start gap-2 rounded-xl border border-line bg-ink-2/50 px-3.5 py-2.5">
                          <CornerDownRight className="mt-0.5 h-3 w-3 shrink-0 text-gold/70" />
                          <p className="text-[11px] leading-relaxed text-faint">{q.why}</p>
                        </div>
                        {q.id === "commute-km" && est.ok && (
                          <div className="mb-3 rounded-xl border border-gold/35 bg-gold/[0.05] px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Navigation className="h-3.5 w-3.5 text-gold" />
                              <span className="text-[12px] font-semibold text-ivory">Distance computed automatically</span>
                            </div>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-mist">
                              Home <b className="text-ivory-dim">{est.homeLabel}</b> → workplace <b className="text-ivory-dim">{est.workLabel}</b> ·
                              {" "}{est.straightKm} km straight line, ≈{est.routeKm} km by road ({est.homeMatch}, {est.workMatch}).
                            </p>
                            <button type="button" onClick={() => submit(q, est.dailyRoundTripKm ?? 0)}
                              className="btn-gold mt-3 px-4 py-2 text-[12px]">
                              Use {est.dailyRoundTripKm} km / day round trip
                            </button>
                            <p className="mt-2 text-[10px] text-faint">Or type your own value below if your route differs.</p>
                          </div>
                        )}
                        <AnswerInput q={q} amount={amount} setAmount={setAmount} onSubmit={submit} disabled={typing} />
                      </div>
                    </motion.div>
                  ) : i > activeIdx && activeIdx >= 0 ? null : null}
                </div>
              );
            })}

            {typing && (
              <div className="flex items-center gap-2 pl-11 text-mist">
                <span className="pulse-soft h-1.5 w-1.5 rounded-full bg-gold" />
                <span className="pulse-soft h-1.5 w-1.5 rounded-full bg-gold" style={{ animationDelay: "0.2s" }} />
                <span className="pulse-soft h-1.5 w-1.5 rounded-full bg-gold" style={{ animationDelay: "0.4s" }} />
                <span className="ml-2 text-[11px]">Applying your answer…</span>
              </div>
            )}

            {finished && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <AiBubble gold>
                  Perfect — that was everything. Your dossier is now complete:{" "}
                  <b className="text-gold-2">{answeredCount} answers</b> from you,{" "}
                  <b className="text-gold-2">
                    {s.docs.reduce((a, d) => a + (d.fields?.length ?? 0), 0)} fields
                  </b>{" "}
                  from your documents. Next, I prepared your securities for confirmation.
                </AiBubble>
              </motion.div>
            )}
          </div>

          {finished && (
            <div className="border-t border-line p-5">
              <button onClick={() => router.push("/dashboard/securities")} className="btn-gold w-full px-5 py-3.5 text-sm">
                Continue to securities
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* side: what was NOT asked */}
      <div className="space-y-6 xl:pt-24">
        <div className="panel p-6">
          <span className="kicker">Not asked — already known</span>
          <p className="mt-2 text-[11.5px] leading-relaxed text-faint">
            Other tools would make you type these in. CLARO read them from your documents instead.
          </p>
          <div className="mt-4 space-y-2.5">
            {[
              { q: "Your full name?", a: "Steuererklärung 2024 + assessment" },
              { q: "Date of birth?", a: "14.06.1989 · 2 official sources" },
              { q: "AHV number?", a: "Cross-checked across 3 documents" },
              { q: "Your address?", a: "Aufforderung 2025 + Lohnausweis" },
              { q: "How far is your workplace?", a: est.ok ? `${est.routeKm} km — geo-computed` : "Derived from addresses" },
              { q: "What is your gross salary?", a: "Read from 2 Lohnausweise" },
              { q: "Civil status?", a: "Prior return: married, joint filing" },
              { q: "Do you have children?", a: "1 child — prior return + Kita" },
              { q: "Health insurance premiums?", a: "CHF 9'264 · Helsana statement" },
              { q: "Pillar 3a contributions?", a: "2 certificates · VIAC" },
              { q: "Pillar 2 buy-in (Einkauf)?", a: "CHF 6'000 · BVG-Ausweis PKG" },
              { q: "Education & training costs?", a: "CAS Digital Taxation · HSG receipt" },
              { q: "Crypto holdings & staking?", a: "Bitcoin Suisse tax report parsed" },
              { q: "Bank balances on 31.12?", a: "PostFinance tax statement" },
            ].map((x) => (
              <div key={x.q} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-ink-2/40 px-4 py-2.5">
                <span className="flex items-start gap-2 text-[12px] text-ivory-dim">
                  <Minus className="mt-0.5 h-3 w-3 shrink-0 text-gold/60" />
                  {x.q}
                </span>
                <span className="text-right text-[10.5px] leading-snug text-faint">{x.a}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p className="text-[12px] leading-relaxed text-mist">
              Question discipline is a feature: every question here exists because a document could
              not answer it. The checklist on the left is the proof.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiBubble({ children, faded, gold }: { children: React.ReactNode; faded?: boolean; gold?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold/25 bg-gold/[0.07]">
        <BotMessageSquare className={`h-3.5 w-3.5 ${faded ? "text-mist" : "text-gold"}`} />
      </span>
      <div
        className={`max-w-[85%] rounded-2xl rounded-tl-sm border px-4 py-3 text-[13px] leading-relaxed ${
          gold
            ? "border-gold/40 bg-gold/[0.08] text-ivory"
            : faded
              ? "border-line bg-ink-2/40 text-mist"
              : "border-line-2 bg-panel-2 text-ivory"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function AnswerInput({
  q,
  amount,
  setAmount,
  onSubmit,
  disabled,
}: {
  q: Question;
  amount: string;
  setAmount: (v: string) => void;
  onSubmit: (q: Question, v: string | number | boolean) => void;
  disabled: boolean;
}) {
  if (q.kind === "toggle") {
    return (
      <div className="flex gap-2.5">
        {[
          { v: true, l: "Yes" },
          { v: false, l: "No" },
        ].map((o) => (
          <button
            key={String(o.v)}
            disabled={disabled}
            onClick={() => onSubmit(q, o.v)}
            className="flex items-center gap-2 rounded-full border border-line-2 px-5 py-2.5 text-[13px] font-semibold text-ivory transition-colors hover:border-gold/50 hover:bg-gold/[0.06] disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5 text-gold" />
            {o.l}
          </button>
        ))}
      </div>
    );
  }
  if (q.kind === "chips" || q.kind === "choice-desc") {
    return (
      <div className="flex flex-wrap gap-2.5">
        {q.options?.map((o) => (
          <button
            key={o.value}
            disabled={disabled}
            onClick={() => onSubmit(q, o.value)}
            className={`rounded-full border border-line-2 px-4 py-2.5 text-left transition-colors hover:border-gold/50 hover:bg-gold/[0.06] disabled:opacity-40 ${
              q.kind === "choice-desc" ? "w-full sm:w-[calc(50%-5px)] rounded-2xl" : ""
            }`}
          >
            <span className="block text-[13px] font-semibold text-ivory">{o.label}</span>
            {o.sub && <span className="mt-0.5 block text-[10.5px] text-faint">{o.sub}</span>}
          </button>
        ))}
      </div>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(amount.replace(/['\s]/g, ""));
        if (!Number.isFinite(n) || n < 0) return;
        onSubmit(q, n);
      }}
      className="flex max-w-xs gap-2.5"
    >
      <div className="relative flex-1">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-[10px] text-faint">
          {q.unit}
        </span>
        <input
          autoFocus
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={q.placeholder}
          className="field pl-14 num"
        />
      </div>
      <button type="submit" disabled={disabled || !amount} className="btn-gold px-4 text-sm disabled:opacity-40">
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
