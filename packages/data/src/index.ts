import {
  ContractsFileSchema,
  DeploymentsFileSchema,
  RunbooksFileSchema,
  type Contract,
  type Deployment,
  type Runbook,
} from "@cartographer/schemas";
import contractsJson from "../fixtures/contracts.json" with { type: "json" };
import deploymentsJson from "../fixtures/deployments.json" with { type: "json" };
import runbooksJson from "../fixtures/runbooks.json" with { type: "json" };

export function loadDeployments(): Deployment[] {
  return DeploymentsFileSchema.parse(deploymentsJson);
}

export function loadContracts(): Contract[] {
  return ContractsFileSchema.parse(contractsJson);
}

export function loadRunbooks(): Record<string, Runbook> {
  return RunbooksFileSchema.parse(runbooksJson);
}

export function loadFixtureBundle() {
  return {
    deployments: loadDeployments(),
    contracts: loadContracts(),
    runbooks: loadRunbooks(),
  };
}
