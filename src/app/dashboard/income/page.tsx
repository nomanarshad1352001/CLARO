"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  Bitcoin,
  Briefcase,
  Building2,
  Check,
  Coins,
  Globe2,
  HandCoins,
  Landmark,
  LineChart,
  Minus,
  PiggyBank,
  Plus,
  ShieldCheck,
  Trash2,
  Umbrella,
  Wallet,
  X,
} from "lucide-react";
import { LockedState, PageHead } from "@/components/app/shell";
import { useApp, genId } from "@/lib/store";
import { numericField } from "@/lib/questions";
import { propertyTotals } from "@/lib/tax-engine";
import { fmtChf } from "@/lib/format";
import type { AssetItem, IncomeItem } from "@/lib/types";

const INCOME_ICON: Record<string, React.ReactNode> = {
  salary: <Briefcase className="h-3.5 w-3.5" />,
  bonus: <HandCoins className="h-3.5 w-3.5" />,
  benefit: <ShieldCheck className="h-3.5 w-3.5" />,
  ahv_iv: <Umbrella className="h-3.5 w-3.5" />,
  pension: <PiggyBank className="h-3.5 w-3.5" />,
  unemployment: <Umbrella className="h-3.5 w-3.5" />,
  interest: <Banknote className="h-3.5 w-3.5" />,
  dividend: <LineChart className="h-3.5 w-3.5" />,
  rental: <Building2 className="h-3.5 w-3.5" />,
  foreign: <Globe2 className="h-3.5 w-3.5" />,
  staking: <Bitcoin className="h-3.5 w-3.5" />,
  other: <Coins className="h-3.5 w-3.5" />,
};

const ASSET_ICON: Record<string, React.ReactNode> = {
  bank: <Landmark className="h-3.5 w-3.5" />,
  savings: <PiggyBank className="h-3.5 w-3.5" />,
  securities: <LineChart className="h-3.5 w-3.5" />,
  crypto: <Bitcoin className="h-3.5 w-3.5" />,
  real_estate: <Building2 className="h-3.5 w-3.5" />,
  vested_pension: <Umbrella className="h-3.5 w-3.5" />,
  foreign_asset: <Globe2 className="h-3.5 w-3.5" />,
  debt: <Minus className="h-3.5 w-3.5" />,
};

