"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Fingerprint, KeyRound, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useT, LangSwitch } from "@/lib/i18n";
import { Logo } from "@/components/ui";
import { useApp } from "@/lib/store";
import { IMG_ALPS_REFLECTION } from "@/lib/tax-data";

export default function LoginPage() {
  const router = useRouter();
  const login = useApp((s) => s.login);
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<"creds" | "2fa">("creds");
  const [code, setCode] = useState("");

  const finish = () => {
    const name = email
      ? email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "A. Keller";
    setBusy(true);
    setTimeout(() => {
      login(name || "A. Keller", email || "demo@claro.tax");
      router.push("/dashboard");
    }, 500);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stage === "creds") {
      setBusy(true);
      setTimeout(() => { setBusy(false); setStage("2fa"); }, 550);
      return;
    }
    finish();
  };

  const demo = () => {
    setBusy(true);
    setTimeout(() => {
      login("Alexandre Keller", "alex.keller@bluewin.ch");
      router.push("/dashboard");
    }, 500);
  };

  return (
    <main className="flex min-h-screen">
      {/* visual side */}
      <div className="relative hidden w-[46%] overflow-hidden lg:block">
        <img src={IMG_ALPS_REFLECTION} alt="Swiss Alps reflecting in a lake" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-ink via-ink/55 to-ink/10" />
        <div className="absolute right-0 bottom-0 left-0 p-12">
          <p className="font-display text-3xl leading-snug font-light text-ivory">
            “The quietest hour of the year is the one where your taxes are
            <span className="display-italic gold-text"> already done</span>.”
          </p>
          <p className="mt-4 font-mono text-[10px] tracking-[0.25em] text-ivory-dim uppercase">
            48'231 households · filed 2024 with CLARO
          </p>
        </div>
      </div>

      {/* form side */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-14">
        <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-gold/[0.06] blur-[100px]" />
        <div className="w-full max-w-md">
          <Link href="/" aria-label="Back to landing">
            <Logo size="lg" />
          </Link>
          <h1 className="font-display mt-10 text-4xl font-light text-ivory">
            Welcome <span className="display-italic gold-text">back</span>
          </h1>
          <p className="mt-2 text-sm text-mist">Your vault is exactly where you left it.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
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
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••••"
                className="field"
              />
            </label>
            <button type="submit" disabled={busy} className="btn-gold w-full px-5 py-3.5 text-sm disabled:opacity-60">
              {busy ? "Opening your vault…" : "Sign in"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <button onClick={demo} className="btn-ghost mt-3 w-full px-5 py-3.5 text-sm">
            <Fingerprint className="h-4 w-4 text-gold" />
            Continue instantly with the demo dossier
          </button>

          <p className="mt-6 text-center text-[13px] text-faint">
            New to CLARO?{" "}
            <Link href="/signup" className="font-semibold text-gold-2 hover:text-gold">
              Create an account
            </Link>
          </p>
          <p className="mt-8 flex items-center justify-center gap-2 text-[11px] text-faint">
            <ShieldCheck className="h-3.5 w-3.5 text-gold/70" />
            Demo environment — no real credentials required, nothing leaves your browser. · TLS 1.3 · server-side secrets only
          </p>
        </div>
      </div>
    </main>
  );
}
