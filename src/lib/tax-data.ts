import type { DocType, Holding, Property } from "./types";

/* ------------------------------------------------------------------ */
/*  Cantons & municipalities — deterministic tariff model              */
/*  simpleRate(income) = min + (max-min) * income/(income+120_000)     */
/*  cantonal = simple × cantonMult ; municipal = simple × muniMult     */
/* ------------------------------------------------------------------ */

export interface Municipality {
  id: string;
  name: string;
  muniMult: number;
}

export interface Canton {
  code: string;
  name: string;
  simpleMin: number; // effective simple-tax rate at income 0
  simpleMax: number; // effective simple-tax rate asymptote
  cantonMult: number;
  churchRate: number; // share of cantonal tax for registered churches
  wealthPerMille: number; // simple wealth tax per mille
  wealthAllowanceSingle: number;
  wealthAllowanceMarried: number;
  commuteCapCantonal: number; // max commuting deduction (cantonal level)
  eFiling: boolean;
  filingAgency: string;
  municipalities: Municipality[];
}

export const CANTONS: Canton[] = [
  {
    code: "ZH", name: "Zürich", simpleMin: 0.006, simpleMax: 0.052, cantonMult: 1.0,
    churchRate: 0.09, wealthPerMille: 0.75, wealthAllowanceSingle: 80_000, wealthAllowanceMarried: 160_000,
    commuteCapCantonal: 5_200, eFiling: true, filingAgency: "Kantonales Steueramt Zürich · eTax.private",
    municipalities: [
      { id: "zurich", name: "Zürich", muniMult: 1.19 },
      { id: "winterthur", name: "Winterthur", muniMult: 1.22 },
      { id: "uster", name: "Uster", muniMult: 1.1 },
      { id: "dubendorf", name: "Dübendorf", muniMult: 1.27 },
      { id: "dietikon", name: "Dietikon", muniMult: 1.2 },
      { id: "wetzikon", name: "Wetzikon", muniMult: 1.16 },
      { id: "wadenswil", name: "Wädenswil", muniMult: 1.17 },
      { id: "horgen", name: "Horgen", muniMult: 1.08 },
      { id: "bulach", name: "Bülach", muniMult: 1.12 },
      { id: "kloten", name: "Kloten", muniMult: 1.08 },
      { id: "opfikon", name: "Opfikon", muniMult: 0.97 },
      { id: "wallisellen", name: "Wallisellen", muniMult: 1.05 },
      { id: "adliswil", name: "Adliswil", muniMult: 1.1 },
      { id: "thalwil", name: "Thalwil", muniMult: 0.94 },
      { id: "kusnacht", name: "Küsnacht", muniMult: 0.79 },
      { id: "zumikon", name: "Zumikon", muniMult: 0.79 },
    ],
  },
  {
    code: "BE", name: "Bern", simpleMin: 0.004, simpleMax: 0.031, cantonMult: 1.54,
    churchRate: 0.16, wealthPerMille: 0.6, wealthAllowanceSingle: 97_000, wealthAllowanceMarried: 160_000,
    commuteCapCantonal: 6_800, eFiling: true, filingAgency: "Steuerverwaltung Kanton Bern · TaxMe",
    municipalities: [
      { id: "bern", name: "Bern", muniMult: 1.54 },
      { id: "biel", name: "Biel/Bienne", muniMult: 1.64 },
      { id: "thun", name: "Thun", muniMult: 1.6 },
      { id: "koniz", name: "Köniz", muniMult: 1.54 },
      { id: "ostermundigen", name: "Ostermundigen", muniMult: 1.64 },
      { id: "steffisburg", name: "Steffisburg", muniMult: 1.52 },
      { id: "muri", name: "Muri b. Bern", muniMult: 1.5 },
      { id: "langnau", name: "Langnau i.E.", muniMult: 1.58 },
    ],
  },
  {
    code: "LU", name: "Luzern", simpleMin: 0.005, simpleMax: 0.034, cantonMult: 1.6,
    churchRate: 0.17, wealthPerMille: 0.65, wealthAllowanceSingle: 60_000, wealthAllowanceMarried: 110_000,
    commuteCapCantonal: 6_000, eFiling: true, filingAgency: "Dienststelle Steuern Luzern · eSt Luzern",
    municipalities: [
      { id: "luzern", name: "Luzern", muniMult: 1.75 },
      { id: "kriens", name: "Kriens", muniMult: 1.75 },
      { id: "emmen", name: "Emmen", muniMult: 1.75 },
      { id: "horw", name: "Horw", muniMult: 1.55 },
      { id: "ebikon", name: "Ebikon", muniMult: 1.85 },
      { id: "meggen", name: "Meggen", muniMult: 1.4 },
      { id: "sursee", name: "Sursee", muniMult: 1.6 },
    ],
  },
  {
    code: "SZ", name: "Schwyz", simpleMin: 0.004, simpleMax: 0.028, cantonMult: 1.3,
    churchRate: 0.1, wealthPerMille: 0.4, wealthAllowanceSingle: 60_000, wealthAllowanceMarried: 120_000,
    commuteCapCantonal: 6_000, eFiling: true, filingAgency: "Steuerverwaltung Schwyz · eSteuer SZ",
    municipalities: [
      { id: "schwyz", name: "Schwyz", muniMult: 1.4 },
      { id: "freienbach", name: "Freienbach", muniMult: 0.9 },
      { id: "einsiedeln", name: "Einsiedeln", muniMult: 1.45 },
      { id: "kussnacht-sz", name: "Küssnacht", muniMult: 1.5 },
      { id: "arth", name: "Arth", muniMult: 1.5 },
      { id: "wollerau", name: "Wollerau", muniMult: 0.9 },
    ],
  },
  {
    code: "ZG", name: "Zug", simpleMin: 0.003, simpleMax: 0.026, cantonMult: 0.82,
    churchRate: 0.08, wealthPerMille: 0.45, wealthAllowanceSingle: 100_000, wealthAllowanceMarried: 200_000,
    commuteCapCantonal: 6_000, eFiling: true, filingAgency: "Steuerverwaltung Zug · e-Zug-Tax",
    municipalities: [
      { id: "zug", name: "Zug", muniMult: 0.55 },
      { id: "baar", name: "Baar", muniMult: 0.55 },
      { id: "risch", name: "Risch", muniMult: 0.52 },
      { id: "cham", name: "Cham", muniMult: 0.6 },
      { id: "steinhausen", name: "Steinhausen", muniMult: 0.52 },
      { id: "hünenberg", name: "Hünenberg", muniMult: 0.6 },
    ],
  },
  {
    code: "SG", name: "St. Gallen", simpleMin: 0.005, simpleMax: 0.033, cantonMult: 1.38,
    churchRate: 0.17, wealthPerMille: 0.7, wealthAllowanceSingle: 55_000, wealthAllowanceMarried: 110_000,
    commuteCapCantonal: 3_600, eFiling: true, filingAgency: "Steuerverwaltung St. Gallen · SG eTax",
    municipalities: [
      { id: "stgallen", name: "St. Gallen", muniMult: 1.45 },
      { id: "wil", name: "Wil", muniMult: 1.33 },
      { id: "rorschach", name: "Rorschach", muniMult: 1.29 },
      { id: "gossau", name: "Gossau", muniMult: 1.33 },
      { id: "buchs", name: "Buchs", muniMult: 1.33 },
      { id: "goldach", name: "Goldach", muniMult: 1.16 },
    ],
  },
  {
    code: "AG", name: "Aargau", simpleMin: 0.005, simpleMax: 0.035, cantonMult: 1.12,
    churchRate: 0.12, wealthPerMille: 0.8, wealthAllowanceSingle: 50_000, wealthAllowanceMarried: 100_000,
    commuteCapCantonal: 7_000, eFiling: true, filingAgency: "Kantonales Steueramt Aargau · eTax AG",
    municipalities: [
      { id: "aarau", name: "Aarau", muniMult: 0.95 },
      { id: "baden", name: "Baden", muniMult: 0.93 },
      { id: "wettingen", name: "Wettingen", muniMult: 0.91 },
      { id: "zofingen", name: "Zofingen", muniMult: 1.0 },
      { id: "rheinfelden", name: "Rheinfelden", muniMult: 0.92 },
      { id: "wohlen", name: "Wohlen", muniMult: 1.02 },
    ],
  },
  {
    code: "BS", name: "Basel-Stadt", simpleMin: 0.006, simpleMax: 0.075, cantonMult: 1.0,
    churchRate: 0.08, wealthPerMille: 1.0, wealthAllowanceSingle: 75_000, wealthAllowanceMarried: 150_000,
    commuteCapCantonal: 3_000, eFiling: true, filingAgency: "Steuerverwaltung Basel-Stadt · ePortal",
    municipalities: [
      { id: "basel", name: "Basel", muniMult: 0 },
      { id: "riehen", name: "Riehen", muniMult: 0.02 },
      { id: "bettingen", name: "Bettingen", muniMult: 0.02 },
    ],
  },
  {
    code: "GE", name: "Genève", simpleMin: 0.008, simpleMax: 0.068, cantonMult: 0.455,
    churchRate: 0.0, wealthPerMille: 1.2, wealthAllowanceSingle: 86_833, wealthAllowanceMarried: 173_666,
    commuteCapCantonal: 500, eFiling: true, filingAgency: "Administration fiscale Genève · GE-démarches",
    municipalities: [
      { id: "geneve", name: "Genève", muniMult: 0.455 },
      { id: "carouge", name: "Carouge", muniMult: 0.41 },
      { id: "lancy", name: "Lancy", muniMult: 0.42 },
      { id: "vernier", name: "Vernier", muniMult: 0.48 },
      { id: "meyrin", name: "Meyrin", muniMult: 0.42 },
      { id: "cologny", name: "Cologny", muniMult: 0.3 },
      { id: "geneve-centre", name: "Chêne-Bougeries", muniMult: 0.34 },
    ],
  },
  {
    code: "VD", name: "Vaud", simpleMin: 0.007, simpleMax: 0.055, cantonMult: 1.55,
    churchRate: 0.09, wealthPerMille: 0.9, wealthAllowanceSingle: 57_000, wealthAllowanceMarried: 113_000,
    commuteCapCantonal: 700, eFiling: true, filingAgency: "Administration cantonale des impôts · VaudTax",
    municipalities: [
      { id: "lausanne", name: "Lausanne", muniMult: 0.785 },
      { id: "yverdon", name: "Yverdon-les-Bains", muniMult: 0.72 },
      { id: "nyon", name: "Nyon", muniMult: 0.6 },
      { id: "vevey", name: "Vevey", muniMult: 0.76 },
      { id: "montreux", name: "Montreux", muniMult: 0.69 },
      { id: "morges", name: "Morges", muniMult: 0.72 },
      { id: "pully", name: "Pully", muniMult: 0.68 },
    ],
  },
  {
    code: "TI", name: "Ticino", simpleMin: 0.005, simpleMax: 0.04, cantonMult: 0.95,
    churchRate: 0.1, wealthPerMille: 0.9, wealthAllowanceSingle: 50_000, wealthAllowanceMarried: 100_000,
    commuteCapCantonal: 6_000, eFiling: false, filingAgency: "Divisione delle contribuzioni · Démarche cartacea",
    municipalities: [
      { id: "lugano", name: "Lugano", muniMult: 0.85 },
      { id: "bellinzona", name: "Bellinzona", muniMult: 0.85 },
      { id: "locarno", name: "Locarno", muniMult: 0.85 },
      { id: "mendrisio", name: "Mendrisio", muniMult: 0.8 },
      { id: "chiasso", name: "Chiasso", muniMult: 0.85 },
      { id: "paradiso", name: "Paradiso", muniMult: 0.72 },
    ],
  },
  {
    code: "VS", name: "Valais", simpleMin: 0.005, simpleMax: 0.036, cantonMult: 1.3,
    churchRate: 0.13, wealthPerMille: 0.7, wealthAllowanceSingle: 30_000, wealthAllowanceMarried: 60_000,
    commuteCapCantonal: 2_900, eFiling: false, filingAgency: "Service des contributions · Envoi postal",
    municipalities: [
      { id: "sion", name: "Sion", muniMult: 1.15 },
      { id: "martigny", name: "Martigny", muniMult: 1.2 },
      { id: "monthey", name: "Monthey", muniMult: 1.25 },
      { id: "brig", name: "Brig-Glis", muniMult: 1.1 },
      { id: "crans", name: "Crans-Montana", muniMult: 0.95 },
      { id: "zermatt", name: "Zermatt", muniMult: 0.85 },
    ],
  },
  {
    code: "FR", name: "Fribourg", simpleMin: 0.006, simpleMax: 0.04, cantonMult: 1.0,
    churchRate: 0.1, wealthPerMille: 1.1, wealthAllowanceSingle: 20_000, wealthAllowanceMarried: 40_000,
    commuteCapCantonal: 5_000, eFiling: true, filingAgency: "Service cantonal des contributions FR · FriTax",
    municipalities: [
      { id: "fribourg", name: "Fribourg", muniMult: 0.81 },
      { id: "bulle", name: "Bulle", muniMult: 0.77 },
      { id: "villars", name: "Villars-sur-Glâne", muniMult: 0.69 },
      { id: "murten", name: "Murten", muniMult: 0.75 },
    ],
  },
  {
    code: "SO", name: "Solothurn", simpleMin: 0.005, simpleMax: 0.036, cantonMult: 1.04,
    churchRate: 0.14, wealthPerMille: 1.0, wealthAllowanceSingle: 40_000, wealthAllowanceMarried: 80_000,
    commuteCapCantonal: 6_000, eFiling: true, filingAgency: "Steueramt Solothurn · eTax SO",
    municipalities: [
      { id: "solothurn", name: "Solothurn", muniMult: 1.12 },
      { id: "olten", name: "Olten", muniMult: 1.09 },
      { id: "grenchen", name: "Grenchen", muniMult: 1.28 },
      { id: "dornach", name: "Dornach", muniMult: 1.05 },
    ],
  },
  {
    code: "BL", name: "Basel-Landschaft", simpleMin: 0.005, simpleMax: 0.042, cantonMult: 1.0,
    churchRate: 0.09, wealthPerMille: 0.95, wealthAllowanceSingle: 75_000, wealthAllowanceMarried: 150_000,
    commuteCapCantonal: 6_000, eFiling: true, filingAgency: "Steuerverwaltung BL · BL-Tax",
    municipalities: [
      { id: "liestal", name: "Liestal", muniMult: 0.62 },
      { id: "allschwil", name: "Allschwil", muniMult: 0.58 },
      { id: "reinach-bl", name: "Reinach", muniMult: 0.58 },
      { id: "binningen", name: "Binningen", muniMult: 0.53 },
    ],
  },
  {
    code: "SH", name: "Schaffhausen", simpleMin: 0.005, simpleMax: 0.035, cantonMult: 1.12,
    churchRate: 0.12, wealthPerMille: 0.9, wealthAllowanceSingle: 50_000, wealthAllowanceMarried: 100_000,
    commuteCapCantonal: 6_000, eFiling: true, filingAgency: "Steuerverwaltung Schaffhausen · eTax SH",
    municipalities: [
      { id: "schaffhausen", name: "Schaffhausen", muniMult: 0.97 },
      { id: "neuhausen", name: "Neuhausen a. Rhf.", muniMult: 1.06 },
      { id: "stein-am-rhein", name: "Stein am Rhein", muniMult: 0.95 },
    ],
  },
  {
    code: "TG", name: "Thurgau", simpleMin: 0.005, simpleMax: 0.032, cantonMult: 1.17,
    churchRate: 0.14, wealthPerMille: 0.7, wealthAllowanceSingle: 50_000, wealthAllowanceMarried: 100_000,
    commuteCapCantonal: 6_000, eFiling: true, filingAgency: "Steuerverwaltung Thurgau · eTax.tg",
    municipalities: [
      { id: "frauenfeld", name: "Frauenfeld", muniMult: 1.28 },
      { id: "kreuzlingen", name: "Kreuzlingen", muniMult: 1.27 },
      { id: "arbon", name: "Arbon", muniMult: 1.3 },
      { id: "amriswil", name: "Amriswil", muniMult: 1.25 },
    ],
  },
  {
    code: "GR", name: "Graubünden", simpleMin: 0.005, simpleMax: 0.035, cantonMult: 1.0,
    churchRate: 0.12, wealthPerMille: 0.9, wealthAllowanceSingle: 50_000, wealthAllowanceMarried: 100_000,
    commuteCapCantonal: 6_000, eFiling: true, filingAgency: "Steuerverwaltung Graubünden · SteuerGR",
    municipalities: [
      { id: "chur", name: "Chur", muniMult: 0.9 },
      { id: "davos", name: "Davos", muniMult: 0.85 },
      { id: "stmoritz", name: "St. Moritz", muniMult: 0.65 },
      { id: "landquart", name: "Landquart", muniMult: 0.95 },
    ],
  },
  {
    code: "NE", name: "Neuchâtel", simpleMin: 0.007, simpleMax: 0.05, cantonMult: 1.23,
    churchRate: 0.0, wealthPerMille: 1.1, wealthAllowanceSingle: 50_000, wealthAllowanceMarried: 100_000,
    commuteCapCantonal: 3_200, eFiling: true, filingAgency: "Service des contributions NE · Clic&Tax",
    municipalities: [
      { id: "neuchatel", name: "Neuchâtel", muniMult: 0.66 },
      { id: "chaux-de-fonds", name: "La Chaux-de-Fonds", muniMult: 0.77 },
      { id: "val-de-ruz", name: "Val-de-Ruz", muniMult: 0.71 },
    ],
  },
  {
    code: "JU", name: "Jura", simpleMin: 0.006, simpleMax: 0.042, cantonMult: 2.85,
    churchRate: 0.12, wealthPerMille: 1.3, wealthAllowanceSingle: 30_000, wealthAllowanceMarried: 60_000,
    commuteCapCantonal: 4_000, eFiling: false, filingAgency: "Service des contributions JU · envoi officiel",
    municipalities: [
      { id: "delemont", name: "Delémont", muniMult: 1.95 },
      { id: "porrentruy", name: "Porrentruy", muniMult: 2.0 },
      { id: "haute-sorne", name: "Haute-Sorne", muniMult: 1.98 },
    ],
  },
  {
    code: "UR", name: "Uri", simpleMin: 0.004, simpleMax: 0.03, cantonMult: 1.0,
    churchRate: 0.11, wealthPerMille: 0.6, wealthAllowanceSingle: 55_000, wealthAllowanceMarried: 110_000,
    commuteCapCantonal: 6_000, eFiling: false, filingAgency: "Amt für Steuern Uri · offizieller Versand",
    municipalities: [
      { id: "altdorf", name: "Altdorf", muniMult: 0.97 },
      { id: "schattdorf", name: "Schattdorf", muniMult: 0.94 },
      { id: "erstfeld", name: "Erstfeld", muniMult: 1.05 },
    ],
  },
  {
    code: "OW", name: "Obwalden", simpleMin: 0.004, simpleMax: 0.029, cantonMult: 2.95,
    churchRate: 0.11, wealthPerMille: 0.55, wealthAllowanceSingle: 30_000, wealthAllowanceMarried: 60_000,
    commuteCapCantonal: 6_000, eFiling: false, filingAgency: "Steuerverwaltung Obwalden · offizieller Versand",
    municipalities: [
      { id: "sarnen", name: "Sarnen", muniMult: 4.0 },
      { id: "kerns", name: "Kerns", muniMult: 4.2 },
      { id: "engelberg", name: "Engelberg", muniMult: 4.35 },
    ],
  },
  {
    code: "NW", name: "Nidwalden", simpleMin: 0.004, simpleMax: 0.027, cantonMult: 2.66,
    churchRate: 0.1, wealthPerMille: 0.5, wealthAllowanceSingle: 35_000, wealthAllowanceMarried: 70_000,
    commuteCapCantonal: 6_000, eFiling: false, filingAgency: "Steueramt Nidwalden · offizieller Versand",
    municipalities: [
      { id: "stans", name: "Stans", muniMult: 2.4 },
      { id: "hergiswil", name: "Hergiswil", muniMult: 1.85 },
      { id: "buochs", name: "Buochs", muniMult: 2.5 },
    ],
  },
  {
    code: "GL", name: "Glarus", simpleMin: 0.005, simpleMax: 0.033, cantonMult: 1.0,
    churchRate: 0.12, wealthPerMille: 0.8, wealthAllowanceSingle: 40_000, wealthAllowanceMarried: 80_000,
    commuteCapCantonal: 6_000, eFiling: false, filingAgency: "Steuerverwaltung Glarus · offizieller Versand",
    municipalities: [
      { id: "glarus", name: "Glarus", muniMult: 0.62 },
      { id: "glarus-nord", name: "Glarus Nord", muniMult: 0.6 },
      { id: "glarus-sued", name: "Glarus Süd", muniMult: 0.67 },
    ],
  },
  {
    code: "AR", name: "Appenzell Ausserrhoden", simpleMin: 0.005, simpleMax: 0.034, cantonMult: 3.2,
    churchRate: 0.13, wealthPerMille: 0.8, wealthAllowanceSingle: 40_000, wealthAllowanceMarried: 80_000,
    commuteCapCantonal: 5_000, eFiling: false, filingAgency: "Steuerverwaltung AR · offizieller Versand",
    municipalities: [
      { id: "herisau", name: "Herisau", muniMult: 4.1 },
      { id: "teufen", name: "Teufen", muniMult: 3.3 },
      { id: "speicher", name: "Speicher", muniMult: 3.9 },
    ],
  },
  {
    code: "AI", name: "Appenzell Innerrhoden", simpleMin: 0.004, simpleMax: 0.028, cantonMult: 0.96,
    churchRate: 0.11, wealthPerMille: 0.6, wealthAllowanceSingle: 40_000, wealthAllowanceMarried: 80_000,
    commuteCapCantonal: 5_000, eFiling: false, filingAgency: "Steuerverwaltung AI · offizieller Versand",
    municipalities: [
      { id: "appenzell", name: "Appenzell", muniMult: 0.92 },
      { id: "oberegg", name: "Oberegg", muniMult: 0.98 },
    ],
  },
];

