import { NextRequest, NextResponse } from "next/server";
import {
  ICTAX_KURSLISTE,
  isinCheckDigitValid,
  lookupIcTax,
  valorFromIsin,
  classifyAsset,
} from "@/lib/securities-engine";

/* ------------------------------------------------------------------ */
/*  ICTax valuation endpoint                                           */
/*                                                                     */
/*  Resolves ISIN / Valor against the Federal Tax Administration's     */
/*  Kursliste (ICTax) to obtain the official year-end tax value.       */
/*  Deterministic lookup — no model inference involved.                */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { isins?: string[]; year?: number };
  const year = body.year ?? 2025;
  const isins = body.isins ?? [];

  await new Promise((r) => setTimeout(r, 420));

  const results = isins.map((raw) => {
    const isin = raw.trim().toUpperCase();
    const valid = isinCheckDigitValid(isin);
    if (!valid) {
      return {
        isin,
        status: "invalid_isin" as const,
        message: "ISO 6166 check digit failed — value taken from the custodian statement instead.",
      };
    }
    const rec = lookupIcTax(isin, year);
    if (!rec) {
      return {
        isin,
        status: "not_listed" as const,
        valor: valorFromIsin(isin),
        message: "Not present in the FTA Kursliste — the custodian's tax value is authoritative.",
      };
    }
    return {
      isin,
      status: "verified" as const,
      name: rec.name,
      valor: rec.valor ?? valorFromIsin(isin),
      closing: rec.closing,
      currency: rec.currency,
      assetClass: rec.assetClass ?? classifyAsset(rec.name, isin),
      taxableIncomePerUnit: rec.taxableIncomePerUnit,
      source: `ICTax · FTA Kursliste ${year}`,
    };
  });

  return NextResponse.json({
    year,
    requested: isins.length,
    verified: results.filter((r) => r.status === "verified").length,
    coverage: ICTAX_KURSLISTE[year]?.length ?? 0,
    results,
    meta: {
      provider: "Eidgenössische Steuerverwaltung — ICTax / Kursliste",
      deterministic: true,
      note: "Official year-end valuations. Where a security is not listed, the custodian statement value is used and flagged.",
    },
  });
}
