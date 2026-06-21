import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ContractsFileSchema,
  DeploymentsFileSchema,
  RunbooksFileSchema,
  type Contract,
  type Deployment,
  type Runbook,
} from "@cartographer/schemas";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

function loadJson(filename: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, filename), "utf-8"));
}

export function loadDeployments(): Deployment[] {
  return DeploymentsFileSchema.parse(loadJson("deployments.json"));
}

export function loadContracts(): Contract[] {
  return ContractsFileSchema.parse(loadJson("contracts.json"));
}

export function loadRunbooks(): Record<string, Runbook> {
  return RunbooksFileSchema.parse(loadJson("runbooks.json"));
}

export function loadFixtureBundle() {
  return {
    deployments: loadDeployments(),
    contracts: loadContracts(),
    runbooks: loadRunbooks(),
  };
}
