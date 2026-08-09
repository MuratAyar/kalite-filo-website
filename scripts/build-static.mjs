import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const allowedTargets = new Set(["production", "staging"]);
const target = process.argv[2];

if (!allowedTargets.has(target)) {
  throw new Error(
    `Build target must be one of: ${Array.from(allowedTargets).join(", ")}.`,
  );
}

const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const result = spawnSync(process.execPath, [nextCli, "build"], {
  env: {
    ...process.env,
    KALITE_FILO_DEPLOY_TARGET: target,
  },
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

if (result.status === 0) {
  const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
  for (const marker of ["images/.gitkeep", "fonts/.gitkeep"]) {
    rmSync(path.join(repositoryRoot, "out", marker), { force: true });
  }
}

process.exitCode = result.status ?? 1;
