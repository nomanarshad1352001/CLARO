import { NextRequest, NextResponse } from "next/server";
import type { Conflict, MissingItem, DocType } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Cross-document reconciliation — finds conflicts & gaps after all   */
/*  documents have been extracted. Deterministic rule set.             */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { docTypes?: DocType[]; fileNames?: string[] };
  const types = body.docTypes ?? [];

  const has = (t: DocType) => types.includes(t);
  const twoSalaries = types.filter((t) => t === "salary_certificate").length >= 2;

  const conflicts: Conflict[] = [];

  /* Identity-level contradictions (AHV, address, employer…) are handled
     by the Personal Data Automation engine — see lib/personal-data.ts. */

  if (has("securities_statement") && has("bank_statement")) {
    conflicts.push({
      id: "securities-value",
      title: "Securities value discrepancy",
      detail:
        "PostFinance lists a custody overview of CHF 131'900 (per 31.10), while the UBS e-tax statement per 31.12 totals CHF 141'774.95. For the 31.12 tax value the e-tax statement is authoritative.",
      fieldKey: "portfolio_value",
      options: [
        { label: "CHF 141'774.95", value: "141774.95", source: "UBS eSteuerauszug · 31.12 (authoritative)" },
        { label: "CHF 131'900", value: "131900", source: "PostFinance overview · 31.10 (stale)" },
      ],
    });
  }

  if (has("childcare_receipt") && has("bank_statement")) {
    conflicts.push({
      id: "childcare-amount",
      title: "Childcare: invoiced vs. paid",
      detail:
        "Kita Sonnenstube invoiced CHF 14'400, but only CHF 13'200 in transfers were detected on the bank statement (one quarter pending). Only amounts actually paid are deductible.",
      fieldKey: "childcare_amount",
      options: [
        { label: "CHF 13'200 (paid)", value: "13200", source: "PostFinance transfers — deductible" },
        { label: "CHF 14'400 (invoiced)", value: "14400", source: "Kita statements — include pending Q4" },
      ],
    });
  }

  const missing: MissingItem[] = [
    {
      id: "m-church",
      label: "Church affiliation",
      detail: "Not visible on any document; required for the church-tax surcharge.",
      questionId: "church-member",
    },
    {
      id: "m-commute",
      label: "Commuting pattern",
      detail: "Mode & cost of travel to work drives the commuting deduction.",
      questionId: "commute-mode",
    },
    {
      id: "m-prof",
      label: "Professional expenses election",
      detail: "Flat rate vs. documented actual costs — a legal election, not derivable.",
      questionId: "professional-mode",
    },
  ];

  if (!has("mortgage_statement")) {
    missing.push({
      id: "m-debt",
      label: "Debt & mortgage interest",
      detail: "No mortgage statement found — confirm whether debt interest exists.",
      questionId: "debt",
    });
  }
  if (!twoSalaries) {
    missing.push({
      id: "m-status",
      label: "Civil status confirmation",
      detail: "Single-income documents detected — status cannot be cross-validated.",
      questionId: "other-income",
    });
  }
  missing.push(
    {
      id: "m-alimony",
      label: "Maintenance payments",
      detail: "Alimony paid is deductible — never stated on employer or bank documents.",
      questionId: "alimony",
    },
    {
      id: "m-other-income",
      label: "Other income",
      detail: "Freelance, rental or board income would not appear on these documents.",
      questionId: "other-income",
    }
  );

  return NextResponse.json({ conflicts, missing });
}
