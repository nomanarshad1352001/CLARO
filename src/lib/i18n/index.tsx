"use client";

/* ------------------------------------------------------------------ */
/*  i18n ARCHITECTURE                                                  */
/*                                                                     */
/*  Launch language: German (de).                                      */
/*  Fr/It/En are added by appending dictionaries — no code changes.    */
/*  Every UI string flows through t(key); content-heavy legal prose    */
/*  ships per-locale from the CMS layer in production.                 */
/* ------------------------------------------------------------------ */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "de" | "en" | "fr" | "it";
export const ACTIVE_LOCALES: Locale[] = ["de", "en"];

export const LOCALE_META: Record<Locale, { name: string; short: string; ready: boolean }> = {
  de: { name: "Deutsch", short: "DE", ready: true },
  en: { name: "English", short: "EN", ready: true },
  fr: { name: "Français · bientôt", short: "FR", ready: false },
  it: { name: "Italiano · presto", short: "IT", ready: false },
};

type Dict = Record<string, string>;

const de: Dict = {
  "nav.overview": "Übersicht",
  "nav.workflow": "Erklärungsablauf",
  "shell.vault": "CLARO Vault",
  "shell.taxyear": "Steuerjahr",
  "shell.noJurisdiction": "Kein Steuerdomizil gewählt",
  "shell.signout": "Abmelden",
  "shell.reset": "Demo zurücksetzen",
  "shell.filed": "Abgegeben",
  "shell.loading": "Vault wird geöffnet",
  "shell.securityCenter": "Sicherheitszentrale",
  "shell.language": "Sprache",

  "step.setup.t": "Ihre Situation",
  "step.setup.s": "Kanton · Gemeinde · Jahr",
  "step.documents.t": "Dokumente",
  "step.documents.s": "KI-Erfassung & Klassifikation",
  "step.review.t": "KI-Prüfung",
  "step.review.s": "Identität & Konflikte",
  "step.questions.t": "Rückfragen",
  "step.questions.s": "Nur was die KI nicht sieht",
  "step.income.t": "Einkommen & Vermögen",
  "step.income.s": "Konsolidierte Übersicht",
  "step.securities.t": "Wertschriften",
  "step.securities.s": "ISIN · ICTax · Banken",
  "step.property.t": "Liegenschaften",
  "step.property.s": "Inland & Ausland",
  "step.calculation.t": "Berechnung",
  "step.calculation.s": "Deterministische Regel-Engine",
  "step.filing.t": "Prüfen & Einreichen",
  "step.filing.s": "Signieren · Übermitteln · Verfolgen",

  "ov.commandcentre": "Kommandozentrale",
  "ov.progress": "Erklärungs-Fortschritt",
  "ov.greet.morning": "Guten Morgen",
  "ov.greet.day": "Guten Tag",
  "ov.greet.evening": "Guten Abend",
  "ov.next": "Als Nächstes",
  "ov.filedState": "Ihre Erklärung wurde übermittelt. Verfolgen Sie unten den Weg zur Veranlagung.",
  "ov.aiActivity": "KI-Aktivität",

  "common.continue": "Weiter",
  "common.confirm": "Bestätigen",
  "common.cancel": "Abbrechen",
  "common.close": "Schliessen",
  "common.save": "Speichern",
  "common.delete": "Löschen",
  "common.yes": "Ja",
  "common.no": "Nein",
  "common.edit": "Ändern",
  "common.back": "Zurück",
  "common.year": "Steuerjahr",
  "common.canton": "Kanton",
  "common.municipality": "Gemeinde",

  "auth.welcome.back": "Willkommen zurück",
  "auth.vault.waiting": "Ihr Vault ist genau dort, wo Sie ihn verlassen haben.",
  "auth.open.vault": "Steuer-Vault eröffnen",
  "auth.two.minutes": "Zwei Minuten jetzt sparen Ihnen ein Wochenende im März.",
  "auth.signin": "Anmelden",
  "auth.enable.2fa.title": "Zwei-Faktor-Authentisierung",
  "auth.2fa.sub": "Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.",
  "auth.passkey": "Mit Passkey fortfahren",
  "auth.demo": "Sofort mit dem Demo-Dossier fortfahren",

  "sec.title": "Sicherheit & Datenschutz",
  "sec.session": "Sitzung",
  "sec.region": "Datenregion",
  "sec.retention": "Aufbewahrung der Dokumente",
  "sec.retention.days30": "30 Tage nach Abgabe löschen",
  "sec.retention.days90": "90 Tage nach Abgabe löschen",
  "sec.retention.days365": "1 Jahr (Standard, revFADP-konform)",
  "sec.retention.manual": "Nur auf meine Anweisung",
  "sec.delete.title": "Vollständige Löschung",
  "sec.delete.body": "Löscht dieses Dossier unwiderruflich aus Ihrem Vault (Dokumente, Identität, Antworten, Berechnungen).",
  "sec.delete.action": "Dossier endgültig löschen",
  "sec.noTraining": "Kein Modell-Training mit Kundendaten — vertraglich zugesichert, nicht abschaltbar.",
  "sec.aiProvider": "Dokumenten-KI",
  "sec.viewPage": "Zur Sicherheitsseite",
};

