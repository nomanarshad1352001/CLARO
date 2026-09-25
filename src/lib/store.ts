"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActivityEntry,
  AssetItem,
  Household,
  IncomeItem,
  Property,
  Answer,
  CalcBreakdown,
  Conflict,
  FilingResult,
  Holding,
  MissingItem,
  Session,
  SetupInfo,
  TaxDoc,
} from "./types";
import { DEMO_HOLDINGS, DEMO_PROPERTIES } from "./tax-data";

export const genId = () => Math.random().toString(36).slice(2, 10);
export const now = () =>
  new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

interface AppState {
  hydrated: boolean;
  session: Session | null;
  setup: SetupInfo | null;
  docs: TaxDoc[];
  processed: boolean;
  conflicts: Conflict[];
  missing: MissingItem[];
  answers: Answer[];
  questionsDone: boolean;
  holdings: Holding[];
  securitiesConfirmed: boolean;
  calc: CalcBreakdown | null;
  confirmedResponsibility: boolean;
  filing: FilingResult | null;
  activity: ActivityEntry[];
  deductionOverrides: Record<string, number>;
  profileChoices: Record<string, string>;
  retentionDays: number;
  household: Household;
  properties: Property[];
  incomeConfirmed: boolean;
  propertyConfirmed: boolean;
  extraIncome: IncomeItem[];
  extraAssets: AssetItem[];

  setHydrated: () => void;
  login: (name: string, email: string) => void;
  logout: () => void;
  setSetup: (s: SetupInfo) => void;
  addDocs: (docs: TaxDoc[]) => void;
  updateDoc: (id: string, patch: Partial<TaxDoc>) => void;
  removeDoc: (id: string) => void;
  setProcessed: (data: {
    conflicts: Conflict[];
    missing: MissingItem[];
  }) => void;
  resolveConflict: (id: string, value: string) => void;
  answer: (a: Answer) => void;
  editAnswer: (questionId: string) => void;
  setQuestionsDone: (v: boolean) => void;
  setHoldings: (h: Holding[]) => void;
  confirmSecurities: () => void;
  setCalc: (c: CalcBreakdown | null) => void;
  setConfirmedResponsibility: (v: boolean) => void;
  setFiling: (f: FilingResult) => void;
  log: (icon: string, text: string) => void;
  setDeductionOverride: (id: string, amount: number | null) => void;
  setRetentionDays: (d: number) => void;
  setHousehold: (h: Partial<Household>) => void;
  addExtraIncome: (i: IncomeItem) => void;
  removeExtraIncome: (id: string) => void;
  addExtraAsset: (a: AssetItem) => void;
  removeExtraAsset: (id: string) => void;
  setProperties: (p: Property[]) => void;
  confirmIncome: () => void;
  confirmProperty: () => void;
  chooseProfile: (key: string, value: string) => void;
  unchooseProfile: (key: string) => void;
  resetAll: () => void;
}

