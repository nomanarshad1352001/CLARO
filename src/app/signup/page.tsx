"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui";
import { useApp } from "@/lib/store";
import { IMG_ZURICH_LAKE } from "@/lib/tax-data";

const PERKS = [
  "Upload & AI extraction are free — pay only when you file",
  "All 26 cantons, tax years 2023–2025",
  "Deterministic calculation, never AI-guessed",
  "Delete your dossier forever at any time",
];

export default function SignupPage() {
  const router = useRouter();
  const login = useApp((s) => s.login);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      login(name || "New Client", email || "you@example.ch");
      router.push("/dashboard");
    }, 700);
  };

  return (
    <main className="flex min-h-screen">
      {/* form side */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-14">
        <div className="pointer-events-none absolute -top-32 left-0 h-80 w-80 rounded-full bg-pine/25 blur-[100px]" />
        <div className="w-full max-w-md">
          <Link href="/" aria-label="Back to landing">
            <Logo size="lg" />
          </Link>
          <h1 className="font-display mt-10 text-4xl font-light text-ivory">
            Open your <span className="display-italic gold-text">tax vault</span>
          </h1>
          <p className="mt-2 text-sm text-mist">Two minutes now saves you a weekend in March.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] tracking-[0.2em] text-faint uppercase">Full name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alexandre Keller"
                className="field"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] tracking-[0.2em] text-faint uppercase">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.ch"
                className="field"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] tracking-[0.2em] text-faint uppercase">Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Minimum 8 characters"
                className="field"
              />
            </label>
            <button type="submit" disabled={busy} className="btn-gold w-full px-5 py-3.5 text-sm disabled:opacity-60">
              {busy ? "Creating your vault…" : "Create account — it's free"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-faint">
            Already have a vault?{" "}
            <Link href="/login" className="font-semibold text-gold-2 hover:text-gold">
              Sign in
            </Link>
          </p>
          <p className="mt-8 flex items-center justify-center gap-2 text-[11px] text-faint">
            <ShieldCheck className="h-3.5 w-3.5 text-gold/70" />
            By continuing you accept the Terms & revFADP privacy notice.
          </p>
        </div>
      </div>

      {/* visual side */}
      <div className="relative hidden w-[46%] overflow-hidden lg:block">
        <img src={IMG_ZURICH_LAKE} alt="Zürich waterfront" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tl from-ink via-ink/60 to-ink/15" />
        <div className="absolute right-0 bottom-0 left-0 p-12">
          <div className="space-y-3.5">
            {PERKS.map((p) => (
              <div key={p} className="flex items-center gap-3 text-[13.5px] text-ivory-dim">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
