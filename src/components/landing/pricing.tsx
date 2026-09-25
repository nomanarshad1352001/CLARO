"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/ui";
import { PRICING } from "@/lib/tax-data";

export default function Pricing() {
  return (
    <section id="pricing" className="relative border-t border-line bg-ink-2/40 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          kicker="Pricing"
          title={
            <>
              One price per return. <span className="display-italic gold-text">No surprises.</span>
            </>
          }
          sub="A Zürich fiduciary charges CHF 400–900 per hour. CLARO completes the same work for a fraction — and you keep every rappen it finds."
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {PRICING.map((p, i) => (
            <Reveal key={p.id} delay={i} className="h-full">
              <div
                className={`panel relative flex h-full flex-col p-8 ${
                  p.highlight ? "glow-gold border-gold/40" : "panel-hover"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-gold-2 to-gold px-3.5 py-1 font-mono text-[9.5px] font-medium tracking-[0.2em] text-ink uppercase">
                    Most chosen
                  </span>
                )}
                <h3 className="font-display text-2xl font-normal text-ivory">{p.name}</h3>
                <p className="mt-1 text-[12.5px] text-faint">{p.tagline}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-light text-ivory">
                    <span className="align-top text-2xl text-gold">CHF</span> {p.price}
                  </span>
                  <span className="font-mono text-[10px] tracking-widest text-faint uppercase">/ return</span>
                </div>
                <div className="gold-line my-6" />
                <ul className="flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-ivory-dim">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-8 w-full px-5 py-3 text-center text-sm ${p.highlight ? "btn-gold" : "btn-ghost"}`}
                >
                  {p.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={2}>
          <p className="mx-auto mt-10 max-w-xl text-center text-[12px] leading-relaxed text-faint">
            Pay only when your return is ready to file. Free tier: upload, extraction, review and
            estimate are always free. 30-day money-back guarantee on every plan.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
