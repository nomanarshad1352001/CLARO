import { Quote } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/ui";
import { TESTIMONIALS } from "@/lib/tax-data";

export default function Testimonials() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionHeading
        kicker="In their words"
        title={
          <>
            Trusted across the <span className="display-italic gold-text">confederation</span>
          </>
        }
      />
      <div className="mt-16 grid gap-5 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i} className="h-full">
            <figure className="panel panel-hover flex h-full flex-col p-8">
              <Quote className="h-5 w-5 text-gold/60" />
              <blockquote className="mt-4 flex-1 text-[14px] leading-relaxed text-ivory-dim">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3.5 border-t border-line pt-5">
                <img
                  src={t.img}
                  alt={t.name}
                  loading="lazy"
                  className="h-11 w-11 rounded-full border border-gold/30 object-cover"
                />
                <div>
                  <div className="text-sm font-semibold text-ivory">{t.name}</div>
                  <div className="font-mono text-[10px] tracking-widest text-faint uppercase">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
