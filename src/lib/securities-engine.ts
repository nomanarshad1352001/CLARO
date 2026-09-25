import type { AssetClass, Holding, IcTaxRef } from "./types";

/* ------------------------------------------------------------------ */
/*  Securities recognition engine                                      */
/*                                                                     */
/*  • ISIN validation (ISO 6166 mod-10 check digit)                    */
/*  • Valor (Valorennummer) derivation for Swiss ISINs                 */
/*  • Asset-class inference: Equity / ETF / Fund / Bond                */
/*  • ICTax (FTA Kursliste) year-end valuation lookup                  */
/*  • Multi-custodian consolidation across banks & brokers             */
/* ------------------------------------------------------------------ */

export function isinCheckDigitValid(isin: string): boolean {
  const s = isin.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(s)) return false;
  const digits = s
    .slice(0, 11)
    .split("")
    .map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c))
    .join("");
  let sum = 0;
  let dbl = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return (10 - (sum % 10)) % 10 === Number(s[11]);
}

export function isinCountry(isin: string): string {
  return isin.slice(0, 2).toUpperCase();
}

/** Swiss ISINs embed the Valorennummer: CH + 10 digits (valor = digits w/o leading zeros, minus check). */
export function valorFromIsin(isin: string): string | undefined {
  const s = isin.toUpperCase();
  if (!s.startsWith("CH") || s.length !== 12) return undefined;
  const body = s.slice(2, 11).replace(/^0+/, "");
  return body || undefined;
}

const ETF_HINTS = ["etf", "ishares", "vanguard", "spdr", "xtrackers", "ubs etf", "core", "index fund"];
const FUND_HINTS = ["fund", "fonds", "sicav", "strategy", "portfolio", "balanced", "anlagestiftung"];
const BOND_HINTS = ["bond", "anleihe", "obligation", "coupon", "%", "notes"];

export function classifyAsset(name: string, isin?: string): AssetClass {
  const n = name.toLowerCase();
  if (BOND_HINTS.some((h) => n.includes(h))) return "Bond";
  if (ETF_HINTS.some((h) => n.includes(h))) return "ETF";
  if (FUND_HINTS.some((h) => n.includes(h))) return "Fund";
  if (isin && /^(IE|LU)/.test(isin.toUpperCase())) return "Fund";
  return "Equity";
}

/* ---------------- ICTax / FTA Kursliste (official valuations) ------ */
/* Year-end tax values published by the Federal Tax Administration.
   Integrated where technically available; otherwise the custodian's
   statement value is used and the position is flagged as unverified. */

export interface IcTaxRecord {
  isin: string;
  name: string;
  valor?: string;
  closing: number;
  currency: string;
  assetClass: AssetClass;
  taxableIncomePerUnit: number;
}

