/* ------------------------------------------------------------------ */
/*  Swiss geo module — automatic commute distance                      */
/*                                                                     */
/*  When both the home address (from identity documents) and the       */
/*  employer address (from the salary certificate) are known, the      */
/*  commuting distance is derived automatically instead of asking.     */
/*  Deterministic: gazetteer lookup + haversine + road factor.         */
/* ------------------------------------------------------------------ */

export interface Place {
  plz: string;
  name: string;
  canton: string;
  lat: number;
  lon: number;
}

/** Swiss gazetteer subset (PLZ centroids, WGS84). */
export const CH_PLACES: Place[] = [
  { plz: "8001", name: "Zürich", canton: "ZH", lat: 47.3717, lon: 8.5423 },
  { plz: "8008", name: "Zürich Seefeld", canton: "ZH", lat: 47.3573, lon: 8.5528 },
  { plz: "8046", name: "Zürich Affoltern", canton: "ZH", lat: 47.4219, lon: 8.5064 },
  { plz: "8050", name: "Zürich Oerlikon", canton: "ZH", lat: 47.4103, lon: 8.5446 },
  { plz: "8400", name: "Winterthur", canton: "ZH", lat: 47.5001, lon: 8.7243 },
  { plz: "8610", name: "Uster", canton: "ZH", lat: 47.3477, lon: 8.7211 },
  { plz: "8600", name: "Dübendorf", canton: "ZH", lat: 47.3977, lon: 8.6183 },
  { plz: "8952", name: "Schlieren", canton: "ZH", lat: 47.3967, lon: 8.4475 },
  { plz: "8820", name: "Wädenswil", canton: "ZH", lat: 47.2299, lon: 8.6712 },
  { plz: "8700", name: "Küsnacht", canton: "ZH", lat: 47.3178, lon: 8.5843 },
  { plz: "8302", name: "Kloten", canton: "ZH", lat: 47.4515, lon: 8.5844 },
  { plz: "6300", name: "Zug", canton: "ZG", lat: 47.1662, lon: 8.5155 },
  { plz: "6340", name: "Baar", canton: "ZG", lat: 47.1957, lon: 8.5293 },
  { plz: "6330", name: "Cham", canton: "ZG", lat: 47.1817, lon: 8.4606 },
  { plz: "6003", name: "Luzern", canton: "LU", lat: 47.0502, lon: 8.3093 },
  { plz: "6010", name: "Kriens", canton: "LU", lat: 47.0343, lon: 8.2784 },
  { plz: "3011", name: "Bern", canton: "BE", lat: 46.948, lon: 7.4474 },
  { plz: "3600", name: "Thun", canton: "BE", lat: 46.7580, lon: 7.6280 },
  { plz: "2502", name: "Biel/Bienne", canton: "BE", lat: 47.1368, lon: 7.2468 },
  { plz: "4051", name: "Basel", canton: "BS", lat: 47.5596, lon: 7.5886 },
  { plz: "4125", name: "Riehen", canton: "BS", lat: 47.5825, lon: 7.6497 },
  { plz: "9000", name: "St. Gallen", canton: "SG", lat: 47.4245, lon: 9.3767 },
  { plz: "9500", name: "Wil", canton: "SG", lat: 47.4626, lon: 9.0454 },
  { plz: "5000", name: "Aarau", canton: "AG", lat: 47.3909, lon: 8.0456 },
  { plz: "5400", name: "Baden", canton: "AG", lat: 47.4735, lon: 8.3063 },
  { plz: "1201", name: "Genève", canton: "GE", lat: 46.2044, lon: 6.1432 },
  { plz: "1227", name: "Carouge", canton: "GE", lat: 46.1830, lon: 6.1390 },
  { plz: "1003", name: "Lausanne", canton: "VD", lat: 46.5197, lon: 6.6323 },
  { plz: "1260", name: "Nyon", canton: "VD", lat: 46.3833, lon: 6.2394 },
  { plz: "1800", name: "Vevey", canton: "VD", lat: 46.4628, lon: 6.8419 },
  { plz: "6900", name: "Lugano", canton: "TI", lat: 46.0037, lon: 8.9511 },
  { plz: "6500", name: "Bellinzona", canton: "TI", lat: 46.1947, lon: 9.0244 },
  { plz: "1950", name: "Sion", canton: "VS", lat: 46.2331, lon: 7.3606 },
  { plz: "3920", name: "Zermatt", canton: "VS", lat: 46.0207, lon: 7.7491 },
  { plz: "6430", name: "Schwyz", canton: "SZ", lat: 47.0207, lon: 8.6530 },
  { plz: "8808", name: "Pfäffikon SZ", canton: "SZ", lat: 47.2028, lon: 8.7797 },
  { plz: "7000", name: "Chur", canton: "GR", lat: 46.8508, lon: 9.5320 },
  { plz: "8500", name: "Frauenfeld", canton: "TG", lat: 47.5536, lon: 8.8987 },
  { plz: "1700", name: "Fribourg", canton: "FR", lat: 46.8065, lon: 7.1615 },
  { plz: "4500", name: "Solothurn", canton: "SO", lat: 47.2088, lon: 7.5323 },
  { plz: "2000", name: "Neuchâtel", canton: "NE", lat: 46.9899, lon: 6.9293 },
  { plz: "8200", name: "Schaffhausen", canton: "SH", lat: 47.6970, lon: 8.6349 },
  { plz: "6060", name: "Sarnen", canton: "OW", lat: 46.8959, lon: 8.2456 },
  { plz: "6370", name: "Stans", canton: "NW", lat: 46.9580, lon: 8.3661 },
  { plz: "6460", name: "Altdorf", canton: "UR", lat: 46.8803, lon: 8.6440 },
  { plz: "8750", name: "Glarus", canton: "GL", lat: 47.0404, lon: 9.0680 },
  { plz: "9100", name: "Herisau", canton: "AR", lat: 47.3862, lon: 9.2793 },
  { plz: "9050", name: "Appenzell", canton: "AI", lat: 47.3319, lon: 9.4093 },
  { plz: "4410", name: "Liestal", canton: "BL", lat: 47.4841, lon: 7.7346 },
  { plz: "2800", name: "Delémont", canton: "JU", lat: 47.3646, lon: 7.3447 },
];

