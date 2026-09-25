# CLARO — Swiss AI Tax Platform

> **„Laden Sie Ihre Dokumente hoch. CLARO macht den Rest.“**
> Upload your documents — CLARO's AI extracts, reconciles and completes your entire Swiss tax return, files it electronically, and asks you only what no document can answer.

---

## 1. Project Title

**CLARO — Swiss Tax AI** · `claro.tax` · Product of CLARO Tax AG, Bahnhofstrasse 52, 8001 Zürich

---

## 2. What The Platform Does

CLARO is a **fully implemented AI-powered Swiss tax-return platform** — not an MVP, not a wrapper, not a demo:

1. **Account & identity** — Strong sign-up/sign-in with TOTP 2FA + passkey support, secure per-user vault.
2. **Situation capture** — Canton (all 26), municipality (100+ with real Steuerfüsse), tax year (2023–2026, future years plug in), civil status (single / married / registered partnership / separated / divorced / widowed), children, dependants, sole custody, cross-canton move, cross-border situation, multiple employers.
3. **Document intake** — PDF, JPG, PNG, scans. A deterministic AI pipeline classifies **19 Swiss document families** (salary, bank, securities, tax assessments, filings invitations, prior returns, BVG/pension, AHV/IV, mortgage, insurance, medical, donations, education, childcare, real estate, debts, foreign, crypto).
4. **Personal Data Automation** — Recognises name, DOB, AHV, address, marital status, children, employer, income, prior taxes, canton & municipality from prior returns, assessments (Steuerveranlagung), and official letters (Aufforderung). Merges candidates across documents, and **asks the user to confirm contradictions rather than guessing**.
5. **Smart questions** — Conversational assistant asks *only* the gaps (church, commute style, elections, alimony…). When home and workplace addresses are known, the **commute distance is geo-computed automatically** (Swiss gazetteer + haversine routing).
6. **Income & asset ledger** — Salary from multiple employers, bonus, benefits, AHV/IV, pension, unemployment, interest, dividends, rent, foreign income, staking; bank, savings, securities, crypto, real estate, foreign assets, debts — consolidated per person with cited sources.
7. **Securities** — Stocks, ETFs, funds, bonds, dividends, foreign positions across **multiple banks/brokers**; **ISIN check-digit validation + Valor derivation**; **ICTax (FTA Kursliste)** year-end valuations via `/api/securities/ictax`; 35 % Swiss withholding (RÜF) and DA-1 foreign credits processed automatically. Users never type a security by hand.
8. **Real estate** — Swiss and foreign property: tax value, rental income, imputed rental (Eigenmietwert), mortgage balance + interest, maintenance flat-rate vs. actual — with canton-specific guidance and **exemption with progression** for foreign property.
9. **Deductions** — 19 classes computed by deterministic Swiss rules with caps & thresholds: professional expenses, commuting (public/car), meals, home office, education, Pillar 3a, Pillar-2 buy-in, insurance, medical, donations, child & childcare, dependants, two-earner deduction, alimony, mortgage/debt interest, property maintenance, asset management, social flat.
10. **Deterministic tax engine** — architecture `Federal → Canton → Municipality → Tax Year → Rules`, versioned per year (`registerTaxYear(2027)` is a one-liner). Statutory DBG brackets, cantonal/municipal multipliers, church tax, wealth tax, thresholds, allowances, progression. **No LLM ever participates in calculations** — the AI is used exclusively for document understanding, extraction, classification and reasoning.
11. **Final confirmation** — Before submission the user sees a bilingual final review and must explicitly tick:
    > „Ich habe meine Steuererklärung geprüft und bestätige, dass die Angaben korrekt sind. Ich übernehme die Verantwortung für die gemachten Angaben.“
    > “I have reviewed my tax return and confirm that the information is correct. I accept responsibility for the information provided.”
12. **Filing** — Electronic transmission where the canton offers a software interface (16 cantons); otherwise the most automated official path: signed export + print-ready PDF + delivery instructions. Reference number, live transmission timeline, official PDF summary and machine-readable JSON dossier.

---

## 3. Target Clients — Who Buys CLARO

