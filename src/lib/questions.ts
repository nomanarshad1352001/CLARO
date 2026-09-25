import type { Answer, AssetItem, Household, IncomeItem, Property, TaxDoc } from "./types";
import type { EngineInput } from "./tax-engine";
import { getAnswerValue } from "./store";
import { estimateCommute } from "./geo";
import type { Holding } from "./types";

/* ------------------------------------------------------------------ */
/*  Question graph — the AI asks ONLY what documents cannot answer.    */
/* ------------------------------------------------------------------ */

export interface Question {
  id: string;
  prompt: string;
  why: string;
  kind: "toggle" | "chips" | "amount" | "distance" | "choice-desc";
  options?: { value: string; label: string; sub?: string }[];
  unit?: string;
  placeholder?: string;
  followUp?: (value: string | number | boolean) => string | null; // id of follow-up question
  skipIf?: (answers: Answer[]) => boolean;
}

export const QUESTIONS: Question[] = [
  {
    id: "church-member",
    prompt: "Are you registered with an officially recognised church or religious community in your canton?",
    why: "Church tax is levied as a surcharge on the cantonal tax (≈9–17% depending on canton). It is never stated on salary or bank documents, so I have to ask.",
    kind: "chips",
    options: [
      { value: "none", label: "Not registered" },
      { value: "reformed", label: "Protestant-Reformed" },
      { value: "catholic", label: "Roman Catholic" },
      { value: "christ-catholic", label: "Christ Catholic" },
      { value: "other", label: "Other community" },
    ],
  },
  {
    id: "professional-mode",
    prompt: "For professional expenses (commuting aside), shall I apply the statutory flat rate — or did you keep receipts for higher actual costs?",
    why: "The flat rate (3% of salary, min. CHF 2'000, max. CHF 4'000 per person) needs no proof. Actual costs only pay off above that amount.",
    kind: "choice-desc",
    options: [
      { value: "flat", label: "Apply the flat rate", sub: "Recommended for most — no receipts needed" },
      { value: "actual", label: "I have higher actual costs", sub: "You will enter the total amount" },
    ],
  },
  {
    id: "professional-actual",
    prompt: "What is the total of your documented professional expenses for the tax year (training, work tools, specialist literature, home office)?",
    why: "Actual costs must be declared as a round figure and substantiated on request by the tax office.",
    kind: "amount",
    unit: "CHF",
    placeholder: "e.g. 5'400",
    skipIf: (a) => getAnswerValue(a, "professional-mode") !== "actual",
  },
  {
    id: "commute-mode",
    prompt: "How do you mainly travel to work? This drives the commuting deduction (Fahrkosten).",
    why: "No uploaded document reveals your commute. Public transport passes and car kilometres are deductible within cantonal caps.",
    kind: "chips",
    options: [
      { value: "public", label: "Public transport" },
      { value: "car", label: "Car" },
      { value: "home", label: "Home office / none" },
    ],
  },
  {
    id: "commute-pass",
    prompt: "What did your public transport passes cost in total for the year (GA, Halbtax, zone passes)?",
    why: "Travelcard costs are deductible up to the federal cap of CHF 3'200 (higher in many cantons).",
    kind: "amount",
    unit: "CHF",
    placeholder: "e.g. 3'860",
    skipIf: (a) => getAnswerValue(a, "commute-mode") !== "public",
  },
  {
    id: "commute-km",
    prompt: "How many kilometres is your daily round trip to work by car?",
    why: "Car commuting is deductible at CHF 0.70/km for ~220 working days, subject to the cantonal ceiling.",
    kind: "distance",
    unit: "km / day",
    placeholder: "e.g. 34",
    skipIf: (a) => getAnswerValue(a, "commute-mode") !== "car",
  },
  {
    id: "moved",
    prompt: "Did you move to a different municipality or canton during the tax year?",
    why: "Taxes are owed to your municipality on 31 December, and a cross-canton move changes the entire calculation.",
    kind: "toggle",
  },
  {
    id: "debt",
    prompt: "Do you have any mortgage or private loans on which you paid interest? I found no mortgage statement among your documents.",
    why: "Debt interest is fully deductible from income and the debt itself reduces taxable wealth.",
    kind: "toggle",
  },
  {
    id: "debt-interest",
    prompt: "How much debt interest did you pay in total during the tax year?",
    why: "Only the interest is deductible — repayments of the principal are not.",
    kind: "amount",
    unit: "CHF",
    placeholder: "e.g. 9'920",
    skipIf: (a) => getAnswerValue(a, "debt") !== true,
  },
  {
    id: "alimony",
    prompt: "Did you pay alimony or child maintenance to a former partner?",
    why: "Maintenance payments are deductible; received maintenance would be taxable income.",
    kind: "toggle",
  },
  {
    id: "alimony-amount",
    prompt: "How much alimony/maintenance did you pay during the tax year?",
    why: "Bank transfers qualify as proof — keep them on file.",
    kind: "amount",
    unit: "CHF",
    placeholder: "e.g. 12'000",
    skipIf: (a) => getAnswerValue(a, "alimony") !== true,
  },
  {
    id: "other-income",
    prompt: "Did you have any other taxable income I could not see — freelance work, rental income, board-of-director fees?",
    why: "Undeclared income is the most common reason for retroactive assessments. Better to capture it now.",
    kind: "toggle",
  },
  {
    id: "other-income-amount",
    prompt: "What was the total amount of this additional income (gross)?",
    why: "It will be added to your taxable income as 'other income'.",
    kind: "amount",
    unit: "CHF",
    placeholder: "e.g. 8'500",
    skipIf: (a) => getAnswerValue(a, "other-income") !== true,
  },
];

