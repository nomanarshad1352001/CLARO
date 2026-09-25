"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Globe2,
  Cpu,
  Trash2,
  KeyRound,
  X,
  ExternalLink,
  Timer,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function SecurityCenter() {
  const [open, setOpen] = useState(false);
  const t = useT().t;
  const s = useApp();
  const router = useRouter();

  const RETENTION_OPTIONS = [
    { days: 30, key: "sec.retention.days30" },
    { days: 90, key: "sec.retention.days90" },
    { days: 365, key: "sec.retention.days365" },
    { days: -1, key: "sec.retention.manual" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line-2 py-2 text-[11px] font-semibold text-mist transition-colors hover:border-gold/40 hover:text-ivory"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-gold" />
        {t("shell.securityCenter")}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-ink/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-ink-2 p-7"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="kicker">{t("sec.title")}</span>
                  <h3 className="font-display mt-2 text-2xl font-semibold text-ivory">{t("shell.securityCenter")}</h3>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-full p-2 text-faint hover:text-ivory">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <Block icon={<Lock className="h-4 w-4 text-gold" />} title="Transport & storage encryption">
                  Every connection runs TLS 1.3 with HSTS; documents and dossiers rest under
                  AES-256-GCM with per-vault keys and strict per-user data isolation. No shared
                  encryption contexts between customers.
                </Block>

                <Block icon={<KeyRound className="h-4 w-4 text-gold" />} title={t("sec.session")}>
                  Protected by password policy + TOTP 2FA; passkeys (WebAuthn) supported. Sessions
                  are device-bound tokens with automatic expiry — signed in as{" "}
                  <b className="text-ivory">{s.session?.email}</b>.
                </Block>

                <Block icon={<Cpu className="h-4 w-4 text-gold" />} title={t("sec.aiProvider")}>
                  Sensitive document understanding runs on a private, locally hosted LLM
                  (Ollama-class, Swiss tenancy): document bytes never leave our perimeter.
                  <span className="mt-2 flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/[0.05] px-3 py-2.5 text-[11px] leading-relaxed text-mist">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    {t("sec.noTraining")}
                  </span>
                </Block>

                <Block icon={<Globe2 className="h-4 w-4 text-gold" />} title={t("sec.region")}>
                  Processing and at-rest storage in ISO 27001-certified Swiss data centres
                  (ch-central); EU fallback region only. API keys and secrets live server-side in
                  environment storage — never in source, never in the browser bundle.
                </Block>

                <div className="rounded-2xl border border-line bg-panel p-5">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-gold" />
                    <span className="text-[13px] font-semibold text-ivory">{t("sec.retention")}</span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {RETENTION_OPTIONS.map((o) => (
                      <button
                        key={o.days}
                        onClick={() => s.setRetentionDays(o.days)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-[12px] transition-colors ${
                          s.retentionDays === o.days
                            ? "border-gold/45 bg-gold/[0.07] text-gold-2"
                            : "border-line-2 text-mist hover:border-gold/25"
                        }`}
                      >
                        {t(o.key)}
                        <span className={`num text-[9.5px] ${s.retentionDays === o.days ? "text-gold-2" : "text-faint"}`}>
                          {s.retentionDays === o.days ? "●" : "○"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-alert/30 bg-alert/[0.04] p-5">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-alert" />
                    <span className="text-[13px] font-semibold text-ivory">{t("sec.delete.title")}</span>
                  </div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-mist">{t("sec.delete.body")}</p>
                  <button
                    onClick={() => {
                      s.resetAll();
                      setOpen(false);
                      router.push("/dashboard/setup");
                    }}
                    className="mt-3 w-full rounded-xl border border-alert/45 py-2.5 text-[12px] font-semibold text-alert transition-colors hover:bg-alert/10"
                  >
                    {t("sec.delete.action")}
                  </button>
                </div>

                <a href="/security" target="_blank"
                  className="flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-gold-2 hover:underline">
                  {t("sec.viewPage")} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[13px] font-semibold text-ivory">{title}</span>
      </div>
      <div className="mt-2 text-[11.5px] leading-relaxed text-mist">{children}</div>
    </div>
  );
}
