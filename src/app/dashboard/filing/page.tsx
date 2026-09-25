"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  Download,
  FileJson,
  FileSignature,
  Landmark,
  Lock,
  Printer,
  Send,
} from "lucide-react";
import { LockedState, PageHead } from "@/components/app/shell";
import { useApp } from "@/lib/store";
import { STEPS, stepStatus } from "@/lib/steps";
import { getCanton } from "@/lib/tax-data";
import { fmtChf } from "@/lib/format";
import type { FilingResult } from "@/lib/types";
import { buildPersonalProfile, lockedProfile } from "@/lib/personal-data";
import { numericField } from "@/lib/questions";

export default function FilingPage() {
  const router = useRouter();
  const s = useApp();
  const [sig, setSig] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acked, setAcked] = useState(false);
  const [finalReview, setFinalReview] = useState(false);
  const [finalCheck, setFinalCheck] = useState(false);

  const gates = {
    setupDone: !!s.setup,
    processed: s.processed,
    conflictsResolved: s.conflicts.every((c) => c.resolved !== undefined),
    questionsDone: s.questionsDone,
    incomeDone: s.incomeConfirmed,
    securitiesDone: s.securitiesConfirmed,
    propertyDone: s.propertyConfirmed,
    calcDone: !!s.calc,
    filed: !!s.filing,
  };
  const ready =
    gates.setupDone && gates.processed && gates.conflictsResolved && gates.questionsDone &&
    gates.incomeDone && gates.securitiesDone && gates.propertyDone && gates.calcDone;

  useEffect(() => {
    if (s.filing && !acked) {
      const t = setTimeout(() => setAcked(true), 5200);
      return () => clearTimeout(t);
    }
  }, [s.filing, acked]);

  const canton = s.setup ? getCanton(s.setup.canton) : null;
  const prof = lockedProfile(buildPersonalProfile(s.docs), s.profileChoices);
  const sigMatches = s.session ? sig.trim().toLowerCase() === s.session.name.trim().toLowerCase() : false;
  const canSubmit = ready && confirmed && sigMatches && !submitting && !s.filing;

  const submit = async () => {
    if (!s.setup) return;
    setSubmitting(true);
    const res = await fetch("/api/filing/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canton: s.setup.canton,
        municipality: s.setup.municipalityId,
        year: s.setup.year,
        taxpayer: s.session?.name,
      }),
    });
    const data = await res.json();
    s.setFiling(data as FilingResult);
    s.setConfirmedResponsibility(true);
    setSubmitting(false);
    setAcked(false);
  };

  const downloadJson = () => {
    if (!s.setup || !s.calc) return;
    const payload = {
      taxpayer: s.session,
      jurisdiction: s.setup,
      answers: s.answers,
      documents: s.docs.map((d) => ({ file: d.fileName, type: d.typeLabel, summary: d.summary })),
      holdings: s.holdings,
      calculation: s.calc,
      filing: s.filing,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `claro-steuererklaerung-${s.setup.year}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const printOfficial = () => {
    if (!s.setup || !s.calc) return;
    const c = s.calc;
    const rows = [
      ["Gross income", fmtChf(c.grossIncome)],
      ["Total deductions (cantonal)", `− ${fmtChf(c.totalDeductionsCantonal)}`],
      ["Taxable income · federal", fmtChf(c.taxableIncomeFederal)],
      ["Taxable income · cantonal", fmtChf(c.taxableIncomeCantonal)],
      ["Direct federal tax", fmtChf(c.federalTax)],
      [`Cantonal tax (${c.cantonCode})`, fmtChf(c.cantonalTax)],
      [`Municipal tax (${c.municipality})`, fmtChf(c.municipalTax)],
      ["Church tax", fmtChf(c.churchTax)],
      ["Wealth tax", fmtChf(c.wealthTax)],
      ["Personal tax", fmtChf(c.personalTax)],
      ["Child credits", `− ${fmtChf(c.childCredits)}`],
      ["DA-1 foreign tax credits", `− ${fmtChf(c.da1Credit, { decimals: true })}`],
      ["Total (estimate)", fmtChf(c.totalAfterCredits)],
      ["35% anticipatory tax refund (RÜF)", fmtChf(c.withholdingRefundCH, { decimals: true })],
    ];
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>CLARO — Steuererklärung ${c.year}</title>
      <style>body{font-family:Georgia,serif;color:#141414;max-width:760px;margin:48px auto;padding:0 24px}
      h1{font-weight:400;font-size:26px;border-bottom:2px solid #d92e25;padding-bottom:12px}
      .meta{color:#555;font-size:12px;margin:12px 0 28px}
      table{width:100%;border-collapse:collapse;font-size:13.5px}
      td{padding:8px 4px;border-bottom:1px solid #e3dfd2}
      td:last-child{text-align:right;font-variant-numeric:tabular-nums}
      .sig{margin-top:44px;font-size:12.5px;color:#333}
      .k{font-weight:600}
      .foot{margin-top:36px;font-size:11px;color:#777;border-top:1px solid #ddd;padding-top:12px}</style></head><body>
      <h1>Steuererklärung ${c.year} — Zusammenfassung</h1>
      <div class="meta">Steuerpflichtige Person: <b>${s.session?.name ?? ""}</b> · Wohngemeinde: <b>${s.setup?.municipality}</b>, Kanton <b>${s.setup?.canton}</b> · erstellt mit CLARO Rules Engine v1.2 · ${new Date().toLocaleDateString("de-CH")}</div>
      <table>${rows.map((r) => `<tr><td>${r[0]}</td><td class="k">${r[1]}</td></tr>`).join("")}</table>
      <div class="sig">Ich bestätige, dass die Angaben nach bestem Wissen vollständig und wahrheitsgemäss sind (Art. 176 DBG).
      <br/><br/>Unterschrift: <b>${s.filing ? s.session?.name : "____________________"}</b> ${s.filing ? `· eingereicht elektronisch, Ref. ${s.filing.reference}` : ""}</div>
      <div class="foot">Schätzwert — die definitive Veranlagung erfolgt durch die kantonale Steuerverwaltung. CLARO Tax AG, Zürich.</div>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  if (!ready) {
    return (
      <LockedState
        step="Calculation"
        message="The filing desk opens once the deterministic calculation is locked in. Complete the workflow steps first."
        ctaHref="/dashboard/calculation"
        ctaLabel="Run the calculation"
      />
    );
  }

  return (
    <div>
      <PageHead
        kicker="Step 07 · Review & file"
        title={
          s.filing ? (
            <>
              Filed. <span className="display-italic gold-text">Beautifully.</span>
            </>
          ) : (
            <>
              One signature from <span className="display-italic gold-text">done</span>
            </>
          )
        }
        sub={
          s.filing
            ? `Reference ${s.filing.reference} — your declaration is with the tax office.`
            : "Review the completed return below, confirm your legal responsibility, and transmit. You stay in control until the very last click."
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        {/* left: completed return review */}
        <div className="space-y-6">
          {/* checklist */}
          <div className="panel p-6">
            <h3 className="font-display text-xl font-normal text-ivory">Pre-flight checklist</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {STEPS.slice(0, 8).map((st) => {
                const done = stepStatus(st.key, gates) === "done";
                return (
                  <div key={st.key} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${done ? "border-ok/25 bg-ok/[0.03]" : "border-line-2"}`}>
                    <span className={`grid h-5 w-5 place-items-center rounded-full ${done ? "bg-ok/15" : "bg-white/5"}`}>
                      <Check className={`h-3 w-3 ${done ? "text-ok" : "text-faint"}`} />
                    </span>
                    <span className="text-[12.5px] text-ivory-dim">{st.title}</span>
                    <span className={`ml-auto font-mono text-[9px] tracking-widest uppercase ${done ? "text-ok" : "text-faint"}`}>
                      {done ? "OK" : "open"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* return summary */}
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h3 className="font-display text-xl font-normal text-ivory">Completed tax return · {s.setup?.year}</h3>
              <button onClick={printOfficial} className="btn-ghost px-3.5 py-2 text-[12px]">
                <Printer className="h-3.5 w-3.5" /> Official summary
              </button>
            </div>
            <div className="divide-y divide-line/70">
              <Section title="Persons & household">
                <Row l="Taxpayer" v={prof.fullName ?? s.session?.name ?? "—"} />
                {prof.dateOfBirth && <Row l="Date of birth" v={prof.dateOfBirth} />}
                {prof.ahv && <Row l="AHV no." v={prof.ahv.replace(/(\d{3}\.\d{4})\.\d{4}\.(\d{2})/, "$1.••••.$2")} />}
                {prof.address && <Row l="Residence" v={prof.address} />}
                <Row l="Marital status" v={prof.maritalStatus ?? "Married — joint taxation"} />
                <Row l="Children" v={prof.children ?? "1 — third-party care"} />
                <Row l="Tax domicile 31.12" v={`${s.setup?.municipality}, canton ${s.setup?.canton}`} />
                <Row l="Registered community" v={String(s.answers.find((a) => a.questionId === "church-member")?.display ?? "—")} />
              </Section>
              <Section title="Income">
                <Row l="Combined employment income" v={fmtChf(s.docs.reduce((a, d) => a + (d.fields?.find((f) => f.key === "gross_salary")?.numeric ?? 0), 0))} />
                <Row l="Dividend & coupon income (gross)" v={fmtChf(s.holdings.reduce((a, h) => a + h.dividendGrossChf, 0), { decimals: true })} />
                <Row l="Interest income" v={`CHF ${numericField(s.docs, "interest_income").toLocaleString("de-CH")}`} />
                {numericField(s.docs, "staking_income") > 0 && (
                  <Row l="Crypto staking rewards" v={fmtChf(numericField(s.docs, "staking_income"))} />
                )}
                {numericField(s.docs, "rental_income") > 0 && (
                  <Row l="Rental income (net of maintenance)" v={fmtChf(numericField(s.docs, "rental_income"))} />
                )}
                {numericField(s.docs, "foreign_income") > 0 && (
                  <Row l="Foreign-source income (DTA)" v={fmtChf(numericField(s.docs, "foreign_income"))} />
                )}
                <Row l="Other income" v={fmtChf(Number(s.answers.find((a) => a.questionId === "other-income-amount")?.value ?? 0))} />
              </Section>
              <Section title={`Deductions · ${s.calc ? s.calc.deductionLines.length : 0} positions`}>
                {s.calc?.deductionLines.map((l) => <Row key={l.id} l={l.label} v={`− ${fmtChf(l.applied)}`} gold />)}
              </Section>
              <Section title={`Securities · ${s.holdings.length} positions`}>
                <Row l="Tax value 31.12" v={fmtChf(s.holdings.reduce((a, h) => a + h.valueChf, 0), { decimals: true })} />
                {numericField(s.docs, "crypto_value") > 0 && (
                  <Row l="Crypto assets 31.12 (FTA rates)" v={fmtChf(numericField(s.docs, "crypto_value"))} />
                )}
                <Row l="35% anticipatory tax (RÜF)" v={`+ ${fmtChf(s.calc?.withholdingRefundCH ?? 0, { decimals: true })} refund`} />
                <Row l="Foreign WHT credited (DA-1)" v={`− ${fmtChf(s.calc?.da1Credit ?? 0, { decimals: true })}`} />
              </Section>
              <Section title="Deterministic assessment (engine v1.2)">
                <Row l="Direct federal tax" v={fmtChf(s.calc?.federalTax ?? 0)} />
                <Row l="Cantonal tax" v={fmtChf(s.calc?.cantonalTax ?? 0)} />
                <Row l="Municipal tax" v={fmtChf(s.calc?.municipalTax ?? 0)} />
                <Row l="Church tax" v={fmtChf(s.calc?.churchTax ?? 0)} />
                <Row l="Wealth tax" v={fmtChf(s.calc?.wealthTax ?? 0)} />
                <Row l="Estimated total" v={fmtChf(s.calc?.totalAfterCredits ?? 0)} strong />
              </Section>
            </div>
          </div>
        </div>

        {/* right: signature & submission */}
        <div className="space-y-6">
          {!s.filing ? (
            <>
              <div className="panel glow-gold p-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold/30 bg-gold/[0.08]">
                    <FileSignature className="h-4.5 w-4.5 text-gold" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-normal text-ivory">Declaration of responsibility</h3>
                    <p className="text-[11px] text-faint">Art. 176 DBG / StG {s.setup?.canton}</p>
                  </div>
                </div>
                <p className="mt-4 text-[12.5px] leading-relaxed text-mist">
                  I confirm that I have reviewed the completed tax return and that all information is,
                  to the best of my knowledge, <b className="text-ivory">complete and correct</b>. I understand
                  that this declaration is legally binding and that false or incomplete statements are
                  punishable under tax law.
                </p>
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-ink-2/50 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#d92e25]"
                  />
                  <span className="text-[12px] leading-relaxed text-ivory-dim">
                    I accept responsibility for the content of this declaration.
                  </span>
                </label>
                <label className="mt-4 block">
                  <span className="mb-1.5 block font-mono text-[9.5px] tracking-[0.2em] text-faint uppercase">
                    Electronic signature — type your full name
                  </span>
                  <input
                    className="field num"
                    placeholder={s.session?.name ?? "Full name"}
                    value={sig}
                    onChange={(e) => setSig(e.target.value)}
                  />
                  <span className={`mt-1.5 block text-[10.5px] ${sigMatches ? "text-ok" : "text-faint"}`}>
                    {sig.length === 0
                      ? `Must match: ${s.session?.name}`
                      : sigMatches
                        ? "Signature verified against account holder"
                        : "Does not match the account holder"}
                  </span>
                </label>
                <button onClick={() => { setFinalReview(true); setFinalCheck(false); }} disabled={!canSubmit} className="btn-gold mt-5 w-full px-5 py-4 text-[15px] disabled:cursor-not-allowed disabled:opacity-40">
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                      Transmitting securely…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit tax return
                    </>
                  )}
                </button>
                <p className="mt-3.5 flex items-center justify-center gap-1.5 text-[10.5px] text-faint">
                  <Lock className="h-3 w-3" /> AES-256 · transmitted to {canton?.filingAgency} · opens the mandatory final review
                </p>
              </div>

              <div className="panel p-6">
                <h4 className="font-mono text-[10px] tracking-[0.22em] text-faint uppercase">How filing works here</h4>
                <div className="mt-3 space-y-3 text-[12px] leading-relaxed text-mist">
                  <p>
                    {canton?.eFiling
                      ? `Canton ${canton.name} accepts machine-readable declarations. CLARO validates your dossier against the official schema and transmits it directly — you receive the reference instantly.`
                      : `Canton ${canton?.name} has no public software interface. CLARO generates the official signed declaration file plus a print-ready PDF accepted by the tax office, with exact delivery instructions.`}
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.05] px-3.5 py-2.5 text-[11px] text-gold-2">
                    <Landmark className="h-3.5 w-3.5 shrink-0" />
                    Channel: {canton?.eFiling ? "direct e-filing" : "official export + instructions"}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="panel glow-gold overflow-hidden p-7">
                <div className="flex items-center gap-3.5">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.15 }}
                    className="grid h-12 w-12 place-items-center rounded-full bg-gold/15"
                  >
                    <BadgeCheck className="h-6 w-6 text-gold" />
                  </motion.span>
                  <div>
                    <h3 className="font-display text-2xl font-light text-ivory">Return transmitted</h3>
                    <p className="num text-[11.5px] text-gold-2">Ref. {s.filing.reference}</p>
                  </div>
                </div>
                <div className="mt-5 rounded-xl border border-line bg-ink-2/50 px-4 py-3 text-[11.5px] text-mist">
                  {s.filing.methodLabel}
                  <br />
                  <span className="num text-[10.5px] text-faint">
                    {new Date(s.filing.submittedAt).toLocaleString("de-CH")} · {s.filing.municipality}, {s.filing.canton}
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {(s.filing as unknown as { timeline?: { key: string; label: string; state: string }[] }).timeline?.map((t, i) => {
                    const done = t.state === "done" || (t.key === "acknowledged" && acked);
                    const pending = t.state === "pending" && !(t.key === "acknowledged" && acked);
                    return (
                      <motion.div
                        key={t.key}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.15 }}
                        className="flex items-start gap-3"
                      >
                        <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${done ? "bg-ok/15" : pending ? "bg-gold/15" : "bg-white/5"}`}>
                          {done ? (
                            <Check className="h-3 w-3 text-ok" />
                          ) : pending ? (
                            <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-faint" />
                          )}
                        </span>
                        <span className={`text-[12px] leading-snug ${done ? "text-ivory" : pending ? "text-gold-2" : "text-faint"}`}>
                          {t.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="panel p-6">
                <h4 className="font-mono text-[10px] tracking-[0.22em] text-faint uppercase">Your records</h4>
                <div className="mt-3 grid gap-2.5">
                  <button onClick={printOfficial} className="btn-ghost w-full px-4 py-3 text-[13px]">
                    <Download className="h-4 w-4 text-gold" /> Official PDF summary
                  </button>
                  <button onClick={downloadJson} className="btn-ghost w-full px-4 py-3 text-[13px]">
                    <FileJson className="h-4 w-4 text-gold" /> Machine-readable dossier (JSON)
                  </button>
                </div>
                <p className="mt-4 text-[10.5px] leading-relaxed text-faint">
                  Keep both files with your source documents (10-year retention). When the official
                  assessment arrives, compare it line-by-line in the overview.
                </p>
              </div>
            </motion.div>
          )}

          <div className="panel p-6">
            <h4 className="font-mono text-[10px] tracking-[0.22em] text-faint uppercase">Need a human?</h4>
            <p className="mt-2.5 text-[12px] leading-relaxed text-mist">
              Premium plans include a certified expert review and the drafting of an objection letter
              (Einsprache) if the assessment deviates.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 w-full rounded-xl border border-line-2 py-2.5 text-[12px] font-semibold text-ivory-dim transition-colors hover:border-gold/40 hover:text-ivory"
            >
              Back to the command centre
            </button>
          </div>
        </div>
      </div>

      {/* ---- mandatory final confirmation ---- */}
      <AnimatePresence>
        {finalReview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/70 p-5 backdrop-blur-sm"
            onClick={() => !submitting && setFinalReview(false)}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()} className="panel my-8 w-full max-w-lg p-8">
              <span className="kicker">Letzte Prüfung · Final review</span>
              <h3 className="font-display mt-3 text-3xl font-semibold leading-tight text-ivory">
                Steuererklärung {s.setup?.year} — {s.setup?.municipality}, {s.setup?.canton}
              </h3>
              <div className="mt-4 grid gap-2 rounded-2xl border border-line bg-panel-2 p-4">
                {[
                  ["Einkommen / Income", fmtChf(s.calc?.grossIncome ?? 0)],
                  ["Abzüge / Deductions", `− ${fmtChf(s.calc?.totalDeductionsCantonal ?? 0)}`],
                  ["Geschätzte Steuern / Est. tax", fmtChf(s.calc?.totalAfterCredits ?? 0)],
                  ["Signatur / Signature", s.session?.name ?? ""],
                ].map((r) => (
                  <div key={r[0]} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-mist">{r[0]}</span>
                    <span className="num text-ivory">{r[1]}</span>
                  </div>
                ))}
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-gold/40 bg-gold/[0.05] px-5 py-4">
                <input type="checkbox" checked={finalCheck} onChange={(e) => setFinalCheck(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#d92e25]" />
                <span>
                  <span className="block text-[13.5px] font-semibold leading-snug text-ivory">
                    „Ich habe meine Steuererklärung geprüft und bestätige, dass die Angaben korrekt sind.
                    Ich übernehme die Verantwortung für die gemachten Angaben.“
                  </span>
                  <span className="mt-1.5 block text-[11.5px] leading-snug text-mist">
                    &ldquo;I have reviewed my tax return and confirm that the information is correct.
                    I accept responsibility for the information provided.&rdquo;
                  </span>
                </span>
              </label>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => setFinalReview(false)} disabled={submitting} className="btn-ghost px-4 py-3 text-sm disabled:opacity-50">
                  Zurück · Back
                </button>
                <button
                  onClick={() => { setFinalReview(false); submit(); }}
                  disabled={!finalCheck || submitting}
                  className="btn-gold px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? "Übermitteln…" : "Verbindlich einreichen · File now"}
                </button>
              </div>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-faint">
                Without this explicit confirmation, nothing is transmitted. · Ohne diese Bestätigung wird nichts übermittelt.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4">
      <div className="mb-2 font-mono text-[9.5px] tracking-[0.22em] text-faint uppercase">{title}</div>
      <div className="divide-y divide-line/50">{children}</div>
    </div>
  );
}

function Row({ l, v, gold, strong, hide }: { l: string; v: string; gold?: boolean; strong?: boolean; hide?: boolean }) {
  if (hide) return null;
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className={`text-[12.5px] ${strong ? "font-semibold text-ivory" : "text-mist"}`}>{l}</span>
      <span className={`num text-[12.5px] ${strong ? "text-base text-gold-2" : gold ? "text-gold-2" : "text-ivory"}`}>{v}</span>
    </div>
  );
}