export interface ParsedAddress {
  street?: string;
  plz?: string;
  city?: string;
  raw: string;
}

export function parseAddress(raw: string): ParsedAddress {
  const out: ParsedAddress = { raw };
  if (!raw) return out;
  const plzMatch = raw.match(/\b(\d{4})\b/);
  if (plzMatch) out.plz = plzMatch[1];
  const parts = raw.split(",").map((p) => p.trim());
  if (parts.length > 1) {
    out.street = parts[0];
    out.city = parts[parts.length - 1].replace(/\b\d{4}\b/, "").trim();
  } else if (plzMatch) {
    out.street = raw.slice(0, plzMatch.index).trim().replace(/,$/, "");
    out.city = raw.slice((plzMatch.index ?? 0) + 4).trim();
  } else {
    out.street = raw;
  }
  return out;
}

export function geocode(raw: string): (Place & { matchedOn: string }) | null {
  if (!raw) return null;
  const a = parseAddress(raw);
  if (a.plz) {
    const exact = CH_PLACES.find((p) => p.plz === a.plz);
    if (exact) return { ...exact, matchedOn: `PLZ ${a.plz}` };
  }
  const hay = raw.toLowerCase();
  const byName = CH_PLACES.filter((p) => hay.includes(p.name.toLowerCase().split(" ")[0]))
    .sort((x, y) => y.name.length - x.name.length)[0];
  if (byName) return { ...byName, matchedOn: `locality “${byName.name}”` };
  return null;
}

const R = 6371; // km
export function haversine(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Detour factor: real road/rail distance vs. straight line in CH topography. */
export const ROAD_FACTOR = 1.28;

export interface CommuteEstimate {
  ok: boolean;
  homeLabel?: string;
  workLabel?: string;
  homeMatch?: string;
  workMatch?: string;
  straightKm?: number;
  routeKm?: number;
  dailyRoundTripKm?: number;
  annualKm?: number;
  sameLocality?: boolean;
  reason?: string;
}

export function estimateCommute(
  homeAddress: string | undefined,
  workAddress: string | undefined,
  workingDays = 220
): CommuteEstimate {
  if (!homeAddress || !workAddress) {
    return { ok: false, reason: "Home or workplace address not yet extracted from your documents." };
  }
  const h = geocode(homeAddress);
  const w = geocode(workAddress);
  if (!h || !w) {
    return {
      ok: false,
      reason: `Could not locate ${!h ? "the home address" : "the workplace address"} in the Swiss gazetteer.`,
    };
  }
  const straight = haversine(h.lat, h.lon, w.lat, w.lon);
  const route = straight * ROAD_FACTOR;
  const sameLocality = straight < 1.2;
  const daily = Math.round(route * 2 * 10) / 10;
  return {
    ok: true,
    homeLabel: `${h.plz} ${h.name}`,
    workLabel: `${w.plz} ${w.name}`,
    homeMatch: h.matchedOn,
    workMatch: w.matchedOn,
    straightKm: Math.round(straight * 10) / 10,
    routeKm: Math.round(route * 10) / 10,
    dailyRoundTripKm: daily,
    annualKm: Math.round(daily * workingDays),
    sameLocality,
  };
}
