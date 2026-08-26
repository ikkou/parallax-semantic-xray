import { DEFAULT_APPLICATION_ID, getLocalTools } from "./registry";
import { getModelContext, type NativeDiscoveredTool, type RegisteredTool } from "./types";

export type ToolInventory = {
  nativeDiscoveredTools: NativeDiscoveredTool[];
  localRegisteredTools: RegisteredTool[];
  nativeDiscoveryAvailable: boolean;
};

export async function discoverNativeTools(): Promise<NativeDiscoveredTool[]> {
  const modelContext = getModelContext();
  const getTools = modelContext?.getTools;
  if (typeof getTools !== "function") return [];

  const tools = await getTools.call(modelContext);
  return tools.filter(
    (tool): tool is NativeDiscoveredTool =>
      typeof tool === "object" && tool !== null && "name" in tool,
  );
}

export async function getToolInventory(applicationId = DEFAULT_APPLICATION_ID): Promise<ToolInventory> {
  const modelContext = getModelContext();
  const nativeDiscoveryAvailable = typeof modelContext?.getTools === "function";

  return {
    nativeDiscoveredTools: nativeDiscoveryAvailable ? await discoverNativeTools() : [],
    localRegisteredTools: getLocalTools(applicationId),
    nativeDiscoveryAvailable,
  };
}
