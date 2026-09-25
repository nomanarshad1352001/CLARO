"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileCheck2, Landmark, ShieldCheck, Sparkles } from "lucide-react";
import { HERO_IMG_MATTERHORN } from "@/lib/tax-data";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  return (
    <section className="tick-grid relative overflow-hidden pt-16">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-gold/[0.07] blur-[120px]" />
      <div className="pointer-events-none absolute top-40 -left-40 h-[420px] w-[420px] rounded-full bg-pine/25 blur-[110px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pt-16 pb-20 lg:grid-cols-[1.15fr_0.85fr] lg:pt-24">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-gold/[0.06] px-4 py-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span className="font-mono text-[10.5px] tracking-[0.24em] text-gold uppercase">
              Tax year 2025 now open · All 26 cantons
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.08, ease }}
            className="font-display text-[13vw] leading-[1.02] font-light tracking-tight text-ivory sm:text-6xl lg:text-[4.6rem]"
          >
            Your Swiss tax return,
            <br />
            <span className="display-italic gold-text">completed</span> while you
            <br />
            pour the coffee.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.18, ease }}
            className="mt-7 max-w-xl text-[15.5px] leading-relaxed text-mist"
          >
            Upload everything — including last year's return, your assessment and the official
            invitation. CLARO recognises <em className="font-semibold text-ivory not-italic">who you are</em> automatically:
            name, address, AHV, family, employer, prior taxes. It merges every source, surfaces
            contradictions instead of guessing, and files the return — asking only what no document
            can answer.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.28, ease }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link href="/signup" className="btn-gold px-7 py-3.5 text-[15px]">
              Begin tax year 2025
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#workflow" className="btn-ghost px-6 py-3.5 text-[15px]">
              See the 5-minute flow
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-line border-y border-line py-5"
          >
            {[
              { icon: FileCheck2, stat: "96.4%", label: "of returns filed untouched by human hands" },
              { icon: Landmark, stat: "26 / 26", label: "cantons & 2'100+ municipalities covered" },
              { icon: ShieldCheck, stat: "5.7 min", label: "median time from upload to filed" },
            ].map((s) => (
              <div key={s.stat} className="px-4 first:pl-0">
                <s.icon className="mb-2 h-4 w-4 text-gold/80" />
                <div className="num text-lg text-ivory">{s.stat}</div>
                <div className="mt-1 text-[10.5px] leading-snug tracking-wide text-faint uppercase">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* right visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.25, ease }}
          className="relative hidden lg:block"
        >
          <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-gold/15 via-transparent to-pine/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-line-2">
            <img
              src={HERO_IMG_MATTERHORN}
              alt="Matterhorn at sunrise, Zermatt"
              className="h-[520px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />

            {/* floating AI card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.9, ease }}
              className="absolute right-5 bottom-5 left-5"
            >
              <div className="panel relative overflow-hidden p-5 backdrop-blur-md">
                <div className="scanline absolute right-0 left-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="kicker">Live extraction</span>
                  <span className="num rounded-full bg-ok/10 px-2 py-0.5 text-[10px] text-ok">98.7% confidence</span>
                </div>
                <div className="mt-3 space-y-2.5 font-mono text-[11.5px]">
                  <Row label="Lohnausweis_2025.pdf" val="Gross salary · CHF 118'400" done />
                  <Row label="UBS_eSteuerauszug.pdf" val="8 positions · DA-1 flagged" done />
                  <Row label="Säule_3a_VIAC.pdf" val="CHF 7'056 · max reached" done />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[10.5px] tracking-wider text-faint uppercase">Remaining questions</span>
                  <span className="num text-sm text-gold">3 of 31 fields</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Row({ label, val, done }: { label: string; val: string; done?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="truncate text-ivory-dim">{label}</span>
      <span className={`shrink-0 ${done ? "text-gold-2" : "text-mist"}`}>{val}</span>
    </div>
  );
}
