import { execSync } from "node:child_process";

function run(command: string) {
  execSync(command, { stdio: "inherit" });
}

export default async function globalSetup() {
  run(
    "npx wrangler d1 migrations apply travel-journal-e2e-db --local --config wrangler.e2e.toml"
  );
}
