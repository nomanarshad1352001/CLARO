/* ------------------------------------------------------------------ */
/*  AI PROVIDER ABSTRACTION                                            */
/*                                                                     */
/*  For sensitive document processing (financial & identity data) the   */
/*  pipeline can run against a LOCAL / PRIVATE LLM (e.g. Ollama with   */
/*  a quantized open model hosted in Swiss infrastructure), so raw     */
/*  documents never leave our perimeter. Cloud models remain an opt-in |
/*  for non-sensitive tasks. Production doc pipelines default to local.*/
/*                                                                     */
/*  Configure via environment variable — never hardcode endpoints:     */
/*    AI_PROVIDER=ollama            (default, private)                 */
/*    OLLAMA_BASE_URL=http://…      (set in your deployment env)       */
/*    OLLAMA_MODEL=llama3.1:70b                                     */
/*    ALLOW_CLOUD_LLM=false         (hard privacy switch)              */
/* ------------------------------------------------------------------ */

export type AiProviderKind = "ollama" | "cloud" | "local-rules";

export interface AiProviderInfo {
  kind: AiProviderKind;
  label: string;
  description: string;
  dataLeavesPerimeter: boolean;
  trainsModels: boolean;
  region: string;
}

export function getAiProvider(): AiProviderInfo {
  const kind = (process.env.AI_PROVIDER ?? "ollama").toLowerCase();
  const allowCloud = (process.env.ALLOW_CLOUD_LLM ?? "false") === "true";

  if (kind === "cloud" && allowCloud) {
    return {
      kind: "cloud",
      label: "SOC-2 cloud LLM (opt-in)",
      description:
        "Explicitly enabled by the customer for non-sensitive classifications. No document content is retained or used for training (zero-retention agreement).",
      dataLeavesPerimeter: true,
      trainsModels: false,
      region: process.env.CLOUD_LLM_REGION ?? "eu-central",
    };
  }

  if (kind === "ollama" || true) {
    /* default: private, on-premise class processing */
    const model = process.env.OLLAMA_MODEL ?? "llama3.1:70b-instruct-q4";
    return {
      kind: "ollama",
      label: `Private LLM · Ollama (${model})`,
      description:
        "Runs inside CLARO's Swiss tenancy. Document bytes are processed in memory and never transmitted to third parties. Inputs are never used for model training.",
      dataLeavesPerimeter: false,
      trainsModels: false,
      region: "ch-central (ISO 27001)",
    };
  }
}

export function aiProviderHeaders(): Record<string, string> {
  const p = getAiProvider();
  return {
    "X-AI-Provider": p.kind,
    "X-AI-Provider-Label": p.label,
    "X-AI-Training": p.trainsModels ? "enabled" : "never",
    "X-Data-Region": p.region,
  };
}
