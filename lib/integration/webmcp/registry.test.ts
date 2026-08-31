import assert from "node:assert/strict";
import { test } from "node:test";
import { clearLocalTools, getLocalTool, getLocalTools, setLocalTool } from "./registry";
import type { RegisteredTool } from "./types";

function tool(name: string): RegisteredTool {
  return {
    name,
    description: `${name} fixture`,
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    execute: async () => ({ ok: true }),
  };
}

test("local WebMCP tools are isolated by application ID", () => {
  clearLocalTools("registry-app-a");
  clearLocalTools("registry-app-b");
  const appATool = tool("shared-name");
  const appBTool = tool("shared-name");

  setLocalTool(appATool, "registry-app-a");
  setLocalTool(appBTool, "registry-app-b");

  assert.equal(getLocalTool("shared-name", "registry-app-a"), appATool);
  assert.equal(getLocalTool("shared-name", "registry-app-b"), appBTool);
  assert.deepEqual(getLocalTools("registry-app-a").map((entry) => entry.name), ["shared-name"]);
  assert.deepEqual(getLocalTools("registry-app-b").map((entry) => entry.name), ["shared-name"]);

  clearLocalTools("registry-app-a");
  assert.equal(getLocalTool("shared-name", "registry-app-a"), undefined);
  assert.equal(getLocalTool("shared-name", "registry-app-b"), appBTool);
  clearLocalTools("registry-app-b");
});