export const TAX_YEARS = [2026, 2025, 2024, 2023];

export function getCanton(code: string): Canton {
  return CANTONS.find((c) => c.code === code) ?? CANTONS[0];
}
export function getMunicipality(code: string, id: string): Municipality {
  const c = getCanton(code);
  return c.municipalities.find((m) => m.id === id) ?? c.municipalities[0];
}

/* ------------------------------------------------------------------ */
/*  Document taxonomy                                                  */
/* ------------------------------------------------------------------ */

export const DOC_TYPE_META: Record<DocType, { label: string; labelDe: string; hint: string }> = {
  salary_certificate: { label: "Salary certificate", labelDe: "Lohnausweis", hint: "§11 Lohnausweis" },
  bank_statement: { label: "Bank / tax statement", labelDe: "Steuerauszug Bank", hint: "Year-end balance & interest" },
  pillar3a: { label: "Pillar 3a certificate", labelDe: "Säule 3a Bescheinigung", hint: "Bound pension contribution" },
  insurance_premiums: { label: "Health insurance premiums", labelDe: "Prämienbescheinigung", hint: "KVG premium statement" },
  securities_statement: { label: "Securities / e-tax statement", labelDe: "Wertschriftenverzeichnis", hint: "Depot with dividends" },
  medical_invoice: { label: "Medical invoice", labelDe: "Krankheitskosten", hint: "Out-of-pocket medical" },
  donation_receipt: { label: "Donation receipt", labelDe: "Spendenbestätigung", hint: "Charitable donation" },
  mortgage_statement: { label: "Mortgage statement", labelDe: "Hypothekarzins", hint: "Debt & interest" },
  childcare_receipt: { label: "Childcare receipts", labelDe: "Kinderbetreuung", hint: "Third-party childcare" },
  prior_return: { label: "Prior-year tax return", labelDe: "Steuererklärung Vorjahr", hint: "Reference & personal data" },
  tax_assessment: { label: "Tax assessment / invoice", labelDe: "Steuerveranlagung", hint: "Official definitive notice" },
  tax_invitation: { label: "Filing invitation", labelDe: "Steueraufforderung", hint: "Official letter from tax office" },
  pension_fund: { label: "Pension fund / BVG", labelDe: "BVG-Ausweis · 2. Säule", hint: "Occupational pension & buy-ins" },
  ahv_iv: { label: "AHV / IV document", labelDe: "AHV-Kontoauszug", hint: "Social insurance record" },
  education: { label: "Education / training", labelDe: "Weiterbildung", hint: "Job-related courses & certificates" },
  real_estate: { label: "Real estate document", labelDe: "Liegenschaft", hint: "Property, rental & maintenance" },
  debt_document: { label: "Debt / loan document", labelDe: "Schuldnachweis", hint: "Private loans & interest" },
  foreign_document: { label: "Foreign document", labelDe: "Auslandsbeleg", hint: "Foreign income & DTA credits" },
  crypto_statement: { label: "Crypto tax report", labelDe: "Krypto-Steuerbericht", hint: "Wallets, staking & trades" },
  other: { label: "Other document", labelDe: "Weiteres Dokument", hint: "Unclassified" },
};

