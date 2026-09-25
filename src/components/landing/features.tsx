import { Reveal, SectionHeading } from "@/components/ui";
import { IMG_ZURICH } from "@/lib/tax-data";
import {
  AlertTriangle,
  Coins,
  FileText,
  Languages,
  Lock,
  LineChart as LineChartIcon,
} from "lucide-react";

export default function Features() {
  return (
    <section id="features" className="relative border-t border-line bg-ink-2/40 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          kicker="Capabilities"
          title={
            <>
              An office of experts, <span className="display-italic gold-text">distilled</span>
            </>
          }
          sub="Everything a fiduciary would do for you — document intake, reconciliation, deduction hunting, DA-1 credits, calculation and filing — compressed into one quiet, precise system."
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {/* large card */}
          <Reveal className="lg:col-span-2">
            <div className="panel panel-hover relative h-full overflow-hidden">
              <img src={IMG_ZURICH} alt="Zürich waterfront" className="h-56 w-full object-cover opacity-60" />
              <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-t from-panel to-transparent" />
              <div className="relative p-7 pt-2">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-ink/80 px-3 py-1">
                  <LineChartIcon className="h-3.5 w-3.5 text-gold" />
                  <span className="font-mono text-[10px] tracking-[0.2em] text-gold uppercase">Securities engine</span>
                </div>
                <h3 className="font-display text-2xl font-normal text-ivory">
                  Full custody processing, position by position
                </h3>
                <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed text-mist">
                  Dividends are grossed up, Swiss anticipatory tax (35%) is reclaimed, foreign
                  withholding travels through DA-1, year-end tax values feed the wealth tax —
                  automatically, from your bank's eSteuerauszug.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <div className="panel panel-hover h-full p-7">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/25 bg-gold/[0.07]">
                <AlertTriangle className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display mt-5 text-2xl font-normal text-ivory">Conflict radar</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-mist">
                Two documents disagree? The discrepancy is presented with both sources so you decide
                once — instead of explaining it to the tax office in six months.
              </p>
              <div className="mt-5 space-y-2 rounded-xl border border-line bg-ink-2/60 p-4 font-mono text-[11px]">
                <div className="flex justify-between"><span className="text-ivory-dim">AHV no. · Lohnausweis</span><span className="text-ivory">…9087.33</span></div>
                <div className="flex justify-between"><span className="text-ivory-dim">AHV no. · Säule 3a</span><span className="text-alert">…9087.38</span></div>
                <div className="border-t border-line pt-2 text-gold-2">Resolution requested → 1 tap</div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="panel panel-hover h-full p-7">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/25 bg-gold/[0.07]">
                <Coins className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display mt-5 text-2xl font-normal text-ivory">Every deduction, by the rules</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-mist">
                Nineteen deduction classes checked with Swiss caps &amp; thresholds applied —
                median recovered value CHF 1'840 per return.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {[
                  "Berufskosten",
                  "Fahrkosten",
                  "ÖV / Auto",
                  "Verpflegung",
                  "Homeoffice",
                  "Weiterbildung",
                  "Säule 3a",
                  "2. Säule Einkauf",
                  "Prämien",
                  "Krankheitskosten",
                  "Spenden",
                  "Kinder",
                  "Kinderbetreuung",
                  "Unterhalt",
                  "Schuldzinsen",
                  "Liegenschaftsunterhalt",
                ].map((c) => (
                  <span key={c} className="rounded-full border border-line bg-white/60 px-2.5 py-1 font-mono text-[9px] tracking-wider text-mist uppercase">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <div className="panel panel-hover h-full p-7">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/25 bg-gold/[0.07]">
                <Lock className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display mt-5 text-2xl font-normal text-ivory">Swiss-hosted privacy</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-mist">
                TLS 1.3 in transit, AES-256 at rest, ISO 27001 Swiss data centres, zero model training
                on your documents. Delete everything, forever, in one click.
              </p>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="panel panel-hover h-full p-7">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/25 bg-gold/[0.07]">
                <Languages className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display mt-5 text-2xl font-normal text-ivory">Four languages</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-mist">
                German, French, Italian and English documents are understood natively — from a Lugano
                conto corrente to a Genève attestation quittances.
              </p>
              <div className="mt-5 flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-faint uppercase">
                <FileText className="h-3.5 w-3.5 text-gold/70" /> DE · FR · IT · EN
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
