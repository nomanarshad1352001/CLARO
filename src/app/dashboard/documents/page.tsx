"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  CloudUpload,
  FileText,
  Loader2,
  ScanSearch,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { LockedState, PageHead } from "@/components/app/shell";
import { useApp, genId } from "@/lib/store";
import type { DocType, TaxDoc } from "@/lib/types";
import { DOC_TYPE_META } from "@/lib/tax-data";
import { fmtBytes } from "@/lib/format";

export default function DocumentsPage() {
  const router = useRouter();
  const s = useApp();
  const [drag, setDrag] = useState(false);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const demoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const seqTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  const demoIdx = useRef(0);

  useEffect(() => {
    return () => {
      clearTimeout(demoTimer.current);
      clearInterval(seqTimer.current);
    };
  }, []);

  const analyzeDoc = useCallback(
    async (docId: string, fileName: string, typeHint?: DocType) => {
      const set = (patch: Partial<TaxDoc>) => useApp.getState().updateDoc(docId, patch);
      try {
        set({ status: "analyzing", progress: 18 });
        await new Promise((r) => setTimeout(r, 550));
        set({ status: "classifying", progress: 44 });
        await new Promise((r) => setTimeout(r, 650));
        set({ status: "extracting", progress: 72 });
        const res = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName, typeHint }),
        });
        const data = await res.json();
        await new Promise((r) => setTimeout(r, 500));
        if (data.status === "needs_type") {
          set({ status: "needs_type", progress: 100 });
          setPickerFor(docId);
        } else {
          set({
            status: "done",
            progress: 100,
            type: data.type,
            typeLabel: data.typeLabel,
            confidence: data.confidence,
            fields: data.fields,
            summary: data.summary,
          });
        }
      } catch {
        set({ status: "error", progress: 100 });
      }
    },
    []
  );

  const ingest = (files: { name: string; size: number; isDemo?: boolean; pages?: number }[]) => {
    if (!files.length) return;
    const docs: TaxDoc[] = files.map((f) => ({
      id: genId(),
      fileName: f.name,
      size: f.size,
      mime: "application/pdf",
      status: "queued",
      progress: 0,
      type: null,
      isDemo: f.isDemo,
      pages: f.pages ?? Math.max(1, Math.round(f.size / 400_000)),
    }));
    s.addDocs(docs);
    return docs;
  };

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list).map((f) => ({ name: f.name, size: f.size }));
    s.log("folder", `${files.length} document(s) added to the vault`);
    ingest(files);
  };

  const loadDemo = () => {
    import("@/lib/tax-data").then(({ DEMO_DOCS }) => {
      s.log("folder", `Demo dossier imported — ${DEMO_DOCS.length} documents from the Keller family (incl. prior return, assessment & official invitation)`);
      demoIdx.current = 0;
      const step = () => {
        const i = demoIdx.current;
        if (i >= DEMO_DOCS.length) return;
        const d = DEMO_DOCS[i];
        ingest([{ name: d.fileName, size: d.size, isDemo: true, pages: d.pages }]);
        demoIdx.current = i + 1;
        demoTimer.current = setTimeout(step, 180);
      };
      step();
    });
  };

  const runPipeline = async () => {
    setRunning(true);
    const queued = useApp.getState().docs.filter((d) => d.status === "queued" || d.status === "needs_type");
    for (const doc of queued) {
      useApp.getState().updateDoc(doc.id, { status: "analyzing", progress: 8 });
      await new Promise((r) => setTimeout(r, 120));
    }
    for (const doc of queued) {
      await analyzeDoc(doc.id, doc.fileName);
    }
    const state = useApp.getState();
    const res = await fetch("/api/ai/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        docTypes: state.docs.filter((d) => d.status === "done").map((d) => d.type),
        fileNames: state.docs.map((d) => d.fileName),
      }),
    });
    const merged = await res.json();
    state.setProcessed({ conflicts: merged.conflicts, missing: merged.missing });
    setRunning(false);
  };

  const chooseType = (docId: string, type: DocType) => {
    const doc = s.docs.find((d) => d.id === docId);
    setPickerFor(null);
    if (doc) analyzeDoc(docId, doc.fileName, type);
  };

  const totalDocs = s.docs.length;
  const doneDocs = s.docs.filter((d) => d.status === "done").length;
  const overall = totalDocs ? Math.round(s.docs.reduce((a, d) => a + d.progress, 0) / totalDocs) : 0;
  const allDone = totalDocs > 0 && s.docs.every((d) => d.status === "done" || d.status === "error");

  if (!s.setup) {
    return (
      <LockedState
        step="Jurisdiction"
        message="Documents reveal income — but only your canton and municipality reveal what it costs you. Choose them first so every extraction lands in the right context."
        ctaHref="/dashboard/setup"
        ctaLabel="Choose jurisdiction"
      />
    );
  }

  return (
    <div>
      <PageHead
        kicker="Step 02 · Documents"
        title={
          <>
            Feed the <span className="display-italic gold-text">machine</span>
          </>
        }
        sub="Drop everything you have — salary certificates, bank and custody statements, 3a, premiums, receipts. The AI classifies, reads and cross-references each one. Nothing to sort beforehand."
        actions={
          <button onClick={loadDemo} className="btn-ghost px-4 py-2.5 text-[13px]">
            <Wand2 className="h-4 w-4 text-gold" />
            Load the demo dossier
          </button>
        }
      />

      {/* dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInput.current?.click()}
        className={`relative cursor-pointer overflow-hidden rounded-[22px] border border-dashed p-10 text-center transition-all ${
          drag ? "border-gold bg-gold/[0.07]" : "border-line-2 bg-panel/60 hover:border-gold/40"
        }`}
      >
        <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        {drag && <div className="diag-stripes absolute inset-0" />}
        <div className="relative">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gold/30 bg-gold/[0.07]">
            <CloudUpload className="h-6 w-6 text-gold" />
          </div>
          <p className="font-display mt-4 text-xl text-ivory">
            Drop your documents here — <span className="display-italic gold-text">all at once</span>
          </p>
          <p className="mt-1.5 text-[12.5px] text-faint">
            PDF, JPG, PNG, scans & photos · encrypted in your vault · or click to browse
          </p>
        </div>
      </div>

      {/* pipeline controls */}
      {totalDocs > 0 && (
        <div className="panel mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-40 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all duration-500"
                style={{ width: `${overall}%` }}
              />
              <span className="num absolute inset-0 grid place-items-center text-[11px] text-ivory">
                {doneDocs}/{totalDocs} · {overall}%
              </span>
            </div>
            <span className="hidden text-[12px] text-mist sm:block">
              {running ? "AI pipeline running…" : s.processed ? "Reconciliation complete" : "Ready to process"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!s.processed ? (
              <button
                onClick={runPipeline}
                disabled={running || s.docs.every((d) => d.status === "done")}
                className="btn-gold px-5 py-3 text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {running ? "Analysing documents…" : "Run AI analysis"}
              </button>
            ) : (
              <button onClick={() => router.push("/dashboard/review")} className="btn-gold px-5 py-3 text-[13px]">
                Review merged facts
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* document list */}
      <div className="mt-6 space-y-3">
        <AnimatePresence initial={false}>
          {s.docs.map((d) => (
            <motion.div
              key={d.id}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="panel overflow-hidden"
            >
              <div className="flex items-center gap-4 px-5 py-4">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${d.status === "done" ? "border-gold/35 bg-gold/[0.08]" : "border-line-2 bg-white/[0.03]"}`}>
                  {d.status === "done" ? (
                    <FileText className="h-4.5 w-4.5 text-gold" />
                  ) : d.status === "analyzing" || d.status === "classifying" || d.status === "extracting" ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-gold" />
                  ) : (
                    <ScanSearch className="h-4.5 w-4.5 text-mist" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[13.5px] font-semibold text-ivory">{d.fileName}</span>
                    {d.isDemo && (
                      <span className="rounded-full border border-line-2 px-2 py-0.5 font-mono text-[9px] tracking-widest text-faint uppercase">
                        demo
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="num text-[10.5px] text-faint">{fmtBytes(d.size)}{d.pages ? ` · ${d.pages} p.` : ""}</span>
                    <StatusLine doc={d} />
                  </div>
                  {d.status !== "done" && d.status !== "queued" && d.status !== "needs_type" && (
                    <div className="mt-2 h-1 w-full max-w-sm overflow-hidden rounded-full bg-white/5">
                      <div className="shimmer h-full rounded-full" style={{ width: `${d.progress}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {d.status === "done" && (
                    <button
                      onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                      className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/[0.06] px-3 py-1.5 text-[11px] font-semibold text-gold-2"
                    >
                      {d.fields?.length ?? 0} fields
                      <ChevronDown className={`h-3 w-3 transition-transform ${expanded === d.id ? "rotate-180" : ""}`} />
                    </button>
                  )}
                  {d.status === "needs_type" && (
                    <button
                      onClick={() => setPickerFor(d.id)}
                      className="rounded-full border border-alert/40 bg-alert/10 px-3 py-1.5 text-[11px] font-semibold text-alert"
                    >
                      Set type
                    </button>
                  )}
                  <button
                    onClick={() => s.removeDoc(d.id)}
                    className="rounded-full p-2 text-faint transition-colors hover:bg-alert/10 hover:text-alert"
                    aria-label="Remove document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* extracted fields drawer */}
              <AnimatePresence initial={false}>
                {expanded === d.id && d.fields && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-line bg-ink-2/50 px-5 py-4">
                      <p className="mb-3 text-[12px] leading-relaxed text-mist">{d.summary}</p>
                      <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                        {d.fields.map((f) => (
                          <div key={f.key} className="flex items-baseline justify-between gap-4 border-b border-line/60 py-1.5">
                            <span className="text-[11.5px] text-faint">{f.label}</span>
                            <span className="flex items-baseline gap-2">
                              <span className="num text-[12px] text-ivory">{f.value}</span>
                              <span className={`num text-[9px] ${f.confidence >= 0.95 ? "text-ok" : f.confidence >= 0.88 ? "text-gold-2" : "text-alert"}`}>
                                {Math.round(f.confidence * 100)}%
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* type picker modal */}
      <AnimatePresence>
        {pickerFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-5 backdrop-blur-sm"
            onClick={() => setPickerFor(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="panel w-full max-w-md p-7"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-2xl font-light text-ivory">Classify manually</h3>
                  <p className="mt-1.5 text-[12.5px] text-mist">
                    The AI couldn't confidently match this file. Pick its type and extraction will resume instantly.
                  </p>
                </div>
                <button onClick={() => setPickerFor(null)} className="rounded-full p-1.5 text-faint hover:text-ivory">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {(Object.keys(DOC_TYPE_META) as DocType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => chooseType(pickerFor, t)}
                    className="rounded-xl border border-line-2 px-3 py-2.5 text-left transition-colors hover:border-gold/40 hover:bg-gold/[0.05]"
                  >
                    <span className="block text-[12.5px] font-semibold text-ivory">{DOC_TYPE_META[t].label}</span>
                    <span className="block text-[10px] text-faint">{DOC_TYPE_META[t].hint}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {s.processed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel mt-8 flex flex-wrap items-center justify-between gap-4 border-gold/30 bg-gold/[0.04] p-6"
        >
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/15">
              <Sparkles className="h-5 w-5 text-gold" />
            </span>
            <div>
              <p className="font-display text-lg text-ivory">
                {doneDocs} documents merged into one dossier
              </p>
              <p className="text-[12px] text-mist">
                The AI cross-referenced every field and found {s.conflicts.length} conflict(s) to resolve with you.
              </p>
            </div>
          </div>
          <button onClick={() => router.push("/dashboard/review")} className="btn-gold px-6 py-3 text-sm">
            Continue to AI review
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

function StatusLine({ doc }: { doc: TaxDoc }) {
  if (doc.status === "done") {
    return (
      <span className="flex items-center gap-2 text-[11px] text-gold-2">
        {doc.typeLabel}
        <span className="num text-[9.5px] text-mist">· {doc.confidence ? Math.round(doc.confidence * 100) : 0}% conf.</span>
      </span>
    );
  }
  const map: Record<string, string> = {
    queued: "Queued for analysis",
    analyzing: "Reading pages…",
    classifying: "Classifying document…",
    extracting: "Extracting taxable fields…",
    needs_type: "One tap needed: choose document type",
    error: "Unreadable — please re-upload",
  };
  const tone = doc.status === "queued" ? "text-faint" : doc.status === "error" || doc.status === "needs_type" ? "text-alert" : "text-gold-2 pulse-soft";
  return <span className={`text-[11px] ${tone}`}>{map[doc.status]}</span>;
}