export const DOC_KEYWORDS: { type: DocType; words: string[] }[] = [
  { type: "tax_assessment", words: ["veranlagung", "veranlagungsverfuegung", "assessment", "definitiv", "steuerrechnung", "einschätzung", "taxation"] },
  { type: "tax_invitation", words: ["aufforderung", "einladung", "invitation", "rappel"] },
  { type: "prior_return", words: ["steuererklaerung", "steuererklärung", "declaration", "prior", "vorjahr", "2023", "2022"] },
  { type: "crypto_statement", words: ["crypto", "bitcoin", "btc", "ethereum", "coinbase", "binance", "kraken", "staking", "wallet", "krypto"] },
  { type: "pension_fund", words: ["bvg", "pensionskasse", "vorsorgeausweis", "caisse-de-pension", "pk-ausweis", "2-saeule", "2sa"] },
  { type: "ahv_iv", words: ["ahv-konto", "ik-auszug", "iv-verfuegung", "avs", "invaliden", "sozialversicherung"] },
  { type: "education", words: ["weiterbildung", "education", "training", "kurs", "course", "formation", "studium", "cas", "mba", "zertifikat"] },
  { type: "real_estate", words: ["liegenschaft", "grundstueck", "grundstück", "immobilien", "property", "eigenmietwert", "immo"] },
  { type: "debt_document", words: ["privatkredit", "loan", "kredit", "schuld", "leasing"] },
  { type: "foreign_document", words: ["foreign", "ausland", "grenzgaenger", "cross-border", "foreign-income", "w-2", "w2-"] },
  { type: "salary_certificate", words: ["lohn", "salary", "lohnausweis", "wage", "salaire", "certificat-de-salaire"] },
  { type: "pillar3a", words: ["3a", "saeule", "säule", "pillar", "vorsorge", "prevoyance"] },
  { type: "securities_statement", words: ["depot", "wertschriften", "securities", "portfolio", "dividend", "etax", "e-tax", "ubs", "credit-suisse"] },
  { type: "insurance_premiums", words: ["krankenkasse", "health", "praemien", "prämien", "helsana", "css", "swica", "visana", "assurance-maladie"] },
  { type: "bank_statement", words: ["bank", "konto", "postfinance", "statement", "auszug", "zins", "raiffeisen", "compte"] },
  { type: "medical_invoice", words: ["arzt", "medical", "zahn", "pharma", "apotheke", "spital", "medicale", "dentist", "rechnung"] },
  { type: "donation_receipt", words: ["spende", "spenden", "donation", "charity", "roteskreuz", "caritas"] },
  { type: "mortgage_statement", words: ["hypothek", "mortgage", "hypotheque"] },
  { type: "childcare_receipt", words: ["kita", "childcare", "kinderbetreuung", "krippe", "creche"] },
];