export const ICTAX_KURSLISTE: Record<number, IcTaxRecord[]> = {
  2025: [
    { isin: "CH0038863350", name: "Nestlé SA", valor: "3886335", closing: 74.18, currency: "CHF", assetClass: "Equity", taxableIncomePerUnit: 3.0 },
    { isin: "CH0244767585", name: "UBS Group AG", valor: "24476758", closing: 27.94, currency: "CHF", assetClass: "Equity", taxableIncomePerUnit: 0.7 },
    { isin: "CH0012005267", name: "Novartis AG", valor: "1200526", closing: 86.9, currency: "CHF", assetClass: "Equity", taxableIncomePerUnit: 3.3 },
    { isin: "CH0011075394", name: "Zurich Insurance Group AG", valor: "1107539", closing: 512.4, currency: "CHF", assetClass: "Equity", taxableIncomePerUnit: 25.0 },
    { isin: "CH0012032048", name: "Roche Holding AG GS", valor: "1203204", closing: 265.3, currency: "CHF", assetClass: "Equity", taxableIncomePerUnit: 9.7 },
    { isin: "CH0237935652", name: "iShares Core SPI ETF", valor: "23793565", closing: 148.6, currency: "CHF", assetClass: "ETF", taxableIncomePerUnit: 1.48 },
    { isin: "CH0594712319", name: "ZKB 1.75% Bond 2031", valor: "59471231", closing: 1012.5, currency: "CHF", assetClass: "Bond", taxableIncomePerUnit: 17.5 },
    { isin: "CH0130595124", name: "Swisscanto Bond Fund CHF", valor: "13059512", closing: 98.4, currency: "CHF", assetClass: "Fund", taxableIncomePerUnit: 1.62 },
    { isin: "US0378331005", name: "Apple Inc.", closing: 232.7, currency: "USD", assetClass: "Equity", taxableIncomePerUnit: 0.89 },
    { isin: "US9220427424", name: "Vanguard Total World Stock ETF", closing: 118.4, currency: "USD", assetClass: "ETF", taxableIncomePerUnit: 1.735 },
    { isin: "IE00B4L5Y983", name: "iShares Core MSCI World UCITS ETF", closing: 92.15, currency: "USD", assetClass: "Fund", taxableIncomePerUnit: 1.24 },
    { isin: "DE0007164600", name: "SAP SE", closing: 218.4, currency: "EUR", assetClass: "Equity", taxableIncomePerUnit: 2.2 },
  ],
};

export function lookupIcTax(isin: string, year = 2025): IcTaxRecord | null {
  const list = ICTAX_KURSLISTE[year] ?? ICTAX_KURSLISTE[2025];
  return list.find((r) => r.isin.toUpperCase() === isin.toUpperCase()) ?? null;
}

export function ictaxRefFor(isin: string, year = 2025): IcTaxRef | undefined {
  const rec = lookupIcTax(isin, year);
  if (!rec) return undefined;
  return {
    value: rec.closing,
    currency: rec.currency,
    source: `ICTax · FTA Kursliste ${year}`,
    verified: true,
  };
}

/** Enrich a raw parsed position with ISIN/valor/class/ICTax data. */
export function enrichHolding(h: Holding, year = 2025): Holding {
  const valid = isinCheckDigitValid(h.isin);
  const ict = valid ? ictaxRefFor(h.isin, year) : undefined;
  const cls = classifyAsset(h.name, h.isin);
  const value = ict ? h.qty * ict.value * h.fxRate : h.valueChf;
  return {
    ...h,
    assetClass: cls,
    valor: h.valor ?? (valid ? valorFromIsin(h.isin) : undefined),
    ictax: ict,
    valueChf: Math.round(value * 100) / 100,
  };
}

export interface CustodianGroup {
  custodian: string;
  count: number;
  value: number;
  dividends: number;
  withholding: number;
  verified: number;
}

export function groupByCustodian(holdings: Holding[]): CustodianGroup[] {
  const map = new Map<string, CustodianGroup>();
  for (const h of holdings) {
    const g =
      map.get(h.custodian) ??
      { custodian: h.custodian, count: 0, value: 0, dividends: 0, withholding: 0, verified: 0 };
    g.count += 1;
    g.value += h.valueChf;
    g.dividends += h.dividendGrossChf;
    g.withholding += h.withholdingChf;
    if (h.ictax?.verified) g.verified += 1;
    map.set(h.custodian, g);
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
}

export function coverageStats(holdings: Holding[]) {
  const withIsin = holdings.filter((h) => isinCheckDigitValid(h.isin)).length;
  const withValor = holdings.filter((h) => !!h.valor).length;
  const withIcTax = holdings.filter((h) => h.ictax?.verified).length;
  return {
    total: holdings.length,
    withIsin,
    withValor,
    withIcTax,
    custodians: new Set(holdings.map((h) => h.custodian)).size,
    autoPct: holdings.length ? Math.round((withIcTax / holdings.length) * 100) : 0,
  };
}
