export const MARKET_REGISTRY_ABI = [
  "function getAuditTargets() view returns ((uint256 auditTargetId,string title,string category,string sourceUrl,bytes32 sourceHash,uint256 deadline,uint256 createdAt,uint8 status,address creator,bytes32 metadataHash)[])",
  "function getAuditTarget(uint256 auditTargetId) view returns (uint256 auditTargetId,string title,string category,string sourceUrl,bytes32 sourceHash,uint256 deadline,uint256 createdAt,uint8 status,address creator,bytes32 metadataHash)",
  "function createAuditTarget(string title,string category,string sourceUrl,bytes32 sourceHash,uint256 deadline,bytes32 metadataHash) returns (uint256 auditTargetId)",
  "function updateAuditTargetStatus(uint256 auditTargetId,uint8 status)",
  "event AuditTargetCreated(uint256 indexed auditTargetId,string title,string category,string sourceUrl,bytes32 indexed sourceHash,uint256 deadline,bytes32 indexed metadataHash,address creator)",
  "event AuditTargetStatusUpdated(uint256 indexed auditTargetId,uint8 status)",
] as const;

export const RECEIPT_REGISTRY_ABI = [
  "function getReceipt(uint256 receiptId) view returns (uint256 receiptId,string agentId,uint256 auditTargetId,bytes32 signalHash,bytes32 reasoningHash,uint16 integrityScore,uint16 agentProbability,uint16 referenceProbability,int256 edgeBps,uint256 suggestedTestnetUsdcAmount,string decision,uint8 lifecycleState,uint256 timestamp,address writer)",
  "function getReceiptsByAgent(string agentId) view returns ((uint256 receiptId,string agentId,uint256 auditTargetId,bytes32 signalHash,bytes32 reasoningHash,uint16 integrityScore,uint16 agentProbability,uint16 referenceProbability,int256 edgeBps,uint256 suggestedTestnetUsdcAmount,string decision,uint8 lifecycleState,uint256 timestamp,address writer)[])",
  "function writeReceipt(string agentId,uint256 auditTargetId,bytes32 signalHash,bytes32 reasoningHash,uint16 integrityScore,uint16 agentProbability,uint16 referenceProbability,int256 edgeBps,uint256 suggestedTestnetUsdcAmount,string decision) returns (uint256 receiptId)",
  "function updateLifecycleState(uint256 receiptId,uint8 lifecycleState)",
  "event ReceiptWritten(uint256 indexed receiptId,string agentId,uint256 indexed auditTargetId,bytes32 indexed reasoningHash,uint16 integrityScore,string decision,address writer)",
  "event LifecycleUpdated(uint256 indexed receiptId,uint8 lifecycleState)",
] as const;
