import { NextRequest, NextResponse } from "next/server";
import { DOC_KEYWORDS, DOC_TYPE_META } from "@/lib/tax-data";
import { aiProviderHeaders, getAiProvider } from "@/lib/ai-provider";
import type { DocType, ExtractedField } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Simulated document AI — deterministic OCR/classification pipeline. */
/*  A real deployment swaps the templates for a vision-LLM pipeline;   */
/*  the interface stays identical.                                     */
/* ------------------------------------------------------------------ */

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function classify(fileName: string): { type: DocType; confidence: number } | null {
  const n = fileName.toLowerCase();
  for (const rule of DOC_KEYWORDS) {
    if (rule.words.some((w) => n.includes(w))) {
      return { type: rule.type, confidence: 0.9 + (hashString(fileName) % 9) / 100 };
    }
  }
  return null;
}

const f = (key: string, label: string, value: string, group: string, numeric?: number, confidence = 0.98): ExtractedField =>
  ({ key, label, value, group, numeric, confidence });

function extract(type: DocType, fileName: string): { fields: ExtractedField[]; summary: string } {
  const h = hashString(fileName);
  const vary = (base: number, spread: number) => base + ((h % 1000) / 1000 - 0.5) * 2 * spread;
  const isSpouseDoc = /_m_|maria|_m\./i.test(fileName);

  switch (type) {
    case "salary_certificate": {
      if (isSpouseDoc) {
        const gross = Math.round(vary(64_500, 400));
        return {
          summary: "Salary certificate (Lohnausweis) issued by Kreisschule Seefeld for Maria Keller, part-time 70%.",
          fields: [
            f("employee", "Employee", "Maria Keller", "Person", undefined, 0.99),
            f("is_spouse", "Role", "Spouse (secondary income)", "Person", 1, 0.99),
            f("ahv", "AHV no.", "756.5870.1129.54", "Person", undefined, 0.97),
            f("employer", "Employer", "Kreisschule Seefeld, Zürich", "Employment"),
          f("employer_address", "Workplace address", "Seefeldstrasse 220, 8008 Zürich", "Employment", undefined, 0.95),
          f("bonus", "Bonus / 13th salary share", `CHF ${Math.round(gross * 0.04).toLocaleString("de-CH")}`, "Income", Math.round(gross * 0.04), 0.93),
            f("gross_salary", "Gross salary (§2)", `CHF ${gross.toLocaleString("de-CH")}`, "Income", gross, 0.99),
            f("net_salary", "Net salary (§6)", `CHF ${Math.round(gross * 0.843).toLocaleString("de-CH")}`, "Income", Math.round(gross * 0.843)),
            f("ahv_contrib", "AHV/IV/EO contributions", `CHF ${Math.round(gross * 0.05275).toLocaleString("de-CH")}`, "Social", Math.round(gross * 0.05275)),
            f("bvg", "Occupational pension (BVG)", `CHF ${Math.round(gross * 0.07).toLocaleString("de-CH")}`, "Social", Math.round(gross * 0.07)),
            f("workload", "Employment level", "70 %", "Employment", 0.7),
          ],
        };
      }
      const gross = Math.round(vary(118_400, 600));
      return {
        summary: "Salary certificate (Lohnausweis) issued by Halden Partner AG for Alex Keller, full-time.",
        fields: [
          f("employee", "Employee", "Alex Keller", "Person", undefined, 0.99),
          f("ahv", "AHV no.", "756.4421.9087.33", "Person", undefined, 0.99),
          f("address", "Address", "Seefeldstrasse 112, 8008 Zürich", "Person", undefined, 0.96),
          f("employer", "Employer", "Halden Partner AG, Zug", "Employment"),
          f("employer_address", "Workplace address", "Bahnhofstrasse 21, 6300 Zug", "Employment", undefined, 0.97),
          f("bonus", "Bonus (§3)", `CHF ${Math.round(gross * 0.09).toLocaleString("de-CH")}`, "Income", Math.round(gross * 0.09), 0.97),
          f("benefits", "Fringe benefits (§14 car/meals)", `CHF ${Math.round(gross * 0.02).toLocaleString("de-CH")}`, "Income", Math.round(gross * 0.02), 0.92),
          f("gross_salary", "Gross salary (§2)", `CHF ${gross.toLocaleString("de-CH")}`, "Income", gross, 0.99),
          f("net_salary", "Net salary (§6)", `CHF ${Math.round(gross * 0.838).toLocaleString("de-CH")}`, "Income", Math.round(gross * 0.838)),
          f("ahv_contrib", "AHV/IV/EO contributions", `CHF ${Math.round(gross * 0.05275).toLocaleString("de-CH")}`, "Social", Math.round(gross * 0.05275)),
          f("alv", "ALV contribution", `CHF ${Math.round(gross * 0.011).toLocaleString("de-CH")}`, "Social", Math.round(gross * 0.011)),
          f("bvg", "Occupational pension (BVG)", `CHF ${Math.round(gross * 0.07).toLocaleString("de-CH")}`, "Social", Math.round(gross * 0.07)),
          f("gkz", "Non-occupational accident (NBU)", `CHF ${Math.round(gross * 0.0113).toLocaleString("de-CH")}`, "Social", Math.round(gross * 0.0113)),
        ],
      };
    }
    case "pillar3a": {
      const base = isSpouseDoc ? 5_200 : 7_056;
      return {
        summary: `Pillar 3a contribution certificate from VIAC Invest AG ${isSpouseDoc ? "(Maria Keller)" : "(Alex Keller)"}.`,
        fields: [
          ...(isSpouseDoc ? [f("is_spouse", "Role", "Spouse (secondary)", "Person", 1, 0.99)] : []),
          f("holder", "Policy holder", isSpouseDoc ? "Maria Keller" : "Alex Keller", "Person"),
          f(
            "ahv",
            "AHV no.",
            isSpouseDoc ? "756.5870.1129.54" : "756.4421.9087.38",
            "Person",
            undefined,
            isSpouseDoc ? 0.98 : 0.94
          ),
          f("institute", "Foundation", "VIAC Invest AG, Basel", "Pension"),
          f("contribution_3a", "3a contribution tax year", `CHF ${base.toLocaleString("de-CH")}`, "Pension", base, 0.99),
          f("vested", "Vested balance 31.12", `CHF ${Math.round(base * 4.2).toLocaleString("de-CH")}`, "Pension", Math.round(base * 4.2), 0.95),
        ],
      };
    }
    case "bank_statement": {
      const balance = Math.round(vary(42_380, 800));
      return {
        summary: "PostFinance year-end tax statement: private account, savings account and custody overview.",
        fields: [
          f("holder", "Account holder", "Alex & Maria Keller (joint)", "Person"),
          f("iban", "IBAN", "CH56 0900 0000 8001 2345 6", "Account", undefined, 0.94),
          f("bank_balance", "Balance 31.12", `CHF ${balance.toLocaleString("de-CH")}`, "Assets", balance, 0.99),
          f("interest_income", "Interest income", `CHF ${Math.max(8, Math.round(vary(12, 4)))}`, "Income", Math.max(8, Math.round(vary(12, 4))), 0.97),
          f("custody_note", "Custody reference", "Securities overview CHF 131'900 (per 31.10)", "Assets", 131_900, 0.88),
        ],
      };
    }
    case "securities_statement": {
      return {
        summary: "UBS eSteuerauszug: 8 positions, CH/IE/US domicile, dividends with 35% anticipatory tax and US WHT.",
        fields: [
          f("custodian", "Custodian bank", "UBS Switzerland AG", "Depot"),
          f("portfolio_value", "Tax value 31.12", "CHF 141'774.95", "Depot", 141_774.95, 0.99),
          f("dividends_gross", "Gross dividends & coupons", "CHF 3'167.50", "Income", 3_167.5, 0.98),
          f("wht_ch", "Swiss anticipatory tax 35%", "CHF 1'030.53", "Credits", 1_030.53, 0.98),
          f("wht_da1", "Foreign WHT (DA-1 eligible)", "CHF 49.76", "Credits", 49.76, 0.95),
          f("positions", "Positions parsed", "8 securities", "Depot", 8, 0.99),
        ],
      };
    }
    case "insurance_premiums": {
      const total = Math.round(vary(9_264, 150));
      return {
        summary: "Helsana premium statement for tax purposes — 2 adults, 1 child (KVG basic + supplementary).",
        fields: [
          f("insurer", "Insurer", "Helsana Versicherungen AG", "Insurance"),
          f("premiums_total", "Premiums paid", `CHF ${total.toLocaleString("de-CH")}`, "Deductions", total, 0.99),
          f("persons", "Insured persons", "3 (Alex, Maria, Lena)", "Insurance", 3),
          f("franchise", "Franchise adults", "CHF 300 / 1'500", "Insurance"),
        ],
      };
    }
    case "childcare_receipt": {
      const total = Math.round(vary(14_400, 300));
      return {
        summary: "Kita Sonnenstube annual statement: third-party care for Lena Keller (2022), 3 days/week.",
        fields: [
          f("child", "Child", "Lena Keller, born 14.03.2022", "Family", undefined, 0.98),
          f("childcare_amount", "Invoiced care costs", `CHF ${total.toLocaleString("de-CH")}`, "Deductions", total, 0.97),
          f("transfers_detected", "Bank transfers detected", "CHF 13'200", "Deductions", 13_200, 0.9),
          f("days", "Care pattern", "3 days / week, 48 weeks", "Family"),
        ],
      };
    }
    case "medical_invoice": {
      const total = Math.round(vary(2_150, 120));
      return {
        summary: "Dental clinic invoice — treatment not covered by KVG insurance (self-paid).",
        fields: [
          f("patient", "Patient", "Alex Keller", "Health"),
          f("provider", "Provider", "Zahnarztpraxis am See, Zürich", "Health"),
          f("medical_amount", "Out-of-pocket amount", `CHF ${total.toLocaleString("de-CH")}`, "Deductions", total, 0.97),
        ],
      };
    }
    case "donation_receipt": {
      const total = Math.round(vary(850, 80));
      return {
        summary: "Swiss Red Cross donation confirmation — tax-deductible donation (Art. 33a DBG).",
        fields: [
          f("organisation", "Organisation", "Schweizerisches Rotes Kreuz (ZEWO-certified)", "Donations"),
          f("donation_amount", "Donation amount", `CHF ${total.toLocaleString("de-CH")}`, "Deductions", total, 0.99),
        ],
      };
    }
    case "mortgage_statement": {
      const interest = Math.round(vary(9_920, 250));
      return {
        summary: "Mortgage annual statement: outstanding debt and interest paid.",
        fields: [
          f("mortgage_debt", "Outstanding debt 31.12", `CHF ${Math.round(interest * 64.5).toLocaleString("de-CH")}`, "Assets", interest * 64.5),
          f("mortgage_interest", "Interest paid", `CHF ${interest.toLocaleString("de-CH")}`, "Deductions", interest, 0.99),
        ],
      };
    }
    case "prior_return": {
      return {
        summary:
          "Previous-year tax return (Steuererklärung 2024) as filed electronically. Rich source of personal reference data: identity, civil status, dependants, prior income.",
        fields: [
          f("name", "Full name", "Alex Keller", "Identity", undefined, 0.99),
          f("dob", "Date of birth", "14.06.1989", "Identity", undefined, 0.98),
          f("ahv", "AHV no.", "756.4421.9087.33", "Identity", undefined, 0.99),
          f("addr", "Address (31.12.2024)", "Seefeldstrasse 112, 8008 Zürich", "Residence", undefined, 0.98),
          f("marital", "Civil status", "Married — joint taxation with Maria Keller", "Family", undefined, 0.99),
          f("children", "Children / dependants", "1 — Lena Keller (b. 14.03.2022)", "Family", undefined, 0.98),
          f("employer", "Employer (2024)", "Mandala Health AG, Zürich (until 06/2025)", "Employment", undefined, 0.96),
          f("inc_decl", "Taxable income declared 2024", "CHF 164'800", "Prior year", 164_800, 0.97),
          f("wealth_decl", "Taxable wealth declared 2024", "CHF 178'200", "Prior year", 178_200, 0.95),
          f("tax_paid", "Tax paid on account 2024", "CHF 7'940", "Prior year", 7_940, 0.96),
          f("canton", "Tax canton", "ZH — Kanton Zürich", "Jurisdiction", undefined, 0.99),
          f("muni", "Tax municipality", "Zürich (Stadt)", "Jurisdiction", undefined, 0.99),
        ],
      };
    }
    case "tax_assessment": {
      return {
        summary:
          "Official tax assessment & definitive invoice 2024 (Steuerveranlagung, Kantonales Steueramt Zürich). Authoritative for prior-year figures and identity data.",
        fields: [
          f("name", "Full name", "Alex Keller", "Identity", undefined, 0.99),
          f("dob", "Date of birth", "14.06.1989", "Identity", undefined, 0.99),
          f("ahv", "AHV no.", "756.4421.9087.33", "Identity", undefined, 0.99),
          f("addr", "Address on record", "Seefeldstrasse 118, 8008 Zürich", "Residence", undefined, 0.88),
          f("marital", "Civil status", "Married — joint taxation", "Family", undefined, 0.98),
          f("children", "Children considered", "1 child deduction applied", "Family", undefined, 0.95),
          f("inc_assessed", "Taxable income assessed 2024", "CHF 169'500", "Prior year", 169_500, 0.99),
          f("tax_due", "Definitive tax invoice 2024", "CHF 8'410", "Prior year", 8_410, 0.99),
          f("office", "Issuing authority", "Kantonales Steueramt Zürich", "Authority", undefined, 0.99),
          f("canton", "Tax canton", "ZH — Kanton Zürich", "Jurisdiction", undefined, 0.99),
          f("muni", "Tax municipality", "Zürich (Stadt)", "Jurisdiction", undefined, 0.99),
        ],
      };
    }
    case "tax_invitation": {
      return {
        summary:
          "Official filing invitation for tax year 2025 (Aufforderung zur Steuererklärung), issued by the cantonal tax office. Confirms identity, address and jurisdiction.",
        fields: [
          f("name", "Addressee", "Alex Keller", "Identity", undefined, 0.99),
          f("addr", "Address on file", "Seefeldstrasse 112, 8008 Zürich", "Residence", undefined, 0.97),
          f("cantonal_ref", "Taxpayer reference", "ZH-…441 908", "Authority", undefined, 0.92),
          f("deadline", "Filing deadline", "31.03.2026", "Authority", undefined, 0.98),
          f("office", "Issuing authority", "Kantonales Steueramt Zürich", "Authority", undefined, 0.99),
          f("canton", "Tax canton", "ZH — Kanton Zürich", "Jurisdiction", undefined, 0.99),
          f("muni", "Tax municipality", "Zürich (Stadt)", "Jurisdiction", undefined, 0.99),
        ],
      };
    }
    case "pension_fund": {
      const vested = Math.round(vary(212_400, 4_000));
      return {
        summary:
          "Pension fund certificate (BVG-Ausweis, 2nd pillar) from PKG. Vested capital is exempt from wealth tax until payout; the voluntary buy-in (Einkauf) is fully deductible.",
        fields: [
          f("holder", "Insured person", "Alex Keller", "Person"),
          f("institute", "Pension fund", "PKG Pensionskasse", "Pension"),
          f("insured_salary", "Coordinated salary", `CHF ${Math.round(vary(101_400, 800)).toLocaleString("de-CH")}`, "Pension", Math.round(vary(101_400, 800)), 0.96),
          f("vested_capital", "Vested benefits 31.12 (wealth-tax exempt)", `CHF ${vested.toLocaleString("de-CH")}`, "Pension", vested, 0.97),
          f("buy_in_2p", "Voluntary buy-in (Einkauf) tax year", "CHF 6'000", "Deductions", 6_000, 0.99),
          f("note", "Note", "Buy-in deductible; no withdrawal restriction triggered", "Pension"),
        ],
      };
    }
    case "ahv_iv": {
      return {
        summary:
          "AHV individual account statement (IK-Kontoauszug). Contribution history verified — no gaps, which supports the identity dossier.",
        fields: [
          f("name", "Insured person", "Alex Keller", "Identity", undefined, 0.99),
          f("ahv", "AHV no.", "756.4421.9087.33", "Identity", undefined, 0.99),
          f("addr", "Address (registered)", "Seefeldstrasse 112, 8008 Zürich", "Residence", undefined, 0.9),
          f("years", "Contribution years", "17 years (2008–2024)", "Social", 17, 0.95),
          f("gaps", "Contribution gaps", "None detected", "Social", 0),
        ],
      };
    }
    case "education": {
      const total = Math.round(vary(4_800, 220));
      return {
        summary:
          "Job-related education receipt: CAS Digital Taxation, University of St. Gallen — deductible as Weiterbildung within the federal cap.",
        fields: [
          f("course", "Course", "CAS Digital Taxation (2025)", "Education"),
          f("provider", "Provider", "Universität St. Gallen (HSG)", "Education"),
          f("education_amount", "Tuition & materials", `CHF ${total.toLocaleString("de-CH")}`, "Deductions", total, 0.99),
          f("relevance", "Job relevance confirmed", "Yes — role-related curriculum", "Education"),
        ],
      };
    }
    case "real_estate": {
      const rent = Math.round(vary(31_200, 600));
      const maint = Math.round(vary(7_850, 350));
      return {
        summary:
          "Real estate file: rented property with annual rental income and documented maintenance costs (Liegenschaftsunterhalt).",
        fields: [
          f("property", "Property", "Einfamilienhaus, Uster (rented out)", "Property"),
          f("rental_income", "Rental income (gross/year)", `CHF ${rent.toLocaleString("de-CH")}`, "Income", rent, 0.98),
          f("maintenance_costs", "Maintenance costs (documented)", `CHF ${maint.toLocaleString("de-CH")}`, "Deductions", maint, 0.97),
          f("est_value", "Estimated market value", `CHF ${Math.round(vary(1_240_000, 20_000)).toLocaleString("de-CH")}`, "Assets", Math.round(vary(1_240_000, 20_000)), 0.9),
        ],
      };
    }
    case "debt_document": {
      const interest = Math.round(vary(1_420, 90));
      return {
        summary:
          "Private loan statement: outstanding balance offsets taxable wealth; interest paid is fully deductible.",
        fields: [
          f("creditor", "Creditor", "Cembra MoneyBank AG", "Debt"),
          f("debt_outstanding", "Outstanding balance 31.12", `CHF ${Math.round(interest * 16.8).toLocaleString("de-CH")}`, "Assets", Math.round(interest * 16.8), 0.98),
          f("debt_interest", "Interest paid", `CHF ${interest.toLocaleString("de-CH")}`, "Deductions", interest, 0.99),
        ],
      };
    }
    case "foreign_document": {
      const income = Math.round(vary(12_600, 400));
      return {
        summary:
          "Foreign-source income document (board-of-director fee, Germany). Taxable in Switzerland; foreign tax withheld is handled under the DTA credit procedure.",
        fields: [
          f("source_country", "Source country", "Germany (DTA applies)", "Foreign"),
          f("foreign_income", "Foreign income (gross)", `CHF ${income.toLocaleString("de-CH")}`, "Income", income, 0.97),
          f("foreign_tax_paid", "Foreign tax withheld", `CHF ${Math.round(income * 0.15).toLocaleString("de-CH")}`, "Credits", Math.round(income * 0.15), 0.94),
          f("note", "Treatment", "Declared fully; relief via pauschale Steueranrechnung", "Foreign"),
        ],
      };
    }
    case "crypto_statement": {
      const value = Math.round(vary(58_340, 2_000));
      const staking = Math.round(vary(1_240, 120));
      return {
        summary:
          "Crypto tax report (Bitcoin Suisse): year-end wallet values enter wealth tax, staking rewards are taxable income; private capital gains remain tax-free.",
        fields: [
          f("custodian", "Platform", "Bitcoin Suisse AG", "Crypto"),
          f("positions", "Positions", "BTC 0.42 · ETH 3.10 · SOL 12.0", "Crypto"),
          f("crypto_value", "Tax value 31.12 (FTA rates)", `CHF ${value.toLocaleString("de-CH")}`, "Assets", value, 0.98),
          f("staking_income", "Staking rewards (income)", `CHF ${staking.toLocaleString("de-CH")}`, "Income", staking, 0.97),
          f("trades", "Trades", "34 — private gains tax-free, no stamp duty", "Crypto", 34),
        ],
      };
    }
    default:
      return {
        summary: "Document accepted. The AI could not find taxable attributes — it will be kept on file as supporting evidence.",
        fields: [f("note", "Classification", "Supporting document — no taxable values found", "Other")],
      };
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { fileName?: string; typeHint?: DocType };
  const fileName = body.fileName ?? "document.pdf";
  const hint = body.typeHint;

  let type: DocType;
  let confidence: number;
  if (hint) {
    type = hint;
    confidence = 0.86;
  } else {
    const found = classify(fileName);
    if (!found) {
      return NextResponse.json(
        {
          status: "needs_type",
          options: Object.entries(DOC_TYPE_META).map(([value, m]) => ({ value, label: m.label })),
          message: "The AI could not confidently classify this document. Please select the document type.",
          provider: getAiProvider(),
        },
        { headers: aiProviderHeaders() }
      );
    }
    type = found.type;
    confidence = found.confidence;
  }

  const { fields, summary } = extract(type, fileName);
  return NextResponse.json(
    {
      status: "done",
      type,
      typeLabel: DOC_TYPE_META[type].label,
      confidence,
      fields,
      summary,
      provider: getAiProvider(),
    },
    { headers: aiProviderHeaders() }
  );
}