export default function IncomePage() {
  const router = useRouter();
  const s = useApp();
  const [tab, setTab] = useState<"income" | "assets">("income");
  const [modal, setModal] = useState<null | "income" | "asset">(null);

  const year = s.setup?.year ?? 2025;

  const { income, assets } = useMemo(() => {
    const docs = s.docs;
    const prop = propertyTotals(s.properties, year);
    const salaryDocs = docs.filter((d) => d.type === "salary_certificate" && d.status === "done");
    const inc: IncomeItem[] = [];

    salaryDocs.forEach((d, i) => {
      const spouse = !!d.fields?.some((f) => f.key === "is_spouse");
      const gross = d.fields?.find((f) => f.key === "gross_salary")?.numeric ?? 0;
      const bonus = d.fields?.find((f) => f.key === "bonus")?.numeric ?? 0;
      const ben = d.fields?.find((f) => f.key === "benefits")?.numeric ?? 0;
      const employer = d.fields?.find((f) => f.key === "employer")?.value ?? `Employer ${i + 1}`;
      if (gross) inc.push({ id: `sal-${d.id}`, kind: "salary", label: "Employment salary", payer: employer, amount: gross, person: spouse ? "spouse" : "primary", source: d.fileName, auto: true });
      if (bonus) inc.push({ id: `bon-${d.id}`, kind: "bonus", label: "Bonus / 13th salary", payer: employer, amount: bonus, person: spouse ? "spouse" : "primary", source: d.fileName, auto: true });
      if (ben) inc.push({ id: `ben-${d.id}`, kind: "benefit", label: "Fringe benefits (car, meals)", payer: employer, amount: ben, person: spouse ? "spouse" : "primary", source: d.fileName, auto: true });
    });

    const add = (kind: IncomeItem["kind"], label: string, payer: string, amount: number, source: string) => {
      if (amount > 0) inc.push({ id: `${kind}-${label}`, kind, label, payer, amount, person: "primary", source, auto: true });
    };
    add("ahv_iv", "AHV / IV benefits", "Ausgleichskasse", numericField(s.docs, "ahv_pension_income"), "AHV statement");
    add("pension", "Pension (2nd pillar) income", "PKG Pensionskasse", numericField(s.docs, "pension_income"), "BVG certificate");
    add("unemployment", "Unemployment benefits (ALV)", "Arbeitslosenkasse", numericField(s.docs, "unemployment_income"), "ALV statement");
    add("interest", "Bank interest", "PostFinance AG", numericField(s.docs, "interest_income"), "Bank tax statement");
    const div = s.holdings.reduce((a, h) => a + h.dividendGrossChf, 0);
    add("dividend", "Dividends & coupons (gross)", `${new Set(s.holdings.map((h) => h.custodian)).size} custodians`, div, "e-tax statements");
    add("rental", "Rental & imputed rental income", "Swiss property", prop.swissIncome, "Property files");
    add("foreign", "Foreign-source income", "Germany (DTA)", numericField(s.docs, "foreign_income"), "Foreign document");
    add("staking", "Crypto staking rewards", "Bitcoin Suisse AG", numericField(s.docs, "staking_income"), "Crypto tax report");
    if (prop.foreignIncome > 0)
      inc.push({ id: "foreign-prop", kind: "foreign", label: "Foreign property rental value", payer: "France", amount: prop.foreignIncome, person: "primary", source: "Foreign property file", auto: true, foreignExempt: true });

    const ast: AssetItem[] = [];
    const addA = (kind: AssetItem["kind"], label: string, institution: string, amount: number, source: string, taxExempt = false) => {
      if (amount !== 0) ast.push({ id: `${kind}-${label}`, kind, label, institution, amount, source, auto: true, taxExempt });
    };
    addA("bank", "Bank & savings accounts", "PostFinance AG", numericField(s.docs, "bank_balance"), "Bank tax statement");
    addA("securities", "Securities portfolio", `${new Set(s.holdings.map((h) => h.custodian)).size} custodians`, s.holdings.reduce((a, h) => a + h.valueChf, 0), "e-tax statements");
    addA("crypto", "Crypto assets", "Bitcoin Suisse AG", numericField(s.docs, "crypto_value"), "Crypto tax report");
    addA("real_estate", "Swiss real estate (tax value)", "Uster ZH", prop.swissWealth, "Property files");
    addA("foreign_asset", "Foreign real estate", "Chamonix FR", prop.foreignWealth, "Foreign property file", true);
    addA("vested_pension", "Vested pension capital (2nd pillar)", "PKG", numericField(s.docs, "vested_capital"), "BVG certificate", true);
    addA("debt", "Mortgages", "Swiss lenders", -prop.mortgageDebt, "Mortgage statements");
    addA("debt", "Private loans", "Cembra MoneyBank AG", -numericField(s.docs, "debt_outstanding"), "Loan statement");

    return { income: [...inc, ...s.extraIncome], assets: [...ast, ...s.extraAssets] };
  }, [s.docs, s.holdings, s.properties, s.extraIncome, s.extraAssets, year]);

  const totalIncome = income.filter((i) => !i.foreignExempt).reduce((a, i) => a + i.amount, 0);
  const exemptIncome = income.filter((i) => i.foreignExempt).reduce((a, i) => a + i.amount, 0);
  const grossAssets = assets.filter((a) => a.amount > 0 && !a.taxExempt).reduce((a, i) => a + i.amount, 0);
  const exemptAssets = assets.filter((a) => a.taxExempt).reduce((a, i) => a + i.amount, 0);
  const debts = Math.abs(assets.filter((a) => a.amount < 0).reduce((a, i) => a + i.amount, 0));

  if (!s.questionsDone) {
    return (
      <LockedState
        step="Smart questions"
        message="The consolidated ledger is assembled once your answers are in — they determine how several income types are treated."
        ctaHref="/dashboard/questions"
        ctaLabel="Answer the questions"
      />
    );
  }

  return (
    <div>
      <PageHead
        kicker="Step 05 · Income & assets"
        title={<>Everything you own and earn, <span className="display-italic gold-text">in one ledger</span></>}
        sub="Salaries from multiple employers, bonuses, benefits, AHV/IV, pensions, unemployment, interest, dividends, rent, foreign income and crypto — consolidated automatically from your documents, with every line traced to its source."
        actions={
          <button onClick={() => setModal(tab === "income" ? "income" : "asset")} className="btn-ghost px-4 py-2.5 text-[13px]">
            <Plus className="h-4 w-4 text-gold" /> Add {tab === "income" ? "income" : "asset"}
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Taxable income", val: fmtChf(totalIncome), sub: `${income.filter((i) => !i.foreignExempt).length} sources`, icon: Wallet },
          { label: "Exempt w/ progression", val: fmtChf(exemptIncome), sub: "Foreign property — raises the rate only", icon: Globe2 },
          { label: "Gross taxable assets", val: fmtChf(grossAssets), sub: `${assets.filter((a) => a.amount > 0 && !a.taxExempt).length} asset classes`, icon: Landmark },
          { label: "Debts (deducted)", val: `− ${fmtChf(debts)}`, sub: "Mortgages & private loans", icon: Minus },
        ].map((k) => (
          <div key={k.label} className="panel p-5">
            <k.icon className="h-4 w-4 text-gold" />
            <div className="num mt-3 text-[21px] text-ivory">{k.val}</div>
            <div className="mt-0.5 font-mono text-[9px] tracking-[0.2em] text-faint uppercase">{k.label}</div>
            <div className="mt-1.5 text-[11px] text-mist">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        {(["income", "assets"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-5 py-2.5 text-[13px] font-semibold capitalize transition-colors ${
              tab === t ? "border-gold/50 bg-gold/[0.07] text-gold-2" : "border-line-2 bg-white/60 text-mist hover:border-gold/30"
            }`}
          >
            {t === "income" ? `Income · ${income.length}` : `Assets & debts · ${assets.length}`}
          </button>
        ))}
      </div>

      <div className="panel mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line">
                {(tab === "income"
                  ? ["Type", "Description", "Payer", "Person", "Amount", ""]
                  : ["Type", "Description", "Institution", "Treatment", "Amount", ""]
                ).map((h) => (
                  <th key={h} className="px-5 py-3.5 font-mono text-[9.5px] font-medium tracking-[0.2em] text-faint uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tab === "income"
                ? income.map((i) => (
                    <tr key={i.id} className="group border-b border-line/60 transition-colors hover:bg-gold/[0.02]">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/60 px-2.5 py-1 text-[10px] text-mist">
                          <span className="text-gold">{INCOME_ICON[i.kind]}</span>
                          {i.kind.replace("_", "/")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-[13px] font-semibold text-ivory">{i.label}</div>
                        <div className="text-[10px] text-faint">{i.source}</div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-mist">{i.payer}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] tracking-widest uppercase ${i.person === "spouse" ? "bg-pine/40 text-ivory-dim" : "bg-gold/10 text-gold-2"}`}>
                          {i.person}
                        </span>
                      </td>
                      <td className="num px-5 py-3.5 text-[13px] text-ivory">
                        {fmtChf(i.amount)}
                        {i.foreignExempt && <span className="ml-2 text-[9px] text-faint">exempt</span>}
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        {!i.auto && (
                          <button onClick={() => s.removeExtraIncome(i.id)} className="rounded-full p-1.5 text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-alert/10 hover:text-alert">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                : assets.map((a) => (
                    <tr key={a.id} className="group border-b border-line/60 transition-colors hover:bg-gold/[0.02]">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/60 px-2.5 py-1 text-[10px] text-mist">
                          <span className={a.amount < 0 ? "text-alert" : "text-gold"}>{ASSET_ICON[a.kind]}</span>
                          {a.kind.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-[13px] font-semibold text-ivory">{a.label}</div>
                        <div className="text-[10px] text-faint">{a.source}</div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-mist">{a.institution}</td>
                      <td className="px-5 py-3.5 text-[11px]">
                        {a.taxExempt ? <span className="text-ok">exempt / progression</span> : a.amount < 0 ? <span className="text-alert">reduces wealth</span> : <span className="text-mist">wealth tax</span>}
                      </td>
                      <td className={`num px-5 py-3.5 text-[13px] ${a.amount < 0 ? "text-alert" : "text-ivory"}`}>{fmtChf(a.amount)}</td>
                      <td className="px-3 py-3.5 text-right">
                        {!a.auto && (
                          <button onClick={() => s.removeExtraAsset(a.id)} className="rounded-full p-1.5 text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-alert/10 hover:text-alert">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 bg-panel-2 px-5 py-4">
          <p className="text-[11px] text-faint">
            {s.household.multipleEmployers ? "Multiple employers detected — salaries aggregated per person. " : ""}
            Exempt items raise the tax rate (Progressionsvorbehalt) without being taxed in Switzerland.
          </p>
          <div className="num text-[13px] text-ivory">
            {tab === "income" ? `Total taxable income: ${fmtChf(totalIncome)}` : `Net wealth: ${fmtChf(grossAssets - debts)}`}
          </div>
        </div>
      </div>

      <div className={`panel mt-8 flex flex-wrap items-center justify-between gap-4 p-6 ${s.incomeConfirmed ? "border-ok/30" : "glow-gold border-gold/35"}`}>
        <div className="flex items-center gap-4">
          <span className={`grid h-11 w-11 place-items-center rounded-full ${s.incomeConfirmed ? "bg-ok/[0.1]" : "bg-gold/[0.1]"}`}>
            <Check className={`h-5 w-5 ${s.incomeConfirmed ? "text-ok" : "text-gold"}`} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ivory">
              {s.incomeConfirmed ? "Ledger confirmed" : "Confirm the consolidated ledger"}
            </p>
            <p className="max-w-xl text-[12px] leading-relaxed text-mist">
              {s.incomeConfirmed
                ? "All income and asset positions feed the calculation exactly as listed."
                : "Check that no income source or account is missing. Add anything the documents could not reveal."}
            </p>
          </div>
        </div>
        {s.incomeConfirmed ? (
          <button onClick={() => router.push("/dashboard/securities")} className="btn-gold px-6 py-3 text-sm">
            Continue to securities <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={s.confirmIncome} className="btn-gold px-6 py-3 text-sm">
            <Check className="h-4 w-4" /> Confirm ledger
          </button>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <AddModal
            kind={modal}
            onClose={() => setModal(null)}
            onAddIncome={(i) => { s.addExtraIncome(i); setModal(null); }}
            onAddAsset={(a) => { s.addExtraAsset(a); setModal(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddModal({
  kind, onClose, onAddIncome, onAddAsset,
}: {
  kind: "income" | "asset";
  onClose: () => void;
  onAddIncome: (i: IncomeItem) => void;
  onAddAsset: (a: AssetItem) => void;
}) {
  const [label, setLabel] = useState("");
  const [payer, setPayer] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState(kind === "income" ? "other" : "bank");
  const [isDebt, setIsDebt] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount.replace(/['\s]/g, "")) || 0;
    if (kind === "income") {
      onAddIncome({ id: genId(), kind: type as IncomeItem["kind"], label: label || "Additional income", payer: payer || "—", amount: n, person: "primary", source: "Manually added", auto: false });
    } else {
      onAddAsset({ id: genId(), kind: (isDebt ? "debt" : type) as AssetItem["kind"], label: label || "Additional asset", institution: payer || "—", amount: isDebt ? -Math.abs(n) : n, source: "Manually added", auto: false });
    }
  };

  const incomeTypes = ["salary", "bonus", "benefit", "ahv_iv", "pension", "unemployment", "interest", "dividend", "rental", "foreign", "other"];
  const assetTypes = ["bank", "savings", "securities", "crypto", "real_estate", "foreign_asset"];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-5 backdrop-blur-sm" onClick={onClose}>
      <motion.form initial={{ scale: 0.95, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 14 }}
        onClick={(e) => e.stopPropagation()} onSubmit={submit} className="panel w-full max-w-md p-7">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-2xl font-semibold text-ivory">Add {kind === "income" ? "income" : "asset"}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-faint hover:text-ivory"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-3">
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
            {(kind === "income" ? incomeTypes : assetTypes).map((t) => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </select>
          <input className="field" placeholder="Description" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input className="field" placeholder={kind === "income" ? "Payer" : "Institution"} value={payer} onChange={(e) => setPayer(e.target.value)} />
          <input className="field num" inputMode="decimal" placeholder="Amount in CHF" value={amount} onChange={(e) => setAmount(e.target.value)} />
          {kind === "asset" && (
            <button type="button" onClick={() => setIsDebt(!isDebt)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-[13px] transition-colors ${isDebt ? "border-alert/40 bg-alert/[0.06] text-alert" : "border-line-2 text-ivory-dim"}`}>
              This is a debt (reduces taxable wealth)
              <span className="num text-[10.5px]">{isDebt ? "ON" : "OFF"}</span>
            </button>
          )}
          <button type="submit" className="btn-gold mt-1 w-full px-5 py-3 text-sm"><Plus className="h-4 w-4" /> Add to ledger</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
