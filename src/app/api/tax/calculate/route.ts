import { NextRequest, NextResponse } from "next/server";
import { computeReturn, type EngineInput } from "@/lib/tax-engine";

/* ------------------------------------------------------------------ */
/*  Deterministic tax computation endpoint.                            */
/*  The AI never computes taxes — this endpoint executes the statutory */
/*  rules engine (DBG federal tariff + cantonal multiplier model).     */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as EngineInput;
    if (!input.cantonCode || !input.municipalityId || !input.year) {
      return NextResponse.json({ error: "Missing jurisdiction or tax year." }, { status: 400 });
    }
    const result = computeReturn(input);
    return NextResponse.json({
      result,
      meta: {
        engine: "CLARO Rules Engine v1.2",
        tariffs: `DBG/IFD ${input.year} · cantonal multipliers ${input.cantonCode} ${input.year}`,
        deterministic: true,
        computedAt: new Date().toISOString(),
        disclaimer:
          "Indicative estimate. The definitive assessment is issued by your cantonal tax administration.",
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid input for calculation." }, { status: 400 });
  }
}
