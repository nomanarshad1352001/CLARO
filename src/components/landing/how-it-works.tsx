import { Reveal, SectionHeading } from "@/components/ui";
import {
  ArrowRight,
  BotMessageSquare,
  Calculator,
  FileSearch,
  FolderUp,
  Layers,
  Send,
} from "lucide-react";

const PHASES = [
  {
    icon: FolderUp,
    no: "01",
    title: "Upload everything",
    body: "Drag in salary certificates, bank tax statements, 3a certificates, premium statements, depot reports — PDFs, scans and photos alike. The vault accepts them all at once.",
    detail: "OCR · vision models · eSteuerauszug parser",
  },
  {
    icon: FileSearch,
    no: "02",
    title: "AI reads & classifies",
    body: "PDF, JPG, PNG or scanned paper — salary certificates, assessments, pensions (BVG & 3a), AHV/IV records, bank, broker, mortgage, insurance, medical, donations, education, childcare, real estate, debts, foreign income and crypto reports are recognised by type, issuer and person.",
    detail: "19 Swiss document families · identity OCR",
  },
  {
    icon: Layers,
    no: "03",
    title: "Personal data automation",
    body: "Name, date of birth, AHV, address, civil status, children, employer, canton — merged from every official document you own. Contradictions are flagged and confirmed by you, never guessed.",
    detail: "13 identity fields · source-cited",
  },
  {
    icon: BotMessageSquare,
    no: "04",
    title: "Only the gaps are asked",
    body: "Church affiliation, commuting, elections — the assistant asks precisely the questions your documents cannot answer. Everything found stays silently applied.",
    detail: "Median: 3–7 questions",
  },
  {
    icon: Calculator,
    no: "05",
    title: "Deterministic calculation",
    body: "An LLM never touches your numbers. A versioned rules registry (federal → canton → municipality → tax year) applies the DBG tariff, your exact multipliers, wealth tax and exemption-with-progression — reproducible to the rappen.",
    detail: "Versioned rules · federal → canton → commune → year",
  },
  {
    icon: Send,
    no: "06",
    title: "Filed in one click",
    body: "You review, confirm responsibility and submit. Where the canton offers an interface we transmit electronically; otherwise you get the signed official export.",
    detail: "10 cantons live e-filing · 16 official export",
  },
];

export default function HowItWorks() {
  return (
    <section id="workflow" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionHeading
        kicker="The complete workflow"
        title={
          <>
            From shoebox to <span className="display-italic gold-text">filed</span>, end to end
          </>
        }
        sub="Not a chatbot wrapper — a structured pipeline that implements the entire Swiss declaration workflow, with you in control at exactly two moments: review and submit."
      />
      <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {PHASES.map((p, i) => (
          <Reveal key={p.no} delay={i % 3} className="h-full">
            <div className="panel panel-hover group relative h-full overflow-hidden p-7">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-[64px] bg-gradient-to-bl from-gold/[0.07] to-transparent" />
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/25 bg-gold/[0.07]">
                  <p.icon className="h-5 w-5 text-gold" />
                </div>
                <span className="num text-[13px] text-faint">{p.no}</span>
              </div>
              <h3 className="font-display mt-5 text-[22px] font-normal text-ivory">{p.title}</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-mist">{p.body}</p>
              <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                <ArrowRight className="h-3 w-3 text-gold/70 transition-transform group-hover:translate-x-1" />
                <span className="font-mono text-[10px] tracking-[0.18em] text-faint uppercase">{p.detail}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
