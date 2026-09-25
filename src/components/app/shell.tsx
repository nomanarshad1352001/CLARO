"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  BadgeCheck,
  Calculator,
  Check,
  FolderUp,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  MessageSquareText,
  RotateCcw,
  ScanSearch,
  Send,
  TrendingUp,
  Wallet,
  Home,
} from "lucide-react";
import { Logo } from "@/components/ui";
import { useApp } from "@/lib/store";
import { STEPS, stepStatus, type Gates } from "@/lib/steps";
import { buildPersonalProfile, profileResolved } from "@/lib/personal-data";
import { useT, LangSwitch } from "@/lib/i18n";
import SecurityCenter from "@/components/app/security-center";

export const ICONS: Record<string, ReactNode> = {
  "map-pin": <MapPin className="h-4 w-4" />,
  folder: <FolderUp className="h-4 w-4" />,
  scan: <ScanSearch className="h-4 w-4" />,
  message: <MessageSquareText className="h-4 w-4" />,
  chart: <TrendingUp className="h-4 w-4" />,
  calc: <Calculator className="h-4 w-4" />,
  send: <Send className="h-4 w-4" />,
  wallet: <Wallet className="h-4 w-4" />,
  home: <Home className="h-4 w-4" />,
};

export function useGates(): Gates & { ready: boolean; loggedIn: boolean } {
  const s = useApp();
  const conflictsResolved =
    s.conflicts.every((c) => c.resolved !== undefined) &&
    profileResolved(buildPersonalProfile(s.docs), s.profileChoices);
  return {
    setupDone: !!s.setup,
    processed: s.processed,
    conflictsResolved,
    questionsDone: s.questionsDone,
    incomeDone: s.incomeConfirmed,
    securitiesDone: s.securitiesConfirmed,
    propertyDone: s.propertyConfirmed,
    calcDone: !!s.calc,
    filed: !!s.filing,
    ready: s.hydrated,
    loggedIn: !!s.session,
  };
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { t } = useT();
  const pathname = usePathname();
  const s = useApp();
  const gates = useGates();

  useEffect(() => {
    if (s.hydrated && !s.session) router.replace("/login");
  }, [s.hydrated, s.session, router]);

  if (!s.hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-faint uppercase">{t("shell.loading")}</span>
        </div>
      </div>
    );
  }
  if (!s.session) {
    router.replace("/login");
    return null;
  }

  const doneCount = STEPS.filter((st) => stepStatus(st.key, gates) === "done").length;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-ink">
      {/* ambient */}
      <div className="pointer-events-none fixed top-0 left-72 h-[420px] w-[720px] rounded-full bg-gold/[0.045] blur-[130px]" />
      <div className="pointer-events-none fixed right-0 bottom-0 h-[380px] w-[520px] rounded-full bg-pine/20 blur-[120px]" />

      {/* sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-line bg-ink-2/70 backdrop-blur-xl lg:flex">
        <div className="flex items-center justify-between px-6 py-6">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          {gates.filed && (
            <span className="flex items-center gap-1 rounded-full border border-ok/40 bg-ok/10 px-2.5 py-1 font-mono text-[9px] tracking-widest text-ok uppercase">
              <BadgeCheck className="h-3 w-3" /> {t("shell.filed")}
            </span>
          )}
        </div>
        <div className="mx-6 mb-5 rounded-xl border border-gold/25 bg-gold/[0.05] px-4 py-3">
          <div className="font-mono text-[9px] tracking-[0.22em] text-faint uppercase">{t("shell.taxyear")}</div>
          <div className="num mt-0.5 text-lg text-gold-2">{s.setup?.year ?? "—"}</div>
          <div className="mt-1 text-[11px] text-mist">
            {s.setup ? `${s.setup.municipality}, canton ${s.setup.canton}` : t("shell.noJurisdiction")}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          <NavItem
            href="/dashboard"
            active={pathname === "/dashboard"}
            icon={<LayoutDashboard className="h-4 w-4" />}
            title={t("nav.overview")}
            sub={t("ov.commandcentre")}
          />
          <div className="px-3 pt-4 pb-2 font-mono text-[9px] tracking-[0.28em] text-faint uppercase">
            {t("nav.workflow")}
          </div>
          {STEPS.map((st) => {
            const status = stepStatus(st.key, gates);
            const active = pathname.startsWith(st.href);
            return (
              <NavItem
                key={st.key}
                href={st.href}
                active={active}
                locked={status === "locked"}
                icon={
                  status === "done" ? (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-gold/15">
                      <Check className="h-3 w-3 text-gold" />
                    </span>
                  ) : status === "locked" ? (
                    <Lock className="h-3.5 w-3.5 text-faint" />
                  ) : (
                    <span className="text-gold">{ICONS[st.icon]}</span>
                  )
                }
                title={t(`step.${st.key}.t`)}
                sub={t(`step.${st.key}.s`)}
                num={st.num}
              />
            );
          })}
        </nav>

        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/30 bg-gold/10 font-mono text-[11px] text-gold-2">
              {s.session.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-ivory">{s.session.name}</div>
              <div className="truncate text-[10.5px] text-faint">{s.session.email}</div>
            </div>
          </div>
          <SecurityCenter />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                s.resetAll();
                router.push("/dashboard/setup");
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line-2 py-2 text-[11px] text-mist transition-colors hover:border-gold/40 hover:text-ivory"
            >
              <RotateCcw className="h-3 w-3" /> {t("shell.reset")}
            </button>
            <button
              onClick={() => {
                s.logout();
                router.push("/");
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line-2 py-2 text-[11px] text-mist transition-colors hover:border-alert/50 hover:text-alert"
            >
              <LogOut className="h-3 w-3" /> {t("shell.signout")}
            </button>
          </div>
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => {
              s.logout();
              router.push("/");
            }}
            className="text-mist"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 pb-4">
          <Link
            href="/dashboard"
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] ${pathname === "/dashboard" ? "border-gold/50 text-gold-2" : "border-line-2 text-mist"}`}
          >
            Overview
          </Link>
          {STEPS.map((st) => {
            const status = stepStatus(st.key, gates);
            return (
              <Link
                key={st.key}
                href={st.href}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] ${
                  pathname.startsWith(st.href)
                    ? "border-gold/50 text-gold-2"
                    : status === "locked"
                      ? "border-line text-faint"
                      : "border-line-2 text-mist"
                }`}
              >
                {st.num} · {t(`step.${st.key}.t`)}
              </Link>
            );
          })}
        </div>
      </div>

      {/* content */}
      <div className="relative lg:pl-72">
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-line bg-ink/80 px-10 py-4 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] text-faint uppercase">
            <span>CLARO Vault</span>
            <span className="text-gold/60">·</span>
            <span className="text-mist">{s.session.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <LangSwitch compact />
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-panel-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="num text-[11px] text-mist">
              {doneCount}/{STEPS.length} · {pct}%
            </span>
          </div>
        </header>
        <main className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  active,
  locked,
  icon,
  title,
  sub,
  num,
}: {
  href: string;
  active: boolean;
  locked?: boolean;
  icon: ReactNode;
  title: string;
  sub: string;
  num?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors ${
        active
          ? "border border-gold/30 bg-gold/[0.08]"
          : locked
            ? "border border-transparent opacity-45 hover:opacity-70"
            : "border border-transparent hover:bg-white/[0.04]"
      }`}
    >
      <span className="grid w-6 place-items-center">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[13px] font-semibold ${active ? "text-gold-2" : "text-ivory-dim"}`}>
          {title}
        </span>
        <span className="block truncate text-[10.5px] text-faint">{sub}</span>
      </span>
      {num && <span className="num text-[10px] text-faint">{num}</span>}
    </Link>
  );
}

export function PageHead({
  kicker,
  title,
  sub,
  actions,
}: {
  kicker: string;
  title: ReactNode;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="kicker">{kicker}</span>
        <h1 className="font-display mt-2 text-3xl font-light text-ivory sm:text-4xl">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-mist">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function LockedState({
  step,
  message,
  ctaHref,
  ctaLabel,
}: {
  step: string;
  message: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="panel mx-auto mt-16 max-w-lg p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/25 bg-gold/[0.06]">
        <Lock className="h-5 w-5 text-gold" />
      </div>
      <h2 className="font-display mt-5 text-2xl font-light text-ivory">Complete “{step}” first</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-mist">{message}</p>
      <Link href={ctaHref} className="btn-gold mt-6 px-6 py-3 text-sm">
        {ctaLabel}
      </Link>
    </div>
  );
}
