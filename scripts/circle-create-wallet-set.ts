#!/usr/bin/env node
/**
 * scripts/circle-create-wallet-set.ts
 *
 * Creates a Circle developer-controlled wallet set and one ARC-TESTNET wallet.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   npx tsx scripts/circle-create-wallet-set.ts
 *      — or —
 *   npm run circle:create-wallet-set
 *
 * ── Prerequisites ────────────────────────────────────────────────────────────
 *   CIRCLE_API_KEY       must be set in .env.local
 *   CIRCLE_ENTITY_SECRET must be set in .env.local
 *   (Run circle-register-entity-secret.ts first if you have not already done so)
 *
 * ── Security rules ───────────────────────────────────────────────────────────
 *   • CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are never logged
 *   • .env.local must not be committed (it is git-ignored)
 *   • Wallet set IDs and wallet addresses are safe to log (not secrets)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as crypto from "crypto";
import * as path from "path";
import * as dotenv from "dotenv";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

// ── 1. Load .env.local ────────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ── 2. Validate environment ───────────────────────────────────────────────────
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;

const missing: string[] = [];
if (!CIRCLE_API_KEY) missing.push("CIRCLE_API_KEY");
if (!CIRCLE_ENTITY_SECRET) missing.push("CIRCLE_ENTITY_SECRET");

if (missing.length > 0) {
  console.error("");
  console.error(`  ❌  Missing required env vars in .env.local:`);
  missing.forEach((k) => console.error(`      • ${k}`));
  console.error("");
  console.error("  Run scripts/circle-register-entity-secret.ts first if");
  console.error("  you have not yet registered your entity secret.");
  console.error("");
  process.exit(1);
}

// ── 3. Initialise Circle client ───────────────────────────────────────────────
const client = initiateDeveloperControlledWalletsClient({
  apiKey: CIRCLE_API_KEY!,
  entitySecret: CIRCLE_ENTITY_SECRET!,
});

console.log("");
console.log("  ⏳  Creating AgoraLens Agent Wallet Set...");

// ── 4. Create wallet set ──────────────────────────────────────────────────────
let walletSetId: string;

try {
  const walletSetRes = await client.createWalletSet({
    name: "AgoraLens Agent Wallet Set",
    idempotencyKey: crypto.randomUUID(),
  });

  const walletSet = walletSetRes.data?.walletSet;

  if (!walletSet?.id) {
    console.error("  ❌  Circle returned an empty wallet set response.");
    console.error("      Raw response:", JSON.stringify(walletSetRes, null, 2));
    process.exit(1);
  }

  walletSetId = walletSet.id;
  console.log("  ✅  Wallet set created.");
} catch (err: unknown) {
  const msg = scrub(err instanceof Error ? err.message : String(err));
  console.error("");
  console.error("  ❌  Failed to create wallet set:");
  console.error(`      ${msg}`);
  console.error("");
  process.exit(1);
}

// ── 5. Create one ARC-TESTNET wallet ─────────────────────────────────────────
console.log("  ⏳  Creating one ARC-TESTNET wallet...");

let walletId: string;
let walletAddress: string;

try {
  const walletsRes = await client.createWallets({
    walletSetId,
    blockchains: ["ARC-TESTNET"],
    count: 1,
    idempotencyKey: crypto.randomUUID(),
  });

  const wallet = walletsRes.data?.wallets?.[0];

  if (!wallet?.id || !wallet?.address) {
    console.error("  ❌  Circle returned an empty wallet response.");
    console.error("      Raw response:", JSON.stringify(walletsRes, null, 2));
    process.exit(1);
  }

  walletId = wallet.id;
  walletAddress = wallet.address;
  console.log("  ✅  Wallet created.");
} catch (err: unknown) {
  const msg = scrub(err instanceof Error ? err.message : String(err));
  console.error("");
  console.error("  ❌  Failed to create wallet:");
  console.error(`      ${msg}`);
  console.error("");
  process.exit(1);
}

// ── 6. Print results ──────────────────────────────────────────────────────────
console.log("");
console.log("  ──────────────────────────────────────────────────────────────");
console.log("  ✅  Done. Paste the following into your .env.local:");
console.log("  ──────────────────────────────────────────────────────────────");
console.log("");
console.log(`  CIRCLE_WALLET_SET_ID=${walletSetId}`);
console.log("");
console.log("  ──────────────────────────────────────────────────────────────");
console.log("  Wallet details:");
console.log("  ──────────────────────────────────────────────────────────────");
console.log("");
console.log(`  Wallet ID      : ${walletId}`);
console.log(`  Wallet Address : ${walletAddress}`);
console.log(`  Blockchain     : ARC-TESTNET`);
console.log(`  Network        : Arc Testnet (chain 5042002)`);
console.log("");
console.log("  ──────────────────────────────────────────────────────────────");
console.log("  Next steps:");
console.log("  1. Add CIRCLE_WALLET_SET_ID to .env.local");
console.log("  2. Restart dev server: npm run dev");
console.log("  3. Circle Wallets will now be active for new Agent sessions");
console.log("  ──────────────────────────────────────────────────────────────");
console.log("");

// ── Helper ────────────────────────────────────────────────────────────────────
/** Scrub sensitive env values from any error message before printing. */
function scrub(message: string): string {
  return message
    .replace(CIRCLE_API_KEY!, "CIRCLE_API_KEY_REDACTED")
    .replace(CIRCLE_ENTITY_SECRET!, "CIRCLE_ENTITY_SECRET_REDACTED");
}
