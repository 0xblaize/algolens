#!/usr/bin/env node
/**
 * scripts/circle-register-entity-secret.ts
 *
 * Generates a Circle Entity Secret, registers it with Circle API,
 * and saves the recovery file to the local /recovery folder.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   npx tsx scripts/circle-register-entity-secret.ts
 *
 * ── Prerequisites ────────────────────────────────────────────────────────────
 *   CIRCLE_API_KEY must be set in .env.local
 *
 * ── Security rules ───────────────────────────────────────────────────────────
 *   • CIRCLE_API_KEY is never logged
 *   • The recovery/ folder is git-ignored (see .gitignore)
 *   • Never run this script on a shared/CI machine without secure env handling
 *   • This is a ONE-TIME operation — re-running will rotate the entity secret
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { registerEntitySecretCiphertext } from "@circle-fin/developer-controlled-wallets";

// ── 1. Load .env.local (server-only secrets) ─────────────────────────────────
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

// ── 2. Validate environment ───────────────────────────────────────────────────
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;

if (!CIRCLE_API_KEY) {
  console.error("");
  console.error("  ❌  CIRCLE_API_KEY is not set in .env.local");
  console.error("      Add it and re-run this script.");
  console.error("");
  process.exit(1);
}

// ── 3. Prepare recovery folder ────────────────────────────────────────────────
const RECOVERY_DIR = path.resolve(process.cwd(), "recovery");
if (!fs.existsSync(RECOVERY_DIR)) {
  fs.mkdirSync(RECOVERY_DIR, { recursive: true });
}

// ── 4. Generate entity secret ─────────────────────────────────────────────────
//
// The SDK's generateEntitySecret() returns void and only prints to the console.
// We generate the secret ourselves so we can capture and use it in code.
//
// Format: 32 cryptographically random bytes encoded as a 64-char hex string.
const entitySecret: string = crypto.randomBytes(32).toString("hex");

// ── 5. Register with Circle ───────────────────────────────────────────────────
console.log("");
console.log("  ⏳  Registering entity secret ciphertext with Circle...");
console.log("");

let recoveryFileContent: string;

try {
  const response = await registerEntitySecretCiphertext({
    apiKey: CIRCLE_API_KEY,
    entitySecret,
  });

  if (!response.data?.recoveryFile) {
    console.error("  ❌  Circle API returned an empty recovery file.");
    console.error("      Full response:", JSON.stringify(response, null, 2));
    process.exit(1);
  }

  recoveryFileContent = response.data.recoveryFile;
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);

  // Scrub the API key from any error output
  const safeMessage = message.replace(CIRCLE_API_KEY, "CIRCLE_API_KEY_REDACTED");

  console.error("");
  console.error("  ❌  Failed to register entity secret with Circle:");
  console.error(`      ${safeMessage}`);
  console.error("");
  console.error("  Check that:");
  console.error("    • CIRCLE_API_KEY is correct and active");
  console.error("    • You have not already registered an entity secret for this key");
  console.error("      (registration is a one-time operation per API key)");
  console.error("");
  process.exit(1);
}

// ── 6. Save recovery file ─────────────────────────────────────────────────────
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const recoveryFileName = `entity-secret-recovery-${timestamp}.dat`;
const recoveryFilePath = path.join(RECOVERY_DIR, recoveryFileName);

fs.writeFileSync(recoveryFilePath, recoveryFileContent, "utf8");

// ── 7. Print results ──────────────────────────────────────────────────────────
console.log("  ✅  Entity secret registered successfully with Circle.");
console.log("");
console.log("  ──────────────────────────────────────────────────────────────");
console.log("  ⚠️   COPY THE VALUE BELOW AND SAVE IT NOW.");
console.log("       It will NOT be shown again.");
console.log("  ──────────────────────────────────────────────────────────────");
console.log("");
console.log("  Paste this into your .env.local:");
console.log("");
console.log(`  CIRCLE_ENTITY_SECRET=${entitySecret}`);
console.log("");
console.log("  ──────────────────────────────────────────────────────────────");
console.log("");
console.log("  Recovery file saved to:");
console.log(`  ${recoveryFilePath}`);
console.log("");
console.log("  ⚠️   Keep the recovery file safe. It is git-ignored.");
console.log("       You will need it if you ever need to re-register.");
console.log("");
console.log("  ──────────────────────────────────────────────────────────────");
console.log("  Next steps:");
console.log("  1. Copy the CIRCLE_ENTITY_SECRET value above into .env.local");
console.log("  2. Restart your dev server: npm run dev");
console.log("  3. The Create Agent flow will now use Circle Wallets");
console.log("  ──────────────────────────────────────────────────────────────");
console.log("");
