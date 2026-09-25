import type {
  CalcBreakdown,
  CivilStatus,
  DeductionLine,
  Holding,
  Property,
} from "./types";
import { getCanton, getMunicipality } from "./tax-data";
import { getRules, type Bracket } from "./tax-rules";

/* ------------------------------------------------------------------ */
/*  DETERMINISTIC SWISS TAX ENGINE                                     */
/*                                                                     */
/*  Federal → Canton → Municipality → Tax Year → Rules                 */
/*                                                                     */
/*  All statutory constants come from the versioned rules registry     */
/*  (lib/tax-rules.ts). No LLM is involved in any computation: the     */
/*  same structured input always yields the identical output.          */
/* ------------------------------------------------------------------ */

export interface EngineInput {
  year: number;
  cantonCode: string;
  municipalityId: string;

  /* taxpayer situation */
  civilStatus: CivilStatus;
  childrenCount: number;
  dependantsCount: number;
  soleCustody: boolean;
  churchMember: boolean;
  movedDuringYear: boolean;
  previousCanton?: string;
  crossBorder: boolean;

  /* income */
  grossSalaryPrimary: number;
  grossSalarySpouse: number;
  bonusIncome: number;
  benefitsIncome: number;
  ahvIvIncome: number;
  pensionIncome: number;
  unemploymentIncome: number;
  otherIncome: number;
  interestIncome: number;
  foreignIncome: number;
  foreignIncomeExempt: number;
  stakingIncome: number;

  /* deduction drivers */
  pillar3aPrimary: number;
  professionalMode: "flat" | "actual";
  professionalActual: number;
  commuteMode: "public" | "car" | "none";
  commuteKmPerDay: number;
  publicPassCost: number;
  insuranceCapBase: number;
  donations: number;
  medicalCosts: number;
  childcareCosts: number;
  debtInterest: number;
  assetMgmtCost: number;
  alimony: number;
  educationCosts: number;
  buyIn2p: number;

  /* assets */
  holdings: Holding[];
  properties: Property[];
  bankBalance: number;
  cryptoValue: number;
  debtOutstanding: number;
  foreignAssets: number;
}

export function progressive(income: number, brackets: Bracket[]): number {
  if (income <= 0) return 0;
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    const top = i + 1 < brackets.length ? brackets[i + 1].from : Infinity;
    if (income > b.from) tax += (Math.min(income, top) - b.from) * b.rate;
    else break;
  }
  return tax;
}

export function isJoint(status: CivilStatus): boolean {
  return status === "married" || status === "registered_partnership";
}

/** Federal tariff selection: joint, Elterntarif (single parent) or single. */
export function federalTax(
  income: number,
  status: CivilStatus,
  childrenCount: number,
  soleCustody: boolean,
  year: number
): { tax: number; tariff: string } {
  const rules = getRules(year);
  if (income <= 0) return { tax: 0, tariff: "none" };
  const joint = isJoint(status);
  const parentTariff = !joint && childrenCount > 0 && soleCustody;
  const brackets = joint || parentTariff ? rules.federalMarried : rules.federalSingle;
  const raw = progressive(income, brackets);
  return {
    tax: Math.min(raw, income * rules.federalCapRate),
    tariff: joint ? "Verheiratetentarif" : parentTariff ? "Elterntarif" : "Grundtarif",
  };
}

export function round5(n: number): number {
  return Math.round(n / 5) * 5;
}
export function chf(n: number): number {
  return Math.round(n * 100) / 100;
}

export function securitiesTotals(holdings: Holding[]) {
  const value = holdings.reduce((s, h) => s + h.valueChf, 0);
  const dividends = holdings.reduce((s, h) => s + h.dividendGrossChf, 0);
  const refundCH = holdings.filter((h) => h.reclaimType === "RÜF").reduce((s, h) => s + h.withholdingChf, 0);
  const da1 = holdings.filter((h) => h.reclaimType === "DA-1").reduce((s, h) => s + h.withholdingChf, 0);
  return { value: chf(value), dividends: chf(dividends), refundCH: chf(refundCH), da1: chf(da1) };
}

export interface PropertyTotals {
  swissIncome: number;
  foreignIncome: number;
  maintenance: number;
  mortgageInterest: number;
  swissWealth: number;
  foreignWealth: number;
  mortgageDebt: number;
}

