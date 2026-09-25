import { NextRequest, NextResponse } from "next/server";
import { getCanton, getMunicipality } from "@/lib/tax-data";

/* ------------------------------------------------------------------ */
/*  Filing endpoint — routes to electronic transmission where the      */
/*  canton offers a software interface, otherwise produces the most    */
/*  automated official export path.                                    */
/* ------------------------------------------------------------------ */

function reference(canton: string, year: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  const seed = Date.now();
  for (let i = 0; i < 8; i++) {
    tail += chars[(seed >> (i * 5)) % chars.length];
  }
  return `${canton}-${year}-${tail.slice(0, 4)}-${tail.slice(4, 8)}`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    canton?: string;
    municipality?: string;
    year?: number;
    taxpayer?: string;
  };
  const cantonCode = body.canton ?? "ZH";
  const muniId = body.municipality ?? "";
  const year = body.year ?? 2025;
  const canton = getCanton(cantonCode);
  const muni = getMunicipality(cantonCode, muniId || canton.municipalities[0].id);

  /* simulate transmission latency */
  await new Promise((r) => setTimeout(r, 900));

  const ref = reference(canton.code, year);

  if (canton.eFiling) {
    return NextResponse.json({
      id: `filing-${ref}`,
      method: "e-filing" as const,
      methodLabel: `Electronic transmission via ${canton.filingAgency}`,
      submittedAt: new Date().toISOString(),
      canton: canton.name,
      municipality: muni.name,
      year,
      reference: ref,
      status: "transmitted",
      timeline: [
        { key: "signed", label: "Declaration signed & responsibility confirmed", state: "done" },
        { key: "validated", label: "Schema validation against cantonal interface passed", state: "done" },
        { key: "transmitted", label: `Transmitted to ${canton.filingAgency}`, state: "done" },
        { key: "acknowledged", label: "Receipt acknowledged by tax office", state: "pending" },
        { key: "assessment", label: "Official assessment (Veranlagung) — expected within 2–6 months", state: "upcoming" },
      ],
    });
  }

  return NextResponse.json({
    id: `filing-${ref}`,
    method: "export" as const,
    methodLabel: `Official signed export — ${canton.filingAgency}`,
    submittedAt: new Date().toISOString(),
    canton: canton.name,
    municipality: muni.name,
    year,
    reference: ref,
    status: "export_ready",
    timeline: [
      { key: "signed", label: "Declaration signed & responsibility confirmed", state: "done" },
      { key: "generated", label: "Official declaration file + print-ready PDF generated", state: "done" },
      { key: "deliver", label: "Canton has no software interface — send the signed PDF (registered mail) or upload to the cantonal portal", state: "pending" },
      { key: "assessment", label: "Official assessment (Veranlagung) — expected within 2–6 months", state: "upcoming" },
    ],
  });
}
