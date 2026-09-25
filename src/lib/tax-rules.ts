/* ------------------------------------------------------------------ */
/*  VERSIONED SWISS TAX RULES REGISTRY                                 */
/*                                                                     */
/*  Architecture:  Federal → Canton → Municipality → Tax Year → Rules  */
/*                                                                     */
/*  Every rule set is keyed by tax year so a future year is added by   */
/*  appending one object — no engine code changes required.            */
/*  These are structured data, never produced by an LLM.               */
/* ------------------------------------------------------------------ */

export interface Bracket {
  from: number;
  rate: number;
}

export interface DeductionRules {
  p3aEmployed: number;
  p3aSelfEmployed: number;
  profFlatRate: number;
  profFlatMin: number;
  profFlatMax: number;
  commuteCapFederal: number;
  carRatePerKm: number;
  commuteDays: number;
  mealsPerDay: number;
  mealsDays: number;
  mealsCap: number;
  homeOfficeFlat: number;
  educationCap: number;
  childcareCapFederal: number;
  childDeductionFederal: number;
  childTaxCreditFederal: number;
  supportDeduction: number;
  insuranceCapSingle: number;
  insuranceCapMarried: number;
  insurancePerChild: number;
  medicalThreshold: number;
  donationCapRate: number;
  socialFlat: number;
  twoEarnerRate: number;
  twoEarnerMin: number;
  twoEarnerMax: number;
  propertyMaintenanceFlat: number; // flat % of imputed/actual rental
  imputedRentalRate: number; // % of tax value when self-used
}

export interface TaxYearRules {
  year: number;
  label: string;
  effectiveFrom: string;
  federalSingle: Bracket[];
  federalMarried: Bracket[];
  federalCapRate: number;
  deductions: DeductionRules;
  /** per-year canton multiplier overrides: cantonCode → factor */
  cantonMultiplierOverrides: Record<string, number>;
  notes: string[];
}

const FED_SINGLE_2025: Bracket[] = [
  { from: 0, rate: 0 },
  { from: 18_300, rate: 0.0077 },
  { from: 32_900, rate: 0.0088 },
  { from: 43_500, rate: 0.0264 },
  { from: 58_000, rate: 0.0297 },
  { from: 76_100, rate: 0.0594 },
  { from: 82_000, rate: 0.066 },
  { from: 108_800, rate: 0.088 },
  { from: 141_500, rate: 0.11 },
  { from: 184_900, rate: 0.132 },
];

const FED_MARRIED_2025: Bracket[] = [
  { from: 0, rate: 0 },
  { from: 29_900, rate: 0.01 },
  { from: 52_700, rate: 0.02 },
  { from: 60_500, rate: 0.03 },
  { from: 78_100, rate: 0.04 },
  { from: 93_600, rate: 0.05 },
  { from: 107_200, rate: 0.06 },
  { from: 119_000, rate: 0.07 },
  { from: 128_800, rate: 0.08 },
  { from: 136_000, rate: 0.09 },
  { from: 142_300, rate: 0.1 },
  { from: 146_300, rate: 0.11 },
  { from: 895_900, rate: 0.13 },
];

const DEDUCTIONS_2025: DeductionRules = {
  p3aEmployed: 7_056,
  p3aSelfEmployed: 35_280,
  profFlatRate: 0.03,
  profFlatMin: 2_000,
  profFlatMax: 4_000,
  commuteCapFederal: 3_200,
  carRatePerKm: 0.7,
  commuteDays: 220,
  mealsPerDay: 15,
  mealsDays: 220,
  mealsCap: 3_200,
  homeOfficeFlat: 1_200,
  educationCap: 12_900,
  childcareCapFederal: 25_000,
  childDeductionFederal: 6_700,
  childTaxCreditFederal: 251,
  supportDeduction: 6_700,
  insuranceCapSingle: 1_800,
  insuranceCapMarried: 3_600,
  insurancePerChild: 700,
  medicalThreshold: 0.05,
  donationCapRate: 0.2,
  socialFlat: 700,
  twoEarnerRate: 0.5,
  twoEarnerMin: 8_600,
  twoEarnerMax: 14_100,
  propertyMaintenanceFlat: 0.2,
  imputedRentalRate: 0.035,
};