export function propertyTotals(props: Property[], year: number): PropertyTotals {
  const r = getRules(year);
  const t: PropertyTotals = {
    swissIncome: 0, foreignIncome: 0, maintenance: 0,
    mortgageInterest: 0, swissWealth: 0, foreignWealth: 0, mortgageDebt: 0,
  };
  for (const p of props) {
    const gross = p.rentalIncome > 0 ? p.rentalIncome : p.imputedRental;
    const maint = p.maintenanceMode === "actual" ? p.maintenanceActual : gross * r.deductions.propertyMaintenanceFlat;
    const foreign = p.countryCode !== "CH";
    if (foreign) {
      t.foreignIncome += gross;
      t.foreignWealth += p.taxValue;
    } else {
      t.swissIncome += gross;
      t.swissWealth += p.taxValue;
    }
    t.maintenance += maint;
    t.mortgageInterest += p.mortgageInterest;
    t.mortgageDebt += p.mortgageBalance;
  }
  return t;
}

export function computeReturn(inp: EngineInput): CalcBreakdown {
  const rules = getRules(inp.year);
  const D = rules.deductions;
  const canton = getCanton(inp.cantonCode);
  const muni = getMunicipality(inp.cantonCode, inp.municipalityId);
  const sec = securitiesTotals(inp.holdings);
  const prop = propertyTotals(inp.properties ?? [], inp.year);
  const joint = isJoint(inp.civilStatus);

  /* ------------------------------ income -------------------------- */
  const employment = inp.grossSalaryPrimary + inp.grossSalarySpouse + inp.bonusIncome + inp.benefitsIncome;
  const replacement = inp.ahvIvIncome + inp.pensionIncome + inp.unemploymentIncome;
  const capital = inp.interestIncome + sec.dividends + inp.stakingIncome;

  const incomeBreakdown = [
    { label: "Employment (salary, bonus, benefits)", amount: chf(employment) },
    { label: "AHV / IV, pension, unemployment", amount: chf(replacement) },
    { label: "Interest, dividends & staking", amount: chf(capital) },
    { label: "Real estate (rent / imputed rental)", amount: chf(prop.swissIncome) },
    { label: "Foreign income (taxable in CH)", amount: chf(inp.foreignIncome) },
    { label: "Other income", amount: chf(inp.otherIncome) },
  ].filter((x) => x.amount !== 0);

  const grossIncome =
    employment + replacement + capital + prop.swissIncome + inp.foreignIncome + inp.otherIncome;

  /* exempt with progression: foreign real estate & treaty-exempt income */
  const exemptProgression = prop.foreignIncome + inp.foreignIncomeExempt;

  /* --------------------------- deductions ------------------------- */
  const lines: DeductionLine[] = [];
  const push = (l: DeductionLine) => lines.push(l);
  const earners = (inp.grossSalaryPrimary > 0 ? 1 : 0) + (inp.grossSalarySpouse > 0 ? 1 : 0);

  if (employment > 0) {
    const flat = Math.min(
      Math.max(employment * D.profFlatRate, D.profFlatMin),
      D.profFlatMax * Math.max(1, joint && earners > 1 ? 2 : 1)
    );
    const chosen = inp.professionalMode === "actual" && inp.professionalActual > flat ? inp.professionalActual : flat;
    push({
      id: "pro", label: "Professional expenses",
      amount: inp.professionalMode === "actual" ? inp.professionalActual : flat,
      applied: chosen,
      source: inp.professionalMode === "actual" ? "Your declaration" : `Flat rate · ${D.profFlatRate * 100}% of salary (CHF ${D.profFlatMin.toLocaleString("de-CH")}–${D.profFlatMax.toLocaleString("de-CH")} p.p.)`,
      auto: inp.professionalMode !== "actual",
      note: `Art. 26 DBG · rules ${inp.year}`,
    });
  }

  if (inp.pillar3aPrimary > 0) {
    const cap = D.p3aEmployed * (joint && earners > 1 ? 2 : 1);
    push({
      id: "p3a", label: "Pillar 3a contributions", amount: inp.pillar3aPrimary, cappedAt: cap,
      applied: Math.min(inp.pillar3aPrimary, cap), source: "Säule-3a-Bescheinigungen", auto: true,
      note: inp.pillar3aPrimary > cap
        ? `Capped at CHF ${cap.toLocaleString("de-CH")} (${inp.year} employed limit${joint && earners > 1 ? " × 2" : ""})`
        : "Fully deductible · Art. 33 Abs. 1 lit. e DBG",
    });
  }

  let commute = 0;
  if (inp.commuteMode === "public") commute = inp.publicPassCost;
  if (inp.commuteMode === "car") commute = inp.commuteKmPerDay * D.commuteDays * D.carRatePerKm;
  if (commute > 0) {
    push({
      id: "commute", label: "Commuting costs", amount: commute, cappedAt: D.commuteCapFederal,
      applied: Math.min(commute, D.commuteCapFederal),
      source: inp.commuteMode === "car"
        ? `Auto-computed · ${inp.commuteKmPerDay} km/day × ${D.commuteDays} days × CHF ${D.carRatePerKm}`
        : "Travelcard costs",
      auto: true,
      note: `Federal cap CHF ${D.commuteCapFederal.toLocaleString("de-CH")} · cantonal cap CHF ${canton.commuteCapCantonal.toLocaleString("de-CH")}`,
    });
    const meals = D.mealsPerDay * D.mealsDays;
    push({
      id: "meals", label: "Meals away from home", amount: meals, cappedAt: D.mealsCap,
      applied: Math.min(meals, D.mealsCap),
      source: `Derived from the ${inp.commuteMode === "car" ? "car" : "public-transport"} commute`,
      auto: true, note: `CHF ${D.mealsPerDay}/day × ${D.mealsDays} days`,
    });
  }
  if (inp.commuteMode === "none") {
    push({
      id: "homeoffice", label: "Home office (flat room share)", amount: D.homeOfficeFlat,
      applied: D.homeOfficeFlat, source: "Derived from your home-office answer", auto: true,
      note: `Flat CHF ${D.homeOfficeFlat.toLocaleString("de-CH")} where a work room replaces the commute`,
    });
  }

  if (inp.educationCosts > 0) {
    push({
      id: "edu", label: "Education & training", amount: inp.educationCosts, cappedAt: D.educationCap,
      applied: Math.min(inp.educationCosts, D.educationCap), source: "Course receipts", auto: true,
      note: `Art. 33 Abs. 1 lit. e DBG · cap CHF ${D.educationCap.toLocaleString("de-CH")} (${inp.year})`,
    });
  }
  if (inp.buyIn2p > 0) {
    push({ id: "bvg2", label: "Pillar 2 buy-in (BVG Einkauf)", amount: inp.buyIn2p, applied: inp.buyIn2p,
      source: "BVG-Ausweis", auto: true, note: "Fully deductible · Art. 33 Abs. 1 lit. d DBG" });
  }

  const insuranceCap =
    (joint ? D.insuranceCapMarried : D.insuranceCapSingle) + inp.childrenCount * D.insurancePerChild;
  if (inp.insuranceCapBase > 0) {
    push({ id: "ins", label: "Health & life insurance premiums", amount: inp.insuranceCapBase,
      cappedAt: insuranceCap, applied: Math.min(inp.insuranceCapBase, insuranceCap),
      source: "Prämienbescheinigung", auto: true,
      note: `Household cap CHF ${insuranceCap.toLocaleString("de-CH")} (status-based)` });
  }

  if (inp.childcareCosts > 0 && inp.childrenCount > 0) {
    const cap = D.childcareCapFederal * inp.childrenCount;
    push({ id: "childcare", label: "Third-party childcare", amount: inp.childcareCosts, cappedAt: cap,
      applied: Math.min(inp.childcareCosts, cap), source: "Childcare statements", auto: true,
      note: `Cap CHF ${D.childcareCapFederal.toLocaleString("de-CH")} per child (federal, ${inp.year})` });
  }

  if (inp.donations > 0) {
    const cap = grossIncome * D.donationCapRate;
    push({ id: "don", label: "Charitable donations", amount: inp.donations, cappedAt: cap,
      applied: Math.min(inp.donations, cap), source: "Donation receipts", auto: true,
      note: `Up to ${D.donationCapRate * 100}% of net income · Art. 33a DBG` });
  }
  if (inp.medicalCosts > 0) {
    const threshold = grossIncome * D.medicalThreshold;
    push({ id: "med", label: "Out-of-pocket medical costs", amount: inp.medicalCosts,
      applied: Math.max(0, inp.medicalCosts - threshold), source: "Medical invoices", auto: true,
      note: `Excess over ${D.medicalThreshold * 100}% of net income (CHF ${Math.round(threshold).toLocaleString("de-CH")})` });
  }

  const totalDebtInterest = inp.debtInterest + prop.mortgageInterest;
  if (totalDebtInterest > 0) {
    push({ id: "debt", label: "Mortgage & debt interest", amount: totalDebtInterest, applied: totalDebtInterest,
      source: "Mortgage / loan statements", auto: true, note: "Fully deductible · Art. 33 Abs. 1 lit. a DBG" });
  }
  if (prop.maintenance > 0) {
    push({ id: "prop", label: "Property maintenance (Liegenschaftsunterhalt)", amount: prop.maintenance,
      applied: prop.maintenance, source: "Property files · actual or flat rate", auto: true,
      note: `Flat option ${D.propertyMaintenanceFlat * 100}% of rental value · Art. 32 DBG` });
  }

  if (inp.alimony > 0) {
    push({ id: "ali", label: "Alimony / maintenance paid", amount: inp.alimony, applied: inp.alimony,
      source: "Your declaration", auto: false, note: "Art. 33 Abs. 1 lit. c DBG" });
  }
  if (inp.dependantsCount > 0) {
    const amt = inp.dependantsCount * D.supportDeduction;
    push({ id: "dep", label: `Support deduction × ${inp.dependantsCount} dependant(s)`, amount: amt,
      applied: amt, source: "Household situation", auto: true, note: "Art. 35 Abs. 1 lit. b DBG" });
  }

  if (sec.value > 0) {
    const amt = inp.assetMgmtCost > 0 ? inp.assetMgmtCost : Math.round(sec.value * 0.003);
    push({ id: "mgmt", label: "Securities management costs", amount: amt, applied: amt,
      source: "Custodian statements · flat 0.3% of portfolio", auto: true, note: "Deposit fees & administration" });
  }

  /* two-earner deduction (Zweiverdienerabzug) */
  if (joint && inp.grossSalaryPrimary > 0 && inp.grossSalarySpouse > 0) {
    const lower = Math.min(inp.grossSalaryPrimary, inp.grossSalarySpouse);
    const amt = Math.min(Math.max(lower * D.twoEarnerRate, D.twoEarnerMin), D.twoEarnerMax);
    push({ id: "two", label: "Two-earner deduction", amount: amt, applied: Math.min(amt, lower),
      source: "Both spouses employed", auto: true,
      note: `${D.twoEarnerRate * 100}% of the lower income, CHF ${D.twoEarnerMin.toLocaleString("de-CH")}–${D.twoEarnerMax.toLocaleString("de-CH")}` });
  }

  push({ id: "soc", label: "Social deductions (catch-all)", amount: D.socialFlat, applied: D.socialFlat,
    source: "Statutory flat deduction", auto: true });

  if (inp.childrenCount > 0) {
    const amt = D.childDeductionFederal * inp.childrenCount;
    push({ id: "childFed", label: `Child deduction × ${inp.childrenCount} (federal)`, amount: amt,
      applied: amt, source: "Household situation", auto: true });
  }

  const totalFed = lines.reduce((s, l) => s + l.applied, 0);
  const commuteExtra = commute > 0
    ? Math.min(commute, canton.commuteCapCantonal) - Math.min(commute, D.commuteCapFederal) : 0;
  const childExtra = inp.childrenCount * 9_000 - inp.childrenCount * D.childDeductionFederal;
  const totalCanton = totalFed + Math.max(0, commuteExtra) + Math.max(0, childExtra);

  const taxableFed = Math.max(0, grossIncome - totalFed);
  const taxableCanton = Math.max(0, grossIncome - totalCanton);

  /* --------------------------- tariffs ---------------------------- */
  const fedRes = federalTax(taxableFed + exemptProgression, inp.civilStatus, inp.childrenCount, inp.soleCustody, inp.year);
  /* exemption with progression: rate from worldwide base, applied to CH base */
  const worldFed = taxableFed + exemptProgression;
  const fedRate = worldFed > 0 ? fedRes.tax / worldFed : 0;
  const fed = fedRate * taxableFed;

  const mult = rules.cantonMultiplierOverrides[canton.code] ?? 1;
  const cantonMult = canton.cantonMult * mult;

  const rateBase = taxableCanton + exemptProgression;
  const simpleRate = canton.simpleMin + (canton.simpleMax - canton.simpleMin) * (rateBase / (rateBase + 120_000));
  const simpleTax = taxableCanton * simpleRate;

  const cantonal = simpleTax * cantonMult;
  const municipal = simpleTax * muni.muniMult;
  const church = inp.churchMember ? cantonal * canton.churchRate : 0;
  const personal = joint ? 48 : 24;

  /* ---------------------------- wealth ---------------------------- */
  const wealthParts = [
    { label: "Bank & savings accounts", amount: chf(inp.bankBalance) },
    { label: "Securities portfolio", amount: chf(sec.value) },
    { label: "Crypto assets (FTA rates)", amount: chf(inp.cryptoValue) },
    { label: "Real estate — Swiss (tax value)", amount: chf(prop.swissWealth) },
    { label: "Foreign assets & property", amount: chf(prop.foreignWealth + inp.foreignAssets) },
    { label: "Debts & mortgages", amount: -chf(inp.debtOutstanding + prop.mortgageDebt) },
  ].filter((x) => x.amount !== 0);

  const swissWealth = Math.max(
    0,
    inp.bankBalance + sec.value + inp.cryptoValue + prop.swissWealth - inp.debtOutstanding - prop.mortgageDebt
  );
  const allowance = joint ? canton.wealthAllowanceMarried : canton.wealthAllowanceSingle;
  const wealthTaxable = Math.max(0, swissWealth - allowance);
  const wealthSimple = wealthTaxable * (canton.wealthPerMille / 1000);
  const wealthTax = wealthSimple * ((cantonMult + muni.muniMult) / 2);

  const childCredits = inp.childrenCount * D.childTaxCreditFederal;
  const totalBefore = fed + cantonal + municipal + church + personal + wealthTax;
  const totalAfter = Math.max(0, totalBefore - childCredits - sec.da1);
  const netPosition = totalAfter - sec.refundCH;

  return {
    grossIncome: chf(grossIncome),
    deductionLines: lines,
    totalDeductionsFederal: chf(totalFed),
    totalDeductionsCantonal: chf(totalCanton),
    taxableIncomeFederal: chf(round5(taxableFed)),
    taxableIncomeCantonal: chf(round5(taxableCanton)),
    federalTax: chf(round5(fed)),
    simpleTax: chf(round5(simpleTax)),
    cantonalTax: chf(round5(cantonal)),
    municipalTax: chf(round5(municipal)),
    churchTax: chf(round5(church)),
    wealthTaxable: chf(wealthTaxable),
    wealthTax: chf(round5(wealthTax)),
    personalTax: personal,
    childCredits: chf(childCredits),
    withholdingRefundCH: chf(sec.refundCH),
    da1Credit: chf(sec.da1),
    totalBeforeCredits: chf(totalBefore),
    totalAfterCredits: chf(totalAfter),
    netPosition: chf(netPosition),
    effectiveRate: grossIncome > 0 ? totalAfter / grossIncome : 0,
    marginalRate: (canton.simpleMax * (cantonMult + muni.muniMult) + 0.115) * 0.62,
    municipality: muni.name,
    cantonCode: canton.code,
    filingMethod: canton.eFiling ? "e-filing" : "export",
    year: inp.year,
    tariffUsed: fedRes.tariff,
    rulesVersion: `${rules.label} · effective ${rules.effectiveFrom}`,
    propertyIncome: chf(prop.swissIncome),
    exemptIncomeProgression: chf(exemptProgression),
    progressionRate: exemptProgression > 0 ? fedRate : undefined,
    wealthBreakdown: wealthParts,
    incomeBreakdown,
  };
}

