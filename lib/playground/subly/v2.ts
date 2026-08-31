import type { EvidenceRecorder, ExecutionEvidence } from "../../core/evidence";
import { normalizeV1Contract, normalizeV1Evidence } from "../../core/v2/normalize";
import type { DeveloperContractV2, ToolContractV2 } from "../../core/v2/contract";
import type { EvidenceBundleV2 } from "../../core/v2/evidence";
import { getSublyContract, getSublyPath, SUBLY_APPLICATION_ID, type DemoMode } from "./contract";
import { getSublyTools, type SublyToolDefinition } from "./tools";

function addEffectClaims(contract: DeveloperContractV2): DeveloperContractV2 {
  return {
    ...contract,
    agentSurface: {
      ...contract.agentSurface,
      tools: contract.agentSurface.tools.map((tool) => {
        const claims: ToolContractV2["effectClaims"] =
          tool.name === "recommended_upgrade" || tool.name === "purchase_plan"
            ? [
                { effect: "change_subscription", certainty: "guaranteed", phase: "terminal" },
                { effect: "charge_payment", certainty: "guaranteed", phase: "terminal" },
              ]
            : tool.name === "cancel_plan"
              ? [{ effect: "change_subscription", certainty: "guaranteed", phase: "terminal" }]
              : undefined;
        return claims === undefined ? tool : { ...tool, effectClaims: claims };
      }),
    },
  };
}

export function getSublyContractV2(mode: DemoMode): DeveloperContractV2 {
  return addEffectClaims(normalizeV1Contract(getSublyContract(mode)));
}

export function getSublyEvidenceV2(
  mode: DemoMode,
  entries: ExecutionEvidence[] = [],
  runId = `subly-${mode}-live-v2`,
): EvidenceBundleV2 {
  return normalizeV1Evidence(entries, {
    applicationId: SUBLY_APPLICATION_ID,
    runId,
    mode: "live-execution",
    completeness: entries.length > 0 ? "complete" : "unknown",
  });
}

export type SublyToolV2Definition = SublyToolDefinition & ToolContractV2;

export function getSublyToolsV2(
  mode: DemoMode,
  onEvidence?: EvidenceRecorder,
): SublyToolV2Definition[] {
  const contract = getSublyContractV2(mode);
  const runtimeTools = getSublyTools(mode, onEvidence);
  return runtimeTools.map((runtimeTool) => {
    const contractTool = contract.agentSurface.tools.find((tool) => tool.name === runtimeTool.name);
    return contractTool === undefined
      ? runtimeTool
      : { ...runtimeTool, ...contractTool, execute: runtimeTool.execute };
  });
}

export function getSublyV2Path(mode: DemoMode) {
  return getSublyPath(mode);
}
