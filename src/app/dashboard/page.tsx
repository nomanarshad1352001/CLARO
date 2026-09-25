"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Calculator,
  Check,
  FileText,
  Fingerprint,
  FolderUp,
  MapPin,
  MessageSquareText,
  ScanSearch,
  Send,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { STEPS, stepStatus } from "@/lib/steps";
import { useGates, ICONS } from "@/components/app/shell";
import { useT } from "@/lib/i18n";
import { RingProgress, Reveal } from "@/components/ui";
import { visibleQuestions } from "@/lib/questions";
import { fmtChf } from "@/lib/format";

const ACT_ICONS: Record<string, React.ReactNode> = {
  user: <User className="h-3.5 w-3.5" />,
  "map-pin": <MapPin className="h-3.5 w-3.5" />,
  sparkles: <Sparkles className="h-3.5 w-3.5" />,
  fingerprint: <Fingerprint className="h-3.5 w-3.5" />,
  message: <MessageSquareText className="h-3.5 w-3.5" />,
  chart: <TrendingUp className="h-3.5 w-3.5" />,
  send: <Send className="h-3.5 w-3.5" />,
  calc: <Calculator className="h-3.5 w-3.5" />,
  folder: <FolderUp className="h-3.5 w-3.5" />,
};

export default function OverviewPage() {
  const s = useApp();
  const gates = useGates();
  const { t } = useT();
  const doneCount = STEPS.filter((st) => stepStatus(st.key, gates) === "done").length;
  const pct = Math.round((doneCount / STEPS.length) * 100);
  const openQuestions = s.processed
    ? visibleQuestions(s.answers).filter((q) => !s.answers.some((a) => a.questionId === q.id)).length
    : 0;
  const next = STEPS.find((st) => stepStatus(st.key, gates) === "active");

  const hour = new Date().getHours();
  const greet = hour < 11 ? t("ov.greet.morning") : hour < 18 ? t("ov.greet.day") : t("ov.greet.evening");

  return (
    <div>
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="kicker">{t("ov.commandcentre")}</span>
          <h1 className="font-display mt-2 text-4xl font-light text-ivory sm:text-5xl">
            {greet},{" "}
            <span className="display-italic gold-text">{s.session?.name.split(" ")[0] ?? "there"}</span>
          </h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-mist">
            {gates.filed
              ? t("ov.filedState")
              : next
                ? `${t("ov.next")}: ${t(`step.${next.key}.t`)} — ${t(`step.${next.key}.s`)}.`
                : "Everything is in place."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RingProgress pct={pct} size={64} stroke={4} />
          <div>
            <div className="num text-2xl text-ivory">{pct}%</div>
            <div className="font-mono text-[9.5px] tracking-[0.2em] text-faint uppercase">{t("ov.progress")}</div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: FileText,
            label: "Documents merged",
            val: s.processed ? String(s.docs.length) : "—",
            sub: s.processed ? `${s.docs.filter((d) => d.status === "done").length} parsed · ${s.conflicts.length} conflicts found` : "Upload to begin",
            href: "/dashboard/documents",
          },
          {
            icon: MessageSquareText,
            label: "Open questions",
            val: s.processed ? (s.questionsDone ? "0" : String(openQuestions)) : "—",
            sub: s.questionsDone ? "All answered by you" : "Asked only when unseen in documents",
            href: "/dashboard/questions",
          },
          {
            icon: TrendingUp,
            label: "Deductions discovered",
            val: s.calc ? fmtChf(s.calc.totalDeductionsCantonal) : "—",
            sub: s.calc ? `${s.calc.deductionLines.length} positions with sources` : "Revealed after calculation",
            href: "/dashboard/calculation",
          },
          {
            icon: Calculator,
            label: "Estimated total tax",
            val: s.calc ? fmtChf(s.calc.totalAfterCredits) : "—",
            sub: s.calc ? `Effective ${(s.calc.effectiveRate * 100).toFixed(1)}% · ${s.calc.municipality}` : "Deterministic engine",
            href: "/dashboard/calculation",
          },
        ].map((k, i) => (
          <Reveal key={k.label} delay={i}>
            <Link href={k.href} className="panel panel-hover group block h-full p-5">
              <div className="flex items-center justify-between">
                <k.icon className="h-4.5 w-4.5 text-gold" />
                <ArrowUpRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold" />
              </div>
              <div className="num mt-4 text-[26px] text-ivory">{k.val}</div>
              <div className="mt-0.5 font-mono text-[9.5px] tracking-[0.2em] text-faint uppercase">{k.label}</div>
              <div className="mt-2 text-[11.5px] leading-snug text-mist">{k.sub}</div>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* workflow steps */}
        <Reveal>
          <div className="panel h-full p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-normal text-ivory">Declaration workflow</h2>
              {next && (
                <Link href={next.href} className="btn-gold px-4 py-2 text-[12.5px]">
                  Continue: {next.title} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
              {!next && gates.filed && (
                <span className="flex items-center gap-1.5 rounded-full border border-ok/40 bg-ok/10 px-3 py-1.5 font-mono text-[10px] tracking-widest text-ok uppercase">
                  <BadgeCheck className="h-3.5 w-3.5" /> Return filed
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {STEPS.map((st) => {
                const status = stepStatus(st.key, gates);
                return (
                  <Link
                    key={st.key}
                    href={st.href}
                    className={`group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-colors ${
                      status === "done"
                        ? "border-line bg-white/[0.015] hover:border-gold/30"
                        : status === "active"
                          ? "border-gold/30 bg-gold/[0.05] hover:border-gold/50"
                          : "border-line/50 opacity-50 hover:opacity-75"
                    }`}
                  >
                    <span className={`grid h-8 w-8 place-items-center rounded-lg ${status === "done" ? "bg-gold/12" : "bg-white/[0.04]"}`}>
                      {status === "done" ? <Check className="h-3.5 w-3.5 text-gold" /> : <span className="text-gold/90">{ICONS[st.icon]}</span>}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[13.5px] font-semibold text-ivory">
                        <span className="num mr-2 text-[10px] text-faint">{st.num}</span>
                        {st.title}
                      </span>
                      <span className="block text-[11.5px] text-faint">{st.sub}</span>
                    </span>
                    <span
                      className={`font-mono text-[9.5px] tracking-[0.18em] uppercase ${
                        status === "done" ? "text-gold" : status === "active" ? "text-gold-2" : "text-faint"
                      }`}
                    >
                      {status === "done" ? "Done" : status === "active" ? "Next" : "Locked"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* activity feed */}
        <Reveal delay={1}>
          <div className="panel flex h-full flex-col p-6">
            <h2 className="font-display text-xl font-normal text-ivory">AI activity</h2>
            <p className="mt-1 text-[11.5px] text-faint">Every action the system takes, logged for you.</p>
            <div className="mt-5 flex-1 space-y-4">
              {s.activity.length === 0 && (
                <div className="rounded-xl border border-dashed border-line-2 p-5 text-center text-[12px] text-faint">
                  No activity yet. Set your jurisdiction to wake the assistant up.
                </div>
              )}
              {[...s.activity].reverse().slice(0, 8).map((a) => (
                <div key={a.id} className="flex gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/25 bg-gold/[0.06] text-gold">
                    {ACT_ICONS[a.icon] ?? <Sparkles className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] leading-snug text-ivory-dim">{a.text}</p>
                    <span className="num text-[10px] text-faint">{a.at}</span>
                  </div>
                </div>
              ))}
            </div>
            {!gates.setupDone && (
              <Link href="/dashboard/setup" className="btn-gold mt-6 w-full px-4 py-3 text-sm">
                <FolderUp className="h-4 w-4" /> Start: choose jurisdiction
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
