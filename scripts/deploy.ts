/**
 * AgoraLens safe Arc Testnet deployment.
 *
 * Deploys only:
 * 1. MarketAuditRegistry - public audit target metadata for research/integrity review
 * 2. ReasoningReceiptRegistry - AI reasoning receipts
 *
 * No betting, trading, order execution, mainnet, or real-fund movement.
 */

import { network } from "hardhat";

const EXPLORER_BASE = process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";

async function main() {
  if (!process.env.ARC_RPC_URL) {
    console.error("Missing ARC_RPC_URL in .env.local. This is server-only; do not use NEXT_PUBLIC_ARC_RPC_URL.");
    process.exitCode = 1;
    return;
  }

  if (!process.env.ARC_PRIVATE_KEY_TESTNET) {
    console.error("Missing ARC_PRIVATE_KEY_TESTNET in .env.local. Use a testnet key only.");
    process.exitCode = 1;
    return;
  }

  const { ethers } = await network.connect("arcTestnet");
  const [deployer] = await ethers.getSigners();
  const chain = await ethers.provider.getNetwork();

  if (chain.chainId !== 5_042_002n) {
    throw new Error(`Wrong network. Expected Arc Testnet chainId 5042002, got ${chain.chainId.toString()}.`);
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance === 0n) {
    throw new Error(`Deployer ${deployer.address} has zero Arc testnet balance.`);
  }

  console.log("AgoraLens safe Arc Testnet deployment");
  console.log(`Deployer: ${deployer.address}`);
  console.log("Network: Arc Testnet (5042002)");
  console.log("Mode: audit receipts only; no trading or order execution");

  const MarketAuditRegistry = await ethers.getContractFactory("MarketAuditRegistry");
  const marketAuditRegistry = await MarketAuditRegistry.deploy();
  await marketAuditRegistry.waitForDeployment();
  const marketAuditRegistryAddress = await marketAuditRegistry.getAddress();

  const ReasoningReceiptRegistry = await ethers.getContractFactory("ReasoningReceiptRegistry");
  const reasoningReceiptRegistry = await ReasoningReceiptRegistry.deploy();
  await reasoningReceiptRegistry.waitForDeployment();
  const reasoningReceiptRegistryAddress = await reasoningReceiptRegistry.getAddress();

  console.log("");
  console.log("MarketAuditRegistry address:");
  console.log(marketAuditRegistryAddress);
  console.log(`${EXPLORER_BASE}/address/${marketAuditRegistryAddress}`);
  console.log("");
  console.log("ReasoningReceiptRegistry address:");
  console.log(reasoningReceiptRegistryAddress);
  console.log(`${EXPLORER_BASE}/address/${reasoningReceiptRegistryAddress}`);
  console.log("");
  console.log("Paste into .env.local:");
  console.log(`NEXT_PUBLIC_MARKET_REGISTRY_ADDRESS=${marketAuditRegistryAddress}`);
  console.log(`NEXT_PUBLIC_RECEIPT_REGISTRY_ADDRESS=${reasoningReceiptRegistryAddress}`);
  console.log("NEXT_PUBLIC_ARC_CHAIN_ID=5042002");
  console.log(`NEXT_PUBLIC_ARC_EXPLORER_URL=${EXPLORER_BASE}`);
  console.log("NEXT_PUBLIC_ARC_CURRENCY=USDC");
}

main().catch((error: unknown) => {
  console.error("Deployment failed:");
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