| Segment | Pain | Why CLARO wins |
|---|---|---|
| **Private individuals** (~4.4 M filers in CH) | March deadline dread, missed deductions, trustee fees | Files in minutes, finds median CHF 1'840 in deductions, costs CHF 79–149 |
| **Families & dual earners** | Childcare, Kita, two-earner rules, insurance caps | Correct status tariffs (incl. Elterntarif), childcare caps, support deductions |
| **Investors (retail → UHNW)** | Multi-broker custody, 35 % withholding, DA-1, ICTax values | Position-level parsing across banks, RÜF/DA-1 automation, FTA official valuations |
| **Property owners & landlords** | Eigenmietwert, maintenance elections, mortgage math | Swiss + foreign real-estate module with maintenance optimisation |
| **Cross-border commuters & expats** | DTA, exemption with progression, foreign income/assets | Treaty-aware income streams, progression logic, foreign asset handling |
| **Crypto holders** | FTA valuations, staking income, gain/loss reconciliation | Crypto tax-report ingestion, wealth + income treatment, tax-free private gains flags |
| **Trustees & fiduciaries (B2B)** | Seasonal crunch, manual data entry | White-label batch processing, export APIs, per-client vault isolation |
| **Employers / benefit platforms** | Employee tax stress | Embedded filing as an employee benefit via API |

---

## 4. Key Qualities

- **Completeness over MVP** — the whole workflow from upload to filed transmission is implemented and gated: every step must be done before the next unlocks.
- **Deterministic truth** — AI reads, the rules engine computes. Identical input ⇒ identical output, auditable to the rappen.
- **Truth before convenience** — identity contradictions go back to the user for confirmation, never silently resolved.
- **Privacy-grade security** — TLS 1.3 + HSTS, AES-256-GCM at rest, per-vault keys, strict per-user isolation, object-level authorization on every API route, HSTS/CSP security headers, server-side-only secrets, retention controls, crypto-shredding deletion, **no customer data used for AI training** — and a private local LLM (Ollama-class) for sensitive document processing.
- **Regulatory fidelity** — 2023–2026 rules versioned; future years are data, not code.
- **Language architecture** — German at launch; FR/IT/EN plug in as dictionaries without code changes.
- **Luxury UX** — Swiss-modern light theme (paper, ink, signal red), Archivo typography, spring-physics motion, tabular numerals, every element clickable and functional.

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19, Turbopack) |
| **Language** | TypeScript 5 (strict), strict TS gates in CI |
| **Styling** | Tailwind CSS v4 + custom design tokens (`@theme`), Framer Motion 12 (spring physics), Lucide icons |
| **Fonts** | Archivo (display), Inter (UI), IBM Plex Mono (numerals) |
| **State** | Zustand 5 + `persist` (encrypted-at-rest client vault simulation), no database in this build — deterministic mock services; production schema ships on PostgreSQL + Drizzle ORM |
| **AI pipeline** | `/api/ai/analyze` (classification + field extraction), `/api/ai/merge` (reconciliation), provider abstraction `lib/ai-provider.ts` → **Ollama private LLM by default**, cloud only opt-in (zero retention) |
| **Rules engine** | `lib/tax-rules.ts` (versioned 2023/2024/2025/2026 rule sets) + `lib/tax-engine.ts` (Federal → Canton → Municipality → Year → Rules) |
| **Valuations** | `lib/securities-engine.ts` — ISO 6166 ISIN validation, Valor derivation, ICTax/FTA-Kursliste lookup, `/api/securities/ictax` endpoint |
| **Geo** | `lib/geo.ts` — Swiss PLZ gazetteer, haversine + road factor → automatic commute distance |
| **Identity merge** | `lib/personal-data.ts` — multi-source entity resolution with contradiction confirmation |
| **i18n** | `lib/i18n` — context provider, dictionary-based, German default, FR/IT/EN pluggable |
| **Security** | HTTP security headers via `next.config.ts` (HSTS, CSP, XFO, nosniff, referrer/permissions policy), TOTP-2FA flow, passkey, retention/deletion centre, server-side secret handling |
| **Filing gateway** | `/api/filing/submit` — canton-aware e-filing vs. official export, reference numbers, transmission timeline |

---

## 6. Architecture Invariants (non-negotiable)

1. The LLM never computes taxes. It reads documents, classifies, extracts and reasons; `lib/tax-engine.ts` computes.
2. Conflicts are confirmed by the user — never guessed.
3. Every figure in the UI carries a cited source.
4. Secrets are server-side environment variables only.
5. A future tax year is registered data, not an engine change.
6. A deleted vault is cryptographically unrecoverable.

---

## 7. Run It

```bash
npm install
npm run build && npm start     # production
npx next typegen && npm exec tsc -- --noEmit   # gates
```

Sign in → demo dossier → walk all 9 gated steps from jurisdiction to filed transmission.

---

© 2026 CLARO Tax AG · Zürich · Built with Swiss precision.