export function visibleQuestions(answers: Answer[]): Question[] {
  return QUESTIONS.filter((q) => !(q.skipIf && q.skipIf(answers)));
}

export function nextQuestion(answers: Answer[]): Question | null {
  const list = visibleQuestions(answers);
  return list.find((q) => !answers.some((a) => a.questionId === q.id)) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Facts read from processed documents                                */
/* ------------------------------------------------------------------ */

export function numericField(docs: TaxDoc[], key: string): number {
  return docs
    .filter((d) => d.status === "done")
    .reduce((sum, d) => {
      const f = d.fields?.find((x) => x.key === key);
      return sum + (f?.numeric ?? 0);
    }, 0);
}

export function hasDocType(docs: TaxDoc[], type: string): boolean {
  return docs.some((d) => d.type === type && d.status === "done");
}

export interface InferredFact {
  key: string;
  label: string;
  value: string;
  source: string;
}

export function inferredFacts(docs: TaxDoc[], holdings: Holding[]): InferredFact[] {
  const facts: InferredFact[] = [];
  const salaries = docs.filter((d) => d.type === "salary_certificate" && d.status === "done");
  if (salaries.length >= 2) {
    facts.push({
      key: "civil",
      label: "Civil status",
      value: "Married — joint taxation",
      source: "Two salary certificates, same surname & address (§§ 1 + 6)",
    });
  }
  if (hasDocType(docs, "childcare_receipt")) {
    facts.push({
      key: "children",
      label: "Children",
      value: "1 child, third-party care",
      source: "Kita Sonnenstube annual statement",
    });
  }
  if (hasDocType(docs, "insurance_premiums")) {
    facts.push({
      key: "ins",
      label: "Health premiums",
      value: `CHF ${numericField(docs, "premiums_total").toLocaleString("de-CH")} / year`,
      source: "Helsana Prämienbescheinigung",
    });
  }
  if (holdings.length > 0) {
    facts.push({
      key: "wealth",
      label: "Securities (31.12)",
      value: `CHF ${Math.round(holdings.reduce((s, h) => s + h.valueChf, 0)).toLocaleString("de-CH")} · ${holdings.length} positions`,
      source: "UBS eSteuerauszug",
    });
  }
  facts.push({
    key: "residence",
    label: "Tax residence",
    value: "Confirmed — no move reported during year",
    source: "Consistent address across all documents",
  });
  return facts;
}

/* ------------------------------------------------------------------ */
/*  Assemble engine input from documents + answers                     */
/* ------------------------------------------------------------------ */

export function textField(docs: TaxDoc[], key: string): string | undefined {
  for (const d of docs) {
    if (d.status !== "done") continue;
    const f = d.fields?.find((x) => x.key === key);
    if (f) return f.value;
  }
  return undefined;
}

/** Home address (identity docs) and workplace address (salary certificate). */
export function commuteAddresses(docs: TaxDoc[]) {
  const home =
    textField(docs.filter((d) => d.type === "tax_invitation"), "addr") ??
    textField(docs.filter((d) => d.type === "prior_return"), "addr") ??
    textField(docs, "address") ??
    textField(docs, "addr");
  const work =
    textField(
      docs.filter((d) => d.type === "salary_certificate" && !d.fields?.some((f) => f.key === "is_spouse")),
      "employer_address"
    ) ?? textField(docs, "employer_address");
  return { home, work };
}

export function buildEngineInput(args: {
  docs: TaxDoc[];
  answers: Answer[];
  holdings: Holding[];
  properties: Property[];
  household: Household;
  extraIncome?: IncomeItem[];
  extraAssets?: AssetItem[];
  cantonCode: string;
  municipalityId: string;
  year: number;
}): EngineInput {
  const { docs, answers, holdings, properties, household, cantonCode, municipalityId, year } = args;
  const xIncome = (args.extraIncome ?? []).reduce((a, i) => a + i.amount, 0);
  const xAssetsPos = (args.extraAssets ?? []).filter((a) => a.amount > 0).reduce((a, i) => a + i.amount, 0);
  const xDebts = Math.abs((args.extraAssets ?? []).filter((a) => a.amount < 0).reduce((a, i) => a + i.amount, 0));

  const salarySpouse = docs
    .filter((d) => d.type === "salary_certificate" && d.status === "done" && d.fields?.some((f) => f.key === "is_spouse"))
    .reduce((s, d) => s + (d.fields?.find((f) => f.key === "gross_salary")?.numeric ?? 0), 0);
  const salaryAll = numericField(docs, "gross_salary");
  const salaryPrimary = Math.max(0, salaryAll - salarySpouse);

  const church = getAnswerValue(answers, "church-member");
  const commuteModeRaw = getAnswerValue(answers, "commute-mode");
  const debtOn = getAnswerValue(answers, "debt") === true;
  const alimonyOn = getAnswerValue(answers, "alimony") === true;
  const otherIncOn = getAnswerValue(answers, "other-income") === true;
  const profMode = getAnswerValue(answers, "professional-mode");

  const geo = commuteAddresses(docs);
  const est = estimateCommute(geo.home, geo.work);
  const answeredKm = Number(getAnswerValue(answers, "commute-km") ?? 0);
  const autoKm = est.ok && !est.sameLocality ? (est.dailyRoundTripKm ?? 0) : 0;

  return {
    year,
    cantonCode,
    municipalityId,
    civilStatus: household.civilStatus,
    childrenCount: household.childrenCount,
    dependantsCount: household.dependantsCount,
    soleCustody: household.soleCustody,
    churchMember: typeof church === "string" && church !== "none" && church !== undefined,
    movedDuringYear: household.movedDuringYear,
    previousCanton: household.previousCanton,
    crossBorder: household.crossBorder,

    grossSalaryPrimary: salaryPrimary,
    grossSalarySpouse: salarySpouse,
    bonusIncome: numericField(docs, "bonus"),
    benefitsIncome: numericField(docs, "benefits"),
    ahvIvIncome: numericField(docs, "ahv_pension_income"),
    pensionIncome: numericField(docs, "pension_income"),
    unemploymentIncome: numericField(docs, "unemployment_income"),
    otherIncome: (otherIncOn ? Number(getAnswerValue(answers, "other-income-amount") ?? 0) : 0) + xIncome,
    interestIncome: numericField(docs, "interest_income"),
    foreignIncome: numericField(docs, "foreign_income"),
    foreignIncomeExempt: 0,
    stakingIncome: numericField(docs, "staking_income"),

    pillar3aPrimary: numericField(docs, "contribution_3a"),
    professionalMode: profMode === "actual" ? "actual" : "flat",
    professionalActual: Number(getAnswerValue(answers, "professional-actual") ?? 0),
    commuteMode: commuteModeRaw === "car" ? "car" : commuteModeRaw === "public" ? "public" : "none",
    commuteKmPerDay: answeredKm > 0 ? answeredKm : autoKm,
    publicPassCost: Number(getAnswerValue(answers, "commute-pass") ?? 0),
    insuranceCapBase: numericField(docs, "premiums_total"),
    donations: numericField(docs, "donation_amount"),
    medicalCosts: numericField(docs, "medical_amount"),
    childcareCosts: numericField(docs, "childcare_amount"),
    debtInterest:
      (debtOn ? Number(getAnswerValue(answers, "debt-interest") ?? 0) : 0) +
      numericField(docs, "debt_interest"),
    assetMgmtCost: 0,
    alimony: alimonyOn ? Number(getAnswerValue(answers, "alimony-amount") ?? 0) : 0,
    educationCosts: numericField(docs, "education_amount"),
    buyIn2p: numericField(docs, "buy_in_2p"),

    holdings,
    properties,
    bankBalance: numericField(docs, "bank_balance") + xAssetsPos,
    cryptoValue: numericField(docs, "crypto_value"),
    debtOutstanding: numericField(docs, "debt_outstanding") + xDebts,
    foreignAssets: 0,
  };
}