const en: Dict = {
  "nav.overview": "Overview",
  "nav.workflow": "Declaration workflow",
  "shell.vault": "CLARO Vault",
  "shell.taxyear": "Tax year",
  "shell.noJurisdiction": "No jurisdiction selected",
  "shell.signout": "Sign out",
  "shell.reset": "Reset demo",
  "shell.filed": "Filed",
  "shell.loading": "Opening vault",
  "shell.securityCenter": "Security centre",
  "shell.language": "Language",

  "step.setup.t": "Your situation",
  "step.setup.s": "Canton · municipality · year",
  "step.documents.t": "Documents",
  "step.documents.s": "AI intake & classification",
  "step.review.t": "AI review",
  "step.review.s": "Identity & conflicts",
  "step.questions.t": "Smart questions",
  "step.questions.s": "Only what AI can't see",
  "step.income.t": "Income & assets",
  "step.income.s": "Full consolidated ledger",
  "step.securities.t": "Securities",
  "step.securities.s": "ISIN · ICTax · brokers",
  "step.property.t": "Real estate",
  "step.property.s": "Swiss & foreign",
  "step.calculation.t": "Calculation",
  "step.calculation.s": "Deterministic rules engine",
  "step.filing.t": "Review & file",
  "step.filing.s": "Sign · submit · track",

  "ov.commandcentre": "Command centre",
  "ov.progress": "Declaration progress",
  "ov.greet.morning": "Good morning",
  "ov.greet.day": "Good afternoon",
  "ov.greet.evening": "Good evening",
  "ov.next": "Next up",
  "ov.filedState": "Your return was transmitted. Track its journey to the assessment below.",
  "ov.aiActivity": "AI activity",

  "common.continue": "Continue",
  "common.confirm": "Confirm",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.yes": "Yes",
  "common.no": "No",
  "common.edit": "Change",
  "common.back": "Back",
  "common.year": "Tax year",
  "common.canton": "Canton",
  "common.municipality": "Municipality",

  "auth.welcome.back": "Welcome back",
  "auth.vault.waiting": "Your vault is exactly where you left it.",
  "auth.open.vault": "Open your tax vault",
  "auth.two.minutes": "Two minutes now saves you a weekend in March.",
  "auth.signin": "Sign in",
  "auth.enable.2fa.title": "Two-factor authentication",
  "auth.2fa.sub": "Enter the 6-digit code from your authenticator app.",
  "auth.passkey": "Continue with passkey",
  "auth.demo": "Continue instantly with the demo dossier",

  "sec.title": "Security & privacy",
  "sec.session": "Session",
  "sec.region": "Data region",
  "sec.retention": "Document retention",
  "sec.retention.days30": "Delete 30 days after filing",
  "sec.retention.days90": "Delete 90 days after filing",
  "sec.retention.days365": "1 year (default, revFADP-compliant)",
  "sec.retention.manual": "Only when I say so",
  "sec.delete.title": "Complete deletion",
  "sec.delete.body": "Permanently erases this dossier from your vault (documents, identity, answers, calculations).",
  "sec.delete.action": "Delete dossier permanently",
  "sec.noTraining": "No model training on customer data — contractually guaranteed, cannot be switched off.",
  "sec.aiProvider": "Document AI",
  "sec.viewPage": "View security page",
};

export const DICTS: Record<Locale, Dict> = { de, en, fr: {}, it: {} };

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx>({ locale: "de", setLocale: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");

  useEffect(() => {
    const saved = localStorage.getItem("claro-locale") as Locale | null;
    if (saved && LOCALE_META[saved].ready) setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    if (!LOCALE_META[l].ready) return;
    setLocaleState(l);
    localStorage.setItem("claro-locale", l);
  };

  const t = (key: string) => {
    const dict = DICTS[locale] ?? DICTS.de;
    return dict[key] ?? DICTS.de[key] ?? DICTS.en[key] ?? key;
  };

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx);
}

export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useT();
  return (
    <div className="flex items-center gap-1 rounded-full border border-line-2 bg-white/60 p-1">
      {(["de", "en", "fr"] as Locale[]).map((l) => {
        const ready = LOCALE_META[l].ready;
        return (
          <button
            key={l}
            disabled={!ready}
            onClick={() => setLocale(l)}
            title={LOCALE_META[l].name}
            className={`rounded-full px-2.5 py-1 font-mono text-[9.5px] tracking-widest uppercase transition-colors ${
              locale === l
                ? "bg-gold text-white"
                : ready
                  ? "text-mist hover:text-ivory"
                  : "cursor-not-allowed text-faint/60"
            }`}
          >
            {LOCALE_META[l].short}
            {!ready && !compact && <span className="ml-1 text-[7px]">·</span>}
          </button>
        );
      })}
    </div>
  );
}
