"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-8 w-8";
  const text = size === "sm" ? "text-[17px]" : size === "lg" ? "text-[26px]" : "text-xl";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`${box} relative grid place-items-center rounded-[8px] bg-gradient-to-br from-[#e4392c] to-[#c22118] shadow-[0_6px_16px_-6px_rgba(217,46,37,0.55)]`}>
        <span className="absolute h-[55%] w-[16%] rounded-[2px] bg-white" />
        <span className="absolute h-[16%] w-[55%] rounded-[2px] bg-white" />
      </span>
      <span className={`${text} font-display font-bold tracking-[0.14em] text-ivory`}>
        CLARO
        <span className="ml-2 align-middle font-mono text-[9px] font-medium tracking-[0.28em] text-gold">SWISS TAX AI</span>
      </span>
    </span>
  );
}

const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

export function Reveal({
  children,
  delay = 0,
  className = "",
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={rise}
      custom={delay}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  kicker,
  title,
  sub,
  align = "center",
}: {
  kicker: string;
  title: ReactNode;
  sub?: string;
  align?: "center" | "left";
}) {
  const alignCls = align === "center" ? "mx-auto text-center items-center" : "text-left items-start";
  return (
    <div className={`flex max-w-2xl flex-col gap-4 ${alignCls}`}>
      <Reveal>
        <span className="kicker">{kicker}</span>
      </Reveal>
      <Reveal delay={1}>
        <h2 className="font-display text-4xl leading-[1.06] font-light text-ivory sm:text-5xl">{title}</h2>
      </Reveal>
      {sub && (
        <Reveal delay={2}>
          <p className="max-w-xl text-[15px] leading-relaxed text-mist">{sub}</p>
        </Reveal>
      )}
    </div>
  );
}

export function Chip({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "gold" | "ok" | "warn" }) {
  const tones: Record<string, string> = {
    default: "border-line-2 bg-white/[0.03] text-ivory-dim",
    gold: "border-gold/40 bg-gold/10 text-gold-2",
    ok: "border-ok/40 bg-ok/10 text-ok",
    warn: "border-alert/40 bg-alert/10 text-alert",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function RingProgress({ pct, size = 44, stroke = 3 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="ring-track" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#D92E25"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - Math.min(pct, 100) / 100) }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
