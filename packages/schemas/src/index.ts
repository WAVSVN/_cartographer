import { z } from "zod";

export const DeploymentStatusSchema = z.enum(["exception", "watch", "healthy"]);
export const DeploymentTypeSchema = z.enum(["bridge", "permanent"]);
export const SeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const DeploymentSchema = z.object({
  id: z.string().regex(/^(BRG|PRM)-\d{4}$/),
  name: z.string().min(1),
  type: DeploymentTypeSchema,
  status: DeploymentStatusSchema,
  customer_id: z.string(),
  site: z.string(),
  mw_contracted: z.number().nonnegative(),
  mw_available: z.number().nonnegative(),
  equipment: z.string(),
  gfa_tranche: z.string(),
  commissioning_deadline: z.string().nullable(),
  exception_code: z.string().nullable(),
  exception_summary: z.string().nullable(),
  tags: z.array(z.string()),
});

export const ContractSchema = z.object({
  customer_id: z.string(),
  customer: z.string(),
  term_years: z.number().int().positive(),
  uptime_sla_pct: z.number().min(90).max(100),
  bridge_to_permanent: z.boolean(),
  notes: z.string(),
});

export const RunbookSchema = z.object({
  title: z.string(),
  steps: z.array(z.string()).min(1),
});

export const CitationSchema = z.object({
  deployment_id: z.string().optional(),
  customer_id: z.string().optional(),
  exception_code: z.string().nullable().optional(),
  source: z.string().min(1),
});

export const BriefSchema = z.object({
  summary: z.string().min(1),
  severity: SeveritySchema,
  recommended_actions: z.array(z.string()),
  citations: z.array(CitationSchema).min(1),
});

export const ToolLogEntrySchema = z.object({
  tool: z.string(),
  args: z.record(z.unknown()),
  result: z.unknown(),
});

export const BriefMetaSchema = z.object({
  mode: z.enum(["planner", "llm", "llm_fallback"]),
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  llm_model: z.string().optional(),
});

export const BriefResponseSchema = z.object({
  brief: BriefSchema,
  validation: z.object({ ok: z.boolean(), errors: z.array(z.string()) }),
  tools: z.array(ToolLogEntrySchema),
  generated_at: z.string().datetime(),
  meta: BriefMetaSchema.optional(),
});

export const MwBucketSchema = z.object({
  contracted_mw: z.number(),
  available_mw: z.number(),
  gap_mw: z.number(),
  count: z.number().int(),
});

export const TrancheBucketSchema = MwBucketSchema.extend({
  stressed_count: z.number().int().nonnegative(),
});

export const FleetSummarySchema = z.object({
  total_contracted_mw: z.number(),
  total_available_mw: z.number(),
  total_gap_mw: z.number(),
  deployment_count: z.number().int(),
  by_type: z.object({
    bridge: MwBucketSchema,
    permanent: MwBucketSchema,
  }),
  by_tranche: z.record(TrancheBucketSchema),
  by_basin: z.record(MwBucketSchema),
});

export const RiskRankedDeploymentSchema = DeploymentSchema.extend({
  risk_score: z.number().min(0).max(100),
  mw_gap: z.number(),
  days_to_deadline: z.number().nullable(),
  sla_pct: z.number(),
});

export const PipelineItemSchema = z.object({
  deployment: DeploymentSchema,
  customer: z.string(),
  bridge_to_permanent: z.boolean(),
  days_to_deadline: z.number().nullable(),
  mw_gap: z.number(),
  risk_score: z.number(),
  flags: z.array(z.string()),
});

export const ScenarioResultSchema = z.object({
  deployment_id: z.string(),
  slip_weeks: z.number(),
  original_deadline: z.string().nullable(),
  adjusted_deadline: z.string().nullable(),
  sla_at_risk: z.boolean(),
  summary: z.string(),
  affected_mw: z.number(),
});

export const MorningDigestSchema = z.object({
  generated_at: z.string().datetime(),
  fleet: FleetSummarySchema,
  top_risks: z.array(RiskRankedDeploymentSchema),
  upcoming_deadlines: z.array(PipelineItemSchema),
  brief: BriefSchema,
});

export type Deployment = z.infer<typeof DeploymentSchema>;
export type Contract = z.infer<typeof ContractSchema>;
export type Runbook = z.infer<typeof RunbookSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type Brief = z.infer<typeof BriefSchema>;
export type BriefResponse = z.infer<typeof BriefResponseSchema>;
export type BriefMeta = z.infer<typeof BriefMetaSchema>;
export type ToolLogEntry = z.infer<typeof ToolLogEntrySchema>;
export type MwBucket = z.infer<typeof MwBucketSchema>;
export type FleetSummary = z.infer<typeof FleetSummarySchema>;
export type RiskRankedDeployment = z.infer<typeof RiskRankedDeploymentSchema>;
export type PipelineItem = z.infer<typeof PipelineItemSchema>;
export type ScenarioResult = z.infer<typeof ScenarioResultSchema>;
export type MorningDigest = z.infer<typeof MorningDigestSchema>;
export type Severity = z.infer<typeof SeveritySchema>;

export const DeploymentsFileSchema = z.array(DeploymentSchema);
export const ContractsFileSchema = z.array(ContractSchema);
export const RunbooksFileSchema = z.record(RunbookSchema);

export const BriefQuerySchema = z.object({
  query: z.string().min(1).max(2000),
  context: z
    .object({
      selected_deployment_id: z.string().optional(),
    })
    .optional(),
  mode: z.enum(["auto", "planner", "llm"]).optional(),
});
