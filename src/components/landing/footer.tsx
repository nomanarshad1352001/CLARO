import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Logo, Reveal } from "@/components/ui";
import { IMG_ZURICH_LAKE } from "@/lib/tax-data";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      {/* CTA band */}
      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <div className="panel relative overflow-hidden">
            <img src={IMG_ZURICH_LAKE} alt="Lake Zürich" className="absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
            <div className="relative flex flex-col items-start gap-8 p-10 sm:p-14 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <span className="kicker">Deadline 31 March</span>
                <h3 className="font-display mt-3 text-3xl leading-tight font-light text-ivory sm:text-4xl">
                  This year, your return is the
                  <span className="display-italic gold-text"> easy part</span>.
                </h3>
                <p className="mt-3 text-[13.5px] text-mist">
                  Upload tonight, file tomorrow. Free until you file — pay only when your return is ready.
                </p>
              </div>
              <Link href="/signup" className="btn-gold shrink-0 px-8 py-4 text-[15px]">
                Open my vault
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      {/* footer body */}
      <div className="border-t border-line bg-ink-2/60">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-[12.5px] leading-relaxed text-faint">
              CLARO Tax AG · Bahnhofstrasse 52, 8001 Zürich · AI-assisted Swiss tax declaration
              software with deterministic calculation.
            </p>
            <div className="mt-5 flex items-center gap-2 text-[11px] text-mist">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" />
              Hosted in Switzerland · ISO 27001 · GDPR / revFADP compliant
            </div>
          </div>
          {[
            {
              h: "Product",
              links: ["Workflow", "Capabilities", "Live estimator", "Pricing", "Security"],
              href: ["#workflow", "#features", "#estimator", "#pricing", "/security"],
            },
            {
              h: "Cantons",
              links: ["Zürich", "Bern", "Genève", "Zug", "Vaud"],
              href: ["#estimator", "#estimator", "#estimator", "#estimator", "#estimator"],
            },
            {
              h: "Account",
              links: ["Sign in", "Create account", "Support", "Status"],
              href: ["/login", "/signup", "#faq", "#"],
            },
          ].map((col) => (
            <div key={col.h}>
              <div className="font-mono text-[10px] tracking-[0.25em] text-faint uppercase">{col.h}</div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l, i) => (
                  <li key={l}>
                    <a href={col.href[i]} className="text-[13px] text-mist transition-colors hover:text-gold-2">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 sm:flex-row">
            <span className="font-mono text-[10px] tracking-widest text-faint uppercase">
              © 2026 CLARO Tax AG · Bahnhofstrasse 52 · CH-8001 Zürich
            </span>
            <span className="font-mono text-[10px] tracking-widest text-faint uppercase">
              Estimates are indicative — assessment by your tax office prevails
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