/* 2024 — prior-year tariffs (cold-progression adjusted downward) */
const shiftBrackets = (b: Bracket[], f: number): Bracket[] =>
  b.map((x) => ({ from: Math.round((x.from * f) / 100) * 100, rate: x.rate }));

export const TAX_RULES: Record<number, TaxYearRules> = {
  2025: {
    year: 2025,
    label: "Tax year 2025",
    effectiveFrom: "2025-01-01",
    federalSingle: FED_SINGLE_2025,
    federalMarried: FED_MARRIED_2025,
    federalCapRate: 0.115,
    deductions: DEDUCTIONS_2025,
    cantonMultiplierOverrides: {},
    notes: [
      "Pillar 3a employed limit raised to CHF 7'056.",
      "Federal commuting cap unchanged at CHF 3'200.",
      "Cold progression compensated in the federal tariff.",
    ],
  },
  2024: {
    year: 2024,
    label: "Tax year 2024",
    effectiveFrom: "2024-01-01",
    federalSingle: shiftBrackets(FED_SINGLE_2025, 0.978),
    federalMarried: shiftBrackets(FED_MARRIED_2025, 0.978),
    federalCapRate: 0.115,
    deductions: {
      ...DEDUCTIONS_2025,
      p3aEmployed: 7_056,
      p3aSelfEmployed: 35_280,
      educationCap: 12_700,
      childDeductionFederal: 6_700,
      insuranceCapSingle: 1_800,
      insuranceCapMarried: 3_600,
    },
    cantonMultiplierOverrides: { ZH: 0.99, BE: 1.0, GE: 1.0 },
    notes: ["Tariff before the 2025 cold-progression adjustment."],
  },
  2023: {
    year: 2023,
    label: "Tax year 2023",
    effectiveFrom: "2023-01-01",
    federalSingle: shiftBrackets(FED_SINGLE_2025, 0.955),
    federalMarried: shiftBrackets(FED_MARRIED_2025, 0.955),
    federalCapRate: 0.115,
    deductions: {
      ...DEDUCTIONS_2025,
      p3aEmployed: 7_056,
      p3aSelfEmployed: 35_280,
      educationCap: 12_000,
      childcareCapFederal: 25_000,
      childDeductionFederal: 6_600,
    },
    cantonMultiplierOverrides: { ZH: 0.98, BE: 0.99, GE: 1.0, ZG: 1.02 },
    notes: ["Childcare cap raised to CHF 25'000 at federal level from 2023."],
  },
  2026: {
    year: 2026,
    label: "Tax year 2026",
    effectiveFrom: "2026-01-01",
    federalSingle: shiftBrackets(FED_SINGLE_2025, 1.019),
    federalMarried: shiftBrackets(FED_MARRIED_2025, 1.019),
    federalCapRate: 0.115,
    deductions: {
      ...DEDUCTIONS_2025,
      educationCap: 13_200,
      mealsCap: 3_300,
      childDeductionFederal: 6_800,
      insuranceCapSingle: 1_850,
      insuranceCapMarried: 3_700,
      insurancePerChild: 720,
    },
    cantonMultiplierOverrides: {},
    notes: [
      "Projected 2026 set — replaced with final NEST data on official publication.",
      "Education cap raised to CHF 13'200; meals cap CHF 3'300.",
    ],
  },
};

export const SUPPORTED_YEARS = Object.keys(TAX_RULES)
  .map(Number)
  .sort((a, b) => b - a);

export function getRules(year: number): TaxYearRules {
  return TAX_RULES[year] ?? TAX_RULES[SUPPORTED_YEARS[0]];
}

/** Registers a future tax year at runtime — the engine picks it up immediately. */
export function registerTaxYear(rules: TaxYearRules) {
  TAX_RULES[rules.year] = rules;
}
