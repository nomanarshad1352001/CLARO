import type { StepKey } from "./types";

export interface StepDef {
  key: StepKey;
  href: string;
  num: string;
  title: string;
  sub: string;
  icon: string;
}

export const STEPS: StepDef[] = [
  { key: "setup", href: "/dashboard/setup", num: "01", title: "Situation", sub: "Canton · municipality · year", icon: "map-pin" },
  { key: "documents", href: "/dashboard/documents", num: "02", title: "Documents", sub: "AI intake & classification", icon: "folder" },
  { key: "review", href: "/dashboard/review", num: "03", title: "AI review", sub: "Identity & conflicts", icon: "scan" },
  { key: "questions", href: "/dashboard/questions", num: "04", title: "Smart questions", sub: "Only what AI can't see", icon: "message" },
  { key: "income", href: "/dashboard/income", num: "05", title: "Income & assets", sub: "Full consolidated ledger", icon: "wallet" },
  { key: "securities", href: "/dashboard/securities", num: "06", title: "Securities", sub: "ISIN · ICTax · brokers", icon: "chart" },
  { key: "property", href: "/dashboard/property", num: "07", title: "Real estate", sub: "Swiss & foreign property", icon: "home" },
  { key: "calculation", href: "/dashboard/calculation", num: "08", title: "Calculation", sub: "Deterministic rules engine", icon: "calc" },
  { key: "filing", href: "/dashboard/filing", num: "09", title: "Review & file", sub: "Sign · submit · track", icon: "send" },
];

export const STEP_ORDER: StepKey[] = [
  "setup",
  "documents",
  "review",
  "questions",
  "income",
  "securities",
  "property",
  "calculation",
  "filing",
];

export interface Gates {
  setupDone: boolean;
  processed: boolean;
  conflictsResolved: boolean;
  questionsDone: boolean;
  incomeDone: boolean;
  securitiesDone: boolean;
  propertyDone: boolean;
  calcDone: boolean;
  filed: boolean;
}

export function stepStatus(key: StepKey, state: Gates): "done" | "active" | "locked" {
  const done: Record<StepKey, boolean> = {
    setup: state.setupDone,
    documents: state.processed,
    review: state.processed && state.conflictsResolved,
    questions: state.questionsDone,
    income: state.incomeDone,
    securities: state.securitiesDone,
    property: state.propertyDone,
    calculation: state.calcDone,
    filing: state.filed,
  };
  if (done[key]) return "done";
  const idx = STEP_ORDER.indexOf(key);
  for (let i = 0; i < idx; i++) if (!done[STEP_ORDER[i]]) return "locked";
  return "active";
}
