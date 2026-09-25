import { CANTONS } from "@/lib/tax-data";
import { BadgeCheck } from "lucide-react";

export default function Marquee() {
  const items = [...CANTONS, ...CANTONS];
  return (
    <div className="relative border-y border-line bg-ink-2/60 py-5">
      <div className="mask-fade-x overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-10 pr-10">
          {items.map((c, i) => (
            <span key={`${c.code}-${i}`} className="flex items-center gap-2.5 whitespace-nowrap">
              <span className="font-mono text-[12px] tracking-[0.22em] text-ivory-dim uppercase">
                {c.name}
              </span>
              {c.eFiling ? (
                <span className="flex items-center gap-1 rounded-full border border-gold/25 bg-gold/[0.06] px-2 py-0.5 text-[9px] tracking-widest text-gold uppercase">
                  <BadgeCheck className="h-2.5 w-2.5" /> e-filing
                </span>
              ) : (
                <span className="rounded-full border border-line-2 px-2 py-0.5 text-[9px] tracking-widest text-faint uppercase">
                  export
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