/* ------------------------------------------------------------------ */
/*  Demo portfolio (auto-imported from UBS e-tax statement)            */
/* ------------------------------------------------------------------ */

const RUEF = "35% Swiss anticipatory tax — reclaimed in full via the tax return.";
const DA1 = "15% foreign withholding under the DTA — credited via DA-1.";

/** Parsed automatically from four different custodians' e-tax statements. */
export const DEMO_HOLDINGS: Holding[] = [
  { id: "h1", name: "Nestlé SA", ticker: "NESN", isin: "CH0038863350", custodian: "UBS Switzerland AG", country: "CH", assetClass: "Equity", qty: 220, price: 74.18, currency: "CHF", fxRate: 1, valueChf: 16319.6, dividendGrossChf: 660, withholdingRate: 0.35, withholdingChf: 231, reclaimType: "RÜF", reclaimNote: RUEF },
  { id: "h2", name: "UBS Group AG", ticker: "UBSG", isin: "CH0244767585", custodian: "UBS Switzerland AG", country: "CH", assetClass: "Equity", qty: 480, price: 27.94, currency: "CHF", fxRate: 1, valueChf: 13411.2, dividendGrossChf: 336, withholdingRate: 0.35, withholdingChf: 117.6, reclaimType: "RÜF", reclaimNote: RUEF },
  { id: "h3", name: "Novartis AG", ticker: "NOVN", isin: "CH0012005267", custodian: "UBS Switzerland AG", country: "CH", assetClass: "Equity", qty: 130, price: 86.9, currency: "CHF", fxRate: 1, valueChf: 11297, dividendGrossChf: 429, withholdingRate: 0.35, withholdingChf: 150.15, reclaimType: "RÜF", reclaimNote: RUEF },
  { id: "h4", name: "Zurich Insurance Group AG", ticker: "ZURN", isin: "CH0011075394", custodian: "UBS Switzerland AG", country: "CH", assetClass: "Equity", qty: 30, price: 512.4, currency: "CHF", fxRate: 1, valueChf: 15372, dividendGrossChf: 750, withholdingRate: 0.35, withholdingChf: 262.5, reclaimType: "RÜF", reclaimNote: RUEF },
  { id: "h5", name: "Roche Holding AG Genussschein", ticker: "ROG", isin: "CH0012032048", custodian: "PostFinance AG", country: "CH", assetClass: "Equity", qty: 42, price: 265.3, currency: "CHF", fxRate: 1, valueChf: 11142.6, dividendGrossChf: 407.4, withholdingRate: 0.35, withholdingChf: 142.59, reclaimType: "RÜF", reclaimNote: RUEF },
  { id: "h6", name: "iShares Core SPI ETF", ticker: "CSSPI", isin: "CH0237935652", custodian: "PostFinance AG", country: "CH", assetClass: "ETF", qty: 210, price: 148.6, currency: "CHF", fxRate: 1, valueChf: 31206, dividendGrossChf: 310.8, withholdingRate: 0.35, withholdingChf: 108.78, reclaimType: "RÜF", reclaimNote: RUEF },
  { id: "h7", name: "Swisscanto Bond Fund CHF", ticker: "SWCBF", isin: "CH0130595124", custodian: "PostFinance AG", country: "CH", assetClass: "Fund", qty: 180, price: 98.4, currency: "CHF", fxRate: 1, valueChf: 17712, dividendGrossChf: 291.6, withholdingRate: 0.35, withholdingChf: 102.06, reclaimType: "RÜF", reclaimNote: RUEF },
  { id: "h8", name: "ZKB 1.75% Bond 2031", ticker: "ZKB31", isin: "CH0594712319", custodian: "Zürcher Kantonalbank", country: "CH", assetClass: "Bond", qty: 20, price: 1012.5, currency: "CHF", fxRate: 1, valueChf: 20250, dividendGrossChf: 350, withholdingRate: 0.35, withholdingChf: 122.5, reclaimType: "RÜF", reclaimNote: RUEF },
  { id: "h9", name: "Apple Inc.", ticker: "AAPL", isin: "US0378331005", custodian: "Swissquote Bank SA", country: "US", assetClass: "Equity", qty: 90, price: 232.7, currency: "USD", fxRate: 0.89, valueChf: 18639.87, dividendGrossChf: 80.1, withholdingRate: 0.15, withholdingChf: 12.02, reclaimType: "DA-1", reclaimNote: DA1 },
  { id: "h10", name: "Vanguard Total World Stock ETF", ticker: "VT", isin: "US9220427424", custodian: "Swissquote Bank SA", country: "US", assetClass: "ETF", qty: 145, price: 118.4, currency: "USD", fxRate: 0.89, valueChf: 15279.28, dividendGrossChf: 251.6, withholdingRate: 0.15, withholdingChf: 37.74, reclaimType: "DA-1", reclaimNote: DA1 },
  { id: "h11", name: "iShares Core MSCI World UCITS ETF", ticker: "IWDA", isin: "IE00B4L5Y983", custodian: "Swissquote Bank SA", country: "IE", assetClass: "Fund", qty: 160, price: 92.15, currency: "USD", fxRate: 0.89, valueChf: 13122.16, dividendGrossChf: 176.5, withholdingRate: 0, withholdingChf: 0, reclaimType: "NONE", reclaimNote: "Irish-domiciled accumulating UCITS — no withholding at fund level; income still declared." },
  { id: "h12", name: "SAP SE", ticker: "SAP", isin: "DE0007164600", custodian: "Saxo Bank (Schweiz) AG", country: "DE", assetClass: "Equity", qty: 45, price: 218.4, currency: "EUR", fxRate: 0.94, valueChf: 9238.32, dividendGrossChf: 99.1, withholdingRate: 0.15, withholdingChf: 14.87, reclaimType: "DA-1", reclaimNote: "German 26.375% reduced to 15% under the CH–DE DTA; credited via DA-1." },
];

