import { network } from "hardhat";

async function main() {
  if (!process.env.NEXT_PUBLIC_ARC_RPC_URL) {
    throw new Error("NEXT_PUBLIC_ARC_RPC_URL is required for Arc testnet deployment.");
  }
  if (!process.env.ARC_PRIVATE_KEY_TESTNET) {
    throw new Error("ARC_PRIVATE_KEY_TESTNET is required for Arc testnet deployment.");
  }

  const { ethers } = await network.connect("arcTestnet");
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying AgoraLens contracts with ${deployer.address}`);

  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = await MarketRegistry.deploy();
  await marketRegistry.waitForDeployment();

  const ReasoningReceiptRegistry = await ethers.getContractFactory("ReasoningReceiptRegistry");
  const receiptRegistry = await ReasoningReceiptRegistry.deploy();
  await receiptRegistry.waitForDeployment();

  console.log(`NEXT_PUBLIC_MARKET_REGISTRY_ADDRESS=${await marketRegistry.getAddress()}`);
  console.log(`NEXT_PUBLIC_RECEIPT_REGISTRY_ADDRESS=${await receiptRegistry.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