const DEFAULT_HOUSEHOLD: Household = {
  civilStatus: "single",
  childrenCount: 0,
  dependantsCount: 0,
  soleCustody: false,
  movedDuringYear: false,
  crossBorder: false,
  multipleEmployers: false,
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      session: null,
      setup: null,
      docs: [],
      processed: false,
      conflicts: [],
      missing: [],
      answers: [],
      questionsDone: false,
      holdings: [],
      securitiesConfirmed: false,
      calc: null,
      confirmedResponsibility: false,
      filing: null,
      activity: [],
      deductionOverrides: {},
      profileChoices: {},
      retentionDays: 365,
      household: DEFAULT_HOUSEHOLD,
      properties: [],
      incomeConfirmed: false,
      propertyConfirmed: false,
      extraIncome: [],
      extraAssets: [],

      setHydrated: () => set({ hydrated: true }),
      login: (name, email) =>
        set({
          session: { name, email },
          activity: [
            ...get().activity,
            { id: genId(), at: now(), icon: "user", text: `Signed in as ${name}` },
          ],
        }),
      logout: () =>
        set({
          session: null,
          setup: null,
          docs: [],
          processed: false,
          conflicts: [],
          missing: [],
          answers: [],
          questionsDone: false,
          holdings: [],
          securitiesConfirmed: false,
          calc: null,
          confirmedResponsibility: false,
          filing: null,
          activity: [],
          deductionOverrides: {},
          profileChoices: {},
          household: DEFAULT_HOUSEHOLD,
          properties: [],
          incomeConfirmed: false,
          propertyConfirmed: false,
          extraIncome: [],
          extraAssets: [],
        }),
      setSetup: (s) =>
        set({
          setup: s,
          calc: null,
          activity: [
            ...get().activity,
            {
              id: genId(),
              at: now(),
              icon: "map-pin",
              text: `Jurisdiction set: ${s.municipality}, canton ${s.canton} · tax year ${s.year}`,
            },
          ],
        }),
      addDocs: (docs) =>
        set({
          docs: [...get().docs, ...docs],
          processed: false,
          conflicts: [],
          missing: [],
          calc: null,
        }),
      updateDoc: (id, patch) =>
        set({ docs: get().docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) }),
      removeDoc: (id) =>
        set({ docs: get().docs.filter((d) => d.id !== id), processed: false, calc: null }),
      setProcessed: ({ conflicts, missing }) =>
        set({
          processed: true,
          conflicts,
          missing,
          holdings: DEMO_HOLDINGS,
          properties: DEMO_PROPERTIES,
          household: {
            ...get().household,
            civilStatus: get().docs.filter((d) => d.type === "salary_certificate").length >= 2 ? "married" : get().household.civilStatus,
            childrenCount: get().docs.some((d) => d.type === "childcare_receipt") ? 1 : get().household.childrenCount,
            multipleEmployers: get().docs.filter((d) => d.type === "salary_certificate").length >= 2,
          },
          calc: null,
          activity: [
            ...get().activity,
            {
              id: genId(),
              at: now(),
              icon: "sparkles",
              text: `AI merged ${get().docs.length} documents — ${conflicts.length} conflict(s), ${missing.length} open question(s)`,
            },
          ],
        }),
      resolveConflict: (id, value) =>
        set({
          conflicts: get().conflicts.map((c) => (c.id === id ? { ...c, resolved: value } : c)),
          calc: null,
        }),
      answer: (a) =>
        set({
          answers: [...get().answers.filter((x) => x.questionId !== a.questionId), a],
          calc: null,
        }),
      editAnswer: (questionId) =>
        set({
          answers: get().answers.filter((x) => x.questionId !== questionId),
          questionsDone: false,
          calc: null,
        }),
      setQuestionsDone: (v) =>
        set({
          questionsDone: v,
          activity: v
            ? [
                ...get().activity,
                { id: genId(), at: now(), icon: "message", text: "All open questions resolved — return is complete" },
              ]
            : get().activity,
        }),
      setHoldings: (h) => set({ holdings: h, calc: null }),
      confirmSecurities: () =>
        set({
          securitiesConfirmed: true,
          activity: [
            ...get().activity,
            {
              id: genId(),
              at: now(),
              icon: "chart",
              text: `Securities confirmed — ${get().holdings.length} positions, reclaims flagged`,
            },
          ],
        }),
      setCalc: (c) => set({ calc: c }),
      setConfirmedResponsibility: (v) => set({ confirmedResponsibility: v }),
      setFiling: (f) =>
        set({
          filing: f,
          activity: [
            ...get().activity,
            {
              id: genId(),
              at: now(),
              icon: "send",
              text: `Tax return transmitted — reference ${f.reference}`,
            },
          ],
        }),
      log: (icon, text) =>
        set({ activity: [...get().activity, { id: genId(), at: now(), icon, text }] }),
      setDeductionOverride: (id, amount) =>
        set((st) => {
          const next = { ...st.deductionOverrides };
          if (amount === null) delete next[id];
          else next[id] = amount;
          return { deductionOverrides: next, calc: null };
        }),
      addExtraIncome: (i) => set((st) => ({ extraIncome: [...st.extraIncome, i], calc: null })),
      removeExtraIncome: (id) => set((st) => ({ extraIncome: st.extraIncome.filter((x) => x.id !== id), calc: null })),
      addExtraAsset: (a) => set((st) => ({ extraAssets: [...st.extraAssets, a], calc: null })),
      removeExtraAsset: (id) => set((st) => ({ extraAssets: st.extraAssets.filter((x) => x.id !== id), calc: null })),
      setRetentionDays: (d) => set({ retentionDays: d }),
      setHousehold: (h) =>
        set((st) => ({ household: { ...st.household, ...h }, calc: null })),
      setProperties: (p) => set({ properties: p, calc: null }),
      confirmIncome: () =>
        set((st) => ({
          incomeConfirmed: true,
          activity: [...st.activity, { id: genId(), at: now(), icon: "chart", text: "Income & assets ledger confirmed" }],
        })),
      confirmProperty: () =>
        set((st) => ({
          propertyConfirmed: true,
          activity: [...st.activity, { id: genId(), at: now(), icon: "home", text: `Real estate confirmed — ${st.properties.length} propert(ies)` }],
        })),
      chooseProfile: (key, value) =>
        set((st) => ({
          profileChoices: { ...st.profileChoices, [key]: value },
          activity: [
            ...st.activity,
            {
              id: genId(),
              at: now(),
              icon: "fingerprint",
              text: `Identity confirmed (${key}): ${value}`,
            },
          ],
        })),
      unchooseProfile: (key) =>
        set((st) => {
          const next = { ...st.profileChoices };
          delete next[key];
          return { profileChoices: next };
        }),
      resetAll: () =>
        set({
          setup: null,
          docs: [],
          processed: false,
          conflicts: [],
          missing: [],
          answers: [],
          questionsDone: false,
          holdings: [],
          securitiesConfirmed: false,
          calc: null,
          confirmedResponsibility: false,
          filing: null,
          activity: [],
          deductionOverrides: {},
          profileChoices: {},
          household: DEFAULT_HOUSEHOLD,
          properties: [],
          incomeConfirmed: false,
          propertyConfirmed: false,
          extraIncome: [],
          extraAssets: [],
        }),
    }),
    {
      name: "claro-tax-v1",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

export function useAnswer(questionId: string): Answer | undefined {
  return useApp((s) => s.answers.find((a) => a.questionId === questionId));
}

export function getAnswerValue(
  answers: Answer[],
  id: string
): string | number | boolean | undefined {
  return answers.find((a) => a.questionId === id)?.value;
}