/* ---------------- Real estate (Swiss + foreign) -------------------- */

export const DEMO_PROPERTIES: Property[] = [
  {
    id: "p1", label: "Einfamilienhaus Uster", kind: "rental", countryCode: "CH",
    cantonCode: "ZH", municipality: "Uster",
    marketValue: 1240000, taxValue: 868000, imputedRental: 0, rentalIncome: 31200,
    mortgageBalance: 620000, mortgageInterest: 9920,
    maintenanceMode: "actual", maintenanceActual: 7850,
    source: "Liegenschaftsdossier + Hypothekarausweis",
  },
  {
    id: "p2", label: "Ferienwohnung Chamonix (FR)", kind: "secondary", countryCode: "FR",
    marketValue: 410000, taxValue: 287000, imputedRental: 10045, rentalIncome: 0,
    mortgageBalance: 145000, mortgageInterest: 2320,
    maintenanceMode: "flat", maintenanceActual: 0,
    source: "Avis d'imposition française (foreign property)",
  },
];

/* ------------------------------------------------------------------ */
/*  Demo documents fed into the AI pipeline                            */
/* ------------------------------------------------------------------ */

export interface DemoDoc {
  fileName: string;
  size: number;
  pages: number;
}

export const DEMO_DOCS: DemoDoc[] = [
  { fileName: "Lohnausweis_2025_A_Keller.pdf", size: 482_120, pages: 1 },
  { fileName: "Lohnausweis_2025_M_Keller.pdf", size: 461_904, pages: 1 },
  { fileName: "Steuererklaerung_2024_Keller.pdf", size: 2_884_517, pages: 14 },
  { fileName: "Steuerveranlagung_2024_Zuerich.pdf", size: 1_673_205, pages: 6 },
  { fileName: "Aufforderung_Steuererklaerung_2025.pdf", size: 312_664, pages: 2 },
  { fileName: "Saeule3a_Bescheinigung_A_Keller_2025.pdf", size: 210_442, pages: 1 },
  { fileName: "Saeule3a_Bescheinigung_M_Keller_2025.pdf", size: 205_118, pages: 1 },
  { fileName: "PostFinance_Steuerauszug_31.12.2025.pdf", size: 1_204_882, pages: 4 },
  { fileName: "UBS_Depot_eSteuerauszug_2025.pdf", size: 3_412_008, pages: 9 },
  { fileName: "Helsana_Praemienbescheinigung_2025.pdf", size: 188_204, pages: 1 },
  { fileName: "Kita_Sonnenstube_Abrechnung_2025.pdf", size: 624_771, pages: 3 },
  { fileName: "Spendenbestaetigung_SRK_2025.pdf", size: 96_330, pages: 1 },
  { fileName: "Zahnarzt_Rechnung_A_Keller.pdf", size: 142_509, pages: 1 },
  { fileName: "BVG_Vorsorgeausweis_PKG_2025.pdf", size: 452_118, pages: 2 },
  { fileName: "Weiterbildung_CAS_DigitalTax_HSG.pdf", size: 174_990, pages: 1 },
  { fileName: "Crypto_Tax_Report_BitcoinSuisse_2025.pdf", size: 688_430, pages: 5 },
];

