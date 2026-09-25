import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Database,
  Cpu,
  Globe2,
  Trash2,
  BadgeCheck,
  ArrowRight,
  ServerCog,
  FileKey2,
  Fingerprint,
} from "lucide-react";
import { Logo, SectionHeading, Reveal } from "@/components/ui";
import Footer from "@/components/landing/footer";

const PILLARS = [
  {
    icon: KeyRound,
    title: "Strong authentication",
    de: "Starke Authentisierung",
    items: [
      "Mandatory TOTP two-factor authentication for every account",
      "Passkeys (WebAuthn) with device-bound credentials — phishing-resistant",
      "Session tokens are short-lived, device-bound and revocable per device",
      "Progressive rate-limiting & anomaly detection on sign-in",
    ],
  },
  {
    icon: Lock,
    title: "Encryption everywhere",
    de: "Verschlüsselung ohne Ausnahme",
    items: [
      "TLS 1.3 + HSTS on every connection; no downgrade paths",
      "AES-256-GCM at rest with per-vault keys and envelope encryption",
      "Key management in FIPS-validated HSMs; keys never stored alongside data",
      "Documents rendered in memory only — no unencrypted temp files",
    ],
  },
  {
    icon: Database,
    title: "Strict data separation",
    de: "Strikte Mandantentrennung",
    items: [
      "Per-customer data isolation: one vault, one key hierarchy, one ACL scope",
      "Row-level security policies enforce ownership on every query",
      "Authorization middleware on every API route — object-level checks, not just roles",
      "Security headers (CSP, XFO, nosniff, referrer-policy) on every response",
    ],
  },
  {
    icon: Cpu,
    title: "Private document AI",
    de: "Private Dokumenten-KI",
    items: [
      "Sensitive document understanding runs on a locally hosted private LLM (Ollama-class) inside our Swiss tenancy",
      "Customer data is NEVER used to train models — contractually and technically enforced",
      "Cloud models only on explicit customer opt-in, zero-retention endpoints",
      "Deterministic rules engine for all tax math — AI never computes taxes",
    ],
  },
  {
    icon: Globe2,
    title: "Swiss / EU infrastructure",
    de: "Schweizer & EU-Infrastruktur",
    items: [
      "Primary processing and storage in ISO 27001-certified Swiss data centres",
      "revFADP & GDPR compliance by design; EU region as documented fallback only",
      "No US jurisdiction exposure for document payloads",
      "Independent penetration tests twice a year, results summarised to customers",
    ],
  },
  {
    icon: Trash2,
    title: "Deletion & retention",
    de: "Löschung & Aufbewahrung",
    items: [
      "You choose retention: 30 / 90 / 365 days after filing, or manual-only",
      "One-click complete dossier deletion — immediate, irrevocable, logged",
      "Cryptographic shredding: deletion destroys the vault keys, not just references",
      "Automatic purge jobs with verifiable deletion receipts",
    ],
  },
];

export default function SecurityPage() {
  return (
    <main className="relative min-h-screen">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/"><Logo /></Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ivory-dim hover:text-ivory sm:block">
              Anmelden · Sign in
            </Link>
            <Link href="/signup" className="btn-gold px-4 py-2 text-sm">
              Vault eröffnen <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="tick-grid relative pt-40 pb-20">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-gold/[0.05] blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <span className="kicker">Sicherheit & Datenschutz · Security by design</span>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="font-display mt-6 text-5xl font-semibold leading-[1.02] tracking-tight text-ivory sm:text-6xl">
              Ihre sensibelsten Daten.
              <br />
              Unser <span className="display-italic gold-text">heiligstes Gebot.</span>
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-mist">
              CLARO processes salary, identity, account and health-adjacent data. The platform is
              built so that no one — not us, not our vendors, and certainly no AI model provider —
              can read what belongs to you. Security is not a page here; it is the architecture.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="mx-auto mt-9 flex max-w-2xl flex-wrap items-center justify-center gap-2.5">
              {["TLS 1.3 + HSTS", "AES-256-GCM", "ISO 27001 CH", "revFADP / GDPR", "Private LLM (Ollama)", "No training on data"].map((b) => (
                <span key={b} className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/[0.06] px-3.5 py-1.5 font-mono text-[9.5px] tracking-widest text-gold uppercase">
                  <BadgeCheck className="h-3 w-3" /> {b}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i % 3} className="h-full">
              <div className="panel panel-hover h-full p-7">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/25 bg-gold/[0.07]">
                  <p.icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="font-display mt-5 text-xl font-semibold text-ivory">{p.title}</h3>
                <div className="mt-0.5 text-[10.5px] font-mono tracking-widest text-faint uppercase">{p.de}</div>
                <ul className="mt-4 space-y-2.5">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-mist">
                      <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-gold/70" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14">
          <div className="panel relative overflow-hidden p-10">
            <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-gold/[0.06] blur-[80px]" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="flex items-center gap-2">
                  <ServerCog className="h-4 w-4 text-gold" />
                  <span className="kicker">How document bytes travel</span>
                </div>
                <h3 className="font-display mt-3 text-3xl font-semibold text-ivory">The vault pipeline, end to end</h3>
                <ol className="mt-5 space-y-3.5">
                  {[
                    "Upload arrives over TLS 1.3 and streams directly into encrypted object storage — never through an unencrypted relay.",
                    "Classification & extraction run inside our Swiss tenancy on a private LLM; raw documents never leave the perimeter.",
                    "Only structured, cited values reach your dossier view. Nothing is sent to model providers. Nothing trains any model.",
                    "Secrets and API keys live exclusively in server-side environment storage — the browser never sees them.",
                    "When you delete, the vault key is destroyed first (crypto-shredding), rendering every byte unrecoverable.",
                  ].map((x, i) => (
                    <li key={i} className="flex items-start gap-3.5 text-[13px] leading-relaxed text-mist">
                      <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/[0.07] text-[10px] text-gold">{i + 1}</span>
                      {x}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-gold/30 bg-gold/[0.05] p-6">
                  <FileKey2 className="h-5 w-5 text-gold" />
                  <p className="mt-3 text-[13px] font-semibold text-ivory">Your deletion, your receipt</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-mist">
                    Every deletion and every access to your dossier is written to an immutable audit
                    log you can export at any time.
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-panel-2 p-6">
                  <Fingerprint className="h-5 w-5 text-gold" />
                  <p className="mt-3 text-[13px] font-semibold text-ivory">Report a vulnerability</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-mist">
                    Responsible disclosure welcome at security@claro.tax — 24h first response,
                    recognised researchers acknowledged in our hall of fame.
                  </p>
                </div>
                <Link href="/signup" className="btn-gold w-full px-6 py-4 text-sm">
                  Erleben Sie Sicherheit selbst <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
