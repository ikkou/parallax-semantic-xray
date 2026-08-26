import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const exportDirectory = resolve(root, "out");
const distributionDirectory = resolve(root, "dist");
const clientDirectory = resolve(distributionDirectory, "client");
const serverDirectory = resolve(distributionDirectory, "server");

await rm(distributionDirectory, { recursive: true, force: true });
await mkdir(clientDirectory, { recursive: true });
await mkdir(serverDirectory, { recursive: true });
await cp(exportDirectory, clientDirectory, { recursive: true });

await writeFile(
  resolve(serverDirectory, "index.js"),
  `export default {\n  async fetch(request, env) {\n    if (env?.ASSETS?.fetch) return env.ASSETS.fetch(request);\n    return new Response("PARALLAX assets unavailable", { status: 503 });\n  },\n};\n`,
);
