import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import "dotenv/config";
import {
  checkPrivatePlanningLoginLimit,
  clearPrivatePlanningLoginLimit,
  recordPrivatePlanningLoginFailure,
} from "../lib/private-planning-rate-limit";

const mode = process.argv[2];
const identity = process.argv[3] ?? `203.0.113.${Math.floor(Math.random() * 100)}`;
const target = process.argv[4] ?? `private-planning-rate-limit-test-${Date.now()}`;

function runWorker() {
  const result = spawnSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/private-planning-rate-limit-persistence.ts", "worker", identity, target], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  assert.equal(result.status, 0, `worker process should record a failed attempt: ${result.error?.message ?? ""}`);
}

async function main() {
  await clearPrivatePlanningLoginLimit(identity, { target });

  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      runWorker();
    }

    const beforeLockout = await checkPrivatePlanningLoginLimit(identity, { target });
    assert.equal(beforeLockout.allowed, true, "four durable failed attempts should not lock the IP yet");

    runWorker();

    const afterLockout = await checkPrivatePlanningLoginLimit(identity, { target });
    assert.equal(afterLockout.allowed, false, "fifth durable failed attempt should lock the IP");
    assert.ok(afterLockout.retryAfterSeconds > 0, "lockout should include a retry-after window");

    console.log("private planning durable rate-limit persistence checks passed");
  } finally {
    await clearPrivatePlanningLoginLimit(identity, { target });
  }
}

const runner = mode === "worker" ? () => recordPrivatePlanningLoginFailure(identity, { target }) : main;

runner()
  .then(() => {
    if (mode === "worker") {
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