export const EMPTY_INPUT: Omit<EngineInput, "year" | "cantonCode" | "municipalityId"> = {
  civilStatus: "single",
  childrenCount: 0,
  dependantsCount: 0,
  soleCustody: false,
  churchMember: false,
  movedDuringYear: false,
  crossBorder: false,
  grossSalaryPrimary: 0,
  grossSalarySpouse: 0,
  bonusIncome: 0,
  benefitsIncome: 0,
  ahvIvIncome: 0,
  pensionIncome: 0,
  unemploymentIncome: 0,
  otherIncome: 0,
  interestIncome: 0,
  foreignIncome: 0,
  foreignIncomeExempt: 0,
  stakingIncome: 0,
  pillar3aPrimary: 0,
  professionalMode: "flat",
  professionalActual: 0,
  commuteMode: "none",
  commuteKmPerDay: 0,
  publicPassCost: 0,
  insuranceCapBase: 0,
  donations: 0,
  medicalCosts: 0,
  childcareCosts: 0,
  debtInterest: 0,
  assetMgmtCost: 0,
  alimony: 0,
  educationCosts: 0,
  buyIn2p: 0,
  holdings: [],
  properties: [],
  bankBalance: 0,
  cryptoValue: 0,
  debtOutstanding: 0,
  foreignAssets: 0,
};

export function quickEstimate(
  cantonCode: string,
  municipalityId: string,
  income: number,
  married: boolean
) {
  return computeReturn({
    ...EMPTY_INPUT,
    year: 2025,
    cantonCode,
    municipalityId,
    civilStatus: married ? "married" : "single",
    grossSalaryPrimary: income,
    commuteMode: "public",
    publicPassCost: 3_000,
    insuranceCapBase: 6_000,
    bankBalance: 40_000,
  });
}