/* ------------------------------------------------------------------ */
/*  Marketing content                                                 */
/* ------------------------------------------------------------------ */

export const TESTIMONIALS = [
  {
    name: "Dr. Isabelle Rochat",
    role: "Physician · Lausanne, VD",
    quote: "I uploaded eleven documents on a Sunday evening. By the time my espresso was ready, the return was 94% complete — including my DA-1 foreign tax credits. The only question asked was about my church affiliation.",
    img: "https://images.pexels.com/photos/7752788/pexels-photo-7752788.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    name: "Marcandre Tiberi",
    role: "Founder · Zug",
    quote: "As a founder with three bank relationships and a sizeable portfolio, filing used to take my trustee two weeks. CLARO reconciled everything against my e-tax statements in one pass and found CHF 6,200 in deductions I had missed.",
    img: "https://images.pexels.com/photos/26150471/pexels-photo-26150471.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    name: "Sofia Wenger-Brügger",
    role: "Architect · Zürich",
    quote: "The conflict detection alone is worth it. It caught a transposed digit in my AHV number between two certificates that would have delayed my assessment for months. Elegant, quiet, thorough — very Swiss.",
    img: "https://images.pexels.com/photos/25651531/pexels-photo-25651531.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
];

export const FAQ_ITEMS = [
  {
    q: "Which cantons are supported?",
    a: "All 26 cantons for preparation, calculation and export. Direct electronic transmission is available for ZH, BE, LU, SZ, ZG, SG, AG, BS, GE and VD through the official cantonal interfaces. For the remaining cantons, CLARO produces the official signed declaration file and a print-ready PDF accepted by every tax office.",
  },
  {
    q: "Is my data safe? Where is it processed?",
    a: "Documents are encrypted in transit (TLS 1.3) and at rest (AES-256), processed exclusively in ISO 27001-certified Swiss data centres, and never used to train models. You can delete your entire dossier at any time with one click — no dark patterns, no retention.",
  },
  {
    q: "How does the AI decide what to ask me?",
    a: "CLARO first extracts every structured fact from your documents and cross-references them. A question is only generated when a fact legally required for your return cannot be derived from a document — typically church affiliation, commuting habits or professional expense elections. Everything else stays silent.",
  },
  {
    q: "How accurate is the tax calculation?",
    a: "Calculations never come from the AI. They run on a deterministic rules engine implementing the federal DBG tariff and the cantonal multipliers, updated every January. Your estimate typically lands within a few percent of the official assessment; the definitive invoice always comes from your tax office.",
  },
  {
    q: "What about securities and foreign withholding tax?",
    a: "Swiss e-tax statements (eSteuerauszug) are parsed position-by-position. Swiss anticipatory tax (35%) is reclaimed automatically, and foreign withholding under double-taxation treaties is credited via DA-1 when your W-8BEN status is on file.",
  },
  {
    q: "Can a professional review my return?",
    a: "Yes. The Premium plan includes a full review by a federally certified tax expert before submission, plus one hour of consultation — ideal for relocations, divorces, real-estate transactions or exercised stock options.",
  },
];

export const PRICING = [
  {
    id: "essential",
    name: "Essential",
    price: 79,
    tagline: "One clean, complete return.",
    features: [
      "1 tax return, any canton",
      "Unlimited AI document extraction",
      "Automatic deduction discovery",
      "Deterministic tax estimate",
      "Official PDF + e-filing export",
      "Email support within 24h",
    ],
    cta: "Start Essential",
    highlight: false,
  },
  {
    id: "plus",
    name: "Plus",
    price: 149,
    tagline: "For portfolios & families.",
    features: [
      "Everything in Essential",
      "Full securities processing incl. DA-1",
      "Pillar 3a & pension optimisation",
      "Multi-canton move simulation",
      "Prior-year import & carry-over",
      "Priority chat support",
    ],
    cta: "Start Plus",
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 349,
    tagline: "Expert-certified filing.",
    features: [
      "Everything in Plus",
      "Review by certified tax expert",
      "Signed professional liability cover",
      "1h consultation call",
      "Objection letter drafting (Einsprache)",
      "Dedicated concierge",
    ],
    cta: "Start Premium",
    highlight: false,
  },
];

export const HERO_IMG_MATTERHORN =
  "https://images.pexels.com/photos/29518500/pexels-photo-29518500.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
export const IMG_ZURICH =
  "https://images.pexels.com/photos/13356937/pexels-photo-13356937.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
export const IMG_ZURICH_LAKE =
  "https://images.pexels.com/photos/13356939/pexels-photo-13356939.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
export const IMG_ALPS_REFLECTION =
  "https://images.pexels.com/photos/5793935/pexels-photo-5793935.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
