import { OpsContext } from "@cartographer/core";
import { loadFixtureBundle } from "@cartographer/data";

let ops: OpsContext | null = null;

export function getOps(): OpsContext {
  if (!ops) {
    ops = new OpsContext(loadFixtureBundle());
  }
  return ops;
}
