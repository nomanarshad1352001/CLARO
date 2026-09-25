export type DocType =
  | "salary_certificate"
  | "bank_statement"
  | "pillar3a"
  | "insurance_premiums"
  | "securities_statement"
  | "medical_invoice"
  | "donation_receipt"
  | "mortgage_statement"
  | "childcare_receipt"
  | "prior_return"
  | "tax_assessment"
  | "tax_invitation"
  | "pension_fund"
  | "ahv_iv"
  | "education"
  | "real_estate"
  | "debt_document"
  | "foreign_document"
  | "crypto_statement"
  | "other";

/* ---------- Personal data automation ---------- */

export type ProfileKey =
  | "fullName"
  | "dateOfBirth"
  | "ahv"
  | "address"
  | "maritalStatus"
  | "children"
  | "employer"
  | "incomeCurrent"
  | "priorIncomeDeclared"
  | "priorIncomeAssessed"
  | "priorTaxPaid"
  | "canton"
  | "municipality";

export interface ProfileCandidate {
  value: string;
  source: string;
  docId: string;
  confidence: number;
}

export interface ProfileEntry {
  key: ProfileKey;
  label: string;
  status: "auto" | "conflict" | "missing";
  value?: string;
  suggested?: string;
  suggestedReason?: string;
  candidates: ProfileCandidate[];
  confidence?: number;
}

export type DocStatus =
  | "queued"
  | "analyzing"
  | "classifying"
  | "extracting"
  | "done"
  | "needs_type"
  | "error";

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  numeric?: number;
  group: string;
  confidence: number;
}

export interface TaxDoc {
  id: string;
  fileName: string;
  size: number;
  mime: string;
  status: DocStatus;
  progress: number;
  type: DocType | null;
  typeLabel?: string;
  confidence?: number;
  fields?: ExtractedField[];
  summary?: string;
  pages?: number;
  isDemo?: boolean;
}

export interface Conflict {
  id: string;
  title: string;
  detail: string;
  fieldKey: string;
  options: { label: string; value: string; source: string }[];
  resolved?: string;
}

export interface MissingItem {
  id: string;
  label: string;
  detail: string;
  questionId: string;
}

export interface SetupInfo {
  canton: string;
  municipality: string;
  municipalityId: string;
  year: number;
}

export interface Answer {
  questionId: string;
  value: string | number | boolean;
  display: string;
  at: string;
}

export type AssetClass = "Equity" | "ETF" | "Fund" | "Bond";

export interface IcTaxRef {
  value: number;
  currency: string;
  source: string;
  verified: boolean;
}

export interface Holding {
  id: string;
  name: string;
  ticker: string;
  isin: string;
  valor?: string;
  custodian: string;
  country: "CH" | "US" | "IE" | "LU" | "DE" | "FR";
  assetClass: AssetClass;
  qty: number;
  price: number;
  currency: "CHF" | "USD" | "EUR";
  fxRate: number;
  valueChf: number;
  dividendGrossChf: number;
  withholdingRate: number;
  withholdingChf: number;
  reclaimType: "RÜF" | "DA-1" | "NONE";
  reclaimNote: string;
  ictax?: IcTaxRef;
}

/* ---------- Real estate ---------- */

export interface Property {
  id: string;
  label: string;
  kind: "primary" | "secondary" | "rental";
  countryCode: string; // CH or foreign ISO
  cantonCode?: string; // for CH properties
  municipality?: string;
  marketValue: number;
  taxValue: number; // Steuerwert / amtlicher Wert
  imputedRental: number; // Eigenmietwert (own use)
  rentalIncome: number; // actual rent received
  mortgageBalance: number;
  mortgageInterest: number;
  maintenanceMode: "flat" | "actual";
  maintenanceActual: number;
  source: string;
}

/* ---------- Income & assets ledger ---------- */

export type IncomeKind =
  | "salary"
  | "bonus"
  | "benefit"
  | "ahv_iv"
  | "pension"
  | "unemployment"
  | "interest"
  | "dividend"
  | "rental"
  | "foreign"
  | "staking"
  | "other";

export interface IncomeItem {
  id: string;
  kind: IncomeKind;
  label: string;
  payer: string;
  amount: number;
  person: "primary" | "spouse";
  source: string;
  auto: boolean;
  foreignExempt?: boolean;
}

export type AssetKind =
  | "bank"
  | "savings"
  | "securities"
  | "crypto"
  | "real_estate"
  | "vested_pension"
  | "foreign_asset"
  | "debt";

export interface AssetItem {
  id: string;
  kind: AssetKind;
  label: string;
  institution: string;
  amount: number; // debts are negative
  source: string;
  auto: boolean;
  taxExempt?: boolean;
}

/* ---------- Taxpayer situation ---------- */

export type CivilStatus =
  | "single"
  | "married"
  | "registered_partnership"
  | "separated"
  | "divorced"
  | "widowed";

export interface Household {
  civilStatus: CivilStatus;
  civilStatusSince?: string;
  childrenCount: number;
  dependantsCount: number;
  soleCustody: boolean;
  movedDuringYear: boolean;
  previousCanton?: string;
  moveDate?: string;
  crossBorder: boolean;
  crossBorderCountry?: string;
  multipleEmployers: boolean;
}

export interface ActivityEntry {
  id: string;
  at: string;
  icon: string;
  text: string;
}

export interface DeductionLine {
  id: string;
  label: string;
  amount: number;
  cappedAt?: number;
  applied: number;
  source: string;
  auto: boolean;
  note?: string;
}

export interface CalcBreakdown {
  grossIncome: number;
  deductionLines: DeductionLine[];
  totalDeductionsFederal: number;
  totalDeductionsCantonal: number;
  taxableIncomeFederal: number;
  taxableIncomeCantonal: number;
  federalTax: number;
  simpleTax: number;
  cantonalTax: number;
  municipalTax: number;
  churchTax: number;
  wealthTaxable: number;
  wealthTax: number;
  personalTax: number;
  childCredits: number;
  withholdingRefundCH: number;
  da1Credit: number;
  totalBeforeCredits: number;
  totalAfterCredits: number;
  netPosition: number;
  effectiveRate: number;
  marginalRate: number;
  municipality: string;
  cantonCode: string;
  filingMethod: "e-filing" | "export";
  year: number;
  /* extended */
  tariffUsed?: string;
  rulesVersion?: string;
  propertyIncome?: number;
  exemptIncomeProgression?: number;
  progressionRate?: number;
  wealthBreakdown?: { label: string; amount: number }[];
  incomeBreakdown?: { label: string; amount: number }[];
}

export interface FilingResult {
  id: string;
  method: "e-filing" | "export";
  methodLabel: string;
  submittedAt: string;
  canton: string;
  municipality: string;
  year: number;
  reference: string;
}

export interface Session {
  name: string;
  email: string;
}

export type StepKey =
  | "setup"
  | "documents"
  | "review"
  | "questions"
  | "income"
  | "securities"
  | "property"
  | "calculation"
  | "filing";
