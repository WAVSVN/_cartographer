export const TOOL_SCHEMAS = [
  { name: "get_deployment", description: "Fetch a single deployment record by ID.", parameters: { type: "object", properties: { deployment_id: { type: "string" } }, required: ["deployment_id"] } },
  { name: "list_exceptions", description: "List deployments with open exceptions or watch status.", parameters: { type: "object", properties: {} } },
  { name: "get_contract_terms", description: "Return SLA and bridge-to-permanent terms for a customer.", parameters: { type: "object", properties: { customer_id: { type: "string" } }, required: ["customer_id"] } },
  { name: "get_runbook_snippet", description: "Return runbook steps for an exception code.", parameters: { type: "object", properties: { exception_code: { type: "string" } }, required: ["exception_code"] } },
  { name: "get_fleet_summary", description: "MW contracted/available/gap by type, GFA tranche, and basin.", parameters: { type: "object", properties: {} } },
  { name: "get_pipeline", description: "Bridge-to-permanent pipeline with deadlines and risk flags.", parameters: { type: "object", properties: {} } },
  { name: "run_scenario", description: "Model interconnection slip in weeks for a deployment.", parameters: { type: "object", properties: { deployment_id: { type: "string" }, slip_weeks: { type: "number" } }, required: ["deployment_id", "slip_weeks"] } },
] as const;
