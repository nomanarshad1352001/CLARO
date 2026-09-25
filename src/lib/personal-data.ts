import type {
  ProfileCandidate,
  ProfileEntry,
  ProfileKey,
  TaxDoc,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Personal Data Automation engine                                   */
/*  Collects identity & jurisdiction facts from every processed       */
/*  document (prior returns, tax assessments, filing invitations,     */
/*  salary certificates…), merges them and flags contradictions —     */
/*  never guessing: conflicts always go back to the user.             */
/* ------------------------------------------------------------------ */

export const PROFILE_LABELS: Record<ProfileKey, string> = {
  fullName: "Full name",
  dateOfBirth: "Date of birth",
  ahv: "AHV number",
  address: "Address (residence)",
  maritalStatus: "Marital status",
  children: "Children / dependants",
  employer: "Employer",
  incomeCurrent: "Income (current year)",
  priorIncomeDeclared: "Prior-year income · declared",
  priorIncomeAssessed: "Prior-year income · assessed",
  priorTaxPaid: "Prior-year tax invoice",
  canton: "Canton",
  municipality: "Municipality",
};

export const PROFILE_ORDER: ProfileKey[] = [
  "fullName",
  "dateOfBirth",
  "ahv",
  "address",
  "maritalStatus",
  "children",
  "employer",
  "incomeCurrent",
  "priorIncomeDeclared",
  "priorIncomeAssessed",
  "priorTaxPaid",
  "canton",
  "municipality",
];

/* fieldKey → ProfileKey, per document type */
const FIELD_MAP: Record<string, Record<string, ProfileKey>> = {
  salary_certificate: {
    employee: "fullName",
    ahv: "ahv",
    address: "address",
    employer: "employer",
    gross_salary: "incomeCurrent",
  },
  pillar3a: { ahv: "ahv" },
  prior_return: {
    name: "fullName",
    dob: "dateOfBirth",
    ahv: "ahv",
    addr: "address",
    marital: "maritalStatus",
    children: "children",
    employer: "employer",
    inc_decl: "priorIncomeDeclared",
    canton: "canton",
    muni: "municipality",
  },
  tax_assessment: {
    name: "fullName",
    dob: "dateOfBirth",
    ahv: "ahv",
    addr: "address",
    marital: "maritalStatus",
    children: "children",
    inc_assessed: "priorIncomeAssessed",
    tax_due: "priorTaxPaid",
    canton: "canton",
    muni: "municipality",
  },
  tax_invitation: {
    name: "fullName",
    addr: "address",
    canton: "canton",
    muni: "municipality",
  },
  ahv_iv: {
    name: "fullName",
    ahv: "ahv",
    addr: "address",
  },
};

const AUTHORITY: Record<string, number> = {
  tax_assessment: 3,
  tax_invitation: 2,
  prior_return: 1,
  salary_certificate: 1,
};

function norm(key: ProfileKey, raw: string): string {
  const v = raw.toLowerCase();
  switch (key) {
    case "ahv":
      return v.replace(/\D/g, "");
    case "children": {
      const m = v.match(/(\d+)\s*(?:child|—|-|:)/) ?? v.match(/\b(\d+)\b/);
      return m ? `${m[1]} children` : v.replace(/[^a-z0-9]/g, "");
    }
    case "canton": {
      const m = raw.toUpperCase().match(/\b(ZH|BE|LU|UR|SZ|OW|NW|GL|ZG|FR|SO|BS|BL|SH|AR|AI|SG|GR|AG|TG|TI|VD|VS|NE|GE|JU)\b/);
      return m ? m[1] : v.replace(/[^a-z]/g, "");
    }
    case "municipality":
      return v.replace(/\([^)]*\)/g, "").replace(/[^a-zäöü]/g, "");
    case "incomeCurrent":
      return "current-employment-income";
    default:
      return v.replace(/[^a-z0-9äöüéè]/g, "");
  }
}

export function isSpouseDoc(doc: TaxDoc): boolean {
  return !!doc.fields?.some((fd) => fd.key === "is_spouse" && fd.numeric === 1);
}

export function buildPersonalProfile(docs: TaxDoc[]): ProfileEntry[] {
  const buckets = new Map<ProfileKey, ProfileCandidate[]>();

  for (const doc of docs.filter((d) => d.status === "done" && d.type)) {
    if (isSpouseDoc(doc)) continue; // profile targets the primary taxpayer
    const map = FIELD_MAP[doc.type as string];
    if (!map) continue;
    for (const [fieldKey, profileKey] of Object.entries(map)) {
      const fd = doc.fields?.find((x) => x.key === fieldKey);
      if (!fd) continue;
      const list = buckets.get(profileKey) ?? [];
      list.push({
        value: fd.value,
        source: doc.fileName,
        docId: doc.id,
        confidence: fd.confidence,
      });
      buckets.set(profileKey, list);
    }
  }

  return PROFILE_ORDER.map((key) => {
    const candidates = buckets.get(key) ?? [];
    if (candidates.length === 0) {
      return { key, label: PROFILE_LABELS[key], status: "missing" as const, candidates };
    }
    const groups = new Map<string, ProfileCandidate[]>();
    for (const c of candidates) {
      const n = norm(key, c.value);
      const g = groups.get(n) ?? [];
      g.push(c);
      groups.set(n, g);
    }
    const ranked = [...groups.values()].sort((a, b) => {
      const score = (g: ProfileCandidate[]) =>
        g.length * 10 + g.reduce((s, c) => s + (AUTHORITY[docTypeOf(docs, c.docId)] ?? 0), 0) + Math.max(...g.map((c) => c.confidence));
      return score(b) - score(a);
    });

    if (ranked.length === 1) {
      const best = [...candidates].sort((a, b) => b.confidence - a.confidence)[0];
      return {
        key,
        label: PROFILE_LABELS[key],
        status: "auto" as const,
        value: best.value,
        candidates,
        confidence: best.confidence,
      };
    }

    /* conflict — suggest, but never silently apply */
    const top = ranked[0];
    const second = ranked[1];
    const majority = top.length > second.length;
    const bestOfTop = [...top].sort((a, b) => b.confidence - a.confidence)[0];
    const authoritative = top.some((c) => AUTHORITY[docTypeOf(docs, c.docId)] >= 2);
    const recency = key === "employer" && top.some((c) => docTypeOf(docs, c.docId) === "salary_certificate");
    const suggestedReason = majority
      ? `${top.length} of ${candidates.length} sources agree`
      : authoritative
        ? "Matches the authoritative official document"
        : recency
          ? "Most recent source (2025 salary certificate)"
          : "Highest extraction confidence";
    return {
      key,
      label: PROFILE_LABELS[key],
      status: "conflict" as const,
      candidates: [...candidates].sort((a, b) => b.confidence - a.confidence),
      suggested: bestOfTop.value,
      suggestedReason,
    };
  });
}

function docTypeOf(docs: TaxDoc[], docId: string): string {
  return docs.find((d) => d.id === docId)?.type ?? "";
}

export function profileResolved(entries: ProfileEntry[], choices: Record<string, string>): boolean {
  return entries.every((e) => e.status !== "conflict" || choices[e.key] !== undefined);
}

export function lockedProfile(
  entries: ProfileEntry[],
  choices: Record<string, string>
): Partial<Record<ProfileKey, string>> {
  const out: Partial<Record<ProfileKey, string>> = {};
  for (const e of entries) {
    if (e.status === "auto") out[e.key] = e.value;
    else if (e.status === "conflict" && choices[e.key]) out[e.key] = choices[e.key];
  }
  return out;
}
